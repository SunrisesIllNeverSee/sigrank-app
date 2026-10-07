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
  const def = () => ({
    page: E.page,
    viewportReference: { width: 1600, height: 1000 },
    panels: {
      left: { visible: true, width: PANEL_DEF.left },
      right: { visible: true, width: PANEL_DEF.right },
    },
    grid: { columns: 12, snap: true, show: false },
    tiles: E.tiles.map((t) => ({
      id: t.id, component: t.component, zone: t.zone,
      x: t.x ?? 0, y: t.y ?? 0, w: t.w ?? 4, h: t.h ?? 3,
      order: t.order ?? null, visible: t.visible !== false,
    })),
    preset: "custom",
  });
  let S = load() || def();
  let sel = null;

  function load() {
    try { const s = JSON.parse(localStorage.getItem(LS_KEY)); return s && s.page === E.page ? s : null; }
    catch { return null; }
  }
  const save = () => localStorage.setItem(LS_KEY, JSON.stringify(S));
  const tile = (id) => S.tiles.find((t) => t.id === id);
  const tileDef = (id) => E.tiles.find((t) => t.id === id) || {};

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
        <button id="export">EXPORT JSON</button>
      </div>
      <div class="grp">
        <button id="mode">PREVIEW MODE</button>
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

  /* ---------------- grid math ---------------- */
  const colW = () => stage.clientWidth / S.grid.columns;
  const snap = (v, u) => (S.grid.snap ? Math.round(v / u) : v / u);

  /* ---------------- render ---------------- */
  function render() {
    // panels
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
    $("#sgrid").style.backgroundSize =
      `${colW()}px ${ROWH}px, ${colW()}px ${ROWH}px`;
    $("#foot-info").textContent =
      `${S.tiles.filter(t=>t.zone==="stage"&&t.visible).length} stage tiles · ` +
      `${S.grid.columns} col · ${S.preset}`;

    // sidebar modules
    for (const [zone, el] of [["left", pbL], ["right", pbR]]) {
      el.innerHTML = "";
      const mods = S.tiles.filter((t) => t.zone === zone)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      mods.forEach((t, i) => {
        const d = tileDef(t.id);
        const m = document.createElement("div");
        m.className = "mod" + (t.visible ? "" : " hidden") + (sel === t.id ? " sel" : "");
        m.dataset.id = t.id;
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
          select(t.id, zone);
          if (a === "up") reorder(zone, i, -1);
          if (a === "down") reorder(zone, i, +1);
          if (a === "vis") { t.visible = !t.visible; commit(); }
        });
        m.querySelector(".mod-h").addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/mod-id", t.id);
        });
      });
      el.ondragover = (e) => e.preventDefault();
      el.ondrop = (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/mod-id");
        const t = tile(id);
        if (t) { t.zone = zone; t.order = el.children.length; commit(); }
      };
    }

    // stage tiles
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
      n.innerHTML = `<div class="tile-h" draggable="true">${d.name || t.id}
        <span class="tag">${t.id}</span></div>
        <div class="tile-b">${d.body || ""}</div>
        <div class="tile-tools">
          <button data-a="vis" title="hide">✕</button>
        </div>
        <div class="rz"></div>`;
      stage.appendChild(n);

      const h = n.querySelector(".tile-h");
      let drag = null;
      h.addEventListener("mousedown", (e) => {
        drag = { ox: e.clientX - n.offsetLeft, oy: e.clientY - n.offsetTop };
        select(t.id, "stage");
      });
      window.addEventListener("mousemove", (e) => {
        if (!drag) return;
        t.x = clamp(snap((e.clientX - drag.ox) / colW(), 1), 0, S.grid.columns - t.w);
        t.y = Math.max(0, snap((e.clientY - drag.oy) / ROWH, 1));
        n.style.left = t.x * colW() + "px";
        n.style.top = t.y * ROWH + "px";
      });
      window.addEventListener("mouseup", () => { if (drag) { drag = null; commit(); } });

      const rz = n.querySelector(".rz");
      let rsz = null;
      rz.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        rsz = { sw: t.w, sh: t.h, cx: e.clientX, cy: e.clientY };
        select(t.id, "stage");
      });
      window.addEventListener("mousemove", (e) => {
        if (!rsz) return;
        t.w = clamp(snap(rsz.sw + (e.clientX - rsz.cx) / colW(), 1), 1, S.grid.columns - t.x);
        t.h = Math.max(1, snap(rsz.sh + (e.clientY - rsz.cy) / ROWH, 1));
        n.style.width = t.w * colW() + "px";
        n.style.height = t.h * ROWH + "px";
      });
      window.addEventListener("mouseup", () => { if (rsz) { rsz = null; commit(); } });

      n.addEventListener("click", (e) => {
        select(t.id, "stage");
        if (e.target.dataset.a === "vis") { t.visible = false; commit(); }
      });
      h.addEventListener("dragstart", (e) =>
        e.dataTransfer.setData("text/mod-id", t.id));
    });
    renderInsp();
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const commit = () => { S.preset = S.preset || "custom"; save(); render(); };

  function reorder(zone, i, dir) {
    const mods = S.tiles.filter((t) => t.zone === zone)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const j = i + dir;
    if (j < 0 || j >= mods.length) return;
    [mods[i].order, mods[j].order] = [mods[j].order, mods[i].order];
    commit();
  }

  /* ---------------- inspector ---------------- */
  function select(id, zone) { sel = id; insp.classList.add("show"); render(); }
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
      if (z !== "stage" && t.zone === "stage") { t.x = 1; t.y = 0; }
      if (t.zone !== "stage") t.order = 99;
      commit();
    };
    $("#i-vis").onchange = (e) => { t.visible = e.target.value === "1"; commit(); };
    if (z === "stage") {
      $("#i-x").onchange = (e) => { t.x = clamp(+e.target.value, 0, S.grid.columns - t.w); commit(); };
      $("#i-y").onchange = (e) => { t.y = Math.max(0, +e.target.value); commit(); };
      $("#i-w").onchange = (e) => { t.w = clamp(+e.target.value, 1, S.grid.columns - t.x); commit(); };
      $("#i-h").onchange = (e) => { t.h = Math.max(1, +e.target.value); commit(); };
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
      $("#i-o").onchange = (e) => { t.order = +e.target.value; commit(); };
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
    $("#mode").textContent = document.body.classList.contains("preview")
      ? "EDIT MODE" : "PREVIEW MODE";
    $("#mode").classList.toggle("on");
  };
  $("#save").onclick = () => { save(); flash("saved"); };
  $("#reset").onclick = () => {
    if (confirm("Reset layout to defaults?")) { S = def(); commit(); }
  };
  $("#export").onclick = () => {
    const j = JSON.stringify(exportShape(), null, 2);
    const w = window.open("", "_blank", "width=760,height=560");
    w.document.write(`<title>${E.page} layout</title><pre style="font:12px monospace;background:#0a0f08;color:#e9f3df;padding:16px">${j.replace(/</g,"&lt;")}</pre>`);
    navigator.clipboard?.writeText(j).then(() => flash("json copied"));
  };
  $("#insp-x").onclick = () => { sel = null; insp.classList.remove("show"); };

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

  /* presets */
  const selp = $("#preset");
  for (const k of Object.keys(E.presets)) {
    const o = document.createElement("option");
    o.value = k; o.textContent = k.toUpperCase().replace(/_/g, " ");
    selp.appendChild(o);
  }
  selp.onchange = (e) => {
    const p = E.presets[e.target.value];
    if (!p) return;
    if (S.preset !== "custom" ||
        confirm(`Apply preset "${e.target.value}"? Custom layout is kept in storage but replaced here.`)) {
      S = JSON.parse(JSON.stringify({ ...def(), ...p }));
      S.preset = e.target.value;
      commit();
    } else selp.value = "";
  };

  /* panel edge resize */
  document.querySelectorAll(".edge").forEach((ed) => {
    ed.addEventListener("mousedown", (e) => {
      const p = ed.dataset.p;
      ed.classList.add("drag");
      const start = e.clientX, w0 = S.panels[p].width;
      const mm = (e2) => {
        const dx = p === "left" ? e2.clientX - start : start - e2.clientX;
        S.panels[p].width = clamp(w0 + dx, 120, 480);
        render();
      };
      const up = () => {
        ed.classList.remove("drag");
        window.removeEventListener("mousemove", mm);
        window.removeEventListener("mouseup", up);
        commit();
      };
      window.addEventListener("mousemove", mm);
      window.addEventListener("mouseup", up);
    });
  });

  const flash = (m) => { $("#foot-info").textContent = m; setTimeout(render, 900); };
  window.addEventListener("resize", render);
  stage.addEventListener("mousedown", (e) => {
    if (e.target === stage || e.target.id === "sgrid") { sel = null; insp.classList.remove("show"); }
  });

  render();
})();
