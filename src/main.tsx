import { setupL10N } from "./libs/l10n";
import zhCN from "./translations/zhCN";

const PLUGIN_NAME = "orca-background-cover";

const PRESETS = [
  { label: "必应每日壁纸", value: "https://bing.biturl.top/?resolution=1920&format=image&index=0" },
  { label: "随机风景", value: "https://imgapi.cn/api.php?fl=fengjing&gs=images" },
  { label: "随机动漫", value: "https://img.xjh.me/random_img.php?return=302&type=bg" },
  { label: "Picsum 随机", value: "https://picsum.photos/1920/1080" },
  { label: "Unsplash 随机", value: "https://unsplash.it/1600/900?random" },
];

// 插件设置面板不显示任何设置项，全部通过按钮菜单操作，配置存 setData
const SETTINGS_SCHEMA = {};

type InternalSettings = {
  enabled: boolean;
  backgroundImage: string;
  preset: string;
  coverMode: "editor" | "fullscreen";
  uiOpacity: number;
  specialOpacity: number;
  scopeLineColor: string;
  bgOpacity: number;
  blur: number;
  positionX: number;
  positionY: number;
  darkModeImage: string;
  presetSources: string[];
  randomOnStart: boolean;
  randomInterval: boolean;
  autoSwitchInterval: number;
};

const DEFAULT_INTERNAL: InternalSettings = {
  enabled: true,
  backgroundImage: "",
  preset: "none",
  coverMode: "editor",
  uiOpacity: 0.85,
  specialOpacity: 0.65,
  scopeLineColor: "#b8b8b8",
  bgOpacity: 0.25,
  blur: 0,
  positionX: 0,
  positionY: 0,
  darkModeImage: "",
  presetSources: PRESETS.map((p) => p.value),
  randomOnStart: true,
  randomInterval: false,
  autoSwitchInterval: 0,
};

type Settings = InternalSettings;

type LocalImage = { id: string; name: string; fileName: string; url: string };

let cachedInternal: InternalSettings = { ...DEFAULT_INTERNAL };
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const settingsListeners = new Set<() => void>();

function notifySettingsChange() {
  settingsListeners.forEach((fn) => {
    try { fn(); } catch {}
  });
}

function getSettings(_pluginName: string): Settings {
  return { ...cachedInternal };
}

function setSettings(pluginName: string, partial: Partial<Settings>) {
  cachedInternal = { ...cachedInternal, ...partial };
  applyBackground(pluginName);
  notifySettingsChange();
  // 防抖写磁盘：滑块拖动时避免频繁 I/O
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    orca.plugins.setData(pluginName, "bg-config", JSON.stringify(cachedInternal)).catch(() => {});
  }, 300);
}

async function loadInternalSettings(pluginName: string) {
  try {
    const raw = await orca.plugins.getData(pluginName, "bg-config");
    if (raw) cachedInternal = { ...DEFAULT_INTERNAL, ...JSON.parse(raw) };
  } catch {
    cachedInternal = { ...DEFAULT_INTERNAL };
  }
}

// 本地图片 blob URL 缓存：避免每次打开图片库都重新读文件
const localBlobCache = new Map<string, string>();

function getMimeFromName(fileName: string): string {
  const ext = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();
  const map: Record<string, string> = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    gif: "image/gif", webp: "image/webp", bmp: "image/bmp", svg: "image/svg+xml",
  };
  return map[ext] || "image/png";
}

// 本地图片：以真实文件存在仓库 assets/plugins/<plugin>/ 下
// 读取图片文件并转成 blob URL，确保一定能显示
async function readImageToBlobUrl(pluginName: string, fileName: string): Promise<string> {
  const cached = localBlobCache.get(fileName);
  if (cached) return cached;
  try {
    const buf = await orca.plugins.readFile(pluginName, fileName, "buffer");
    if (buf instanceof ArrayBuffer) {
      const blob = new Blob([buf], { type: getMimeFromName(fileName) });
      const url = URL.createObjectURL(blob);
      localBlobCache.set(fileName, url);
      return url;
    }
  } catch {}
  // 回退：尝试用 getAssetPath
  const repoDir = orca.state.repoDir;
  if (repoDir) {
    const absPath = `${repoDir}/assets/plugins/${pluginName}/${fileName}`;
    try {
      return orca.utils.getAssetPath(absPath);
    } catch {
      return absPath;
    }
  }
  return fileName;
}

async function getLocalImages(pluginName: string): Promise<LocalImage[]> {
  try {
    const files = await orca.plugins.listFiles(pluginName);
    const imgExt = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;
    const images: LocalImage[] = [];
    for (const f of files) {
      if (imgExt.test(f)) {
        const name = f.replace(/\.[^.]+$/, "");
        const url = await readImageToBlobUrl(pluginName, f);
        images.push({ id: name, name, fileName: f, url });
      }
    }
    return images;
  } catch {
    return [];
  }
}

async function saveImageFile(pluginName: string, fileName: string, data: ArrayBuffer): Promise<void> {
  await orca.plugins.writeFile(pluginName, fileName, data);
}

async function deleteImageFile(pluginName: string, fileName: string): Promise<void> {
  const cached = localBlobCache.get(fileName);
  if (cached) {
    URL.revokeObjectURL(cached);
    localBlobCache.delete(fileName);
  }
  await orca.plugins.removeFile(pluginName, fileName);
}

// 兼容旧环境的文件读取
function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function isDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

let styleEl: HTMLStyleElement | null = null;
let bgLayer: HTMLDivElement | null = null;
let currentBgImage: HTMLImageElement | null = null; // 缓存当前显示的背景图，用于保存到本地
let currentBgBlobUrl: string | null = null; // 缓存当前背景图的 blob URL
let currentBgSourceUrl: string | null = null; // 缓存上一次加载的源 URL，避免重复加载导致闪烁
let currentBgCssUrl: string | null = null; // 缓存上一次实际设置的 CSS URL
let bgLoadSeq = 0; // 背景加载序号，用于竞态保护（防止旧图覆盖新图）
let loadingPromise: Promise<string | null> | null = null; // 进行中的图片加载，防止并发重复请求

// 静态 CSS：所有动态值用 CSS 变量（--bgc-*），由 applyBackground 更新，避免每次重解析
const STATIC_CSS = `
  /* ===== 编辑器模式：背景只在编辑器区域 ===== */
  body.orca-bg-cover-active.orca-bg-cover-editor .orca-editor,
  body.orca-bg-cover-active.orca-bg-cover-editor .orca-block-editor {
    position: relative;
    isolation: isolate;
  }
  body.orca-bg-cover-active.orca-bg-cover-editor .orca-editor::before,
  body.orca-bg-cover-active.orca-bg-cover-editor .orca-block-editor::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-image: var(--bgc-bg-url);
    background-size: cover;
    background-position: var(--bgc-pos-x) var(--bgc-pos-y);
    background-attachment: fixed;
    background-repeat: no-repeat;
    opacity: var(--bgc-bg-opacity);
    filter: var(--bgc-blur);
  }
  body.orca-bg-cover-active.orca-bg-cover-editor .orca-workspace,
  body.orca-bg-cover-active.orca-bg-cover-editor .orca-block-editor-main,
  body.orca-bg-cover-active.orca-bg-cover-editor .orca-block-editor-blocks,
  body.orca-bg-cover-active.orca-bg-cover-editor .orca-block {
    background-color: transparent !important;
  }

  /* ===== 全屏模式：全局背景层，所有面板透明 ===== */
  body.orca-bg-cover-active.orca-bg-cover-fullscreen { background-color: transparent !important; }
  body.orca-bg-cover-active.orca-bg-cover-fullscreen #main,
  body.orca-bg-cover-active.orca-bg-cover-fullscreen .orca-panels-container { background-color: transparent !important; }
  body.orca-bg-cover-active.orca-bg-cover-fullscreen .orca-panel {
    background-color: transparent !important;
    isolation: isolate;
    position: relative;
  }
  body.orca-bg-cover-active.orca-bg-cover-fullscreen .orca-panel::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-color: color-mix(in oklab, var(--orca-color-bg-1, #fff) var(--bgc-ui-pct), transparent);
  }
  body.orca-bg-cover-active.orca-bg-cover-fullscreen .orca-workspace,
  body.orca-bg-cover-active.orca-bg-cover-fullscreen .orca-editor,
  body.orca-bg-cover-active.orca-bg-cover-fullscreen .orca-block-editor,
  body.orca-bg-cover-active.orca-bg-cover-fullscreen .orca-block-editor-main,
  body.orca-bg-cover-active.orca-bg-cover-fullscreen .orca-block-editor-blocks,
  body.orca-bg-cover-active.orca-bg-cover-fullscreen .orca-block { background-color: transparent !important; }

  /* 面包屑 */
  body.orca-bg-cover-active .orca-scrolling-breadcrumb {
    background-color: color-mix(in oklab, var(--orca-color-bg-1, #fff) var(--bgc-ui-pct), transparent) !important;
    border-radius: 8px;
  }

  /* 查询/表格等容器：半透明底色 */
  body.orca-bg-cover-active .orca-block-editor-query-tabs-container,
  body.orca-bg-cover-active .orca-block-editor-query-views,
  body.orca-bg-cover-active .orca-query-editor,
  body.orca-bg-cover-active .orca-query-conditions,
  body.orca-bg-cover-active .orca-query-conditions-header,
  body.orca-bg-cover-active .orca-query-conditions-body,
  body.orca-bg-cover-active .orca-table,
  body.orca-bg-cover-active .orca-query-table,
  body.orca-bg-cover-active .orca-query-table-table,
  body.orca-bg-cover-active .orca-query-result-table,
  body.orca-bg-cover-active .orca-query-calendar-month,
  body.orca-bg-cover-active .orca-query-result-list-toolbar,
  body.orca-bg-cover-active .orca-query-result-card-toolbar,
  body.orca-bg-cover-active .orca-query-result-table-toolbar,
  body.orca-bg-cover-active .orca-query-result-calendar-toolbar {
    background-color: color-mix(in oklab, var(--orca-color-bg-1, #fff) var(--bgc-special-pct), transparent) !important;
  }

  /* 查询结果容器透明 */
  body.orca-bg-cover-active .orca-query-results,
  body.orca-bg-cover-active .orca-query-list,
  body.orca-bg-cover-active .orca-query-cards {
    background-color: transparent !important;
    background-image: none !important;
  }

  body.orca-bg-cover-active .orca-segmented.orca-block-editor-query-tabs {
    background-color: color-mix(in oklab, var(--orca-color-bg-1, #fff) var(--bgc-ui-pct-60), transparent) !important;
  }
  body.orca-bg-cover-active .orca-segmented-item.orca-selected {
    background-color: color-mix(in oklab, var(--orca-color-bg-1, #fff) 60%, transparent) !important;
  }

  /* 查询条件项不设底色，由容器提供 */
  body.orca-bg-cover-active .orca-query-condition,
  body.orca-bg-cover-active .orca-query-condition-item { background-color: unset !important; }

  /* 表格单元格透明 */
  body.orca-bg-cover-active .orca-table-header,
  body.orca-bg-cover-active .orca-table-row,
  body.orca-bg-cover-active .orca-query-table-row,
  body.orca-bg-cover-active .orca-table-header-cell,
  body.orca-bg-cover-active .orca-table-cell,
  body.orca-bg-cover-active .orca-query-table-header,
  body.orca-bg-cover-active .orca-query-table-header-cell,
  body.orca-bg-cover-active .orca-query-table-cell,
  body.orca-bg-cover-active .orca-query-table-cell-content,
  body.orca-bg-cover-active .orca-table-cell-inner { background-color: transparent !important; }

  /* 引用角标：跟随特殊块不透明度 */
  body.orca-bg-cover-active .orca-block-ref-count-marker {
    background-color: color-mix(in oklab, var(--orca-color-bg-1, #fff) var(--bgc-special-pct), transparent) !important;
    border-radius: 4px;
  }

  /* 层级缩进竖线：默认颜色 */
  body.orca-bg-cover-active .orca-repr-scope-line::before {
    background-color: var(--bgc-scope-line-color, #b8b8b8) !important;
    border-color: var(--bgc-scope-line-color, #b8b8b8) !important;
  }

  /* 层级缩进竖线：选中态用主题色 */
  body.orca-bg-cover-active .orca-block.orca-active-parent > .orca-repr > .orca-repr-main > .orca-repr-main-none-editable > .orca-repr-scope-line::before {
    background-color: var(--orca-color-primary-5) !important;
    border-color: var(--orca-color-primary-5) !important;
  }

  /* 画廊等透明化 */
  body.orca-bg-cover-active .orca-gallery-wrapper,
  body.orca-bg-cover-active .orca-gallery-grid,
  body.orca-bg-cover-active .orca-gallery-add-card,
  body.orca-bg-cover-active .orca-block,
  body.orca-bg-cover-active .orca-repr,
  body.orca-bg-cover-active .orca-repr-main,
  body.orca-bg-cover-active .orca-repr-main-content,
  body.orca-bg-cover-active .orca-repr-children,
  body.orca-bg-cover-active .orca-block-handle,
  body.orca-bg-cover-active .orca-block-caption,
  body.orca-bg-cover-active .orca-image-wrapper,
  body.orca-bg-cover-active .orca-image-figure,
  body.orca-bg-cover-active .orca-image-image,
  body.orca-bg-cover-active .orca-image-resizer {
    background: transparent !important;
    background-color: transparent !important;
  }

  /* 特殊块（卡片/页签/看板）半透明底色 */
  body.orca-bg-cover-active .orca-gallery-card,
  body.orca-bg-cover-active .orca-query-list-block,
  body.orca-bg-cover-active .orca-query-list-block-block,
  body.orca-bg-cover-active .orca-query-list-block-breadcrumb,
  body.orca-bg-cover-active .orca-query-list-block-overlay,
  body.orca-bg-cover-active .orca-query-card,
  body.orca-bg-cover-active .orca-query-card-footer,
  body.orca-bg-cover-active .orca-tabs-main,
  body.orca-bg-cover-active .orca-tabs-body,
  body.orca-bg-cover-active .orca-board,
  body.orca-bg-cover-active .orca-board-column,
  body.orca-bg-cover-active .orca-board-card,
  body.orca-bg-cover-active .orca-kanban,
  body.orca-bg-cover-active .orca-kanban-column,
  body.orca-bg-cover-active .orca-kanban-card {
    background-color: color-mix(in oklab, var(--orca-color-bg-1, #fff) var(--bgc-special-pct), transparent) !important;
  }

  body.orca-bg-cover-active .orca-tabs-strip { background-color: transparent !important; }

  /* 特殊块内部容器透明 */
  body.orca-bg-cover-active .orca-query-list-block .orca-block,
  body.orca-bg-cover-active .orca-query-list-block .orca-repr,
  body.orca-bg-cover-active .orca-query-list-block .orca-repr-main,
  body.orca-bg-cover-active .orca-query-list-block .orca-repr-main-content,
  body.orca-bg-cover-active .orca-query-list-block .orca-repr-children,
  body.orca-bg-cover-active .orca-query-card .orca-block,
  body.orca-bg-cover-active .orca-query-card .orca-repr,
  body.orca-bg-cover-active .orca-query-card .orca-repr-main,
  body.orca-bg-cover-active .orca-query-card .orca-repr-main-content,
  body.orca-bg-cover-active .orca-query-card .orca-repr-children,
  body.orca-bg-cover-active .orca-tabs-main .orca-block,
  body.orca-bg-cover-active .orca-tabs-main .orca-repr,
  body.orca-bg-cover-active .orca-tabs-main .orca-repr-main,
  body.orca-bg-cover-active .orca-tabs-main .orca-repr-main-content,
  body.orca-bg-cover-active .orca-tabs-main .orca-repr-children,
  body.orca-bg-cover-active .orca-board .orca-block,
  body.orca-bg-cover-active .orca-board .orca-repr,
  body.orca-bg-cover-active .orca-board .orca-repr-main,
  body.orca-bg-cover-active .orca-board .orca-repr-main-content,
  body.orca-bg-cover-active .orca-board .orca-repr-children,
  body.orca-bg-cover-active .orca-kanban .orca-block,
  body.orca-bg-cover-active .orca-kanban .orca-repr,
  body.orca-bg-cover-active .orca-kanban .orca-repr-main,
  body.orca-bg-cover-active .orca-kanban .orca-repr-main-content,
  body.orca-bg-cover-active .orca-kanban .orca-repr-children {
    background-color: transparent !important;
  }

  /* 面包屑路径 */
  body.orca-bg-cover-active .orca-query-list-breadcrumb,
  body.orca-bg-cover-active .orca-query-card-breadcrumb,
  body.orca-bg-cover-active .orca-query-block-path { background-color: transparent !important; }

  /* 侧边栏分段 */
  body.orca-bg-cover-active .orca-sidebar-tab-options {
    background-color: color-mix(in oklab, var(--orca-color-bg-1, #fff) var(--bgc-ui-pct-60), transparent) !important;
  }
  body.orca-bg-cover-active .orca-sidebar-tab-options .orca-segmented-item { background-color: transparent !important; }
  body.orca-bg-cover-active .orca-sidebar-tab-options .orca-segmented-item.orca-selected {
    background-color: color-mix(in oklab, var(--orca-color-bg-1, #fff) 60%, transparent) !important;
  }

  /* 全屏模式顶栏/侧栏 */
  body.orca-bg-cover-active.orca-bg-cover-fullscreen #headbar,
  body.orca-bg-cover-active.orca-bg-cover-fullscreen #sidebar {
    background-color: color-mix(in oklab, var(--orca-color-bg-1, #fff) var(--bgc-ui-pct), transparent) !important;
  }
`;

function ensureStyleElement() {
  if (styleEl) return;
  styleEl = document.createElement("style");
  styleEl.id = "orca-background-cover-style";
  styleEl.textContent = STATIC_CSS;
  document.head.appendChild(styleEl);
}

function ensureBgLayer(): HTMLDivElement {
  if (bgLayer) return bgLayer;
  bgLayer = document.createElement("div");
  bgLayer.id = "orca-bg-cover-layer";
  bgLayer.style.position = "fixed";
  bgLayer.style.inset = "0";
  bgLayer.style.zIndex = "0";
  bgLayer.style.pointerEvents = "none";
  bgLayer.style.backgroundSize = "cover";
  bgLayer.style.backgroundPosition = "center center";
  bgLayer.style.backgroundRepeat = "no-repeat";
  document.body.insertBefore(bgLayer, document.body.firstChild);
  return bgLayer;
}

function removeBgLayer() {
  if (bgLayer) {
    bgLayer.remove();
    bgLayer = null;
  }
}

function escapeUrl(url: string): string {
  return url.replace(/"/g, '\\"');
}

// 加载网络图片并转成 blob URL，保证背景和保存是同一张图
function loadImageToBlobUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    // 清理旧的 blob URL（本地缓存的不清理，由 localBlobCache 管理）
    if (currentBgBlobUrl && !Array.from(localBlobCache.values()).includes(currentBgBlobUrl)) {
      URL.revokeObjectURL(currentBgBlobUrl);
    }
    currentBgBlobUrl = null;
    currentBgImage = null;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            currentBgBlobUrl = blobUrl;
            currentBgImage = img;
            resolve(blobUrl);
          } else {
            // 转 blob 失败，保留原始 URL（显示可能不一致，但能显示）
            currentBgImage = img;
            resolve(null);
          }
        }, "image/png");
      } catch (e) {
        // CORS 污染等，保留原始 URL
        currentBgImage = img;
        resolve(null);
      }
    };
    img.onerror = () => {
      currentBgImage = null;
      resolve(null);
    };
    img.src = url;
  });
}

// 加载网络图片：带缓存破坏 + 超时 + 失败自动换下一个图源
function loadNetworkImage(pluginName: string, url: string, opacity: string, blur: string, posX: string, posY: string) {
  currentBgSourceUrl = url;
  if (currentBgBlobUrl && !Array.from(localBlobCache.values()).includes(currentBgBlobUrl)) {
    URL.revokeObjectURL(currentBgBlobUrl);
  }
  currentBgBlobUrl = null;

  const tryLoad = (sourceUrl: string) => {
    const sep = sourceUrl.includes("?") ? "&" : "?";
    const loadUrl = `${sourceUrl.trim()}${sep}_t=${Date.now()}`;
    const seq = ++bgLoadSeq;
    const img = new Image();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      img.src = ""; // 中止加载
      if (seq === bgLoadSeq) tryNext(sourceUrl);
    }, 5000); // 5 秒超时，快速回退到其他图源

    img.onload = () => {
      clearTimeout(timer);
      if (timedOut || seq !== bgLoadSeq) return;
      currentBgImage = img;
      const cssUrl = `url("${escapeUrl(loadUrl)}")`;
      const layer = ensureBgLayer();
      layer.style.backgroundImage = cssUrl;
      layer.style.opacity = opacity;
      layer.style.filter = blur;
      layer.style.backgroundPosition = `${posX} ${posY}`;
      currentBgCssUrl = cssUrl;
      document.body.style.setProperty("--bgc-bg-url", cssUrl);
    };
    img.onerror = () => {
      clearTimeout(timer);
      if (timedOut || seq !== bgLoadSeq) return;
      tryNext(sourceUrl);
    };
    img.src = loadUrl;
  };

  // 当前图源失败时，从预设源列表里找下一个可用的尝试
  const tryNext = (failedUrl: string) => {
    const sources = PRESETS.map((p) => p.value);
    const others = sources.filter((u) => u !== failedUrl);
    if (others.length > 0) {
      const fallback = others[Math.floor(Math.random() * others.length)];
      tryLoad(fallback);
    }
  };

  tryLoad(url);
}

async function applyBackground(pluginName: string) {
  const s = getSettings(pluginName);
  const dark = isDark();

  if (!s.enabled) {
    document.body.classList.remove("orca-bg-cover-active", "orca-bg-cover-fullscreen", "orca-bg-cover-editor");
    removeBgLayer();
    currentBgImage = null;
    currentBgSourceUrl = null;
    currentBgCssUrl = null;
    if (currentBgBlobUrl && !Array.from(localBlobCache.values()).includes(currentBgBlobUrl)) {
      URL.revokeObjectURL(currentBgBlobUrl);
    }
    currentBgBlobUrl = null;
    return;
  }

  let url = "";
  if (s.preset && s.preset !== "none") {
    url = s.preset;
  } else {
    url = dark && s.darkModeImage ? s.darkModeImage : s.backgroundImage;
  }

  const hasImage = url.trim() !== "";

  if (!hasImage) {
    document.body.classList.remove("orca-bg-cover-active", "orca-bg-cover-fullscreen", "orca-bg-cover-editor");
    removeBgLayer();
    currentBgImage = null;
    currentBgSourceUrl = null;
    currentBgCssUrl = null;
    if (currentBgBlobUrl && !Array.from(localBlobCache.values()).includes(currentBgBlobUrl)) {
      URL.revokeObjectURL(currentBgBlobUrl);
    }
    currentBgBlobUrl = null;
    return;
  }

  const isLocal = url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("file:") || url.startsWith("local:") || /^[a-zA-Z]:[\\/]/.test(url) || url.startsWith("/assets/");

  // 记录源 URL，用于下次判断是否需要重新加载
  const sourceUrl = url;

  // 先设置不依赖图片 URL 的样式（透明度、模糊、位置等），网络图提前 return 也不影响
  const uiOpacity = Math.max(0.75, Math.min(1, 1 - 0.25 * (1 - s.uiOpacity)));
  const specialOpacity = Math.max(0.2, Math.min(1, s.specialOpacity));
  const isFullscreen = s.coverMode === "fullscreen";
  const bgOpacity = String(Math.max(0, Math.min(1, s.bgOpacity)));
  const bgBlur = s.blur > 0 ? `blur(${s.blur}px)` : "none";
  const bgPosX = `${50 + s.positionX / 2}%`;
  const bgPosY = `${50 + s.positionY / 2}%`;

  ensureStyleElement();

  if (isFullscreen) {
    ensureBgLayer();
  } else {
    removeBgLayer();
  }

  const bodyStyle = document.body.style;
  bodyStyle.setProperty("--bgc-pos-x", bgPosX);
  bodyStyle.setProperty("--bgc-pos-y", bgPosY);
  bodyStyle.setProperty("--bgc-blur", bgBlur);
  bodyStyle.setProperty("--bgc-bg-opacity", bgOpacity);
  bodyStyle.setProperty("--bgc-ui-pct", `${(1 - uiOpacity) * 100}%`);
  bodyStyle.setProperty("--bgc-ui-pct-60", `${(1 - uiOpacity) * 60}%`);
  bodyStyle.setProperty("--bgc-special-pct", `${specialOpacity * 100}%`);
  bodyStyle.setProperty("--bgc-scope-line-color", s.scopeLineColor || "#b8b8b8");

  document.body.classList.toggle("orca-bg-cover-fullscreen", isFullscreen);
  document.body.classList.toggle("orca-bg-cover-editor", !isFullscreen);
  document.body.classList.add("orca-bg-cover-active");

  // 本地图片：同一张图不重复加载（无缓存破坏）
  // 网络图：即使 sourceUrl 相同也要重新加载，因为 _t 缓存破坏参数会返回不同图片
  if (isLocal && currentBgSourceUrl === sourceUrl) {
    return;
  } else if (!isLocal) {
    loadNetworkImage(pluginName, url, bgOpacity, bgBlur, bgPosX, bgPosY);
    return;
  } else {
    currentBgSourceUrl = sourceUrl;
    if (currentBgBlobUrl && !Array.from(localBlobCache.values()).includes(currentBgBlobUrl)) {
      URL.revokeObjectURL(currentBgBlobUrl);
    }
    currentBgBlobUrl = null;
    if (url.startsWith("local:")) {
      const fileName = url.slice(6);
      const blobUrl = await readImageToBlobUrl(pluginName, fileName);
      url = blobUrl;
      currentBgBlobUrl = blobUrl;
    }
    const img = new Image();
    img.onload = () => { currentBgImage = img; };
    img.src = url.trim();
    currentBgImage = img;
  }

  // 本地图片：直接设置背景
  const layer = ensureBgLayer();
  const bgCssUrl = `url("${escapeUrl(url.trim())}")`;
  layer.style.backgroundImage = bgCssUrl;
  layer.style.opacity = bgOpacity;
  layer.style.filter = bgBlur;
  layer.style.backgroundPosition = `${bgPosX} ${bgPosY}`;
  currentBgCssUrl = bgCssUrl;
  bodyStyle.setProperty("--bgc-bg-url", bgCssUrl);
}

let darkMediaQuery: MediaQueryList | null = null;
let darkModeHandler: (() => void) | null = null;
let pluginNameGlobal = "";
let autoSwitchTimer: ReturnType<typeof setTimeout> | null = null;

// ============ 顶栏按钮 + 菜单 ============

function HeadbarButton() {
  const { useState, useRef, useEffect } = window.React;
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"global" | "wallpaper" | null>(null);
  const [, forceUpdate] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { Button, Popup, Menu, MenuText, MenuSeparator, MenuTitle } = orca.components;

  // 监听设置变化，让菜单状态实时更新
  useEffect(() => {
    const fn = () => forceUpdate((n: number) => n + 1);
    settingsListeners.add(fn);
    return () => { settingsListeners.delete(fn); };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    closeMenu();
    try {
      orca.notify?.("info", "正在上传图片...");
      const buf = await fileToArrayBuffer(file);
      const ext = (file.name.match(/\.[^.]+$/) || [".png"])[0].toLowerCase();
      const fileName = `img-${Date.now()}${ext}`;
      await saveImageFile(pluginNameGlobal, fileName, buf);
      await setSettings(pluginNameGlobal, { preset: "none", backgroundImage: `local:${fileName}`, enabled: true });
      orca.notify?.("success", "图片已添加");
    } catch (err) {
      console.error(err);
      orca.notify?.("error", "上传失败");
    }
  };

  const randomPreset = async () => {
    const s = getSettings(pluginNameGlobal);
    const sources = s.presetSources && s.presetSources.length > 0 ? s.presetSources : PRESETS.map((p) => p.value);
    // 排除当前正在显示的图源，避免连续抽到同一个
    const current = s.preset && s.preset !== "none" ? s.preset : null;
    const candidates = current ? sources.filter((u) => u !== current) : sources;
    const pool = candidates.length > 0 ? candidates : sources;
    const randomUrl = pool[Math.floor(Math.random() * pool.length)];
    const preset = PRESETS.find((p) => p.value === randomUrl);
    await setSettings(pluginNameGlobal, { preset: randomUrl, enabled: true });
    orca.notify?.("success", preset ? `已切换到：${preset.label}` : "已切换壁纸");
    closeMenu();
  };

  const selectPreset = async (value: string) => {
    await setSettings(pluginNameGlobal, { preset: value, enabled: true });
    closeMenu();
  };

  const clearBg = async () => {
    const s = getSettings(pluginNameGlobal);
    await setSettings(pluginNameGlobal, { enabled: !s.enabled });
    closeMenu();
  };

  // 保存当前网络图片到本地图片库（写入真实文件）
  const saveCurrentToLocal = async () => {
    const s = getSettings(pluginNameGlobal);
    let url = "";
    if (s.preset && s.preset !== "none") {
      url = s.preset;
    } else {
      url = s.backgroundImage;
    }

    const isLocalImg = url.startsWith("data:") || url.startsWith("file:") || url.startsWith("local:") || /^[a-zA-Z]:[\\/]/.test(url) || url.startsWith("/assets/");
    if (!url || isLocalImg) {
      orca.notify?.("error", "当前图片已经是本地图片");
      return;
    }

    try {
      orca.notify?.("info", "正在保存图片...");

      let blob: Blob | null = null;

      // 优先用当前背景的 blob URL（和屏幕显示的是同一张）
      if (currentBgBlobUrl) {
        const resp = await fetch(currentBgBlobUrl);
        blob = await resp.blob();
      }
      // 其次用缓存的 Image 绘制 canvas
      if (!blob && currentBgImage && currentBgImage.complete && currentBgImage.naturalWidth > 0) {
        const canvas = document.createElement("canvas");
        canvas.width = currentBgImage.naturalWidth;
        canvas.height = currentBgImage.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(currentBgImage, 0, 0);
          blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        }
      }
      // 最后回退到 fetch 原始 URL（可能返回不同图，仅兜底）
      if (!blob) {
        const resp = await fetch(url, { mode: "cors" });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        blob = await resp.blob();
      }

      if (!blob) throw new Error("无法获取图片数据");

      const fileName = `img-${Date.now()}.png`;
      const buf = await blob.arrayBuffer();
      await saveImageFile(pluginNameGlobal, fileName, buf);
      await setSettings(pluginNameGlobal, { preset: "none", backgroundImage: `local:${fileName}` });
      orca.notify?.("success", "图片已保存到本地图片库");
    } catch (e) {
      console.error("保存图片失败", e);
      orca.notify?.("error", "保存失败：该图片服务器不允许跨域下载，请手动截图保存");
    }
    closeMenu();
  };

  const currentSettings = getSettings(pluginNameGlobal);
  const bgEnabled = currentSettings.enabled;
  const isPresetImage = currentSettings.preset && currentSettings.preset !== "none";

  const menuContent = window.React.createElement(
    Menu,
    { style: { minWidth: "200px" } },
    window.React.createElement(MenuTitle, { title: "背景图" }),
    window.React.createElement(
      MenuText,
      {
        title: "手动挑一张",
        preIcon: "ti ti-hand-click",
        children: window.React.createElement(
          Menu,
          null,
          ...PRESETS.map((p) =>
            window.React.createElement(MenuText, {
              key: p.value,
              title: p.label,
              onClick: () => selectPreset(p.value),
            }),
          ),
          window.React.createElement(MenuSeparator, null),
          window.React.createElement(MenuText, {
            title: "本地图片库",
            preIcon: "ti ti-photo",
            onClick: () => {
              closeMenu();
              setSettingsTab("wallpaper");
            },
          }),
        ),
      },
    ),
    window.React.createElement(MenuText, {
      title: "随机抽一张",
      preIcon: "ti ti-dice-5",
      onClick: randomPreset,
    }),
    isPresetImage
      ? window.React.createElement(MenuText, {
          title: "保存当前图片到本地",
          preIcon: "ti ti-download",
          onClick: saveCurrentToLocal,
        })
      : null,
    window.React.createElement(MenuSeparator, null),
    window.React.createElement(MenuText, {
      title: "添加本地图片",
      preIcon: "ti ti-photo-plus",
      onClick: () => fileInputRef.current?.click(),
    }),
    window.React.createElement(MenuSeparator, null),
    window.React.createElement(MenuText, {
      title: bgEnabled ? "关闭图片背景" : "开启图片背景",
      preIcon: bgEnabled ? "ti ti-eye-off" : "ti ti-eye",
      onClick: clearBg,
    }),
    window.React.createElement(MenuSeparator, null),
    window.React.createElement(MenuText, {
      title: "设置",
      preIcon: "ti ti-settings",
      onClick: () => {
        closeMenu();
        setSettingsTab("global");
      },
    }),
  );

  return window.React.createElement(
    window.React.Fragment,
    null,
    window.React.createElement(
      Button,
      {
        ref: btnRef,
        variant: "plain",
        onClick: () => setMenuOpen(!menuOpen),
        title: "背景图",
      },
      window.React.createElement("i", { className: "ti ti-photo" }),
    ),
    window.React.createElement("input", {
      ref: fileInputRef,
      type: "file",
      accept: "image/*",
      style: { display: "none" },
      onChange: onPickFile,
    }),
    window.React.createElement(
      Popup,
      {
        refElement: btnRef,
        visible: menuOpen,
        onClose: closeMenu,
        escapeToClose: true,
        defaultPlacement: "bottom",
        alignment: "right",
      },
      menuContent,
    ),
    settingsTab
      ? window.React.createElement(SettingsModal, {
          onClose: () => setSettingsTab(null),
          initialTab: settingsTab,
        })
      : null,
  );
}

// ============ 设置面板（ModalOverlay 居中） ============

function SettingsModal({ onClose, initialTab = "global" }: { onClose: () => void; initialTab?: "global" | "wallpaper" }) {
  const { useState, useEffect, useRef } = window.React;
  const [tab, setTab] = useState<"global" | "wallpaper">(initialTab);
  const [, force] = useState(0);
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { ModalOverlay, Button, Switch, Segmented } = orca.components;

  useEffect(() => {
    getLocalImages(pluginNameGlobal).then(setLocalImages);
  }, []);

  const s = getSettings(pluginNameGlobal);
  const update = async (partial: Partial<Settings>) => {
    await setSettings(pluginNameGlobal, partial);
    force((n: number) => n + 1);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await fileToArrayBuffer(file);
      const ext = (file.name.match(/\.[^.]+$/) || [".png"])[0].toLowerCase();
      const fileName = `img-${Date.now()}${ext}`;
      await saveImageFile(pluginNameGlobal, fileName, buf);
      const url = await readImageToBlobUrl(pluginNameGlobal, fileName);
      const updated = [...localImages, { id: fileName.replace(/\.[^.]+$/, ""), name: file.name, fileName, url }];
      setLocalImages(updated);
      await setSettings(pluginNameGlobal, { preset: "none", backgroundImage: `local:${fileName}` });
      force((n: number) => n + 1);
    } catch (err) {
      console.error(err);
      orca.notify?.("error", "上传失败");
    }
  };

  const useLocalImage = (img: LocalImage) => {
    setSettings(pluginNameGlobal, { preset: "none", backgroundImage: `local:${img.fileName}` });
    force((n: number) => n + 1);
  };

  const deleteLocalImage = (fileName: string) => {
    deleteImageFile(pluginNameGlobal, fileName).then(() => {
      const updated = localImages.filter((i: LocalImage) => i.fileName !== fileName);
      setLocalImages(updated);
      force((n: number) => n + 1);
    });
  };

  const slider = (label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, suffix = "") =>
    window.React.createElement(
      "div",
      { style: { marginBottom: "18px", marginTop: "12px" } },
      window.React.createElement(
        "div",
        { style: { display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" } },
        window.React.createElement("span", null, label),
        window.React.createElement(
          "span",
          {
            style: {
              color: "var(--orca-color-primary-5, #8324c2)",
              fontWeight: 600,
              fontSize: "12px",
              padding: "2px 8px",
              borderRadius: "10px",
              backgroundColor: "var(--orca-color-accent-bg, rgba(131,36,194,0.1))",
            },
          },
          `${value}${suffix}`,
        ),
      ),
      window.React.createElement("input", {
        type: "range",
        min,
        max,
        step,
        value,
        onChange: (e: any) => onChange(parseFloat(e.target.value)),
        style: {
          width: "100%",
          height: "6px",
          appearance: "none",
          WebkitAppearance: "none",
          borderRadius: "3px",
          background: "var(--orca-color-bg-2, #eee)",
          outline: "none",
          accentColor: "var(--orca-color-primary-5, #8324c2)",
        },
      }),
    );

  const row = (label: string, control: React.ReactNode) =>
    window.React.createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 0",
          borderBottom: "1px solid var(--orca-color-border, #eee)",
        },
      },
      window.React.createElement("span", { style: { fontSize: "13px", fontWeight: 500 } }, label),
      control,
    );

  let content: React.ReactNode;

  if (tab === "global") {
    content = window.React.createElement(
      "div",
      { style: { padding: "4px 0" } },
      row("开启背景", window.React.createElement(Switch, { on: s.enabled, onChange: (v: boolean) => update({ enabled: v }) })),
      row(
        "覆盖范围",
        window.React.createElement(
          Segmented,
          {
            selected: s.coverMode,
            options: [
              { label: "仅编辑器", value: "editor" },
              { label: "全屏", value: "fullscreen" },
            ],
            onChange: (v: string) => update({ coverMode: v as "editor" | "fullscreen" }),
          },
        ),
      ),
      slider("UI 透明度", s.uiOpacity, 0, 1, 0.01, (v) => update({ uiOpacity: v })),
      slider("背景可见度", s.bgOpacity, 0, 1, 0.01, (v) => update({ bgOpacity: v })),
      slider("背景虚化", s.blur, 0, 20, 0.5, (v) => update({ blur: v }), "px"),
      slider("X 偏移", s.positionX, -100, 100, 1, (v) => update({ positionX: v }), "%"),
      slider("Y 偏移", s.positionY, -100, 100, 1, (v) => update({ positionY: v }), "%"),
      slider("特殊块不透明度", s.specialOpacity, 0.2, 1, 0.01, (v) => update({ specialOpacity: v })),
      window.React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
          },
        },
        window.React.createElement("span", { style: { fontSize: "13px", fontWeight: 500 } }, "层级线颜色"),
        window.React.createElement(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "10px" } },
          window.React.createElement(
            "div",
            {
              style: {
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                backgroundColor: s.scopeLineColor || "#b8b8b8",
                border: "1px solid var(--orca-color-border, #ddd)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                overflow: "hidden",
                position: "relative",
              },
            },
            window.React.createElement("input", {
              type: "color",
              value: s.scopeLineColor || "#b8b8b8",
              onChange: (e: any) => update({ scopeLineColor: e.target.value }),
              style: {
                position: "absolute",
                top: "-6px",
                left: "-6px",
                width: "44px",
                height: "44px",
                border: "none",
                background: "none",
                cursor: "pointer",
                padding: 0,
                opacity: 0,
              },
            }),
          ),
          window.React.createElement(
            "span",
            {
              style: {
                fontSize: "12px",
                color: "var(--orca-color-text-3, #999)",
                fontFamily: "monospace",
                textTransform: "uppercase",
              },
            },
            (s.scopeLineColor || "#b8b8b8").toUpperCase(),
          ),
        ),
      ),
      window.React.createElement(
        "div",
        { style: { marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--orca-color-border, #eee)" } },
        row("每次启动随机", window.React.createElement(Switch, { on: s.randomOnStart, onChange: (v: boolean) => update({ randomOnStart: v }) })),
        row("随机时间轮换", window.React.createElement(Switch, { on: s.randomInterval, onChange: (v: boolean) => update({ randomInterval: v }) })),
        slider("定时切换(0=不定时)", s.autoSwitchInterval, 0, 120, 1, (v) => update({ autoSwitchInterval: v }), " 分"),
      ),
      window.React.createElement(
        "div",
        { style: { marginTop: "20px", display: "flex", justifyContent: "flex-end" } },
        window.React.createElement(
          Button,
          {
            variant: "plain",
            onClick: async () => {
              // 只重置视觉参数，不影响覆盖范围、图片选择等
              await setSettings(pluginNameGlobal, {
                uiOpacity: 0.85,
                specialOpacity: 0.65,
                scopeLineColor: "#b8b8b8",
                bgOpacity: 0.25,
                blur: 0,
                positionX: 0,
                positionY: 0,
              });
              requestAnimationFrame(() => {
                applyBackground(pluginNameGlobal);
                force((n: number) => n + 1);
              });
              orca.notify?.("info", "已恢复默认参数");
            },
            style: { gap: "6px" },
          },
          window.React.createElement("i", { className: "ti ti-refresh" }),
          "恢复默认",
        ),
      ),
    );
  } else {
    content = window.React.createElement(
      "div",
      { style: { padding: "4px 0" } },
      window.React.createElement(
        "div",
        { style: { fontSize: "12px", color: "var(--orca-color-text-secondary, #888)", marginBottom: "10px", fontWeight: 500 } },
        "预设壁纸",
      ),
      ...PRESETS.map((p) => {
        const checked = (s.presetSources || []).includes(p.value);
        return window.React.createElement(
          "div",
          {
            key: p.value,
            onClick: () => {
              const cur = s.presetSources || [];
              const next = checked ? cur.filter((v) => v !== p.value) : [...cur, p.value];
              update({ presetSources: next });
            },
            style: {
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              backgroundColor: checked ? "var(--orca-color-accent-bg, rgba(131,36,194,0.1))" : "transparent",
              color: checked ? "var(--orca-color-primary-5, #8324c2)" : "inherit",
              marginBottom: "4px",
              border: checked ? "1px solid var(--orca-color-primary-5, #8324c2)" : "1px solid transparent",
              transition: "all 0.15s ease",
            },
            onMouseEnter: (e: any) => {
              if (!checked) e.currentTarget.style.backgroundColor = "var(--orca-color-bg-2, #f5f5f5)";
            },
            onMouseLeave: (e: any) => {
              if (!checked) e.currentTarget.style.backgroundColor = "transparent";
            },
          },
          window.React.createElement("i", {
            className: checked ? "ti ti-square-check-filled" : "ti ti-square",
            style: { fontSize: "16px", flexShrink: 0 },
          }),
          window.React.createElement("span", null, p.label),
        );
      }),
      window.React.createElement(
        "div",
        { style: { display: "flex", gap: "8px", margin: "20px 0 14px" } },
        window.React.createElement(
          Button,
          {
            variant: "soft",
            onClick: () => fileInputRef.current?.click(),
            style: { flex: 1, gap: "6px", padding: "10px" },
          },
          window.React.createElement("i", { className: "ti ti-upload" }),
          "上传本地图片",
        ),
        window.React.createElement("input", {
          ref: fileInputRef,
          type: "file",
          accept: "image/*",
          style: { display: "none" },
          onChange: onPickFile,
        }),
      ),
      window.React.createElement(
        "div",
        { style: { fontSize: "12px", color: "var(--orca-color-text-secondary, #888)", marginBottom: "10px", fontWeight: 500 } },
        "我的图片库",
      ),
      localImages.length === 0
        ? window.React.createElement(
            "div",
            {
              style: {
                textAlign: "center",
                padding: "32px 16px",
                color: "var(--orca-color-text-secondary, #999)",
                fontSize: "13px",
                border: "1px dashed var(--orca-color-border, #ddd)",
                borderRadius: "10px",
              },
            },
            "还没有上传的图片",
          )
        : window.React.createElement(
            "div",
            { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
            ...localImages.map((img: LocalImage) =>
              window.React.createElement(
                "div",
                {
                  key: img.id,
                  onClick: () => useLocalImage(img),
                  style: {
                    position: "relative",
                    borderRadius: "10px",
                    overflow: "hidden",
                    cursor: "pointer",
                    aspectRatio: "16/10",
                    border:
                      s.backgroundImage === `local:${img.fileName}`
                        ? "2px solid var(--orca-color-primary-5, #8324c2)"
                        : "2px solid transparent",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    transition: "transform 0.15s ease",
                  },
                  onMouseEnter: (e: any) => {
                    e.currentTarget.style.transform = "scale(1.02)";
                  },
                  onMouseLeave: (e: any) => {
                    e.currentTarget.style.transform = "scale(1)";
                  },
                },
                window.React.createElement("img", {
                  src: img.url,
                  style: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
                }),
                window.React.createElement(
                  "div",
                  {
                    onClick: (e: any) => {
                      e.stopPropagation();
                      deleteLocalImage(img.fileName);
                    },
                    style: {
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      opacity: 0.8,
                    },
                    onMouseEnter: (e: any) => {
                      e.currentTarget.style.opacity = "1";
                    },
                    onMouseLeave: (e: any) => {
                      e.currentTarget.style.opacity = "0.8";
                    },
                  },
                  "×",
                ),
              ),
            ),
          ),
    );
  }

  return window.React.createElement(
    ModalOverlay,
    {
      visible: true,
      onClose,
      blurred: true,
      style: { display: "flex", alignItems: "center", justifyContent: "center" },
    },
    window.React.createElement(
      "div",
      {
        style: {
          width: "540px",
          maxWidth: "92vw",
          maxHeight: "82vh",
          backgroundColor: "var(--orca-color-bg-1, #fff)",
          borderRadius: "16px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        onClick: (e: any) => e.stopPropagation(),
      },
      window.React.createElement(
        "div",
        {
          style: {
            padding: "18px 24px",
            borderBottom: "1px solid var(--orca-color-border, #eee)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          },
        },
        window.React.createElement(
          "div",
          { style: { fontWeight: 600, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" } },
          window.React.createElement("i", { className: "ti ti-photo", style: { color: "var(--orca-color-primary-5, #8324c2)" } }),
          "背景图设置",
        ),
        window.React.createElement(
          Button,
          { variant: "plain", onClick: onClose, style: { padding: "4px", borderRadius: "8px" } },
          window.React.createElement("i", { className: "ti ti-x", style: { fontSize: "20px" } }),
        ),
      ),
      window.React.createElement(
        "div",
        { style: { padding: "12px 24px", borderBottom: "1px solid var(--orca-color-border, #eee)" } },
        window.React.createElement(Segmented, {
          selected: tab,
          options: [
            { label: "全局设置", value: "global" },
            { label: "壁纸管理", value: "wallpaper" },
          ],
          onChange: (v: string) => setTab(v as "global" | "wallpaper"),
          style: { width: "100%" },
        }),
      ),
      window.React.createElement(
        "div",
        { style: { flex: 1, overflowY: "auto", padding: "20px 24px" } },
        content,
      ),
    ),
  );
}

export async function load(_name: string) {
  pluginNameGlobal = _name;
  setupL10N(orca.state.locale, { "zh-CN": zhCN });

  await orca.plugins.setSettingsSchema(_name, SETTINGS_SCHEMA as any);

  // 先加载内部配置（背景图、透明度等），再应用背景
  await loadInternalSettings(_name);

  const s = getSettings(_name);
  // 启动时：如果当前用的是网络预设图（非本地），则随机抽一张，保证每次打开都是新图
  const isNetworkPreset = s.preset && s.preset !== "none" && !s.preset.startsWith("local:");
  if (s.randomOnStart || isNetworkPreset) {
    const sources = s.presetSources && s.presetSources.length > 0 ? s.presetSources : PRESETS.map((p) => p.value);
    const current = s.preset && s.preset !== "none" ? s.preset : null;
    const candidates = current ? sources.filter((u) => u !== current) : sources;
    const pool = candidates.length > 0 ? candidates : sources;
    const randomUrl = pool[Math.floor(Math.random() * pool.length)];
    await setSettings(_name, { preset: randomUrl });
  }

  applyBackground(_name);

  // 后台预加载所有预设图到浏览器缓存，切换时秒开
  setTimeout(() => {
    PRESETS.forEach((p) => {
      const img = new Image();
      img.src = p.value;
    });
  }, 2000);

  // 定时切换（支持随机时间轮换）
  if (s.autoSwitchInterval > 0) {
    const scheduleSwitch = () => {
      const interval = s.randomInterval
        ? (Math.random() * 1.5 + 0.5) * s.autoSwitchInterval * 60 * 1000
        : s.autoSwitchInterval * 60 * 1000;
      autoSwitchTimer = setTimeout(() => {
        const cur = getSettings(_name);
        const sources = cur.presetSources && cur.presetSources.length > 0 ? cur.presetSources : PRESETS.map((p) => p.value);
        const current = cur.preset && cur.preset !== "none" ? cur.preset : null;
        const candidates = current ? sources.filter((u) => u !== current) : sources;
        const pool = candidates.length > 0 ? candidates : sources;
        const randomUrl = pool[Math.floor(Math.random() * pool.length)];
        setSettings(_name, { preset: randomUrl });
        scheduleSwitch();
      }, interval);
    };
    scheduleSwitch();
  }

  orca.headbar.registerHeadbarButton(`${_name}.bgButton`, () =>
    window.React.createElement(HeadbarButton),
  );

  darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  darkModeHandler = () => applyBackground(_name);
  darkMediaQuery.addEventListener("change", darkModeHandler);

  orca.commands.registerCommand(
    `${_name}.random`,
    async () => {
      const cur = getSettings(_name);
      const sources = cur.presetSources && cur.presetSources.length > 0 ? cur.presetSources : PRESETS.map((p) => p.value);
      const current = cur.preset && cur.preset !== "none" ? cur.preset : null;
      const candidates = current ? sources.filter((u) => u !== current) : sources;
      const pool = candidates.length > 0 ? candidates : sources;
      const randomUrl = pool[Math.floor(Math.random() * pool.length)];
      const preset = PRESETS.find((p) => p.value === randomUrl);
      await setSettings(_name, { preset: randomUrl });
      orca.notify?.("success", preset ? `已切换到：${preset.label}` : "已切换壁纸");
    },
    "背景图：随机切换壁纸",
  );

  orca.commands.registerCommand(
    `${_name}.clear`,
    async () => {
      await setSettings(_name, { preset: "none", backgroundImage: "" });
    },
    "背景图：清除背景",
  );

  console.log(`${_name} loaded.`);
}

export async function unload() {
  // 立即落盘未保存的配置
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
    try {
      await orca.plugins.setData(pluginNameGlobal, "bg-config", JSON.stringify(cachedInternal));
    } catch {}
  }

  if (styleEl) {
    styleEl.remove();
    styleEl = null;
  }
  removeBgLayer();
  document.body.classList.remove("orca-bg-cover-active", "orca-bg-cover-fullscreen", "orca-bg-cover-editor");

  if (autoSwitchTimer) {
    clearTimeout(autoSwitchTimer);
    autoSwitchTimer = null;
  }

  orca.headbar.unregisterHeadbarButton(`${PLUGIN_NAME}.bgButton`);

  if (darkMediaQuery && darkModeHandler) {
    darkMediaQuery.removeEventListener("change", darkModeHandler);
  }
  darkMediaQuery = null;
  darkModeHandler = null;

  // 清理 blob URL 缓存，释放内存
  localBlobCache.forEach((url) => URL.revokeObjectURL(url));
  localBlobCache.clear();
  if (currentBgBlobUrl) {
    URL.revokeObjectURL(currentBgBlobUrl);
    currentBgBlobUrl = null;
  }

  settingsListeners.clear();

  orca.commands.unregisterCommand(`${PLUGIN_NAME}.random`);
  orca.commands.unregisterCommand(`${PLUGIN_NAME}.clear`);
}
