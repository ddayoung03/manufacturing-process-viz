// 공정 1: 사형 주조 — 교재 5장(금속 주조의 기초), 6.1절(사형 주조)
(function () {
  const PL = 320;   // 분할선 y
  const S = 13;     // 축척 px/cm — 가로·세로 같은 축척이라 라이저 높이 한계가 그림에서도 정확히 맞는다
  const BOTTOM = 455;

  // Table 5.1 (p.108) 선수축률. 범위로 주어진 값은 가운데 값을 쓴다.
  const METALS = [
    { label: "탄소강 (1.6–2.1% → 1.85%)", s: 0.0185 },
    { label: "회주철 (0.8–1.3% → 1.05%)", s: 0.0105 },
    { label: "백주철 (2.1%)", s: 0.021 },
    { label: "알루미늄 합금 (1.3%)", s: 0.013 },
    { label: "황동 (1.3–1.6% → 1.45%)", s: 0.0145 },
    { label: "아연 (2.6%)", s: 0.026 },
    { label: "마그네슘 (2.1%)", s: 0.021 },
  ];

  const params = {
    L: { label: "주물 길이 L", unit: "cm", min: 5, max: 20, step: 0.5, value: 12.5, digits: 1 },
    W: { label: "주물 폭 W", unit: "cm", min: 3, max: 15, step: 0.5, value: 7.5, digits: 1 },
    t: { label: "주물 두께 t", unit: "cm", min: 0.5, max: 5, step: 0.1, value: 2.0, digits: 1 },
    metal: { label: "주조 금속 (Table 5.1 선수축률)", type: "select", options: METALS, value: 0 },
    h: { label: "스프루 높이 h", unit: "cm", min: 5, max: 22, step: 0.5, value: 20, digits: 1, hint: "Example 5.1 값: 20 cm" },
    As: { label: "스프루 바닥 단면적 A", unit: "cm²", min: 0.5, max: 6, step: 0.1, value: 2.5, digits: 1, hint: "Example 5.1 값: 2.5 cm²" },
    Cm: { label: "주형 상수 Cm", unit: "min/cm²", min: 0.5, max: 6, step: 0.01, value: 3.26, digits: 2, hint: "Example 5.2 에서 구한 강·사형 값: 3.26" },
    tau: { label: "경과 시간 (주물 응고시간 대비)", unit: "%", min: 0, max: 200, step: 1, value: 60, digits: 0 },
    Dr: {
      label: "라이저 지름 D (= 높이 H)", unit: "cm", min: 1, max: 10, step: 0.1, value: 4.7, digits: 1, hint: "Example 5.2 답: 4.7 cm",
      // 막힌(blind) 라이저는 주물 바닥(분할선 아래 t/2)에서 상형 윗면(분할선 위 h)까지만 들어간다
      maxFn: (p) => p.h + p.t / 2,
      limitHint: (max) => `최대 ${D.fmt(max, 1)} cm = h + t/2 — 이보다 높은 라이저는 주형 밖으로 나가 만들 수 없다`,
    },
  };

  function compute(p) {
    const plate = F.plateVA(p.L, p.W, p.t);
    const riser = F.cylinderVA(p.Dr, p.Dr);
    const v = F.sprueVelocity(p.h);
    const Q = F.flowRate(v, p.As);
    const Vfill = plate.V + riser.V;
    const Mc = plate.V / plate.A;
    const Mr = riser.V / riser.A;
    const TTSc = F.chvorinov(p.Cm, plate.V, plate.A);
    const TTSr = F.chvorinov(p.Cm, riser.V, riser.A);
    const s = METALS[p.metal].s;
    return {
      plate, riser, v, Q, Vfill, TMF: F.fillTime(Vfill, Q), Mc, Mr, TTSc, TTSr,
      ratio: TTSr / TTSc, Dmin: 6 * Mc, s,
      pat: { L: F.patternSize(p.L, s), W: F.patternSize(p.W, s), t: F.patternSize(p.t, s) },
    };
  }

  // ---------- 공통 주형 단면 ----------
  function geom(p) {
    const ct = p.t * S;
    const x0 = 200, x1 = x0 + p.L * S;
    const cTop = PL - ct / 2, cBot = PL + ct / 2;
    const rx0 = x1 + 18, rx1 = rx0 + p.Dr * S;
    const sprueTop = PL - p.h * S;
    const rTop = cBot - p.Dr * S;
    const runH = Math.min(12, ct * 0.8);
    const baseW = 6 + p.As * 3.2;
    return { ct, x0, x1, cTop, cBot, rx0, rx1, rTop, sprueTop, runH, baseW, sx: 120 };
  }

  function moldShell(g, picked) {
    const pk = (k) => (picked === k ? "picked" : "");
    let s = "";
    // 주형틀(flask)과 모래
    s += `<g data-term="flask" class="${pk("flask")}"><rect x="40" y="${g.sprueTop}" width="720" height="${BOTTOM - g.sprueTop}" fill="none" stroke="#495057" stroke-width="6"/></g>`;
    s += `<g data-term="cope" class="${pk("cope")}"><rect x="43" y="${g.sprueTop + 3}" width="714" height="${PL - g.sprueTop - 3}" fill="url(#sand)"/></g>`;
    s += `<g data-term="drag" class="${pk("drag")}"><rect x="43" y="${PL}" width="714" height="${BOTTOM - PL - 3}" fill="url(#sand)"/></g>`;
    s += `<g data-term="parting" class="${pk("parting")}"><line x1="34" y1="${PL}" x2="766" y2="${PL}" stroke="${D.INK}" stroke-width="2" stroke-dasharray="10 5"/><rect x="34" y="${PL - 6}" width="732" height="12" fill="transparent"/></g>`;
    return s;
  }

  // 공동(cavity)·게이팅·라이저 윤곽. fill 은 상황별로 바꾼다.
  function cavities(g, fill, picked) {
    const pk = (k) => (picked === k ? "picked" : "");
    const st = `stroke="${D.INK}" stroke-width="1.5"`;
    const top = g.sprueTop;
    return `
      <g data-term="cup" class="${pk("cup")}"><path d="M${g.sx - 34},${top - 26} L${g.sx + 34},${top - 26} L${g.sx + 13},${top} L${g.sx - 13},${top} z" fill="${fill.cup}" ${st}/></g>
      <g data-term="sprue" class="${pk("sprue")}"><path d="M${g.sx - 13},${top} L${g.sx + 13},${top} L${g.sx + g.baseW / 2},${PL + g.runH} L${g.sx - g.baseW / 2},${PL + g.runH} z" fill="${fill.sprue}" ${st}/></g>
      <g data-term="runner" class="${pk("runner")}"><rect x="${g.sx + g.baseW / 2 - 1}" y="${PL}" width="${g.x0 - g.sx - g.baseW / 2 + 2}" height="${g.runH}" fill="${fill.runner}" ${st}/></g>
      <g data-term="cavity" class="${pk("cavity")}"><rect x="${g.x0}" y="${g.cTop}" width="${g.x1 - g.x0}" height="${g.ct}" fill="${fill.cavity}" ${st}/></g>
      <g data-term="riser" class="${pk("riser")}">
        <rect x="${g.x1 - 1}" y="${g.cBot - Math.min(14, g.ct)}" width="20" height="${Math.min(14, g.ct)}" fill="${fill.riser}" ${st}/>
        <rect x="${g.rx0}" y="${g.rTop}" width="${g.rx1 - g.rx0}" height="${g.cBot - g.rTop}" fill="${fill.riser}" ${st}/>
      </g>`;
  }

  const EMPTY = { cup: "#fff", sprue: "#fff", runner: "#fff", cavity: "#fff", riser: "#fff" };

  const terms = {
    flask: "<b>주형틀 (flask)</b> — 상형과 하형의 모래를 담는 상자. 주형틀도 분할선에서 두 쪽으로 나뉜다. (5.1.2, p.100)",
    cope: "<b>상형 (cope)</b> — 주형의 위쪽 절반. 탕구(스프루)와 라이저가 이곳을 관통한다. (5.1.2, p.100, Fig. 5.1b)",
    drag: "<b>하형 (drag)</b> — 주형의 아래쪽 절반. 패턴의 대략 절반이 하형 모래에 묻힌다. (5.1.2, p.100)",
    parting: "<b>분할선 (parting line)</b> — 상형과 하형이 맞닿는 면. 패턴을 빼낼 수 있도록 여기서 주형을 연다. (5.1.2, p.100)",
    cup: "<b>주입컵 (pouring cup)</b> — 쇳물이 튀거나 난류가 생기는 것을 줄이며 스프루로 이끈다. (5.1.2, p.100)",
    sprue: "<b>탕구 (downsprue)</b> — 쇳물이 내려가는 통로. 아래로 갈수록 빨라지므로 단면을 좁혀(taper) 공기 흡입을 막는다. (5.2.3, p.103)",
    runner: "<b>탕도 (runner)</b> — 스프루 바닥에서 공동까지 쇳물을 수평으로 보낸다. 수평이면 유량이 스프루 바닥과 같다. (5.2.3, p.103)",
    cavity: "<b>공동 (mold cavity)</b> — 패턴을 뺀 자리. 수축을 고려해 최종 주물보다 크게 만든다. (5.1.2, p.100; 6.1.1, p.114)",
    riser: "<b>라이저 (riser)</b> — 응고 수축분을 채워 주는 쇳물 저장소. 주물보다 늦게 굳어야 제 역할을 한다. 여기서는 측면 · 막힌(blind) 라이저. (5.1.2, p.100; 5.3.5, p.110)",
  };

  // ---------- 1단계: 패턴과 주형 ----------
  function drawMold(p, r, t, picked) {
    const g = geom(p);
    let s = moldShell(g, picked) + cavities(g, EMPTY, picked);
    // 최종 주물 크기(점선) — 수축 여유를 5배 과장해 보이게 한다
    const k = 1 / (1 + r.s * 5);
    const fw = (g.x1 - g.x0) * k, fh = g.ct * k;
    s += `<rect x="${g.x0 + ((g.x1 - g.x0) - fw) / 2}" y="${PL - fh / 2}" width="${fw}" height="${fh}" fill="none" stroke="${D.MELT}" stroke-width="1.5" stroke-dasharray="5 3"/>`;
    s += D.label(400, BOTTOM - 22, "검은 실선 = 패턴(공동), 주황 점선 = 최종 주물 (차이 5배 과장)", { anchor: "middle", size: 11 });
    s += D.label(g.sx + 42, g.sprueTop - 14, "주입컵", {});
    s += D.label(g.sx - 22, (g.sprueTop + PL) / 2, "탕구", { anchor: "end" });
    s += D.label((g.sx + g.x0) / 2, PL + 36, "탕도", { anchor: "middle" });
    s += D.label((g.rx0 + g.rx1) / 2, g.rTop - 8, "라이저", { anchor: "middle" });
    s += D.label(745, g.sprueTop + 26, "상형", { anchor: "end" });
    s += D.label(745, PL + 34, "하형", { anchor: "end" });
    s += D.label(745, PL - 10, "분할선", { anchor: "end" });
    s += D.text(400, 476, "부품을 누르면 이름과 역할이 아래에 표시된다", { anchor: "middle", size: 12, fill: D.INK2 });
    return s;
  }

  // ---------- 2단계: 주입 ----------
  function drawPour(p, r, t, picked) {
    const g = geom(p);
    const PLAY = 4; // 실제 T_MF 를 4초 재생으로 늘린다
    const f = Math.min(1, (t % (PLAY + 1.2)) / PLAY);
    const levelTop = Math.min(g.cTop, g.rTop);
    const level = g.cBot - f * (g.cBot - levelTop);
    let s = moldShell(g, picked);
    s += cavities(g, { ...EMPTY, cup: "url(#melt)", sprue: "url(#melt)", runner: "url(#melt)" }, picked);
    s += `<clipPath id="lvl"><rect x="0" y="${level}" width="800" height="${BOTTOM}"/></clipPath>`;
    s += `<g clip-path="url(#lvl)" opacity="0.95">
      <rect x="${g.x0}" y="${g.cTop}" width="${g.x1 - g.x0}" height="${g.ct}" fill="url(#melt)"/>
      <rect x="${g.x1}" y="${g.cBot - Math.min(14, g.ct)}" width="18" height="${Math.min(14, g.ct)}" fill="url(#melt)"/>
      <rect x="${g.rx0}" y="${g.rTop}" width="${g.rx1 - g.rx0}" height="${g.cBot - g.rTop}" fill="url(#melt)"/></g>`;
    // 쇳물 줄기
    const streamTop = Math.max(0, g.sprueTop - 70);
    if (f < 1) s += `<rect x="${g.sx - 4}" y="${streamTop}" width="8" height="${g.sprueTop - 26 - streamTop}" fill="url(#melt)" rx="3"/>`;
    // 높이와 속도 표시
    s += D.dim(g.sx - 50, g.sprueTop, g.sx - 50, PL + g.runH / 2, `h = ${D.fmt(p.h, 1)} cm`, { dx: -6 });
    s += D.arrow(g.sx, PL - 40, g.sx, PL + g.runH + 26, { color: D.INK, width: 2 });
    s += D.label(g.sx - 10, PL + g.runH + 36, `v = ${D.fmt(r.v, 1)} cm/s`, { anchor: "end" });
    s += D.arrow(g.x0 - 50, PL + g.runH / 2, g.x0 - 6, PL + g.runH / 2, { width: 2 });
    s += D.label(g.x0 + 10, g.cBot + 30, `Q = ${D.fmt(r.Q, 0)} cm³/s`, {});
    s += D.label(560, BOTTOM - 40, `채움 ${Math.round(f * 100)}%  ·  실제 ${D.fmt(f * r.TMF, 2)} / ${D.fmt(r.TMF, 2)} s`, { anchor: "middle", size: 13 });
    s += D.text(560, BOTTOM - 16, `T_MF ${D.fmt(r.TMF, 2)} s를 ${PLAY}초로 늘려 재생`, { anchor: "middle", size: 11, fill: D.INK2 });
    return s;
  }

  // ---------- 3단계: 응고 (확대 단면 + 냉각 곡선) ----------
  function drawSolidify(p, r) {
    const tc = (p.tau / 100) * r.TTSc;            // 경과 시간 min
    const z = Math.min(420 / (p.L + 1 + p.Dr), 230 / Math.max(p.Dr, p.t));
    const bx = 50, by = 400;
    const cw = p.L * z, chh = p.t * z;
    const rx = bx + (p.L + 1) * z, rw = p.Dr * z;
    let s = `<rect x="20" y="${by - Math.max(p.Dr, p.t) * z - 40}" width="${rx + rw + 30 - 20}" height="${Math.max(p.Dr, p.t) * z + 70}" fill="url(#sand)" stroke="#495057" stroke-width="2"/>`;

    // δ(t) = 반두께 × √(t / T_TS) : 응고층 두께가 √시간에 비례한다는 가정 (Chvorinov 식의 근거와 같은 형태)
    const part = (x, y, w, h, half, TTS, label) => {
      const frac = Math.min(1, Math.sqrt(tc / TTS));
      const d = half * frac;
      let q = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${D.SOLID}" stroke="${D.INK}" stroke-width="1.5"/>`;
      // 벽 근처 미세 등축정 + 안쪽으로 자라는 주상정 (Fig. 5.3)
      const rnd = D.rng(Math.round(w + h));
      for (let i = 0; i < Math.round((w + h) / 6); i++) {
        const top = i % 2 === 0;
        const xx = x + rnd() * w;
        q += `<line x1="${xx}" y1="${top ? y : y + h}" x2="${xx + (rnd() - 0.5) * 3}" y2="${top ? y + d * 0.9 : y + h - d * 0.9}" stroke="#495057" stroke-width="0.6"/>`;
      }
      if (frac < 1) {
        q += `<rect x="${x + d}" y="${y + d}" width="${Math.max(0, w - 2 * d)}" height="${Math.max(0, h - 2 * d)}" fill="url(#melt)"/>`;
      }
      const liquid = (Math.max(0, w - 2 * d) * Math.max(0, h - 2 * d)) / (w * h); // 단면적 기준
      q += D.label(x + w / 2, y - 10, `${label}: ${frac >= 1 ? "응고 완료" : `액상 단면 ${Math.round(liquid * 100)}%`}`, { anchor: "middle", size: 11 });
      return q;
    };
    s += part(bx, by - chh, cw, chh, Math.min(chh, cw) / 2, r.TTSc, "주물");
    s += `<rect x="${bx + cw}" y="${by - Math.min(chh, 0.8 * z)}" width="${z}" height="${Math.min(chh, 0.8 * z)}" fill="${tc >= r.TTSc ? D.SOLID : "url(#melt)"}" stroke="${D.INK}" stroke-width="1"/>`;
    s += part(rx, by - rw, rw, rw, rw / 2, r.TTSr, "라이저");

    // 냉각 곡선 (Fig. 5.2 형태, 온도축은 정성적)
    const tMax = Math.max(r.TTSc, r.TTSr) * 1.4;
    const curve = (TTS) => {
      const t0 = TTS * 0.08;
      return [[0, 100], [t0, 70], [TTS, 70], [TTS + (tMax - TTS) * 0.9, 25]];
    };
    const ch = D.chart({ x: 520, y: 40, w: 240, h: 230 }, {
      xMin: 0, xMax: tMax, yMin: 0, yMax: 110,
      xLabel: "시간 (min)", yLabel: "온도 (정성적)",
      xTicks: [0, tMax / 2, tMax].map((v) => +v.toFixed(2)), fmtX: (v) => D.fmt(v, 2),
      series: [{ pts: curve(r.TTSc), color: D.INK }, { pts: curve(r.TTSr), color: D.MELT, dash: "6 3" }],
    });
    s += ch.svg;
    s += `<line x1="${ch.sx(Math.min(tc, tMax))}" y1="40" x2="${ch.sx(Math.min(tc, tMax))}" y2="270" stroke="${D.MELT}" stroke-width="1.5"/>`;
    s += D.text(ch.sx(r.TTSc), ch.sy(70) - 10, "주물 T_TS", { size: 11, anchor: "middle" });
    s += D.text(ch.sx(r.TTSr), ch.sy(70) + 22, "라이저 T_TS", { size: 11, anchor: "middle", fill: D.MELT });
    s += D.text(530, 62, "응고점 (주입 → 과열 제거 → 응고 → 냉각)", { size: 11, fill: D.INK2 });
    s += D.text(640, 345, `현재 t = ${D.fmt(tc, 2)} min`, { anchor: "middle", size: 13, weight: 700 });
    return s;
  }

  // ---------- 4단계: 수축과 라이저 ----------
  function drawRiser(p, r, t, picked) {
    const g = geom(p);
    const ok = r.ratio > 1;
    let s = moldShell(g, picked) + cavities(g, { cup: "#fff", sprue: "#fff", runner: D.SOLID, cavity: D.SOLID, riser: D.SOLID }, picked);
    if (ok) {
      // 수축공(pipe)이 라이저 꼭대기에 생긴다
      const cx = (g.rx0 + g.rx1) / 2, w = (g.rx1 - g.rx0) * 0.35;
      s += `<path d="M${cx - w},${g.rTop} Q${cx},${g.rTop + (g.cBot - g.rTop) * 0.7} ${cx + w},${g.rTop} z" fill="#fff" stroke="${D.INK}" stroke-width="1.2"/>`;
      s += D.label(cx, g.rTop - 10, "수축공은 라이저에 (잘라 버릴 부분)", { anchor: "middle", size: 11 });
    } else {
      const cx = g.x0 + (g.x1 - g.x0) * 0.62, w = Math.max(10, (g.x1 - g.x0) * 0.12);
      s += `<path d="M${cx - w},${g.cTop + 2} Q${cx},${g.cBot - 2} ${cx + w},${g.cTop + 2} z" fill="#fff" stroke="${"#b42318"}" stroke-width="2"/>`;
      s += D.label(cx, g.cTop - 12, "수축공이 주물 안에 생김", { anchor: "middle", size: 11 });
    }
    s += D.dim(g.rx0, g.cBot + 22, g.rx1, g.cBot + 22, `D = ${D.fmt(p.Dr, 1)} cm`);

    // T_TS 막대 비교
    const max = Math.max(r.TTSc, r.TTSr) * 1.1;
    const bar = (y, v, c, name) =>
      `<rect x="300" y="${y}" width="${(v / max) * 400}" height="18" fill="${c}"/>` +
      D.text(296, y + 14, name, { anchor: "end", size: 12 }) +
      D.text(306 + (v / max) * 400, y + 14, `${D.fmt(v, 2)} min`, { size: 12, weight: 700 });
    s += `<rect x="190" y="${BOTTOM + 2}" width="0" height="0"/>`;
    s += bar(BOTTOM - 58, r.TTSc, D.INK2, "주물 T_TS");
    s += bar(BOTTOM - 34, r.TTSr, ok ? D.MELT : "#b42318", "라이저 T_TS");
    return s;
  }

  window.PROCESSES = window.PROCESSES || [];
  window.PROCESSES.push({
    id: "casting", name: "사형 주조", en: "Sand casting", chapter: "5장 · 6.1절",
    params, compute, terms,
    steps: [
      {
        title: "패턴과 주형 준비", short: "패턴·주형", params: ["L", "W", "t", "metal"], draw: drawMold,
        cites: [
          "5.1.2 Sand-Casting Molds, pp.99–100, Fig. 5.1(b)",
          "6.1 Sand Casting · 6.1.1 Patterns and Cores, pp.113–114, Fig. 6.1",
          "5.3.3 Shrinkage, p.108, Table 5.1 (선수축률)",
        ],
        formulas: [["L<sub>패턴</sub> = L<sub>주물</sub> × (1 + 선수축률)", "Table 5.1, 5.3.3 수축 여유"]],
        phenomenon: "모래를 패턴 둘레에 다져 넣은 뒤 패턴을 빼면 그 자리가 공동이 된다. 주형은 상형과 하형 두 쪽이고, 쇳물이 들어갈 탕구·탕도와 수축을 채울 라이저도 함께 만든다. 쇳물은 식으며 줄어들기 때문에 패턴은 최종 주물보다 수축 여유만큼 크게 만든다.",
        variables: ["주물 치수 L × W × t", "금속별 선수축률 (Table 5.1)", "패턴 치수 = 수축 여유를 더한 치수"],
        assumptions: ["수축 여유는 선형으로 적용한다 (교재: 부피 수축이지만 치수는 선형으로 표현).", "범위로 주어진 수축률은 가운데 값을 쓴다.", "다듬질(가공) 여유는 넣지 않았다."],
        limits: ["단순 직사각 판만 다룬다. 코어나 복잡 형상은 없다.", "도면의 수축 차이는 눈에 보이도록 5배 과장했다."],
        readout: (p, r) => [
          ["주물 부피 V", D.fmt(r.plate.V, 1), "cm³"],
          ["주물 표면적 A", D.fmt(r.plate.A, 1), "cm²"],
          ["선수축률", D.fmt(r.s * 100, 2), "%"],
          ["패턴 L × W × t", `${D.fmt(r.pat.L, 2)} × ${D.fmt(r.pat.W, 2)} × ${D.fmt(r.pat.t, 2)}`, "cm", "공동 크기", true],
        ],
        alerts: (p) => p.t > p.W ? [{ level: "warn", text: "두께가 폭보다 크다. 이 모델은 얇은 판을 가정하므로 L ≥ W ≥ t 범위에서 쓰는 것이 맞다." }] : [],
      },
      {
        title: "쇳물 주입", short: "주입", params: ["h", "As"], draw: drawPour, animated: true,
        cites: [
          "5.2.2 Pouring the Molten Metal, pp.101–102",
          "5.2.3 Engineering Analysis of Pouring, pp.102–103, Eq. (5.2)–(5.6)",
          "Example 5.1 Pouring Calculations, p.103",
        ],
        formulas: [
          ["v = √(2gh)", "Eq. (5.4)"],
          ["Q = v₁A₁ = v₂A₂", "Eq. (5.5) 연속의 법칙"],
          ["T<sub>MF</sub> = V / Q", "Eq. (5.6)"],
        ],
        phenomenon: "주입컵에 부은 쇳물은 탕구를 따라 떨어지며 빨라진다. 베르누이 식에서 마찰을 무시하면 탕구 바닥 속도는 높이 h 로만 정해지고, 단면적을 곱한 유량으로 공동(주물 + 라이저)을 채운다. 너무 느리면 다 차기 전에 굳고, 너무 빠르면 난류로 산화물 혼입과 주형 침식이 생긴다.",
        variables: ["h: 탕구 높이 (cm)", "A: 탕구 바닥 단면적 (cm²)", "V: 채울 부피 = 주물 + 라이저 (cm³)", "g = 981 cm/s²"],
        assumptions: ["마찰 손실 없음, 전 구간 대기압 (Eq. 5.3 → 5.4 단순화).", "탕구 위 초기 속도 v₁ = 0.", "탕도는 수평이라 유량이 탕구 바닥과 같다."],
        limits: ["교재대로 T_MF 는 최소값이다. 실제로는 마찰과 탕도 수축 때문에 더 오래 걸린다.", "난류 여부(레이놀즈 수)는 계산하지 않는다."],
        readout: (p, r) => [
          ["탕구 바닥 속도 v", D.fmt(r.v, 1), "cm/s", "Eq. 5.4"],
          ["유량 Q", D.fmt(r.Q, 1), "cm³/s", "Eq. 5.5"],
          ["채울 부피 V", D.fmt(r.Vfill, 1), "cm³", "주물 + 라이저"],
          ["충전 시간 T_MF", D.fmt(r.TMF, 3), "s", "Eq. 5.6 (최소값)", true],
        ],
        alerts: () => [{ level: "ok", text: "검증: h = 20 cm, A = 2.5 cm² 에서 v = 198.1 cm/s, Q = 495 cm³/s 로 Example 5.1 과 일치한다." }],
      },
      {
        title: "응고와 냉각", short: "응고", params: ["Cm", "tau"], draw: drawSolidify,
        cites: [
          "5.3.1 Solidification of Metals, pp.104–106, Fig. 5.2 (냉각 곡선), Fig. 5.3 (결정 조직)",
          "5.3.2 Solidification Time, pp.106–107, Eq. (5.7) Chvorinov 법칙",
        ],
        formulas: [["T<sub>TS</sub> = C<sub>m</sub> (V / A)<sup>n</sup>,  n = 2", "Eq. (5.7)"]],
        phenomenon: "주형 벽에 닿은 쇳물이 먼저 식어 얇은 껍질(미세 등축정)을 만들고, 열이 빠지는 반대 방향인 중심 쪽으로 주상정이 자라며 응고가 진행된다. 전체 응고 시간은 부피 대 표면적 비 V/A 의 제곱에 비례하므로, V/A 가 큰 라이저가 얇은 판보다 늦게 굳는다.",
        variables: ["C_m: 주형 상수 (min/cm²) — 주형 재료, 금속 열물성, 주입 온도에 따라 실험으로 정함", "V/A: 모듈러스 (cm)", "n = 2"],
        assumptions: ["주물과 라이저는 같은 주형 조건이라 C_m 이 같다 (p.107).", "응고층 두께 ∝ √시간 으로 그려 T_TS 에서 중심까지 굳게 했다 (시각화용 가정).", "냉각 곡선의 온도축은 정성적이다."],
        limits: ["Chvorinov 법칙은 경험식이라 C_m 은 같은 조건의 이전 작업 데이터가 있어야 한다.", "합금의 머시 존과 편석(Fig. 5.4, 5.5)은 그리지 않았다."],
        readout: (p, r) => [
          ["주물 V/A", D.fmt(r.Mc, 3), "cm"],
          ["라이저 V/A = D/6", D.fmt(r.Mr, 3), "cm"],
          ["주물 T_TS", D.fmt(r.TTSc, 2), "min", "Eq. 5.7", true],
          ["라이저 T_TS", D.fmt(r.TTSr, 2), "min", "Eq. 5.7"],
          ["현재 경과 시간", D.fmt((p.tau / 100) * r.TTSc, 2), "min"],
        ],
        alerts: () => [{ level: "ok", text: "검증: 7.5 × 12.5 × 2.0 cm 판, C_m = 3.26 → T_TS ≈ 1.6 min (Example 5.2 의 주어진 값)." }],
      },
      {
        title: "수축과 라이저 설계", short: "라이저", params: ["Dr", "Cm"], draw: drawRiser,
        cites: [
          "5.3.3 Shrinkage, pp.107–108, Fig. 5.6",
          "5.3.4 Directional Solidification, pp.108–109",
          "5.3.5 Riser Design, pp.109–110, Example 5.2",
        ],
        formulas: [
          ["T<sub>TS,라이저</sub> > T<sub>TS,주물</sub>", "5.3.2, p.107"],
          ["원통 D = H 일 때 V/A = D / 6", "Example 5.2"],
        ],
        phenomenon: "수축은 액체 수축, 응고 수축, 고체 열수축의 세 번에 걸쳐 일어난다. 이 중 응고 수축이 마지막으로 굳는 곳에 수축공(pipe)을 남긴다. 라이저가 주물보다 늦게 굳으면 수축공이 라이저로 옮겨 가고, 라이저는 나중에 잘라낸다. 라이저가 먼저 굳으면 주물에 수축공이 생긴다.",
        variables: ["D: 라이저 지름 (= 높이 H)", "주물 T_TS 와 라이저 T_TS 의 비", "라이저 부피 (낭비되는 금속)"],
        assumptions: ["원통 라이저, D/H = 1 (Example 5.2).", "라이저와 주물을 잇는 목은 주물보다 늦게 굳는다고 본다."],
        limits: ["주물 내부의 방향성 응고 경로는 계산하지 않는다.", "수축공의 모양과 크기는 개념도다."],
        readout: (p, r) => [
          ["라이저 T_TS / 주물 T_TS", D.fmt(r.ratio, 2), "", "1 보다 커야 함", true],
          ["최소 지름 (T_TS 같아지는 D)", D.fmt(r.Dmin, 2), "cm", "D = 6 × (V/A)주물"],
          ["Example 5.2 기준 (1.25배)", D.fmt(r.Dmin * Math.sqrt(1.25), 2), "cm"],
          ["라이저 부피 / 주물 부피", D.fmt((r.riser.V / r.plate.V) * 100, 1), "%", "작을수록 낭비 적음 (Example 5.2: 44%)"],
        ],
        alerts: (p, r) => {
          const a = [];
          if (r.ratio <= 1) a.push({ level: "error", text: `라이저가 주물보다 먼저 굳는다 (T_TS 비 ${D.fmt(r.ratio, 2)}). 주물에 수축공이 생긴다. D 를 ${D.fmt(r.Dmin, 2)} cm 보다 크게 하라.` });
          else if (r.ratio < 1.1) a.push({ level: "warn", text: "라이저가 주물과 거의 같이 굳는다. 여유가 부족하다." });
          else a.push({ level: "ok", text: "라이저가 주물보다 늦게 굳는다. 수축공은 라이저 쪽에 생긴다." });          return a;
        },
      },
    ],
  });
})();
