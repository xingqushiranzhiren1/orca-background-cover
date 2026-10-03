const No = "orca-background-cover", To = "bg-config", po = [
  { label: "必应每日壁纸", values: ["https://bing.biturl.top/?resolution=1920&format=image&index=0"] },
  { label: "随机风景", values: ["https://imgapi.cn/api.php?fl=fengjing&gs=images"] },
  {
    label: "随机动漫",
    values: [
      "https://img.xjh.me/random_img.php?return=302&type=bg",
      "https://t.alcy.cc/ycy",
      "https://www.loliapi.com/bg/"
    ]
  },
  { label: "Picsum 随机", values: ["https://picsum.photos/1920/1080"] },
  { label: "Unsplash 随机", values: ["https://unsplash.it/1600/900?random"] }
], lo = po.flatMap((e) => e.values), zo = Object.fromEntries(
  po.flatMap((e) => e.values.map((o) => [o, e.label]))
), Bo = [
  "https://bing.biturl.top/?resolution=1920&format=image&index=0",
  "https://imgapi.cn/api.php?fl=fengjing&gs=images",
  "https://img.xjh.me/random_img.php?return=302&type=bg",
  "https://t.alcy.cc/ycy",
  "https://www.loliapi.com/bg/"
];
function Qo(e) {
  const o = { ...e };
  if (Array.isArray(o.presetSources)) {
    const a = o.presetSources;
    a.length === Bo.length && a.every((n) => Bo.includes(n)) && (o.presetSources = [...lo]);
  }
  return o;
}
function Do(e, o) {
  return zo[e] ? zo[e] : o?.customSources?.find((a) => a.url === e)?.label;
}
function qo(e) {
  const o = (e.customSources || []).map((a) => ({ label: a.label, values: [a.url] }));
  return [...po, ...o];
}
const wo = [
  { label: "关闭", value: "off" },
  { label: "预设壁纸", value: "preset" },
  { label: "我的图片库", value: "library" },
  { label: "二者皆有", value: "both" }
], so = {
  enabled: !0,
  backgroundImage: "",
  preset: "none",
  coverMode: "editor",
  editorSpecial: !1,
  sidebarMute: !1,
  uiOpacity: 0.85,
  specialOpacity: 0.65,
  scopeLineColor: "#b8b8b8",
  bgOpacity: 0.25,
  blur: 0,
  positionX: 0,
  positionY: 0,
  darkModeImage: "",
  customSources: [],
  presetSources: [...lo],
  randomOnStart: !0,
  rotateScope: "off",
  autoSwitchInterval: 0
}, Wo = {
  uiOpacity: 0.85,
  specialOpacity: 0.65,
  scopeLineColor: "#b8b8b8",
  bgOpacity: 0.25,
  blur: 0,
  positionX: 0,
  positionY: 0
};
let $ = { ...so }, f = No;
function j(e, o, a, r) {
  return typeof e == "number" && Number.isFinite(e) ? Math.min(a, Math.max(o, e)) : r;
}
function no(e, o) {
  return typeof e == "string" ? e : o;
}
function io(e, o) {
  return typeof e == "boolean" ? e : o;
}
function Fo(e) {
  const o = so, a = { ...e };
  return wo.some((r) => r.value === a.rotateScope) || (a.rotateScope = o.rotateScope), a.coverMode !== "editor" && a.coverMode !== "fullscreen" && (a.coverMode = o.coverMode), a.enabled = io(a.enabled, o.enabled), a.editorSpecial = io(a.editorSpecial, o.editorSpecial), a.sidebarMute = io(a.sidebarMute, o.sidebarMute), a.randomOnStart = io(a.randomOnStart, o.randomOnStart), a.backgroundImage = no(a.backgroundImage, o.backgroundImage), a.preset = no(a.preset, o.preset), a.darkModeImage = no(a.darkModeImage, o.darkModeImage), a.scopeLineColor = no(a.scopeLineColor, o.scopeLineColor), a.uiOpacity = j(a.uiOpacity, 0, 1, o.uiOpacity), a.bgOpacity = j(a.bgOpacity, 0, 1, o.bgOpacity), a.specialOpacity = j(a.specialOpacity, 0.2, 1, o.specialOpacity), a.blur = j(a.blur, 0, 20, o.blur), a.positionX = j(a.positionX, -100, 100, o.positionX), a.positionY = j(a.positionY, -100, 100, o.positionY), a.autoSwitchInterval = Math.round(j(a.autoSwitchInterval, 0, 1440, o.autoSwitchInterval)), Array.isArray(a.presetSources) ? a.presetSources = a.presetSources.filter(
    (r) => typeof r == "string" && /^https?:\/\//i.test(r)
  ) : delete a.presetSources, a;
}
function C() {
  return { ...$ };
}
let T = null;
async function Zo() {
  try {
    const e = await orca.plugins.getData(f, To), o = e ? JSON.parse(e) : {};
    o.customSources !== void 0 && !Array.isArray(o.customSources) && delete o.customSources, Array.isArray(o.customSources) && (o.customSources = o.customSources.filter(
      (a) => !!a && typeof a.label == "string" && typeof a.url == "string" && /^https?:\/\//i.test(a.url)
    )), o.rotateScope === void 0 && (typeof o.autoSwitchInterval == "number" && o.autoSwitchInterval > 0 && (o.rotateScope = "preset"), delete o.randomInterval), $ = { ...so, ...Qo(Fo(o)) };
  } catch {
    $ = { ...so };
  }
}
function Eo() {
  T != null && clearTimeout(T), T = setTimeout(() => {
    T = null, orca.plugins.setData(f, To, JSON.stringify($)).catch(() => {
    });
  }, 300);
}
async function oe() {
  T != null && (clearTimeout(T), T = null);
  try {
    await orca.plugins.setData(f, To, JSON.stringify($));
  } catch {
  }
}
const ee = /* @__PURE__ */ new Set([
  "presetSources",
  "customSources",
  "randomOnStart",
  "rotateScope",
  "autoSwitchInterval"
]);
function U(e, o) {
  $ = { ...$, ...e }, (Object.keys(e).some((r) => !ee.has(r)) || o?.force === !0) && X(o?.force === !0).catch(() => {
  }), Uo(), co(), Eo();
}
function go(e) {
  const o = e.presetSources?.length ? e.presetSources : [...lo], a = e.preset && e.preset !== "none" ? e.preset : null, r = (l) => a ? l.filter((s) => s !== a) : l, n = (l) => l[Math.floor(Math.random() * l.length)], i = qo(e).filter((l) => l.values.some((s) => o.includes(s)));
  for (let l = i.length - 1; l > 0; l--) {
    const s = Math.floor(Math.random() * (l + 1));
    [i[l], i[s]] = [i[s], i[l]];
  }
  for (const l of i) {
    const s = l.values.filter((q) => o.includes(q)), h = r(s);
    if (h.length > 0) return n(h);
  }
  const v = r(o);
  return v.length > 0 ? n(v) : a ?? o[0] ?? lo[0];
}
async function Yo() {
  const e = C(), o = go(e);
  $ = { ...$, preset: o, enabled: !0 };
  const a = X(!0);
  if (Uo(), co(), Eo(), !await a.catch(() => !1)) return;
  const n = Do(o, e);
  orca.notify?.("success", n ? `已切换到：${n}` : "已切换壁纸");
}
const H = /* @__PURE__ */ new Map();
function re(e) {
  const o = e.slice(e.lastIndexOf(".") + 1).toLowerCase();
  return {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    svg: "image/svg+xml"
  }[o] || "image/png";
}
async function Po(e) {
  const o = H.get(e);
  if (o) return o;
  try {
    const r = await orca.plugins.readFile(f, e, "buffer");
    if (r instanceof ArrayBuffer) {
      const n = URL.createObjectURL(new Blob([r], { type: re(e) }));
      return H.set(e, n), n;
    }
  } catch {
  }
  const a = orca.state?.repoDir;
  if (a) {
    const r = `${a}/assets/plugins/${f}/${e}`;
    try {
      return orca.utils.getAssetPath(r);
    } catch {
      return r;
    }
  }
  return e;
}
async function Xo() {
  try {
    const e = await orca.plugins.listFiles(f), o = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;
    return await Promise.all(
      e.filter((a) => o.test(a)).map(async (a) => {
        const r = a.replace(/\.[^.]+$/, "");
        return { id: r, name: r, fileName: a, url: await Po(a) };
      })
    );
  } catch {
    return [];
  }
}
async function Co(e, o) {
  await orca.plugins.writeFile(f, e, o);
}
async function ae(e) {
  const o = H.get(e);
  o && (URL.revokeObjectURL(o), H.delete(e)), await orca.plugins.removeFile(f, e);
}
function Ho(e) {
  return typeof e.arrayBuffer == "function" ? e.arrayBuffer() : new Promise((o, a) => {
    const r = new FileReader();
    r.onload = () => o(r.result), r.onerror = a, r.readAsArrayBuffer(e);
  });
}
const te = "orca-background-cover-style", ce = "orca-bg-cover-layer", ne = [
  "--bgc-bg-url",
  "--bgc-pos-x",
  "--bgc-pos-y",
  "--bgc-blur",
  "--bgc-bg-opacity",
  "--bgc-ui-pct",
  "--bgc-ui-pct-60",
  "--bgc-special-pct",
  "--bgc-scope-line-color"
], ie = `
  /* ===== 编辑器模式：背景只在主区域（#main），且不随内容滚动 =====
     图挂在主区域容器自身的 ::before 上（#main 本身不随内容滚动），并配
     background-attachment: fixed——滚动编辑器内容时图固定在视口，
     不会出现"往下滚下面就没图"（v1.8 修复）。
     全部微调参数在此模式下均生效：
     背景可见度=图 opacity、背景虚化=图 filter、X/Y 偏移=图 position、
     UI 透明度=面板底色蒙版浓度 */
  body.orca-bg-cover-active.orca-bg-cover-editor #main {
    position: relative;
    isolation: isolate;
  }
  body.orca-bg-cover-active.orca-bg-cover-editor #main::before {
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
  body.orca-bg-cover-active.orca-bg-cover-editor .orca-panel {
    background-color: transparent !important;
    isolation: isolate;
    position: relative;
  }
  body.orca-bg-cover-active.orca-bg-cover-editor .orca-panel::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-color: color-mix(in oklab, var(--orca-color-bg-1, #fff) var(--bgc-ui-pct), transparent);
  }
  body.orca-bg-cover-active.orca-bg-cover-editor #main,
  body.orca-bg-cover-active.orca-bg-cover-editor .orca-panels-container,
  body.orca-bg-cover-active.orca-bg-cover-editor .orca-workspace,
  body.orca-bg-cover-active.orca-bg-cover-editor .orca-editor,
  body.orca-bg-cover-active.orca-bg-cover-editor .orca-block-editor,
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
  /* asar 实锤：日历只有 .orca-query-calendar-month-view 系列，无 .orca-query-calendar-month */
  body.orca-bg-cover-active .orca-query-calendar-month-view,
  body.orca-bg-cover-active .orca-repr-self-fold-container,
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
  body.orca-bg-cover-active .orca-query-table-cell-stats,
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

  /* 画廊等透明化（注意：不能包含 .orca-block-handle——折叠提示圆点
     .orca-block-handle-collapsed 就是它的变体，灰圆底色被抹掉就看不清了） */
  body.orca-bg-cover-active .orca-gallery-wrapper,
  body.orca-bg-cover-active .orca-gallery-grid,
  body.orca-bg-cover-active .orca-gallery-add-card,
  body.orca-bg-cover-active .orca-block,
  body.orca-bg-cover-active .orca-repr,
  body.orca-bg-cover-active .orca-repr-main,
  body.orca-bg-cover-active .orca-repr-main-content,
  body.orca-bg-cover-active .orca-repr-children,
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

  /* 代码块：整块跟随特殊块不透明度（asar 实锤结构：
     .orca-code-editor-container > header(bg-2) + .cm-editor(主题底) + .cm-gutters） */
  body.orca-bg-cover-active .orca-code-editor-container {
    background-color: color-mix(in oklab, var(--orca-color-bg-1, #fff) var(--bgc-special-pct), transparent) !important;
  }
  body.orca-bg-cover-active .orca-code-editor-header,
  body.orca-bg-cover-active .orca-code-editor .cm-editor,
  body.orca-bg-cover-active .orca-code-editor .cm-gutters,
  body.orca-bg-cover-active .orca-code-preview {
    background-color: transparent !important;
  }

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

  /* 编辑器特殊处理延伸到侧栏：与编辑器卡片同款 87.5% 底衬
     （= 思源公式 1 - 0.25 × 前景不透明度默认值 0.5），
     让侧栏跟壁纸有区分度、内容可读。放在全屏规则之后、侧栏静音规则之前，
     保证「侧栏静音」开启时透明化优先（同权重，后者胜）。
     注意：不含顶栏 #headbar（用户明确要求顶栏不参与特殊处理） */
  body.orca-bg-cover-active.orca-bg-cover-fade #sidebar {
    background-color: color-mix(in oklab, var(--orca-color-bg-1, #fff) 87.5%, transparent) !important;
  }

  /* 侧栏静音：顶栏/侧栏/面板/拖动条去底色去边框（asar 实锤这些类均存在；
     .orca-panel-overlay 原生 gray-5+.55opacity、.orca-sidebar-tab-options 原生 gray-7） */
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute #headbar,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute #sidebar,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute #main,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute .orca-panels-container,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute .orca-panels-row,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute .orca-panel-overlay,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute .resizer,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute .orca-sidebar-resizer,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute .orca-panels-row > .resizer,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute .orca-panel > .resizer,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute .orca-sidebar-tab-options,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute .orca-sidebar-tab-options .orca-segmented-item,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute .orca-repo-switcher-button,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute .orca-favorites-list,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute .orca-favorites-items,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute .orca-fav-item,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute .orca-fav-item-item {
    background: transparent !important;
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute #headbar::before,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute #headbar::after,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute #sidebar::before,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute #sidebar::after {
    content: none !important;
    background: none !important;
    box-shadow: none !important;
  }
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute #headbar .orca-button.plain:hover,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute #headbar .orca-button.plain:active,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute #sidebar .orca-button.plain:hover,
  body.orca-bg-cover-active.orca-bg-cover-sidebar-mute #sidebar .orca-button.plain:active {
    background: transparent !important;
    box-shadow: none !important;
  }

  /* 新页面按钮：底色跟随「特殊块不透明度」（原生是 primary-5 实色/gray-7） */
  body.orca-bg-cover-active .orca-sidebar-create-aliased-btn.orca-button {
    background-color: color-mix(in oklab, var(--orca-color-primary-5, #8324c2) var(--bgc-special-pct), transparent) !important;
    border: none !important;
    box-shadow: none !important;
  }

  /* 编辑器特殊处理（同思源）：整个 UI 半透明，背景从界面之下透出。
     0.875 = 思源公式 1 - 0.25 × 前景不透明度默认值 0.5；body 背景必须透明让垫底背景可见。
     注：v1.7.3 起不再叠加圆角外壳（用户判定为败笔，已移除） */
  body.orca-bg-cover-fade {
    background: transparent !important;
    opacity: 0.875;
  }
`;
let D = null, g = null, R = null, V = null, ro = 0, Y = null, F = null, N = null;
const le = 1e4, se = 2;
function _o(e) {
  return {
    posX: `${50 + e.positionX / 2}%`,
    posY: `${50 + e.positionY / 2}%`,
    opacity: String(Math.max(0, Math.min(1, e.bgOpacity))),
    filter: e.blur > 0 ? `blur(${e.blur}px)` : "none"
  };
}
let Lo = null, Io = null, ao = null, to = null, Mo = null;
function be() {
  D || (D = document.createElement("style"), D.id = te, D.textContent = ie, document.head.appendChild(D));
}
let xo = null;
function Vo() {
  return xo || (xo = window.matchMedia("(prefers-color-scheme: dark)")), xo;
}
function jo(e) {
  g || (g = document.createElement("div"), g.id = ce, g.style.position = "fixed", g.style.inset = "0", g.style.zIndex = "0", g.style.pointerEvents = "none", g.style.backgroundSize = "cover", g.style.backgroundPosition = "center center", g.style.backgroundRepeat = "no-repeat", ao = null, to = null);
  const o = e ? document.documentElement : document.body;
  return g.parentElement !== o && (g.style.zIndex = e ? "-1" : "0", e ? o.appendChild(g) : o.insertBefore(g, o.firstChild)), g;
}
function Ao() {
  g?.remove(), g = null, ao = null, to = null;
}
function So(e, o, a, r, n) {
  const i = `url("${e.replace(/"/g, '\\"')}")`;
  if (i !== Io && (Io = i, document.body.style.setProperty("--bgc-bg-url", i)), g) {
    i !== ao && (ao = i, g.style.backgroundImage = i);
    const v = `${o}|${a}|${r}|${n}`;
    v !== to && (to = v, g.style.opacity = o, g.style.filter = a, g.style.backgroundPosition = `${r} ${n}`);
  }
}
function Go() {
  document.body.classList.remove(
    "orca-bg-cover-active",
    "orca-bg-cover-fullscreen",
    "orca-bg-cover-editor",
    "orca-bg-cover-fade",
    "orca-bg-cover-sidebar-mute"
  ), Ao();
  for (const e of ne) document.body.style.removeProperty(e);
  R = null, V = null, F = null, N = null, Y = null, Lo = null, Io = null, ao = null, to = null, Mo = null;
}
function $o() {
  return Vo().matches;
}
function Oo(e, o) {
  if (e.preset && e.preset !== "none") return e.preset;
  const a = o && e.darkModeImage ? e.darkModeImage : e.backgroundImage;
  return typeof a == "string" ? a : "";
}
function bo(e) {
  return e.startsWith("data:") || e.startsWith("blob:") || e.startsWith("file:") || e.startsWith("local:") || /^[a-zA-Z]:[\\/]/.test(e) || e.startsWith("/assets/");
}
async function X(e = !1) {
  const o = C(), a = o.enabled ? Oo(o, $o()) : "";
  if (!a.trim())
    return Go(), !0;
  const { posX: r, posY: n, opacity: i, filter: v } = _o(o), l = o.coverMode === "fullscreen", s = Math.max(0.75, Math.min(1, 1 - 0.25 * (1 - o.uiOpacity))), h = Math.max(0.2, Math.min(1, o.specialOpacity)), q = `${r}|${n}|${v}|${i}|${(1 - s) * 100}|${h * 100}|${o.scopeLineColor || "#b8b8b8"}`;
  if (q !== Lo) {
    Lo = q;
    const u = document.body.style;
    u.setProperty("--bgc-pos-x", r), u.setProperty("--bgc-pos-y", n), u.setProperty("--bgc-blur", v), u.setProperty("--bgc-bg-opacity", i), u.setProperty("--bgc-ui-pct", `${(1 - s) * 100}%`), u.setProperty("--bgc-ui-pct-60", `${(1 - s) * 60}%`), u.setProperty("--bgc-special-pct", `${h * 100}%`), u.setProperty("--bgc-scope-line-color", o.scopeLineColor || "#b8b8b8");
  }
  be(), o.editorSpecial && l ? (jo(!0), document.body.classList.add("orca-bg-cover-fade", "orca-bg-cover-fullscreen"), document.body.classList.remove("orca-bg-cover-editor")) : (document.body.classList.remove("orca-bg-cover-fade"), l ? jo(!1) : Ao(), document.body.classList.toggle("orca-bg-cover-fullscreen", l), document.body.classList.toggle("orca-bg-cover-editor", !l)), document.body.classList.toggle(
    "orca-bg-cover-sidebar-mute",
    o.sidebarMute === !0 && l
  ), document.body.classList.add("orca-bg-cover-active");
  const m = a.trim();
  if (bo(m)) {
    let u = m;
    if (m.startsWith("local:") && (u = await Po(m.slice(6))), F = m, N = null, V = u.startsWith("blob:") ? u : null, So(u, i, v, r, n), u !== Mo) {
      Mo = u;
      const O = new Image();
      O.onload = () => {
        R = O;
      }, O.src = u;
    }
    return !0;
  }
  if (V = null, !e && F === m && N)
    return So(N, i, v, r, n), !0;
  if (!e && F === m && !N || !e && Y === m) return !1;
  const z = ++ro;
  Y = m;
  let E = null;
  try {
    E = await ue(m, z);
  } finally {
    Y === m && (Y = null);
  }
  if (z !== ro) return !1;
  if (!E) {
    F = m, N = null;
    const u = Do(m);
    return orca.notify?.(
      "error",
      u ? `抽取失败：「${u}」加载不出来，请检查网络或换一个图源` : "抽取失败：图片加载不出来，请检查网络或换一个图源"
    ), !1;
  }
  F = m, N = E;
  const L = _o(C());
  return So(E, L.opacity, L.filter, L.posX, L.posY), !0;
}
function de(e, o) {
  return new Promise((a) => {
    const n = /^https?:/i.test(e) ? `${e}${e.includes("?") ? "&" : "?"}_t=${Date.now()}-${Math.floor(Math.random() * 1e6)}` : e, i = new Image();
    let v = !1;
    const l = (h) => {
      if (!v) {
        if (v = !0, clearTimeout(s), h === null) {
          i.onload = null, i.onerror = null;
          try {
            i.src = "";
          } catch {
          }
        }
        a(h);
      }
    }, s = setTimeout(() => l(null), le);
    i.onload = () => {
      if (o !== ro) {
        l(null);
        return;
      }
      R = i, l(n);
    }, i.onerror = () => l(null), i.src = n;
  });
}
async function ue(e, o) {
  for (let a = 0; a < se; a++) {
    const r = await de(e, o);
    if (o !== ro) return null;
    if (r) return r;
  }
  return null;
}
let A = null, Ro = "";
async function Ko(e) {
  const o = await Xo(), a = e.backgroundImage, r = typeof a == "string" && a.startsWith("local:") ? a.slice(6) : null, n = o.map((i) => i.fileName).filter((i) => i !== r);
  return n.length === 0 ? null : n[Math.floor(Math.random() * n.length)];
}
async function Jo(e) {
  const o = e ?? C(), a = o.rotateScope;
  if (a === "off") return !1;
  if (a === "library" || a === "both") {
    const r = await Ko(o);
    if (r != null && (a === "library" || Math.random() < 0.5))
      return U({ preset: "none", backgroundImage: `local:${r}` }, { force: !0 }), !0;
    if (a === "library") return !1;
  }
  return U({ preset: go(o) }, { force: !0 }), !0;
}
function co() {
  const e = C(), o = e.enabled && e.rotateScope !== "off" && e.autoSwitchInterval > 0, a = o ? `${e.rotateScope}:${e.autoSwitchInterval}` : "off";
  if (a === Ro && A != null || (Ro = a, A != null && (clearTimeout(A), A = null), !o)) return;
  const r = e.autoSwitchInterval;
  A = setTimeout(async () => {
    A = null;
    try {
      await Jo();
    } catch {
    }
    co();
  }, r * 6e4);
}
const uo = /* @__PURE__ */ new Set();
function Uo() {
  uo.forEach((e) => {
    try {
      e();
    } catch {
    }
  });
}
function pe() {
  const e = window.React, o = e.createElement, { useState: a, useRef: r, useEffect: n } = e, { Button: i, Popup: v, Menu: l, MenuText: s, MenuSeparator: h, MenuTitle: q } = orca.components, [m, z] = a(!1), [E, L] = a(null), [, u] = a(0), O = r(null), G = r(null);
  n(() => {
    const y = () => u((k) => k + 1);
    return uo.add(y), () => {
      uo.delete(y);
    };
  }, []);
  const b = () => z(!1), vo = async (y) => {
    const k = y.target.files?.[0];
    if (k) {
      b();
      try {
        orca.notify?.("info", "正在上传图片...");
        const x = await Ho(k), _ = (k.name.match(/\.[^.]+$/) || [".png"])[0].toLowerCase(), M = `img-${Date.now()}${_}`;
        await Co(M, x), await U({ preset: "none", backgroundImage: `local:${M}`, enabled: !0 }), orca.notify?.("success", "图片已添加");
      } catch (x) {
        console.error(x), orca.notify?.("error", "上传失败");
      }
    }
  }, yo = async () => {
    b();
    try {
      await Yo();
    } catch (y) {
      console.error(y), orca.notify?.("error", "切换失败");
    }
  }, mo = async (y) => {
    await U({ preset: y, enabled: !0 }, { force: !0 }), b();
  }, d = async () => {
    await U({ enabled: !C().enabled }), b();
  }, P = async () => {
    const y = C();
    let k = "";
    if (y.preset && y.preset !== "none" ? k = y.preset : k = y.backgroundImage, !k || bo(k)) {
      orca.notify?.("error", "当前图片已经是本地图片");
      return;
    }
    try {
      orca.notify?.("info", "正在保存图片...");
      let x = null;
      if (V && (x = await (await fetch(V)).blob()), !x && R && R.complete && R.naturalWidth > 0) {
        const M = document.createElement("canvas");
        M.width = R.naturalWidth, M.height = R.naturalHeight;
        const B = M.getContext("2d");
        B && (B.drawImage(R, 0, 0), x = await new Promise((fo) => M.toBlob(fo, "image/png")));
      }
      if (!x) {
        const M = typeof AbortSignal?.timeout == "function" ? AbortSignal.timeout(2e4) : void 0, B = await fetch(k, { mode: "cors", signal: M });
        if (!B.ok) throw new Error(`HTTP ${B.status}`);
        x = await B.blob();
      }
      if (!x) throw new Error("无法获取图片数据");
      const _ = `img-${Date.now()}.png`;
      await Co(_, await x.arrayBuffer()), await U({ preset: "none", backgroundImage: `local:${_}` }), orca.notify?.("success", "图片已保存到本地图片库");
    } catch (x) {
      console.error("保存图片失败", x), orca.notify?.("error", "保存失败：该图片服务器不允许跨域下载，请手动截图保存");
    }
    b();
  }, I = C(), W = I.preset && I.preset !== "none", K = o(
    l,
    { style: { minWidth: "200px" } },
    o(q, { title: "背景图" }),
    o(
      s,
      {
        title: "手动挑一张",
        preIcon: "ti ti-hand-click",
        children: o(
          l,
          null,
          ...qo(I).map(
            (y) => o(s, {
              key: y.label,
              title: y.label,
              onClick: () => {
                const k = y.values[Math.floor(Math.random() * y.values.length)];
                mo(k);
              }
            })
          ),
          o(h, null),
          o(s, {
            title: "本地图片库",
            preIcon: "ti ti-photo",
            onClick: () => {
              b(), L("wallpaper");
            }
          })
        )
      }
    ),
    o(s, { title: "随机抽一张", preIcon: "ti ti-dice-5", onClick: yo }),
    W ? o(s, { title: "保存当前图片到本地", preIcon: "ti ti-download", onClick: P }) : null,
    o(h, null),
    o(s, {
      title: "添加本地图片",
      preIcon: "ti ti-photo-plus",
      onClick: () => G.current?.click()
    }),
    o(h, null),
    o(s, {
      title: I.enabled ? "关闭图片背景" : "开启图片背景",
      preIcon: I.enabled ? "ti ti-eye-off" : "ti ti-eye",
      onClick: d
    }),
    o(h, null),
    o(s, {
      title: "设置",
      preIcon: "ti ti-settings",
      onClick: () => {
        b(), L("global");
      }
    })
  );
  return o(
    e.Fragment,
    null,
    o(
      i,
      {
        ref: O,
        variant: "plain",
        onClick: () => z(!m),
        title: "背景图"
      },
      o("i", { className: "ti ti-photo" })
    ),
    o("input", {
      ref: G,
      type: "file",
      accept: "image/*",
      style: { display: "none" },
      onChange: vo
    }),
    o(
      v,
      {
        refElement: O,
        visible: m,
        onClose: b,
        escapeToClose: !0,
        defaultPlacement: "bottom",
        alignment: "right"
      },
      K
    ),
    E ? o(ge, { onClose: () => L(null), initialTab: E }) : null
  );
}
function ge({ onClose: e, initialTab: o = "global" }) {
  const a = window.React, r = a.createElement, { useState: n, useEffect: i, useRef: v } = a, { ModalOverlay: l, Button: s, Switch: h, Segmented: q, Select: m } = orca.components, [z, E] = n(o), [, L] = n(0), [u, O] = n([]), G = v(null);
  i(() => {
    Xo().then(O);
  }, []);
  const b = async (t) => {
    await U(t), L((c) => c + 1);
  }, vo = async (t) => {
    const c = t.target.files?.[0];
    if (c)
      try {
        const p = await Ho(c), J = (c.name.match(/\.[^.]+$/) || [".png"])[0].toLowerCase(), S = `img-${Date.now()}${J}`;
        await Co(S, p);
        const w = await Po(S);
        O((Q) => [
          ...Q,
          { id: S.replace(/\.[^.]+$/, ""), name: c.name, fileName: S, url: w }
        ]), await b({ preset: "none", backgroundImage: `local:${S}` });
      } catch (p) {
        console.error(p), orca.notify?.("error", "上传失败");
      }
  }, yo = (t) => {
    b({ preset: "none", backgroundImage: `local:${t}` });
  }, mo = (t) => {
    ae(t).then(() => {
      O((c) => c.filter((p) => p.fileName !== t)), L((c) => c + 1);
    });
  }, d = C(), P = (t, c, p, J, S, w, Q = "") => r(
    "div",
    { style: { marginBottom: "18px", marginTop: "12px" } },
    r(
      "div",
      { style: { display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" } },
      r("span", null, t),
      r(
        "span",
        {
          style: {
            color: "var(--orca-color-primary-5, #8324c2)",
            fontWeight: 600,
            fontSize: "12px",
            padding: "2px 8px",
            borderRadius: "10px",
            backgroundColor: "var(--orca-color-accent-bg, rgba(131,36,194,0.1))"
          }
        },
        `${c}${Q}`
      )
    ),
    r("input", {
      type: "range",
      min: p,
      max: J,
      step: S,
      value: c,
      onChange: (ko) => w(parseFloat(ko.target.value)),
      style: {
        width: "100%",
        height: "6px",
        appearance: "none",
        WebkitAppearance: "none",
        borderRadius: "3px",
        background: "var(--orca-color-bg-2, #eee)",
        outline: "none",
        accentColor: "var(--orca-color-primary-5, #8324c2)"
      }
    })
  ), I = (t, c) => r(
    "div",
    {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: "1px solid var(--orca-color-border, #eee)"
      }
    },
    r("span", { style: { fontSize: "13px", fontWeight: 500 } }, t),
    c
  ), [W, K] = n(!1), [y, k] = n(""), [x, _] = n(""), M = async () => {
    const t = x.trim(), c = y.trim() || `网络源 ${(d.customSources?.length || 0) + 1}`;
    if (!/^https?:\/\//i.test(t)) {
      orca.notify?.("error", "URL 需以 http:// 或 https:// 开头");
      return;
    }
    if ((d.customSources || []).some((p) => p.url === t)) {
      orca.notify?.("error", "该 URL 已存在");
      return;
    }
    await b({
      customSources: [...d.customSources || [], { label: c, url: t }],
      presetSources: [.../* @__PURE__ */ new Set([...d.presetSources || [], t])]
    }), k(""), _(""), K(!1), orca.notify?.("success", `已添加网络源：${c}`);
  }, B = async (t) => {
    await b({
      customSources: (d.customSources || []).filter((c) => c.url !== t),
      presetSources: (d.presetSources || []).filter((c) => c !== t)
    });
  }, fo = qo(d);
  let ho;
  if (z === "global")
    ho = r(
      "div",
      { style: { padding: "4px 0" } },
      I("开启背景", r(h, { on: d.enabled, onChange: (t) => b({ enabled: t }) })),
      I(
        "覆盖范围",
        r(q, {
          selected: d.coverMode,
          options: [
            { label: "仅编辑器", value: "editor" },
            { label: "全屏", value: "fullscreen" }
          ],
          onChange: (t) => b({ coverMode: t })
        })
      ),
      I(
        "编辑器和侧栏特殊处理（仅全屏生效，需开启 official 主题圆角外壳）",
        r(h, { on: d.editorSpecial, onChange: (t) => b({ editorSpecial: t }) })
      ),
      I(
        "侧栏静音（仅全屏生效）",
        r(h, { on: d.sidebarMute, onChange: (t) => b({ sidebarMute: t }) })
      ),
      P("UI 透明度", d.uiOpacity, 0, 1, 0.01, (t) => b({ uiOpacity: t })),
      P("背景可见度", d.bgOpacity, 0, 1, 0.01, (t) => b({ bgOpacity: t })),
      P("背景虚化", d.blur, 0, 20, 0.5, (t) => b({ blur: t })),
      P("X 偏移", d.positionX, -100, 100, 1, (t) => b({ positionX: t }), "%"),
      P("Y 偏移", d.positionY, -100, 100, 1, (t) => b({ positionY: t }), "%"),
      P("特殊块不透明度", d.specialOpacity, 0.2, 1, 0.01, (t) => b({ specialOpacity: t })),
      r(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0"
          }
        },
        r("span", { style: { fontSize: "13px", fontWeight: 500 } }, "层级线颜色"),
        r(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "10px" } },
          r(
            "div",
            {
              style: {
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                backgroundColor: d.scopeLineColor || "#b8b8b8",
                border: "1px solid var(--orca-color-border, #ddd)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                overflow: "hidden",
                position: "relative"
              }
            },
            r("input", {
              type: "color",
              value: d.scopeLineColor || "#b8b8b8",
              onChange: (t) => b({ scopeLineColor: t.target.value }),
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
                opacity: 0
              }
            })
          ),
          r(
            "span",
            {
              style: {
                fontSize: "12px",
                color: "var(--orca-color-text-3, #999)",
                fontFamily: "monospace",
                textTransform: "uppercase"
              }
            },
            (d.scopeLineColor || "#b8b8b8").toUpperCase()
          )
        )
      ),
      r(
        "div",
        {
          style: {
            marginTop: "12px",
            paddingTop: "4px",
            borderTop: "1px solid var(--orca-color-border, #eee)"
          }
        },
        I(
          "随机时间轮换",
          r(m, {
            width: "auto",
            alignment: "right",
            options: wo,
            selected: [d.rotateScope],
            onChange: (t) => {
              const c = t?.[0];
              wo.some((p) => p.value === c) && b({ rotateScope: c });
            }
          })
        ),
        r(
          "div",
          /* 关闭时滑杆置灰且不可点：轮换来源选了才会用到间隔 */
          d.rotateScope === "off" ? { opacity: 0.45, pointerEvents: "none" } : void 0,
          P(
            "定时切换(0=不定时)",
            d.autoSwitchInterval,
            0,
            120,
            1,
            (t) => b({ autoSwitchInterval: t }),
            " 分"
          )
        )
      ),
      r(
        "div",
        {
          style: { marginTop: "20px", display: "flex", justifyContent: "flex-end" }
        },
        r(
          s,
          {
            variant: "plain",
            onClick: async () => {
              await b(Wo), orca.notify?.("info", "已恢复默认参数");
            },
            style: { gap: "6px" }
          },
          r("i", { className: "ti ti-refresh" }),
          "恢复默认"
        )
      )
    );
  else {
    const t = {
      flex: 1,
      padding: "8px 10px",
      borderRadius: "8px",
      border: "1px solid var(--orca-color-border, #ddd)",
      backgroundColor: "var(--orca-color-bg-1, #fff)",
      color: "inherit",
      fontSize: "13px",
      outline: "none"
    };
    ho = r(
      "div",
      { style: { padding: "4px 0" } },
      r(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px"
          }
        },
        r(
          "div",
          {
            style: {
              fontSize: "12px",
              color: "var(--orca-color-text-secondary, #888)",
              fontWeight: 500
            }
          },
          "预设壁纸"
        ),
        r(
          s,
          {
            variant: "soft",
            onClick: () => K(!W),
            style: { gap: "4px", padding: "4px 10px", fontSize: "12px" }
          },
          r("i", { className: W ? "ti ti-x" : "ti ti-world-plus" }),
          W ? "取消" : "添加网络源"
        )
      ),
      W ? r(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid var(--orca-color-border, #ddd)",
            marginBottom: "10px",
            backgroundColor: "var(--orca-color-bg-2, #f5f5f5)"
          }
        },
        r("input", {
          key: "label",
          placeholder: "标题（如：我的图片源）",
          value: y,
          onChange: (c) => k(c.target.value),
          style: t
        }),
        r("input", {
          key: "url",
          placeholder: "图片 API 或图片 URL（http:// 或 https:// 开头）",
          value: x,
          onChange: (c) => _(c.target.value),
          style: t
        }),
        r(
          "div",
          { style: { display: "flex", gap: "8px", justifyContent: "flex-end" } },
          r(
            s,
            { variant: "plain", onClick: () => K(!1), style: { fontSize: "12px" } },
            "取消"
          ),
          r(
            s,
            {
              variant: "soft",
              onClick: () => void M(),
              style: { gap: "4px", fontSize: "12px" }
            },
            r("i", { className: "ti ti-plus" }),
            "添加"
          )
        )
      ) : null,
      ...fo.map((c, p) => {
        const J = p >= po.length, S = c.values.every((w) => (d.presetSources || []).includes(w));
        return r(
          "div",
          {
            key: `${p}-${c.label}`,
            onClick: () => {
              const w = d.presetSources || [], Q = S ? w.filter((ko) => !c.values.includes(ko)) : [.../* @__PURE__ */ new Set([...w, ...c.values])];
              b({ presetSources: Q });
            },
            style: {
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              backgroundColor: S ? "var(--orca-color-accent-bg, rgba(131,36,194,0.1))" : "transparent",
              color: S ? "var(--orca-color-primary-5, #8324c2)" : "inherit",
              marginBottom: "4px",
              border: S ? "1px solid var(--orca-color-primary-5, #8324c2)" : "1px solid transparent",
              transition: "all 0.15s ease"
            },
            onMouseEnter: (w) => {
              S || (w.currentTarget.style.backgroundColor = "var(--orca-color-bg-2, #f5f5f5)");
            },
            onMouseLeave: (w) => {
              S || (w.currentTarget.style.backgroundColor = "transparent");
            }
          },
          r("i", { className: S ? "ti ti-square-check-filled" : "ti ti-square", style: { fontSize: "16px", flexShrink: 0 } }),
          r("span", { style: { flex: 1 } }, c.label),
          J ? r("i", {
            className: "ti ti-trash",
            title: "删除该网络源",
            style: { fontSize: "14px", flexShrink: 0, opacity: 0.55, cursor: "pointer" },
            onClick: (w) => {
              w.stopPropagation(), B(c.values[0]);
            }
          }) : null
        );
      }),
      r(
        "div",
        { style: { display: "flex", gap: "8px", margin: "20px 0 14px" } },
        r(
          s,
          {
            variant: "soft",
            onClick: () => G.current?.click(),
            style: { flex: 1, gap: "6px", padding: "10px" }
          },
          r("i", { className: "ti ti-upload" }),
          "上传本地图片"
        ),
        r("input", {
          ref: G,
          type: "file",
          accept: "image/*",
          style: { display: "none" },
          onChange: vo
        })
      ),
      r(
        "div",
        {
          style: {
            fontSize: "12px",
            color: "var(--orca-color-text-secondary, #888)",
            marginBottom: "10px",
            fontWeight: 500
          }
        },
        "我的图片库"
      ),
      u.length === 0 ? r(
        "div",
        {
          style: {
            textAlign: "center",
            padding: "32px 16px",
            color: "var(--orca-color-text-secondary, #999)",
            fontSize: "13px",
            border: "1px dashed var(--orca-color-border, #ddd)",
            borderRadius: "10px"
          }
        },
        "还没有上传的图片"
      ) : r(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
        ...u.map(
          (c) => r(
            "div",
            {
              key: c.id,
              onClick: () => yo(c.fileName),
              style: {
                position: "relative",
                borderRadius: "10px",
                overflow: "hidden",
                cursor: "pointer",
                aspectRatio: "16/10",
                border: d.backgroundImage === `local:${c.fileName}` ? "2px solid var(--orca-color-primary-5, #8324c2)" : "2px solid transparent",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                transition: "transform 0.15s ease"
              },
              onMouseEnter: (p) => {
                p.currentTarget.style.transform = "scale(1.02)";
              },
              onMouseLeave: (p) => {
                p.currentTarget.style.transform = "scale(1)";
              }
            },
            r("img", { src: c.url, style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } }),
            r(
              "div",
              {
                onClick: (p) => {
                  p.stopPropagation(), mo(c.fileName);
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
                  opacity: 0.8
                },
                onMouseEnter: (p) => {
                  p.currentTarget.style.opacity = "1";
                },
                onMouseLeave: (p) => {
                  p.currentTarget.style.opacity = "0.8";
                }
              },
              "×"
            )
          )
        )
      )
    );
  }
  return r(
    l,
    {
      visible: !0,
      onClose: e,
      blurred: !0,
      style: { display: "flex", alignItems: "center", justifyContent: "center" }
    },
    r(
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
          overflow: "hidden"
        },
        onClick: (t) => t.stopPropagation()
      },
      r(
        "div",
        {
          style: {
            padding: "18px 24px",
            borderBottom: "1px solid var(--orca-color-border, #eee)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }
        },
        r(
          "div",
          {
            style: {
              fontWeight: 600,
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }
          },
          r("i", { className: "ti ti-photo", style: { color: "var(--orca-color-primary-5, #8324c2)" } }),
          "背景图设置"
        ),
        r(
          s,
          { variant: "plain", onClick: e, style: { padding: "4px", borderRadius: "8px" } },
          r("i", { className: "ti ti-x", style: { fontSize: "20px" } })
        )
      ),
      r(
        "div",
        { style: { padding: "12px 24px", borderBottom: "1px solid var(--orca-color-border, #eee)" } },
        r(q, {
          selected: z,
          options: [
            { label: "全局设置", value: "global" },
            { label: "壁纸管理", value: "wallpaper" }
          ],
          onChange: (t) => E(t),
          style: { width: "100%" }
        })
      ),
      r("div", { style: { flex: 1, overflowY: "auto", padding: "20px 24px" } }, ho)
    )
  );
}
let Z = null, oo = null, eo = null;
async function ve(e) {
  f = e || No;
  try {
    await orca.plugins.setSettingsSchema(f, {}), await Zo();
    const o = C(), a = (o.enabled ? Oo(o, $o()) : "").trim(), r = !!a && bo(a), n = !!o.preset && o.preset !== "none";
    o.enabled && !r && (o.randomOnStart || n) && ($ = { ...$, preset: go(o) }, Eo()), X(!0).then((i) => {
      !i && o.enabled && !r && (eo = setTimeout(() => {
        eo = null;
        const v = C(), l = (v.enabled ? Oo(v, $o()) : "").trim();
        v.enabled && l && !bo(l) && X(!0);
      }, 8e3));
    }).catch(() => {
    }), Uo(), co(), orca.headbar.registerHeadbarButton(
      `${f}.bgButton`,
      () => window.React.createElement(pe)
    ), Z = Vo(), oo = () => {
      X().catch(() => {
      });
    }, Z.addEventListener("change", oo), orca.commands.registerCommand(`${f}.random`, () => Yo(), "背景图：随机切换壁纸"), orca.commands.registerCommand(
      `${f}.clear`,
      async () => {
        await U({ preset: "none", backgroundImage: "" });
      },
      "背景图：清除背景"
    ), console.log(`${f} loaded.`);
  } catch (o) {
    console.error(`[${f}] load failed:`, o);
    try {
      orca.notify?.("error", `背景图插件加载失败：${o?.message ?? String(o)}`);
    } catch {
    }
  }
}
async function ye() {
  await oe(), ro++, Y = null, T != null && (clearTimeout(T), T = null), A != null && (clearTimeout(A), A = null), Ro = "", eo != null && (clearTimeout(eo), eo = null), D?.remove(), D = null, Ao(), Go(), Z && oo && Z.removeEventListener("change", oo), Z = null, oo = null, orca.headbar.unregisterHeadbarButton(`${f}.bgButton`), orca.commands.unregisterCommand(`${f}.random`), orca.commands.unregisterCommand(`${f}.clear`);
  for (const e of H.values()) URL.revokeObjectURL(e);
  H.clear(), R = null, V = null, uo.clear(), console.log(`${f} unloaded.`);
}
const me = {
  updateConfig: U,
  getConfig: C,
  applyBackground: X,
  pickRandomPreset: go,
  pickRandomLocal: Ko,
  rotateOnce: Jo,
  scheduleAutoSwitch: co,
  sanitizeConfig: Fo,
  VISUAL_DEFAULTS: Wo
};
export {
  me as __test,
  ve as load,
  ye as unload
};
