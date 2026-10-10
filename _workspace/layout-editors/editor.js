/* layout-editor framework — shared by hall.html / compare.html.
   Each page defines window.EDITOR = { page, viewport, tiles, presets }
   before this script runs. Mid-fidelity: spatial truth, not data truth. */
(function () {
  "use strict";
  const E = window.EDITOR;
  if (!E) throw new Error("window.EDITOR undefined — page didn't init");
  const LS_KEY = `layout-editor:${E.page}`;
  const ROWH = 36;          // stage grid row height in px
  const PANEL_DEF = { left: 220, right: 260 };

  /* ---------------- state ---------------- */
  const defTiles = () =>
    E.tiles.map((t) => ({
      id: t.id,
      component: t.component,
      zone: t.zone,
      x: t.x ?? 0, y: t.y ?? 0, w: t.w ?? 4, h: t.h ?? 3,
      order: t.order ?? null, visible: t.visible !== false,
    }));

  const def = () => ({
    page: E.page,
    viewportReference: { width: 1600, height: 1000 },
    panels: {
      left: { visible: true, width: PANEL_DEF.left },
      right: { visible: true, width: PANEL_DEF.right },
    },
    grid: { columns: 12, snap: true, show: false },
    tiles: defTiles(),
    preset: "custom",
  });

  /* Merge a preset over defaults. Preset tile entries carry only the
     fields they override — they merge BY ID onto the default tile so
     `component` and untouched geometry survive (review #1/#3). */
  function applyPreset(p, name) {
    const base = def();
    if (p.panels) {
      for (const k of ["left", "right"])
        if (p.panels[k]) base.panels[k] = { ...base.panels[k], ...p.panels[k] };
    }
    if (p.grid) base.grid = { ...base.grid, ...p.grid };
    if (Array.isArray(p.tiles)) {
      for (const pt of p.tiles) {
        const t = base.tiles.find((x) => x.id === pt.id);
        if (t) Object.assign(t, pt);
      }
    }
    base.preset = name;
    return base;
  }

  let S = load() || def();
  let sel = null;

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEY));
      // guard against poisoned/partial state (review #1: a prior bug could
      // persist tiles:null — treat unreadable shapes as absent)
      if (!s || s.page !== E.page || !Array.isArray(s.tiles)) return null;
      // top-level shape guards — poisoned panels/grid can't crash render
      if (!s.panels?.left || !s.panels?.right || !s.grid?.columns) return null;
      for (const k of ["left", "right"])
        s.panels[k].width = Number.isFinite(s.panels[k].width)
          ? s.panels[k].width : PANEL_DEF[k];
      // merge tile defs added after this save (new components appear as
      // visible stage/sidebar entries, not silently absent)
      for (const d of E.tiles) {
        if (!s.tiles.some((t) => t.id === d.id)) {
          s.tiles.push({ id: d.id, component: d.component, zone: d.zone,
            x: d.x ?? 0, y: d.y ?? 0, w: d.w ?? 4, h: d.h ?? 3,
            order: d.order ?? null, visible: true });
        }
      }
      // ensure every tile carries component + sane numbers
      for (const t of s.tiles) {
        const d = E.tiles.find((x) => x.id === t.id);
        if (d) t.component = t.component || d.component;
        for (const k of ["x", "y", "w", "h", "order"]) {
          if (t[k] != null && !Number.isFinite(t[k])) t[k] = d ? d[k] ?? 0 : 0;
        }
        t.visible = t.visible !== false;
      }
      return s;
    } catch { return null; }
  }
  const save = () => localStorage.setItem(LS_KEY, JSON.stringify(S));
  const tile = (id) => S.tiles.find((t) => t.id === id);
  const tileDef = (id) => E.tiles.find((t) => t.id === id) || {};
  const clamp = (v, a, b) =>
    Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : a;

  /* ---------------- dom scaffold ---------------- */
  document.body.innerHTML = `
  <div class="frame">
    <div class="toolbar">
      <div class="grp">
        <button id="tg-left">◧ L</button>
        <input id="w-left" class="val" readonly style="width:44px;border:none;background:none">
        <button id="tg-right">◨ R</button>
        <input id="w-right" class="val" readonly style="width:44px;border:none;background:none">
        <button id="reset-panels">reset</button>
      </div>
      <div class="grp">
        <label>GRID</label>
        <button id="grid-show">overlay</button>
        <select id="grid-cols"><option>8</option><option selected>12</option><option>16</option></select>
        <button id="grid-snap">snap ✓</button>
      </div>
      <div class="grp">
        <label>PRESET</label>
        <select id="preset"></select>
      </div>
      <div class="grp">
        <button id="save">SAVE LAYOUT</button>
        <button id="reset">RESET</button>
        <button id="reset-preset">RESET TO PRESET</button>
        <button id="export">EXPORT JSON</button>
        <button id="download">DOWNLOAD</button>
      </div>
      <div class="grp">
        <button id="mode">PREVIEW MODE</button>
      </div>
      <div class="grp" id="hidden-grp" style="display:none">
        <label>HIDDEN</label><span id="hidden-list" style="display:flex;gap:4px"></span>
      </div>
    </div>
    <div class="fcols">
      <div class="rail">
        ${["≡","◫","▤","◨","◱","§","▲","◐","⚙"].map((c,i)=>`<div class="ric${i===0?" on":""}" title="rail">${c}</div>`).join("")}
        <div class="sp"></div><div class="ric">◔</div>
      </div>
      <aside class="panel left" id="p-left">
        <div class="panel-head">LEFT PANEL</div>
        <div class="panel-body" id="pb-left"></div>
        <div class="edge" data-p="left"></div>
      </aside>
      <main class="stage" id="stage"><div class="stage-grid" id="sgrid"></div></main>
      <aside class="panel right" id="p-right">
        <div class="panel-head">INSPECTOR</div>
        <div class="panel-body" id="pb-right"></div>
        <div class="edge" data-p="right"></div>
      </aside>
    </div>
    <div class="ffoot">
      <span>${E.page.toUpperCase()} · LAYOUT EDITOR</span>
      <span id="foot-info"></span>
      <span style="margin-left:auto">mid-fidelity · not production</span>
    </div>
  </div>
  <div class="insp" id="insp">
    <div class="insp-h"><span id="insp-title">TILE</span><button id="insp-x">✕</button></div>
    <div class="insp-b" id="insp-b"></div>
  </div>`;

  const $ = (s) => document.querySelector(s);
  const stage = $("#stage"), pbL = $("#pb-left"), pbR = $("#pb-right"),
        pL = $("#p-left"), pR = $("#p-right"), insp = $("#insp");
  stage.appendChild(insp); // dock INSIDE stage — covers stage only, never
                          // the right panel or toolbar (review)
  const colW = () => stage.clientWidth / S.grid.columns;
  const snap = (v, u) => (S.grid.snap ? Math.round(v / u) : v / u);
  const preview = () => document.body.classList.contains("preview");

  /* keep every stage tile inside the visible canvas (review #6) */
  function normalize() {
    for (const t of S.tiles) {
      if (t.zone !== "stage") continue;
      t.w = clamp(t.w, 1, S.grid.columns);
      t.x = clamp(t.x, 0, Math.max(0, S.grid.columns - t.w));
      t.y = clamp(t.y ?? 0, 0, 60);   // never below scroll reach
      t.h = clamp(t.h ?? 1, 1, 60);
    }
  }

  /* ---------------- drag state — ONE pair of window listeners ----------------
     Review #2: listeners live at top level, registered once. Active
     gesture tracked in `gesture`; nodes update live without re-render. */
  let gesture = null; // { kind:"tile"|"resize"|"panel", id, node, ... }
  window.addEventListener("mousemove", (e) => {
    if (!gesture) return;
    if (gesture.kind === "tile") {
      const t = tile(gesture.id), n = gesture.node;
      if (!t || !n) return;
      t.x = clamp(snap((e.clientX - gesture.ox) / colW(), 1), 0, S.grid.columns - t.w);
      t.y = Math.max(0, snap((e.clientY - gesture.oy) / ROWH, 1));
      n.style.left = t.x * colW() + "px";
      n.style.top = t.y * ROWH + "px";
    } else if (gesture.kind === "resize") {
      const t = tile(gesture.id), n = gesture.node;
      if (!t || !n) return;
      t.w = clamp(snap(gesture.sw + (e.clientX - gesture.cx) / colW(), 1), 1, S.grid.columns - t.x);
      t.h = Math.max(1, snap(gesture.sh + (e.clientY - gesture.cy) / ROWH, 1));
      n.style.width = t.w * colW() + "px";
      n.style.height = t.h * ROWH + "px";
    } else if (gesture.kind === "panel") {
      const dx = gesture.p === "left" ? e.clientX - gesture.start : gesture.start - e.clientX;
      S.panels[gesture.p].width = clamp(gesture.w0 + dx, 120, 480);
      render(); // panel width readout updates live — cheap (no listeners added)
    }
  });
  window.addEventListener("mouseup", () => {
    if (!gesture) return;
    if (gesture.edge) gesture.edge.classList.remove("drag");
    const wasPanel = gesture.kind === "panel";
    gesture = null;
    if (!wasPanel) { markDirty(); save(); render(); }
    else { save(); }
  });

  function markDirty() {
    /* review #4: any user edit marks the layout custom so the preset
       confirm guard fires and the footer label stays honest */
    if (S.preset !== "custom") S.preset = "custom";
  }
  const commit = () => { markDirty(); save(); render(); };

  /* ---------------- render ---------------- */
  function render() {
    normalize();
    pL.classList.toggle("closed", !S.panels.left.visible);
    pR.classList.toggle("closed", !S.panels.right.visible);
    pL.style.width = S.panels.left.width + "px";
    pR.style.width = S.panels.right.width + "px";
    $("#w-left").value = S.panels.left.width + "px";
    $("#w-right").value = S.panels.right.width + "px";
    $("#tg-left").classList.toggle("on", S.panels.left.visible);
    $("#tg-right").classList.toggle("on", S.panels.right.visible);
    stage.classList.toggle("grid-on", S.grid.show);
    $("#grid-show").classList.toggle("on", S.grid.show);
    $("#grid-snap").classList.toggle("on", S.grid.snap);
    $("#grid-snap").textContent = S.grid.snap ? "snap ✓" : "snap";
    $("#grid-cols").value = String(S.grid.columns);
    $("#sgrid").style.backgroundSize = `${colW()}px ${ROWH}px, ${colW()}px ${ROWH}px`;
    $("#foot-info").textContent =
      `${S.tiles.filter((t) => t.zone === "stage" && t.visible).length} stage tiles · ` +
      `${S.grid.columns} col · ${S.preset}`;

    /* hidden-tile recovery rail (review #5) */
    const hidden = S.tiles.filter((t) => !t.visible);
    const hg = $("#hidden-grp");
    if (hidden.length) {
      hg.style.display = "flex";
      const hl = $("#hidden-list");
      hl.innerHTML = "";
      hidden.forEach((t) => {
        const b = document.createElement("button");
        b.textContent = t.id;
        b.title = "show " + t.id;
        b.onclick = () => { t.visible = true; sel = t.id; commit(); };
        hl.appendChild(b);
      });
    } else hg.style.display = "none";

    /* sidebar modules */
    for (const [zone, el] of [["left", pbL], ["right", pbR]]) {
      el.innerHTML = "";
      const mods = S.tiles.filter((t) => t.zone === zone)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      // normalize order to sequential indices (fixes duplicate orders)
      mods.forEach((m, i) => (m.order = i));
      mods.forEach((t, i) => {
        const d = tileDef(t.id);
        const m = document.createElement("div");
        m.className = "mod" + (t.visible ? "" : " hidden") + (sel === t.id ? " sel" : "");
        m.innerHTML = `<div class="mod-h" draggable="true">${d.name || t.id}
          <span class="tag">${t.id}</span>
          <span class="mod-tools">
            <button data-a="up" title="move up">↑</button>
            <button data-a="down" title="move down">↓</button>
            <button data-a="vis" title="hide/show">${t.visible ? "◉" : "◌"}</button>
          </span></div>
          <div class="mod-b">${d.body || ""}</div>`;
        el.appendChild(m);
        m.addEventListener("click", (e) => {
          const a = e.target.closest("button")?.dataset.a;
          sel = t.id;
          clearSel();
          m.classList.add("sel");
          insp.classList.add("show");
          renderInsp();
          if (a === "up") reorder(zone, i, -1);
          if (a === "down") reorder(zone, i, +1);
          if (a === "vis") { t.visible = !t.visible; commit(); }
        });
        m.querySelector(".mod-h").addEventListener("dragstart", (e) => {
          if (preview()) return e.preventDefault();
          e.dataTransfer.setData("text/mod-id", t.id);
        });
      });
      el.ondragover = (e) => e.preventDefault();
      el.ondrop = (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/mod-id");
        const t = tile(id);
        if (t) { t.zone = zone; t.order = mods.length; commit(); }
      };
    }

    /* stage accepts drops from either panel or the inspector (review §sugg) */
    stage.ondragover = (e) => e.preventDefault();
    stage.ondrop = (e) => {
      e.preventDefault();
      if (preview()) return;
      const id = e.dataTransfer.getData("text/mod-id");
      const t = tile(id);
      if (!t) return;
      const r = stage.getBoundingClientRect();
      t.zone = "stage";
      t.x = clamp(snap((e.clientX - r.left) / colW(), 1), 0, S.grid.columns - (t.w || 4));
      t.y = Math.max(0, snap((e.clientY - r.top) / ROWH, 1));
      t.order = null;
      commit();
    };

    /* stage tiles */
    stage.querySelectorAll(".tile").forEach((n) => n.remove());
    S.tiles.filter((t) => t.zone === "stage" && t.visible).forEach((t) => {
      const d = tileDef(t.id);
      const n = document.createElement("div");
      n.className = "tile" + (sel === t.id ? " sel" : "");
      n.dataset.id = t.id;
      n.style.left = t.x * colW() + "px";
      n.style.top = t.y * ROWH + "px";
      n.style.width = t.w * colW() + "px";
      n.style.height = t.h * ROWH + "px";
      n.innerHTML = `<div class="tile-h">${d.name || t.id}
        <span class="tag">${t.id}</span></div>
        <div class="tile-b">${d.body || ""}</div>
        <div class="tile-tools">
          <button class="zg" draggable="true" title="drag to a panel">⇄</button>
          <button data-a="vis" title="hide">✕</button>
        </div>
        <div class="rz"></div>`;
      stage.appendChild(n);

      const h = n.querySelector(".tile-h");
      h.addEventListener("mousedown", (e) => {
        if (preview()) return; /* review §sugg: no layout mutation in preview */
        sel = t.id;
        clearSel();
        n.classList.add("sel");
        insp.classList.add("show");
        renderInsp(); // inspector only — NO re-render, the node stays live
        gesture = { kind: "tile", id: t.id, node: n,
                    ox: e.clientX - n.offsetLeft, oy: e.clientY - n.offsetTop };
      });
      n.querySelector(".zg").addEventListener("dragstart", (e) => {
        e.stopPropagation();
        e.dataTransfer.setData("text/mod-id", t.id);
      });

      const rz = n.querySelector(".rz");
      rz.addEventListener("mousedown", (e) => {
        if (preview()) return;
        e.stopPropagation();
        sel = t.id;
        clearSel();
        n.classList.add("sel");
        renderInsp();
        gesture = { kind: "resize", id: t.id, node: n,
                    sw: t.w, sh: t.h, cx: e.clientX, cy: e.clientY };
      });

      n.addEventListener("click", (e) => {
        sel = t.id;
        clearSel();
        n.classList.add("sel");
        insp.classList.add("show");
        renderInsp();
        if (e.target.dataset.a === "vis") { t.visible = false; commit(); }
      });
    });
    renderInsp();
  }

  function reorder(zone, i, dir) {
    const mods = S.tiles.filter((t) => t.zone === zone)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const j = i + dir;
    if (j < 0 || j >= mods.length) return;
    [mods[i].order, mods[j].order] = [mods[j].order, mods[i].order];
    commit();
  }

  function clearSel() {
    document.querySelectorAll(".tile.sel,.mod.sel").forEach((n) =>
      n.classList.remove("sel"));
  }

  /* ---------------- inspector ---------------- */
  function renderInsp() {
    const t = sel && tile(sel);
    if (!t) { insp.classList.remove("show"); return; }
    insp.classList.add("show");
    $("#insp-title").textContent = `${t.id} — ${tileDef(t.id).name || ""}`;
    const z = t.zone;
    $("#insp-b").innerHTML = `
      <div class="row"><label>ZONE</label>
        <select id="i-zone">
          <option value="left"${z==="left"?" selected":""}>left</option>
          <option value="stage"${z==="stage"?" selected":""}>stage</option>
          <option value="right"${z==="right"?" selected":""}>right</option>
        </select></div>
      <div class="row"><label>VISIBLE</label>
        <select id="i-vis"><option value="1"${t.visible?" selected":""}>shown</option>
        <option value="0"${!t.visible?" selected":""}>hidden</option></select></div>
      ${z === "stage" ? `
      <div class="row"><label>X / COL</label><input id="i-x" type="number" value="${t.x}"></div>
      <div class="row"><label>Y / ROW</label><input id="i-y" type="number" value="${t.y}"></div>
      <div class="row"><label>W / COLS</label><input id="i-w" type="number" value="${t.w}"></div>
      <div class="row"><label>H / ROWS</label><input id="i-h" type="number" value="${t.h}"></div>
      <div class="btnrow">
        <button data-mv="l">◀</button><button data-mv="r">▶</button>
        <button data-mv="u">▲</button><button data-mv="d">▼</button>
        <button data-rz="w-">W−</button><button data-rz="w+">W+</button>
        <button data-rz="h-">H−</button><button data-rz="h+">H+</button>
      </div>` : `
      <div class="row"><label>ORDER</label><input id="i-o" type="number" value="${t.order ?? 0}"></div>
      <div class="btnrow"><button data-mv="u">MOVE UP</button><button data-mv="d">MOVE DOWN</button></div>`}
      <div class="btnrow"><button id="i-reset">RESET TILE</button></div>`;

    $("#i-zone").onchange = (e) => {
      t.zone = e.target.value;
      if (z !== "stage" && t.zone === "stage") { t.x = 0; t.y = 0; t.order = null; }
      if (t.zone !== "stage") t.order = 99;
      commit();
    };
    $("#i-vis").onchange = (e) => { t.visible = e.target.value === "1"; commit(); };
    if (z === "stage") {
      $("#i-x").onchange = (e) => { t.x = clamp(+e.target.value, 0, S.grid.columns - t.w); commit(); };
      $("#i-y").onchange = (e) => { t.y = Math.max(0, +e.target.value || 0); commit(); };
      $("#i-w").onchange = (e) => { t.w = clamp(+e.target.value, 1, S.grid.columns - t.x); commit(); };
      $("#i-h").onchange = (e) => { t.h = Math.max(1, +e.target.value || 1); commit(); };
      $("#insp-b").onclick = (e) => {
        const mv = e.target.dataset.mv, rz = e.target.dataset.rz;
        if (mv === "l") t.x = Math.max(0, t.x - 1);
        if (mv === "r") t.x = Math.min(S.grid.columns - t.w, t.x + 1);
        if (mv === "u") t.y = Math.max(0, t.y - 1);
        if (mv === "d") t.y += 1;
        if (rz === "w-") t.w = Math.max(1, t.w - 1);
        if (rz === "w+") t.w = Math.min(S.grid.columns - t.x, t.w + 1);
        if (rz === "h-") t.h = Math.max(1, t.h - 1);
        if (rz === "h+") t.h += 1;
        if (mv || rz) commit();
      };
    } else {
      $("#i-o").onchange = (e) => { t.order = Math.max(0, +e.target.value || 0); commit(); };
      $("#insp-b").onclick = (e) => {
        const mods = S.tiles.filter((m) => m.zone === z)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const i = mods.indexOf(t);
        if (e.target.dataset.mv === "u") reorder(z, i, -1);
        if (e.target.dataset.mv === "d") reorder(z, i, +1);
      };
    }
    $("#i-reset").onclick = () => {
      const d = E.tiles.find((x) => x.id === t.id);
      Object.assign(t, { zone: d.zone, x: d.x ?? 0, y: d.y ?? 0,
        w: d.w ?? 4, h: d.h ?? 3, order: d.order ?? null, visible: true });
      commit();
    };
  }

  /* ---------------- toolbar ---------------- */
  $("#tg-left").onclick = () => { S.panels.left.visible = !S.panels.left.visible; commit(); };
  $("#tg-right").onclick = () => { S.panels.right.visible = !S.panels.right.visible; commit(); };
  $("#reset-panels").onclick = () => {
    S.panels.left.width = PANEL_DEF.left; S.panels.right.width = PANEL_DEF.right;
    commit();
  };
  $("#grid-show").onclick = () => { S.grid.show = !S.grid.show; commit(); };
  $("#grid-snap").onclick = () => { S.grid.snap = !S.grid.snap; commit(); };
  $("#grid-cols").onchange = (e) => { S.grid.columns = +e.target.value; commit(); };
  $("#mode").onclick = () => {
    document.body.classList.toggle("preview");
    sel = null; insp.classList.remove("show");
    $("#mode").textContent = preview() ? "EDIT MODE" : "PREVIEW MODE";
    $("#mode").classList.toggle("on");
  };
  $("#save").onclick = () => { save(); flash("saved"); };
  $("#reset").onclick = () => {
    if (confirm("Reset layout to defaults?")) { S = def(); sel = null; save(); render(); }
  };

  function exportShape() {
    return {
      page: S.page,
      viewportReference: S.viewportReference,
      panels: S.panels,
      grid: { columns: S.grid.columns, snap: S.grid.snap },
      tiles: S.tiles.map((t) => ({
        id: t.id, component: t.component, zone: t.zone,
        x: t.zone === "stage" ? t.x : null,
        y: t.zone === "stage" ? t.y : null,
        w: t.zone === "stage" ? t.w : null,
        h: t.zone === "stage" ? t.h : null,
        order: t.zone === "stage" ? null : t.order,
        visible: t.visible,
      })),
    };
  }

  $("#export").onclick = () => {
    const j = JSON.stringify(exportShape(), null, 2);
    const w = window.open("", "_blank", "width=760,height=560");
    if (w) w.document.write(
      `<title>${E.page} layout</title><pre style="font:12px monospace;background:#0a0f08;color:#e9f3df;padding:16px">${j.replace(/</g, "&lt;")}</pre>`);
    navigator.clipboard?.writeText(j).then(
      () => flash("json copied"), () => flash("json shown"));
  };
  $("#download").onclick = () => {
    const j = JSON.stringify(exportShape(), null, 2);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([j], { type: "application/json" }));
    a.download = `${E.page}-layout.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    flash("downloaded");
  };
  $("#insp-x").onclick = () => { sel = null; insp.classList.remove("show"); };

  /* presets — merge over defaults, confirm over dirty layouts */
  const selp = $("#preset");
  const ph = document.createElement("option");
  ph.value = ""; ph.textContent = "— choose —";
  selp.appendChild(ph);
  for (const k of Object.keys(E.presets || {})) {
    const o = document.createElement("option");
    o.value = k; o.textContent = k.toUpperCase().replace(/_/g, " ");
    selp.appendChild(o);
  }
  selp.onchange = (e) => {
    const p = E.presets[e.target.value];
    if (!p) return;
    if (S.preset === "custom" &&
        !confirm(`Apply preset "${e.target.value.replace(/_/g, " ")}"? Your current layout will be replaced.`)) {
      selp.value = "";
      return;
    }
    S = applyPreset(p, e.target.value);
    sel = null;
    save(); render();
  };
  // dedicated RESET TO PRESET — re-applies the active preset even when the
  // select still shows it (same-value picks fire no change event)
  $("#reset-preset").onclick = () => {
    const k = selp.value || S.preset;
    if (!E.presets[k]) { flash("no preset chosen"); return; }
    if (!confirm(`Reset layout to preset "${k.replace(/_/g, " ")}"?`)) return;
    S = applyPreset(E.presets[k], k);
    sel = null;
    save(); render();
  };

  /* panel edge resize */
  document.querySelectorAll(".edge").forEach((ed) => {
    ed.addEventListener("mousedown", (e) => {
      const p = ed.dataset.p;
      ed.classList.add("drag");
      gesture = { kind: "panel", p, start: e.clientX,
                  w0: S.panels[p].width, edge: ed };
    });
  });

  const flash = (m) => { $("#foot-info").textContent = m; setTimeout(render, 900); };
  window.addEventListener("resize", render);
  stage.addEventListener("mousedown", (e) => {
    if (e.target === stage || e.target.id === "sgrid") {
      sel = null; insp.classList.remove("show");
    }
  });

  render();
})();
