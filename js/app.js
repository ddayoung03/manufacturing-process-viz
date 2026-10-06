// 화면 제어: 공정 탭, 단계 전환, 슬라이더, 계산 결과, 교재 근거 패널, 애니메이션 루프
(function () {
  const PROCS = window.PROCESSES;
  const $ = (id) => document.getElementById(id);
  const el = {
    tabs: $("processTabs"), stage: $("stage"), title: $("stepTitle"), term: $("termBox"),
    rail: $("stepRail"), prev: $("prevBtn"), next: $("nextBtn"), count: $("stepCount"),
    controls: $("controls"), alerts: $("alerts"), readout: $("readout"),
    cites: $("cites"), explain: $("explain"), play: $("playBtn"), reset: $("resetBtn"),
  };

  const defaults = (proc) => Object.fromEntries(Object.entries(proc.params).map(([k, d]) => [k, d.value]));
  const state = {
    pi: 0,
    step: PROCS.map(() => 0),
    params: PROCS.map(defaults),
    playing: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    t0: performance.now(),
    term: null,
  };

  const proc = () => PROCS[state.pi];
  const step = () => proc().steps[state.step[state.pi]];
  const params = () => state.params[state.pi];

  // ---------- 탭 ----------
  function renderTabs() {
    el.tabs.innerHTML = PROCS.map((p, i) =>
      `<button type="button" role="tab" aria-selected="${i === state.pi}" data-i="${i}" style="--dot:${p.color}"><span class="dot" aria-hidden="true"></span><span>${p.name}<small>${p.en} · ${p.chapter}</small></span></button>`
    ).join("");
  }
  el.tabs.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]");
    if (b) go(+b.dataset.i, state.step[+b.dataset.i]);
  });

  // ---------- 단계 레일 ----------
  function renderRail() {
    const cur = state.step[state.pi];
    el.rail.innerHTML = proc().steps.map((s, i) =>
      `<li class="${i <= cur ? "passed" : ""}"><button type="button" data-s="${i}" ${i === cur ? 'aria-current="step"' : ""} class="${i < cur ? "done" : ""}"><b>${i + 1}</b>${s.short}</button></li>`
    ).join("");
    el.prev.disabled = cur === 0;
    el.next.disabled = cur === proc().steps.length - 1;
    el.count.textContent = `${cur + 1} / ${proc().steps.length} 단계`;
  }
  el.rail.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-s]");
    if (b) go(state.pi, +b.dataset.s);
  });
  el.prev.addEventListener("click", () => go(state.pi, state.step[state.pi] - 1));
  el.next.addEventListener("click", () => go(state.pi, state.step[state.pi] + 1));

  // ---------- 슬라이더 ----------
  function fmtParam(d, v) {
    if (d.type === "select") return "";
    if (d.names) return d.names[v];
    return `${D.fmt(v, d.digits ?? 2)} ${d.unit || ""}`.trim();
  }
  function renderControls() {
    const s = step(), p = params(), P = proc().params;
    el.controls.innerHTML = s.params.map((k) => {
      const d = P[k];
      if (d.type === "select") {
        return `<div class="ctl"><label for="c_${k}"><span>${d.label}</span></label>
          <select id="c_${k}" data-k="${k}">${d.options.map((o, i) => `<option value="${i}" ${i === p[k] ? "selected" : ""}>${o.label}</option>`).join("")}</select>
          ${d.hint ? `<span class="hint">${d.hint}</span>` : ""}</div>`;
      }
      return `<div class="ctl"><label for="c_${k}"><span>${d.label}</span><output id="o_${k}">${fmtParam(d, p[k])}</output></label>
        <input id="c_${k}" data-k="${k}" type="range" min="${d.min}" max="${d.max}" step="${d.step}" value="${p[k]}">
        ${d.hint ? `<span class="hint">${d.hint}</span>` : ""}
        ${d.maxFn ? `<span class="hint limit" id="l_${k}"></span>` : ""}</div>`;
    }).join("") || `<p class="hint">이 단계는 도면의 부품을 눌러 살펴보는 단계다.</p>`;
  }

  // 다른 파라미터에 따라 물리적으로 가능한 최대값이 바뀌는 슬라이더(maxFn)를 그 값에서 막는다
  function applyLimits() {
    const p = params();
    for (const [k, d] of Object.entries(proc().params)) {
      if (!d.maxFn) continue;
      const lim = Math.floor(d.maxFn(p) / d.step + 1e-9) * d.step;
      const max = Math.round(Math.min(d.max, lim) * 1e6) / 1e6;
      if (p[k] > max) p[k] = max;
      const input = $("c_" + k);
      if (!input) continue;
      input.max = max;
      input.value = p[k];
      $("o_" + k).textContent = fmtParam(d, p[k]);
      $("l_" + k).textContent = d.limitHint(max);
    }
  }
  el.controls.addEventListener("input", (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    const d = proc().params[k];
    const v = d.type === "select" ? +e.target.value : parseFloat(e.target.value);
    params()[k] = v;
    const out = $("o_" + k);
    if (out) out.textContent = fmtParam(d, v);
    update();
  });
  el.reset.addEventListener("click", () => {
    state.params[state.pi] = defaults(proc());
    renderControls();
    update();
  });

  // ---------- 결과 · 경고 ----------
  function renderReadout(r) {
    const s = step(), p = params();
    const alerts = (s.alerts ? s.alerts(p, r) : []);
    el.alerts.innerHTML = alerts.map((a) => `<div class="alert ${a.level}">${a.text}</div>`).join("");
    el.readout.innerHTML = s.readout(p, r).map(([label, value, unit, sub, big]) =>
      `<dt>${label}${sub ? `<small>${sub}</small>` : ""}</dt><dd class="${big ? "big" : ""}">${value}${unit ? ` <small>${unit}</small>` : ""}</dd>`
    ).join("");
  }

  // ---------- 교재 근거 ----------
  function renderInfo() {
    const s = step();
    el.cites.innerHTML = s.cites.map((c) => `<li>${c}</li>`).join("");
    const list = (a) => `<ul>${a.map((x) => `<li>${x}</li>`).join("")}</ul>`;
    $("formulas").innerHTML = (s.formulas || []).map((f) => `<div class="formula">${f[0]}<span>${f[1]}</span></div>`).join("");
    el.explain.innerHTML =
      `<h4>현상</h4><p>${s.phenomenon}</p>` +
      `<h4>핵심 변수</h4>${list(s.variables)}` +
      `<h4>가정</h4>${list(s.assumptions)}` +
      `<h4>한계</h4>${list(s.limits)}`;
  }

  // ---------- 도면 ----------
  let lastR = null;
  function drawStage() {
    const t = (performance.now() - state.t0) / 1000;
    el.stage.innerHTML = D.defs() + step().draw(params(), lastR, state.playing ? t : frozenT, state.term);
  }
  let frozenT = 0;
  el.play.addEventListener("click", () => {
    if (state.playing) frozenT = (performance.now() - state.t0) / 1000;
    else state.t0 = performance.now() - frozenT * 1000;
    state.playing = !state.playing;
    el.play.textContent = state.playing ? "일시정지" : "재생";
    el.play.setAttribute("aria-pressed", state.playing);
    drawStage();
  });

  // 도면 부품 클릭 → 용어 설명
  el.stage.addEventListener("click", (e) => {
    const g = e.target.closest("[data-term]");
    if (!g) return;
    const key = g.dataset.term;
    const terms = step().terms || proc().terms || {};
    state.term = key;
    el.term.hidden = false;
    el.term.innerHTML = terms[key] || key;
    drawStage();
  });

  function update() {
    applyLimits();
    lastR = proc().compute(params());
    renderReadout(lastR);
    drawStage();
  }

  function go(pi, si) {
    const n = PROCS[pi].steps.length;
    si = Math.max(0, Math.min(n - 1, si));
    const changed = pi !== state.pi || si !== state.step[pi];
    state.pi = pi;
    state.step[pi] = si;
    if (changed) { state.term = null; el.term.hidden = true; }
    document.body.dataset.process = proc().id;
    el.title.textContent = `${proc().name} ${si + 1}단계 · ${step().title}`;
    history.replaceState(null, "", `#${proc().id}-${si + 1}`);
    renderTabs();
    renderRail();
    renderControls();
    renderInfo();
    update();
  }

  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, select")) return;
    if (e.key === "ArrowRight") go(state.pi, state.step[state.pi] + 1);
    else if (e.key === "ArrowLeft") go(state.pi, state.step[state.pi] - 1);
    else if (["1", "2", "3"].includes(e.key)) go(+e.key - 1, state.step[+e.key - 1]);
  });

  function loop() {
    if (state.playing && step().animated) drawStage();
    requestAnimationFrame(loop);
  }

  // #extrusion-3 같은 주소로 바로 열기
  const m = location.hash.match(/^#(\w+)-(\d+)$/);
  const startPi = m ? Math.max(0, PROCS.findIndex((p) => p.id === m[1])) : 0;
  if (m) state.step[startPi] = (+m[2] || 1) - 1;
  el.play.textContent = state.playing ? "일시정지" : "재생";
  go(startPi, state.step[startPi]);
  requestAnimationFrame(loop);
})();
