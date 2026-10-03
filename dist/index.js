const oe = "orca-background-cover", O = [
  {
    label: "必应每日壁纸",
    value: "https://bing.biturl.top/?resolution=1920&format=image&index=0"
  },
  {
    label: "随机风景",
    value: "https://imgapi.cn/api.php?fl=fengjing&gs=images"
  },
  {
    label: "随机动漫",
    value: "https://img.xjh.me/random_img.php?return=302&type=bg"
  },
  {
    label: "Picsum 随机",
    value: "https://picsum.photos/1920/1080"
  },
  {
    label: "Unsplash 随机",
    value: "https://unsplash.it/1600/900?random"
  }
], de = {}, re = {
  enabled: !0,
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
  presetSources: O.map((r) => r.value),
  randomOnStart: !0,
  randomInterval: !1,
  autoSwitchInterval: 0
};
let F = {
  ...re
}, Y = null;
const _ = /* @__PURE__ */ new Set();
function pe() {
  _.forEach((r) => {
    try {
      r();
    } catch {
    }
  });
}
function W(r) {
  return {
    ...F
  };
}
function I(r, e) {
  F = {
    ...F,
    ...e
  }, ee(r), pe(), Y && clearTimeout(Y), Y = setTimeout(() => {
    orca.plugins.setData(r, "bg-config", JSON.stringify(F)).catch(() => {
    });
  }, 300);
}
async function ge(r) {
  try {
    const e = await orca.plugins.getData(r, "bg-config");
    e && (F = {
      ...re,
      ...JSON.parse(e)
    });
  } catch {
    F = {
      ...re
    };
  }
}
const P = /* @__PURE__ */ new Map();
function ue(r) {
  const e = r.slice(r.lastIndexOf(".") + 1).toLowerCase();
  return {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    svg: "image/svg+xml"
  }[e] || "image/png";
}
async function ce(r, e) {
  const u = P.get(e);
  if (u) return u;
  try {
    const i = await orca.plugins.readFile(r, e, "buffer");
    if (i instanceof ArrayBuffer) {
      const l = new Blob([
        i
      ], {
        type: ue(e)
      }), p = URL.createObjectURL(l);
      return P.set(e, p), p;
    }
  } catch {
  }
  const t = orca.state.repoDir;
  if (t) {
    const i = `${t}/assets/plugins/${r}/${e}`;
    try {
      return orca.utils.getAssetPath(i);
    } catch {
      return i;
    }
  }
  return e;
}
async function ve(r) {
  try {
    const e = await orca.plugins.listFiles(r), u = /\.(png|jpe?g|gif|webp|bmp|svg)$/i, t = [];
    for (const i of e)
      if (u.test(i)) {
        const l = i.replace(/\.[^.]+$/, ""), p = await ce(r, i);
        t.push({
          id: l,
          name: l,
          fileName: i,
          url: p
        });
      }
    return t;
  } catch {
    return [];
  }
}
async function te(r, e, u) {
  await orca.plugins.writeFile(r, e, u);
}
async function ye(r, e) {
  const u = P.get(e);
  u && (URL.revokeObjectURL(u), P.delete(e)), await orca.plugins.removeFile(r, e);
}
function ie(r) {
  return typeof r.arrayBuffer == "function" ? r.arrayBuffer() : new Promise((e, u) => {
    const t = new FileReader();
    t.onload = () => e(t.result), t.onerror = u, t.readAsArrayBuffer(r);
  });
}
function me() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
let A = null, S = null, T = null, v = null, G = null, Q = 0;
const fe = `
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
function we() {
  A || (A = document.createElement("style"), A.id = "orca-background-cover-style", A.textContent = fe, document.head.appendChild(A));
}
function ae() {
  return S || (S = document.createElement("div"), S.id = "orca-bg-cover-layer", S.style.position = "fixed", S.style.inset = "0", S.style.zIndex = "0", S.style.pointerEvents = "none", S.style.backgroundSize = "cover", S.style.backgroundPosition = "center center", S.style.backgroundRepeat = "no-repeat", document.body.insertBefore(S, document.body.firstChild), S);
}
function K() {
  S && (S.remove(), S = null);
}
function le(r) {
  return r.replace(/"/g, '\\"');
}
function he(r, e, u, t, i, l) {
  G = e, v && !Array.from(P.values()).includes(v) && URL.revokeObjectURL(v), v = null;
  const p = (g) => {
    const h = g.includes("?") ? "&" : "?", m = `${g.trim()}${h}_t=${Date.now()}`, s = ++Q, R = new Image();
    let f = !1;
    const w = setTimeout(() => {
      f = !0, R.src = "", s === Q && y(g);
    }, 5e3);
    R.onload = () => {
      if (clearTimeout(w), f || s !== Q) return;
      T = R;
      const b = `url("${le(m)}")`, n = ae();
      n.style.backgroundImage = b, n.style.opacity = u, n.style.filter = t, n.style.backgroundPosition = `${i} ${l}`, document.body.style.setProperty("--bgc-bg-url", b);
    }, R.onerror = () => {
      clearTimeout(w), !(f || s !== Q) && y(g);
    }, R.src = m;
  }, y = (g) => {
    const m = O.map((s) => s.value).filter((s) => s !== g);
    if (m.length > 0) {
      const s = m[Math.floor(Math.random() * m.length)];
      p(s);
    }
  };
  p(e);
}
async function ee(r) {
  const e = W(), u = me();
  if (!e.enabled) {
    document.body.classList.remove("orca-bg-cover-active", "orca-bg-cover-fullscreen", "orca-bg-cover-editor"), K(), T = null, G = null, v && !Array.from(P.values()).includes(v) && URL.revokeObjectURL(v), v = null;
    return;
  }
  let t = "";
  if (e.preset && e.preset !== "none" ? t = e.preset : t = u && e.darkModeImage ? e.darkModeImage : e.backgroundImage, !(t.trim() !== "")) {
    document.body.classList.remove("orca-bg-cover-active", "orca-bg-cover-fullscreen", "orca-bg-cover-editor"), K(), T = null, G = null, v && !Array.from(P.values()).includes(v) && URL.revokeObjectURL(v), v = null;
    return;
  }
  const l = t.startsWith("data:") || t.startsWith("blob:") || t.startsWith("file:") || t.startsWith("local:") || /^[a-zA-Z]:[\\/]/.test(t) || t.startsWith("/assets/"), p = t, y = Math.max(0.75, Math.min(1, 1 - 0.25 * (1 - e.uiOpacity))), g = Math.max(0.2, Math.min(1, e.specialOpacity)), h = e.coverMode === "fullscreen", m = String(Math.max(0, Math.min(1, e.bgOpacity))), s = e.blur > 0 ? `blur(${e.blur}px)` : "none", R = `${50 + e.positionX / 2}%`, f = `${50 + e.positionY / 2}%`;
  we(), h ? ae() : K();
  const w = document.body.style;
  if (w.setProperty("--bgc-pos-x", R), w.setProperty("--bgc-pos-y", f), w.setProperty("--bgc-blur", s), w.setProperty("--bgc-bg-opacity", m), w.setProperty("--bgc-ui-pct", `${(1 - y) * 100}%`), w.setProperty("--bgc-ui-pct-60", `${(1 - y) * 60}%`), w.setProperty("--bgc-special-pct", `${g * 100}%`), w.setProperty("--bgc-scope-line-color", e.scopeLineColor || "#b8b8b8"), document.body.classList.toggle("orca-bg-cover-fullscreen", h), document.body.classList.toggle("orca-bg-cover-editor", !h), document.body.classList.add("orca-bg-cover-active"), l && G === p)
    return;
  if (l) {
    if (G = p, v && !Array.from(P.values()).includes(v) && URL.revokeObjectURL(v), v = null, t.startsWith("local:")) {
      const X = t.slice(6), D = await ce(r, X);
      t = D, v = D;
    }
    const z = new Image();
    z.onload = () => {
      T = z;
    }, z.src = t.trim(), T = z;
  } else {
    he(r, t, m, s, R, f);
    return;
  }
  const b = ae(), n = `url("${le(t.trim())}")`;
  b.style.backgroundImage = n, b.style.opacity = m, b.style.filter = s, b.style.backgroundPosition = `${R} ${f}`, w.setProperty("--bgc-bg-url", n);
}
let J = null, Z = null, k = "", V = null;
function ke() {
  const { useState: r, useRef: e, useEffect: u } = window.React, [t, i] = r(!1), [l, p] = r(null), [, y] = r(0), g = e(null), h = e(null), { Button: m, Popup: s, Menu: R, MenuText: f, MenuSeparator: w, MenuTitle: b } = orca.components;
  u(() => {
    const c = () => y((d) => d + 1);
    return _.add(c), () => {
      _.delete(c);
    };
  }, []);
  const n = () => i(!1), z = async (c) => {
    var q, E, L, B;
    const d = (q = c.target.files) == null ? void 0 : q[0];
    if (d) {
      n();
      try {
        (E = orca.notify) == null || E.call(orca, "info", "正在上传图片...");
        const M = await ie(d), C = (d.name.match(/\.[^.]+$/) || [
          ".png"
        ])[0].toLowerCase(), $ = `img-${Date.now()}${C}`;
        await te(k, $, M), await I(k, {
          preset: "none",
          backgroundImage: `local:${$}`,
          enabled: !0
        }), (L = orca.notify) == null || L.call(orca, "success", "图片已添加");
      } catch (M) {
        console.error(M), (B = orca.notify) == null || B.call(orca, "error", "上传失败");
      }
    }
  }, X = async () => {
    var C;
    const c = W(), d = c.presetSources && c.presetSources.length > 0 ? c.presetSources : O.map(($) => $.value), q = c.preset && c.preset !== "none" ? c.preset : null, E = q ? d.filter(($) => $ !== q) : d, L = E.length > 0 ? E : d, B = L[Math.floor(Math.random() * L.length)], M = O.find(($) => $.value === B);
    await I(k, {
      preset: B,
      enabled: !0
    }), (C = orca.notify) == null || C.call(orca, "success", M ? `已切换到：${M.label}` : "已切换壁纸"), n();
  }, D = async (c) => {
    await I(k, {
      preset: c,
      enabled: !0
    }), n();
  }, U = async () => {
    const c = W();
    await I(k, {
      enabled: !c.enabled
    }), n();
  }, H = async () => {
    var E, L, B, M;
    const c = W();
    let d = "";
    c.preset && c.preset !== "none" ? d = c.preset : d = c.backgroundImage;
    const q = d.startsWith("data:") || d.startsWith("file:") || d.startsWith("local:") || /^[a-zA-Z]:[\\/]/.test(d) || d.startsWith("/assets/");
    if (!d || q) {
      (E = orca.notify) == null || E.call(orca, "error", "当前图片已经是本地图片");
      return;
    }
    try {
      (L = orca.notify) == null || L.call(orca, "info", "正在保存图片...");
      let C = null;
      if (v && (C = await (await fetch(v)).blob()), !C && T && T.complete && T.naturalWidth > 0) {
        const j = document.createElement("canvas");
        j.width = T.naturalWidth, j.height = T.naturalHeight;
        const ne = j.getContext("2d");
        ne && (ne.drawImage(T, 0, 0), C = await new Promise((be) => j.toBlob(be, "image/png")));
      }
      if (!C) {
        const j = await fetch(d, {
          mode: "cors"
        });
        if (!j.ok) throw new Error(`HTTP ${j.status}`);
        C = await j.blob();
      }
      if (!C) throw new Error("无法获取图片数据");
      const $ = `img-${Date.now()}.png`, se = await C.arrayBuffer();
      await te(k, $, se), await I(k, {
        preset: "none",
        backgroundImage: `local:${$}`
      }), (B = orca.notify) == null || B.call(orca, "success", "图片已保存到本地图片库");
    } catch (C) {
      console.error("保存图片失败", C), (M = orca.notify) == null || M.call(orca, "error", "保存失败：该图片服务器不允许跨域下载，请手动截图保存");
    }
    n();
  }, N = W(), o = N.enabled, a = N.preset && N.preset !== "none", x = window.React.createElement(R, {
    style: {
      minWidth: "200px"
    }
  }, window.React.createElement(b, {
    title: "背景图"
  }), window.React.createElement(f, {
    title: "手动挑一张",
    preIcon: "ti ti-hand-click",
    children: window.React.createElement(R, null, ...O.map((c) => window.React.createElement(f, {
      key: c.value,
      title: c.label,
      onClick: () => D(c.value)
    })), window.React.createElement(w, null), window.React.createElement(f, {
      title: "本地图片库",
      preIcon: "ti ti-photo",
      onClick: () => {
        n(), p("wallpaper");
      }
    }))
  }), window.React.createElement(f, {
    title: "随机抽一张",
    preIcon: "ti ti-dice-5",
    onClick: X
  }), a ? window.React.createElement(f, {
    title: "保存当前图片到本地",
    preIcon: "ti ti-download",
    onClick: H
  }) : null, window.React.createElement(w, null), window.React.createElement(f, {
    title: "添加本地图片",
    preIcon: "ti ti-photo-plus",
    onClick: () => {
      var c;
      return (c = h.current) == null ? void 0 : c.click();
    }
  }), window.React.createElement(w, null), window.React.createElement(f, {
    title: o ? "关闭图片背景" : "开启图片背景",
    preIcon: o ? "ti ti-eye-off" : "ti ti-eye",
    onClick: U
  }), window.React.createElement(w, null), window.React.createElement(f, {
    title: "设置",
    preIcon: "ti ti-settings",
    onClick: () => {
      n(), p("global");
    }
  }));
  return window.React.createElement(window.React.Fragment, null, window.React.createElement(m, {
    ref: g,
    variant: "plain",
    onClick: () => i(!t),
    title: "背景图"
  }, window.React.createElement("i", {
    className: "ti ti-photo"
  })), window.React.createElement("input", {
    ref: h,
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: z
  }), window.React.createElement(s, {
    refElement: g,
    visible: t,
    onClose: n,
    escapeToClose: !0,
    defaultPlacement: "bottom",
    alignment: "right"
  }, x), l ? window.React.createElement(xe, {
    onClose: () => p(null),
    initialTab: l
  }) : null);
}
function xe({ onClose: r, initialTab: e = "global" }) {
  const { useState: u, useEffect: t, useRef: i } = window.React, [l, p] = u(e), [, y] = u(0), [g, h] = u([]), m = i(null), { ModalOverlay: s, Button: R, Switch: f, Segmented: w } = orca.components;
  t(() => {
    ve(k).then(h);
  }, []);
  const b = W(), n = async (o) => {
    await I(k, o), y((a) => a + 1);
  }, z = async (o) => {
    var x, c;
    const a = (x = o.target.files) == null ? void 0 : x[0];
    if (a)
      try {
        const d = await ie(a), q = (a.name.match(/\.[^.]+$/) || [
          ".png"
        ])[0].toLowerCase(), E = `img-${Date.now()}${q}`;
        await te(k, E, d);
        const L = await ce(k, E), B = [
          ...g,
          {
            id: E.replace(/\.[^.]+$/, ""),
            name: a.name,
            fileName: E,
            url: L
          }
        ];
        h(B), await I(k, {
          preset: "none",
          backgroundImage: `local:${E}`
        }), y((M) => M + 1);
      } catch (d) {
        console.error(d), (c = orca.notify) == null || c.call(orca, "error", "上传失败");
      }
  }, X = (o) => {
    I(k, {
      preset: "none",
      backgroundImage: `local:${o.fileName}`
    }), y((a) => a + 1);
  }, D = (o) => {
    ye(k, o).then(() => {
      const a = g.filter((x) => x.fileName !== o);
      h(a), y((x) => x + 1);
    });
  }, U = (o, a, x, c, d, q, E = "") => window.React.createElement("div", {
    style: {
      marginBottom: "18px",
      marginTop: "12px"
    }
  }, window.React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "8px",
      fontSize: "13px"
    }
  }, window.React.createElement("span", null, o), window.React.createElement("span", {
    style: {
      color: "var(--orca-color-primary-5, #8324c2)",
      fontWeight: 600,
      fontSize: "12px",
      padding: "2px 8px",
      borderRadius: "10px",
      backgroundColor: "var(--orca-color-accent-bg, rgba(131,36,194,0.1))"
    }
  }, `${a}${E}`)), window.React.createElement("input", {
    type: "range",
    min: x,
    max: c,
    step: d,
    value: a,
    onChange: (L) => q(parseFloat(L.target.value)),
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
  })), H = (o, a) => window.React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0",
      borderBottom: "1px solid var(--orca-color-border, #eee)"
    }
  }, window.React.createElement("span", {
    style: {
      fontSize: "13px",
      fontWeight: 500
    }
  }, o), a);
  let N;
  return l === "global" ? N = window.React.createElement("div", {
    style: {
      padding: "4px 0"
    }
  }, H("开启背景", window.React.createElement(f, {
    on: b.enabled,
    onChange: (o) => n({
      enabled: o
    })
  })), H("覆盖范围", window.React.createElement(w, {
    selected: b.coverMode,
    options: [
      {
        label: "仅编辑器",
        value: "editor"
      },
      {
        label: "全屏",
        value: "fullscreen"
      }
    ],
    onChange: (o) => n({
      coverMode: o
    })
  })), U("UI 透明度", b.uiOpacity, 0, 1, 0.01, (o) => n({
    uiOpacity: o
  })), U("背景可见度", b.bgOpacity, 0, 1, 0.01, (o) => n({
    bgOpacity: o
  })), U("背景虚化", b.blur, 0, 20, 0.5, (o) => n({
    blur: o
  }), "px"), U("X 偏移", b.positionX, -100, 100, 1, (o) => n({
    positionX: o
  }), "%"), U("Y 偏移", b.positionY, -100, 100, 1, (o) => n({
    positionY: o
  }), "%"), U("特殊块不透明度", b.specialOpacity, 0.2, 1, 0.01, (o) => n({
    specialOpacity: o
  })), window.React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0"
    }
  }, window.React.createElement("span", {
    style: {
      fontSize: "13px",
      fontWeight: 500
    }
  }, "层级线颜色"), window.React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "10px"
    }
  }, window.React.createElement("div", {
    style: {
      width: "28px",
      height: "28px",
      borderRadius: "8px",
      backgroundColor: b.scopeLineColor || "#b8b8b8",
      border: "1px solid var(--orca-color-border, #ddd)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      overflow: "hidden",
      position: "relative"
    }
  }, window.React.createElement("input", {
    type: "color",
    value: b.scopeLineColor || "#b8b8b8",
    onChange: (o) => n({
      scopeLineColor: o.target.value
    }),
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
  })), window.React.createElement("span", {
    style: {
      fontSize: "12px",
      color: "var(--orca-color-text-3, #999)",
      fontFamily: "monospace",
      textTransform: "uppercase"
    }
  }, (b.scopeLineColor || "#b8b8b8").toUpperCase()))), window.React.createElement("div", {
    style: {
      marginTop: "20px",
      paddingTop: "16px",
      borderTop: "1px solid var(--orca-color-border, #eee)"
    }
  }, H("每次启动随机", window.React.createElement(f, {
    on: b.randomOnStart,
    onChange: (o) => n({
      randomOnStart: o
    })
  })), H("随机时间轮换", window.React.createElement(f, {
    on: b.randomInterval,
    onChange: (o) => n({
      randomInterval: o
    })
  })), U("定时切换(0=不定时)", b.autoSwitchInterval, 0, 120, 1, (o) => n({
    autoSwitchInterval: o
  }), " 分")), window.React.createElement("div", {
    style: {
      marginTop: "20px",
      display: "flex",
      justifyContent: "flex-end"
    }
  }, window.React.createElement(R, {
    variant: "plain",
    onClick: async () => {
      var o;
      await I(k, {
        uiOpacity: 0.85,
        specialOpacity: 0.65,
        scopeLineColor: "#b8b8b8",
        bgOpacity: 0.25,
        blur: 0,
        positionX: 0,
        positionY: 0
      }), requestAnimationFrame(() => {
        ee(k), y((a) => a + 1);
      }), (o = orca.notify) == null || o.call(orca, "info", "已恢复默认参数");
    },
    style: {
      gap: "6px"
    }
  }, window.React.createElement("i", {
    className: "ti ti-refresh"
  }), "恢复默认"))) : N = window.React.createElement("div", {
    style: {
      padding: "4px 0"
    }
  }, window.React.createElement("div", {
    style: {
      fontSize: "12px",
      color: "var(--orca-color-text-secondary, #888)",
      marginBottom: "10px",
      fontWeight: 500
    }
  }, "预设壁纸"), ...O.map((o) => {
    const a = (b.presetSources || []).includes(o.value);
    return window.React.createElement("div", {
      key: o.value,
      onClick: () => {
        const x = b.presetSources || [], c = a ? x.filter((d) => d !== o.value) : [
          ...x,
          o.value
        ];
        n({
          presetSources: c
        });
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "13px",
        backgroundColor: a ? "var(--orca-color-accent-bg, rgba(131,36,194,0.1))" : "transparent",
        color: a ? "var(--orca-color-primary-5, #8324c2)" : "inherit",
        marginBottom: "4px",
        border: a ? "1px solid var(--orca-color-primary-5, #8324c2)" : "1px solid transparent",
        transition: "all 0.15s ease"
      },
      onMouseEnter: (x) => {
        a || (x.currentTarget.style.backgroundColor = "var(--orca-color-bg-2, #f5f5f5)");
      },
      onMouseLeave: (x) => {
        a || (x.currentTarget.style.backgroundColor = "transparent");
      }
    }, window.React.createElement("i", {
      className: a ? "ti ti-square-check-filled" : "ti ti-square",
      style: {
        fontSize: "16px",
        flexShrink: 0
      }
    }), window.React.createElement("span", null, o.label));
  }), window.React.createElement("div", {
    style: {
      display: "flex",
      gap: "8px",
      margin: "20px 0 14px"
    }
  }, window.React.createElement(R, {
    variant: "soft",
    onClick: () => {
      var o;
      return (o = m.current) == null ? void 0 : o.click();
    },
    style: {
      flex: 1,
      gap: "6px",
      padding: "10px"
    }
  }, window.React.createElement("i", {
    className: "ti ti-upload"
  }), "上传本地图片"), window.React.createElement("input", {
    ref: m,
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: z
  })), window.React.createElement("div", {
    style: {
      fontSize: "12px",
      color: "var(--orca-color-text-secondary, #888)",
      marginBottom: "10px",
      fontWeight: 500
    }
  }, "我的图片库"), g.length === 0 ? window.React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "32px 16px",
      color: "var(--orca-color-text-secondary, #999)",
      fontSize: "13px",
      border: "1px dashed var(--orca-color-border, #ddd)",
      borderRadius: "10px"
    }
  }, "还没有上传的图片") : window.React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px"
    }
  }, ...g.map((o) => window.React.createElement("div", {
    key: o.id,
    onClick: () => X(o),
    style: {
      position: "relative",
      borderRadius: "10px",
      overflow: "hidden",
      cursor: "pointer",
      aspectRatio: "16/10",
      border: b.backgroundImage === `local:${o.fileName}` ? "2px solid var(--orca-color-primary-5, #8324c2)" : "2px solid transparent",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      transition: "transform 0.15s ease"
    },
    onMouseEnter: (a) => {
      a.currentTarget.style.transform = "scale(1.02)";
    },
    onMouseLeave: (a) => {
      a.currentTarget.style.transform = "scale(1)";
    }
  }, window.React.createElement("img", {
    src: o.url,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block"
    }
  }), window.React.createElement("div", {
    onClick: (a) => {
      a.stopPropagation(), D(o.fileName);
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
    onMouseEnter: (a) => {
      a.currentTarget.style.opacity = "1";
    },
    onMouseLeave: (a) => {
      a.currentTarget.style.opacity = "0.8";
    }
  }, "×"))))), window.React.createElement(s, {
    visible: !0,
    onClose: r,
    blurred: !0,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, window.React.createElement("div", {
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
    onClick: (o) => o.stopPropagation()
  }, window.React.createElement("div", {
    style: {
      padding: "18px 24px",
      borderBottom: "1px solid var(--orca-color-border, #eee)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, window.React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: "16px",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }
  }, window.React.createElement("i", {
    className: "ti ti-photo",
    style: {
      color: "var(--orca-color-primary-5, #8324c2)"
    }
  }), "背景图设置"), window.React.createElement(R, {
    variant: "plain",
    onClick: r,
    style: {
      padding: "4px",
      borderRadius: "8px"
    }
  }, window.React.createElement("i", {
    className: "ti ti-x",
    style: {
      fontSize: "20px"
    }
  }))), window.React.createElement("div", {
    style: {
      padding: "12px 24px",
      borderBottom: "1px solid var(--orca-color-border, #eee)"
    }
  }, window.React.createElement(w, {
    selected: l,
    options: [
      {
        label: "全局设置",
        value: "global"
      },
      {
        label: "壁纸管理",
        value: "wallpaper"
      }
    ],
    onChange: (o) => p(o),
    style: {
      width: "100%"
    }
  })), window.React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "20px 24px"
    }
  }, N)));
}
async function Re(r) {
  k = r, orca.state.locale, await orca.plugins.setSettingsSchema(r, de), await ge(r);
  const e = W(), u = e.preset && e.preset !== "none" && !e.preset.startsWith("local:");
  if (e.randomOnStart || u) {
    const t = e.presetSources && e.presetSources.length > 0 ? e.presetSources : O.map((g) => g.value), i = e.preset && e.preset !== "none" ? e.preset : null, l = i ? t.filter((g) => g !== i) : t, p = l.length > 0 ? l : t, y = p[Math.floor(Math.random() * p.length)];
    await I(r, {
      preset: y
    });
  }
  if (ee(r), setTimeout(() => {
    O.forEach((t) => {
      const i = new Image();
      i.src = t.value;
    });
  }, 2e3), e.autoSwitchInterval > 0) {
    const t = () => {
      const i = e.randomInterval ? (Math.random() * 1.5 + 0.5) * e.autoSwitchInterval * 60 * 1e3 : e.autoSwitchInterval * 60 * 1e3;
      V = setTimeout(() => {
        const l = W(), p = l.presetSources && l.presetSources.length > 0 ? l.presetSources : O.map((s) => s.value), y = l.preset && l.preset !== "none" ? l.preset : null, g = y ? p.filter((s) => s !== y) : p, h = g.length > 0 ? g : p, m = h[Math.floor(Math.random() * h.length)];
        I(r, {
          preset: m
        }), t();
      }, i);
    };
    t();
  }
  orca.headbar.registerHeadbarButton(`${r}.bgButton`, () => window.React.createElement(ke)), J = window.matchMedia("(prefers-color-scheme: dark)"), Z = () => ee(r), J.addEventListener("change", Z), orca.commands.registerCommand(`${r}.random`, async () => {
    var m;
    const t = W(), i = t.presetSources && t.presetSources.length > 0 ? t.presetSources : O.map((s) => s.value), l = t.preset && t.preset !== "none" ? t.preset : null, p = l ? i.filter((s) => s !== l) : i, y = p.length > 0 ? p : i, g = y[Math.floor(Math.random() * y.length)], h = O.find((s) => s.value === g);
    await I(r, {
      preset: g
    }), (m = orca.notify) == null || m.call(orca, "success", h ? `已切换到：${h.label}` : "已切换壁纸");
  }, "背景图：随机切换壁纸"), orca.commands.registerCommand(`${r}.clear`, async () => {
    await I(r, {
      preset: "none",
      backgroundImage: ""
    });
  }, "背景图：清除背景"), console.log(`${r} loaded.`);
}
async function Ee() {
  if (Y) {
    clearTimeout(Y), Y = null;
    try {
      await orca.plugins.setData(k, "bg-config", JSON.stringify(F));
    } catch {
    }
  }
  A && (A.remove(), A = null), K(), document.body.classList.remove("orca-bg-cover-active", "orca-bg-cover-fullscreen", "orca-bg-cover-editor"), V && (clearTimeout(V), V = null), orca.headbar.unregisterHeadbarButton(`${oe}.bgButton`), J && Z && J.removeEventListener("change", Z), J = null, Z = null, P.forEach((r) => URL.revokeObjectURL(r)), P.clear(), v && (URL.revokeObjectURL(v), v = null), _.clear(), orca.commands.unregisterCommand(`${oe}.random`), orca.commands.unregisterCommand(`${oe}.clear`);
}
export {
  Re as load,
  Ee as unload
};
