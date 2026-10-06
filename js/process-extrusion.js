// 공정 2: 플라스틱 압출 — 교재 8.1절(고분자 용융체), 8.2절(압출)
(function () {
  const params = {
    D: { label: "스크루(배럴) 지름 D", unit: "mm", min: 25, max: 150, step: 1, value: 75, digits: 0, hint: "교재: 보통 25–150 mm (p.152)" },
    N: { label: "스크루 회전수 N", unit: "rev/min", min: 6, max: 120, step: 1, value: 60, digits: 0, hint: "Example 8.1: 1 rev/s = 60 rev/min" },
    dc: { label: "채널 깊이 dc (계량부)", unit: "mm", min: 1, max: 15, step: 0.1, value: 6, digits: 1 },
    A: { label: "나선각 A", unit: "°", min: 10, max: 30, step: 0.5, value: 20, digits: 1 },
    p: { label: "헤드 압력 p", unit: "MPa", min: 0, max: 30, step: 0.1, value: 7, digits: 1, hint: "Example 8.1: 7.0 MPa" },
    L: { label: "배럴 길이 L", unit: "m", min: 0.5, max: 4, step: 0.05, value: 1.9, digits: 2 },
    eta: { label: "용융체 점도 η", unit: "Pa·s", min: 20, max: 1000, step: 5, value: 100, digits: 0 },
    Dd: { label: "다이 구멍 지름 Dd", unit: "mm", min: 2, max: 15, step: 0.1, value: 6.5, digits: 1, hint: "Example 8.2: 6.5 mm" },
    Ld: { label: "다이 랜드 길이 Ld", unit: "mm", min: 5, max: 60, step: 1, value: 20, digits: 0, hint: "Example 8.2: 20 mm" },
    rs: { label: "스웰 비 rs = Dx / Dd", unit: "", min: 1, max: 2, step: 0.01, value: 1.3, digits: 2, hint: "재료와 다이 길이에 따라 다름 (교재 값 없음, 예시)" },
  };

  function compute(p) {
    const D = p.D / 1000, dc = p.dc / 1000, N = p.N / 60, P = p.p * 1e6;
    const Qd = F.dragFlow(D, N, dc, p.A);
    const Qb = F.backFlow(P, D, dc, p.A, p.eta, p.L);
    const pmax = F.maxPressure(D, N, p.L, p.eta, dc, p.A);
    const Ks = F.dieShapeFactor(p.Dd / 1000, p.eta, p.Ld / 1000);
    const op = F.operatingPoint(Qd, pmax, Ks);
    const rad = (p.A * Math.PI) / 180;
    return {
      Qd, Qb, Qx: Qd - Qb, ratio: Qb / Qd, pmax, Ks, op,
      v: Math.PI * D * N * Math.cos(rad),            // Eq. 8.6 [m/s]
      w: Math.PI * D * Math.sin(rad),                // Eq. 8.9 [m]
      pitch: Math.PI * p.D * Math.tan(rad),          // Eq. 8.4 [mm]
      Dx: F.swellDiameter(p.Dd, p.rs),
    };
  }
  const cm3 = (q) => q * 1e6; // m³/s → cm³/s

  const terms = {
    hopper: "<b>호퍼 (hopper)</b> — 펠릿이나 분말 원료를 담아 중력으로 스크루에 떨어뜨린다. 다이 반대쪽 끝에 있다. (8.2.1, p.153)",
    barrel: "<b>배럴 (barrel)</b> — 안지름 25–150 mm, L/D 10–30. 전기 히터로 처음 녹이고, 이후에는 전단 발열이 녹은 상태를 유지한다. (8.2.1, pp.152–153)",
    feed: "<b>공급부 (feed section)</b> — 채널이 깊어 알갱이를 많이 받아들이고, 호퍼 쪽에서 앞으로 보내며 예열한다. (8.2.1, p.153–154)",
    compression: "<b>압축부 (compression section)</b> — 채널 깊이가 점점 얕아지며 고분자가 녹고, 갇힌 공기가 빠지고, 압축된다. (p.153–154)",
    metering: "<b>계량부 (metering section)</b> — 채널이 가장 얕다. 용융체를 균질하게 하고 다이로 밀어낼 압력을 만든다. 압출 해석의 dc 는 이 구간의 깊이다. (p.153–154)",
    screen: "<b>스크린 팩 + 브레이커 플레이트</b> — 이물을 거르고, 압력을 높이고, 스크루 회전으로 생긴 흐름의 '기억'을 지워 압출물이 비틀리지 않게 한다. (p.154)",
    die: "<b>다이 (die)</b> — 압출기의 부품이 아니라 제품 단면마다 따로 만드는 공구. 구멍 모양이 압출물 단면을 정한다. (8.2.1, p.152; 8.2.3, p.158)",
    screw: "<b>스크루 (screw)</b> — 나선 날개(flight) 사이 채널로 용융체를 민다. 피치는 보통 지름 D 와 비슷하고 tan A = p/(πD). (Fig. 8.5, Eq. 8.4, p.154)",
  };

  // ---------- 1단계: 압출기 구조 (애니메이션) ----------
  function drawExtruder(p, r, t, picked) {
    const pk = (k) => (picked === k ? "picked" : "");
    const x0 = 100, x1 = 660, cy = 250, R = 52;
    const z1 = x0 + (x1 - x0) / 3, z2 = x0 + (2 * (x1 - x0)) / 3;
    const root = (x) => (x < z1 ? 20 : x > z2 ? 40 : 20 + ((x - z1) / (z2 - z1)) * 20); // 뿌리 반지름 (채널 깊이 = R - root)
    let s = "";
    // 배럴 + 히터
    s += `<g data-term="barrel" class="${pk("barrel")}"><rect x="${x0 - 20}" y="${cy - R - 16}" width="${x1 - x0 + 40}" height="${2 * R + 32}" fill="url(#steel)" stroke="${D.INK}" stroke-width="1.5"/></g>`;
    for (let i = 0; i < 6; i++) {
      const hx = x0 + 20 + i * 90;
      s += `<rect x="${hx}" y="${cy - R - 26}" width="60" height="10" fill="#e8590c" opacity="0.75"/><rect x="${hx}" y="${cy + R + 16}" width="60" height="10" fill="#e8590c" opacity="0.75"/>`;
    }
    s += D.text(x0 + 290, cy - R - 34, "히터", { size: 11, fill: D.INK2, anchor: "middle" });
    // 채널 내부 재료: 공급부 알갱이 → 압축부 섞임 → 계량부 용융체
    s += `<rect x="${x0}" y="${cy - R}" width="${x1 - x0}" height="${2 * R}" fill="#fff"/>`;
    s += `<linearGradient id="meltx" x1="0" x2="1"><stop offset="0.33" stop-color="#fff"/><stop offset="0.66" stop-color="${D.POLY}"/></linearGradient>`;
    s += `<rect x="${x0}" y="${cy - R}" width="${x1 - x0}" height="${2 * R}" fill="url(#meltx)" opacity="0.85"/>`;
    const speed = (p.N / 60) * 60; // px/s : 1 rev/s 에 피치 하나(60 px)만큼 전진하는 것으로 표시
    const phase = (t * speed) % 60;
    const rnd = D.rng(7);
    for (let i = 0; i < 26; i++) {
      const bx = x0 + ((rnd() * (z2 - x0 + 40) + phase * 1.0) % (z2 - x0));
      const side = rnd() < 0.5 ? -1 : 1;
      const yy = cy + side * (root(bx) + 4 + rnd() * (R - root(bx) - 8));
      const melt = Math.max(0, (bx - z1) / (z2 - z1));
      s += `<circle cx="${bx}" cy="${yy}" r="${4 * (1 - melt * 0.8)}" fill="#f8f9fa" stroke="${D.INK2}" stroke-width="0.8"/>`;
    }
    // 스크루 뿌리
    s += `<g data-term="screw" class="${pk("screw")}"><path d="M${x0},${cy - 20} L${z1},${cy - 20} L${z2},${cy - 40} L${x1},${cy - 40} L${x1},${cy + 40} L${z2},${cy + 40} L${z1},${cy + 20} L${x0},${cy + 20} z" fill="#adb5bd" stroke="${D.INK}" stroke-width="1.2"/>`;
    // 나선 날개: 나선각 A 만큼 기울어진 막대가 회전에 따라 앞으로 이동
    const slant = 2 * R * Math.tan(((90 - p.A) * Math.PI) / 180) * 0.15;
    s += `<clipPath id="bar"><rect x="${x0}" y="${cy - R}" width="${x1 - x0}" height="${2 * R}"/></clipPath><g clip-path="url(#bar)">`;
    for (let x = x0 - 60 + phase; x < x1 + 60; x += 60) {
      s += `<path d="M${x},${cy - R} L${x + 7},${cy - R} L${x + 7 + slant},${cy + R} L${x + slant},${cy + R} z" fill="#868e96" stroke="${D.INK}" stroke-width="0.8"/>`;
    }
    s += `</g></g>`;
    // 구역 표시 (클릭 가능)
    [["feed", x0, z1, "공급부"], ["compression", z1, z2, "압축부"], ["metering", z2, x1, "계량부"]].forEach(([k, a, b, name]) => {
      s += `<g data-term="${k}" class="${pk(k)}"><rect x="${a + 2}" y="${cy + R + 34}" width="${b - a - 4}" height="26" rx="3" fill="${picked === k ? D.POLY : "#fff"}" stroke="${D.INK}"/>` +
        D.text((a + b) / 2, cy + R + 52, name, { anchor: "middle", size: 13, weight: 700, fill: picked === k ? "#fff" : D.INK }) + `</g>`;
    });
    s += D.text((x0 + x1) / 2, cy + R + 82, "채널 깊이: 깊음 → 점점 얕아짐 → 얕음 (dc)", { anchor: "middle", size: 11, fill: D.INK2 });
    // 호퍼
    s += `<g data-term="hopper" class="${pk("hopper")}"><path d="M${x0 + 10},${cy - R - 110} L${x0 + 110},${cy - R - 110} L${x0 + 75},${cy - R - 18} L${x0 + 45},${cy - R - 18} z" fill="#fff" stroke="${D.INK}" stroke-width="1.5"/>`;
    for (let i = 0; i < 14; i++) s += `<circle cx="${x0 + 30 + (i % 7) * 10}" cy="${cy - R - 95 + Math.floor(i / 7) * 10 + (i % 2) * 3}" r="4" fill="#f8f9fa" stroke="${D.INK2}" stroke-width="0.8"/>`;
    s += `</g>` + D.label(x0 + 60, cy - R - 120, "호퍼 (펠릿)", { anchor: "middle" });
    // 스크린 팩 + 다이
    s += `<g data-term="screen" class="${pk("screen")}"><rect x="${x1}" y="${cy - R}" width="10" height="${2 * R}" fill="#fff" stroke="${D.INK}"/>`;
    for (let y = cy - R + 6; y < cy + R; y += 10) s += `<line x1="${x1 + 2}" y1="${y}" x2="${x1 + 8}" y2="${y}" stroke="${D.INK}"/>`;
    s += `</g>`;
    s += `<g data-term="die" class="${pk("die")}"><path d="M${x1 + 20},${cy - R - 16} L${x1 + 70},${cy - R - 16} L${x1 + 70},${cy - 10} L${x1 + 100},${cy - 10} L${x1 + 100},${cy - R - 16} L${x1 + 110},${cy - R - 16} L${x1 + 110},${cy + R + 16} L${x1 + 100},${cy + R + 16} L${x1 + 100},${cy + 10} L${x1 + 70},${cy + 10} L${x1 + 70},${cy + R + 16} L${x1 + 20},${cy + R + 16} z" fill="url(#steel)" stroke="${D.INK}"/></g>`;
    s += `<path d="M${x1 + 10},${cy - R} L${x1 + 20},${cy - R} L${x1 + 70},${cy - 10} L${x1 + 100},${cy - 10} L${x1 + 100},${cy + 10} L${x1 + 70},${cy + 10} L${x1 + 20},${cy + R} L${x1 + 10},${cy + R} z" fill="${D.POLY}" opacity="0.85"/>`;
    s += `<rect x="${x1 + 100}" y="${cy - 13}" width="${790 - x1 - 100}" height="26" fill="${D.POLY}" stroke="${D.INK}" stroke-width="0.8"/>`;
    s += D.label(x1 + 60, cy - R - 26, "다이", { anchor: "middle" });
    s += D.label(x1 - 5, cy + R + 100, "스크린 팩", { anchor: "middle", size: 11 });
    s += D.arrow(x1 + 120, cy + 30, x1 + 135, cy + 30);
    s += D.text(400, 30, `회전 ${D.fmt(p.N, 0)} rev/min · 피치 ${D.fmt(r.pitch, 1)} mm · 나선각 ${D.fmt(p.A, 1)}°`, { anchor: "middle", size: 13, weight: 700 });
    s += D.text(400, 470, "구역 · 호퍼 · 배럴 · 스크루 · 다이를 누르면 역할이 표시된다", { anchor: "middle", size: 12, fill: D.INK2 });
    return s;
  }

  // ---------- 2·3단계: 평판 모델 속도 분포 ----------
  // u/v = ξ − 3r·ξ(1−ξ),  r = Qb/Qd  (평판 사이 드래그 유동 + 압력 유동 중첩)
  function profile(p, r, t, withBack) {
    const rr = withBack ? r.ratio : 0;
    const x0 = 200, x1 = 740, yTop = 70, yBot = 250, H = yBot - yTop;
    const scale = 180;
    let s = "";
    s += `<rect x="${x0}" y="${yTop - 18}" width="${x1 - x0}" height="18" fill="url(#steel)" stroke="${D.INK}"/>`;
    s += `<rect x="${x0}" y="${yBot}" width="${x1 - x0}" height="18" fill="#adb5bd" stroke="${D.INK}"/>`;
    s += `<rect x="${x0}" y="${yTop}" width="${x1 - x0}" height="${H}" fill="${D.POLY}" opacity="0.18"/>`;
    s += D.text(x0 - 8, yTop - 4, "배럴 (상대적으로 움직이는 판)", { anchor: "end", size: 11 });
    s += D.text(x0 - 8, yBot + 14, "스크루 채널 바닥 (정지)", { anchor: "end", size: 11 });
    s += D.arrow(x1 - 120, yTop - 30, x1 - 20, yTop - 30, { width: 2 });
    s += D.text(x1 - 70, yTop - 42, `v = πDN cosA = ${D.fmt(r.v * 1000, 1)} mm/s`, { anchor: "middle", size: 12, weight: 700 });
    s += D.dim(x0 + 12, yTop, x0 + 12, yBot, `dc = ${D.fmt(p.dc, 1)} mm`, { dx: 46 });

    // 속도 화살표와 분포 곡선
    const ax = 310;
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const xi = i / 10;
      // 역류가 아주 크면 화살표가 채널 밖으로 나가지 않게 자른다
      const u = Math.max((x0 + 6 - ax) / scale, xi - 3 * rr * xi * (1 - xi));
      const y = yBot - xi * H;
      pts.push(`${ax + u * scale},${y}`);
      if (i > 0 && i < 10 && Math.abs(u) > 0.02) s += D.arrow(ax, y, ax + u * scale, y, { width: 1.3, color: u < 0 ? "#b42318" : D.INK });
    }
    s += `<line x1="${ax}" y1="${yTop}" x2="${ax}" y2="${yBot}" stroke="${D.INK}" stroke-width="1"/>`;
    s += `<polyline points="${pts.join(" ")}" fill="none" stroke="${D.POLY}" stroke-width="3"/>`;
    if (withBack) {
      // 드래그만 있을 때 분포(점선) 비교
      s += `<line x1="${ax}" y1="${yBot}" x2="${ax + scale}" y2="${yTop}" stroke="${D.INK2}" stroke-dasharray="5 4"/>`;
      s += D.text(ax + scale + 6, yTop + 16, "드래그만", { size: 11, fill: D.INK2 });
    }

    // 추적 입자: 각 높이에서 u 로 이동
    // 추적 입자는 화살표와 겹치지 않게 x = 470 ~ 670 구간에서만 움직인다
    const tx0 = 530, W = x1 - 10 - tx0;
    for (let i = 1; i < 10; i++) {
      const xi = i / 10;
      const u = xi - 3 * rr * xi * (1 - xi);
      const off = (((t * u * 80) % W) + W) % W;
      for (let k = 0; k < 2; k++) {
        const px = tx0 + ((off + (k * W) / 2) % W);
        s += `<circle cx="${px}" cy="${yBot - xi * H}" r="3.5" fill="${D.INK}" opacity="0.65"/>`;
      }
    }
    s += D.text(630, yBot + 40, "점: 같은 높이 용융체의 이동", { anchor: "middle", size: 11, fill: D.INK2 });
    return s;
  }

  function drawDrag(p, r, t) {
    let s = profile(p, r, t, false);
    // 채널 단면과 유량
    s += D.text(400, 345, `Qd = 0.5 v dc w = 0.5 π² D² N dc sinA cosA`, { anchor: "middle", size: 15, weight: 700 });
    s += D.text(400, 375, `w = πD sinA = ${D.fmt(r.w * 1000, 1)} mm  ·  평균 속도 = v/2`, { anchor: "middle", size: 13 });
    s += D.label(400, 425, `Qd = ${D.fmt(cm3(r.Qd), 2)} cm³/s`, { anchor: "middle", size: 18, weight: 700 });
    return s;
  }

  function drawBack(p, r, t) {
    let s = profile(p, r, t, true);
    // Fig. 8.6: 배럴 길이에 따른 압력 (직선 근사)
    const ch = D.chart({ x: 140, y: 320, w: 300, h: 110 }, {
      xMin: 0, xMax: p.L, yMin: 0, yMax: Math.max(1, p.p * 1.2),
      xLabel: "배럴 위치 (m)", yLabel: "압력 (MPa)",
      xTicks: [0, +(p.L / 2).toFixed(2), +p.L.toFixed(2)], yTicks: [0, +p.p.toFixed(1)],
      series: [{ pts: [[0, 0], [p.L * 0.35, p.p * 0.18], [p.L * 0.8, p.p * 0.82], [p.L, p.p]], color: D.POLY }, { pts: [[0, 0], [p.L, p.p]], color: D.INK2, dash: "5 4", width: 1.5 }],
    });
    s += ch.svg;
    s += D.text(150, 336, "실선: 실제 형태(개념), 점선: 직선 근사 p/L", { size: 11, fill: D.INK2 });
    const x = 600;
    s += D.text(x, 340, `Qd = ${D.fmt(cm3(r.Qd), 2)} cm³/s`, { anchor: "middle", size: 14 });
    s += D.text(x, 366, `− Qb = ${D.fmt(cm3(r.Qb), 2)} cm³/s`, { anchor: "middle", size: 14, fill: "#b42318" });
    s += `<line x1="${x - 90}" y1="378" x2="${x + 90}" y2="378" stroke="${D.INK}"/>`;
    s += D.label(x, 404, `Qx = ${D.fmt(cm3(r.Qx), 2)} cm³/s`, { anchor: "middle", size: 17, weight: 700 });
    return s;
  }

  // ---------- 4단계: 운전점 ----------
  function drawOperating(p, r) {
    const Qm = cm3(r.Qd), pm = r.pmax / 1e6;
    const pOp = r.op.p / 1e6, qOp = cm3(r.op.Q);
    const xMax = pm * 1.08, yMax = Qm * 1.15;
    const ks = cm3(r.Ks) * 1e6; // cm³/s per MPa
    const pDieEnd = Math.min(xMax, yMax / ks);
    const ch = D.chart({ x: 110, y: 40, w: 420, h: 350 }, {
      xMin: 0, xMax, yMin: 0, yMax,
      xLabel: "헤드 압력 p (MPa)", yLabel: "유량 Qx (cm³/s)",
      xTicks: [0, pm / 2, pm].map((v) => +v.toFixed(2)), yTicks: [0, Qm / 2, Qm].map((v) => +v.toFixed(1)),
      fmtX: (v) => D.fmt(v, 1), fmtY: (v) => D.fmt(v, 1),
      series: [{ pts: [[0, Qm], [pm, 0]], color: D.INK }, { pts: [[0, 0], [pDieEnd, ks * pDieEnd]], color: D.POLY }],
    });
    let s = ch.svg;
    s += D.label(ch.sx(0) + 8, ch.sy(Qm) - 10, `Qmax ${D.fmt(Qm, 1)}`, { size: 11 });
    s += D.label(ch.sx(pm), ch.sy(0) - 14, `pmax ${D.fmt(pm, 1)}`, { size: 11, anchor: "end" });
    s += D.text(ch.sx(pm * 0.55), ch.sy(Qm * 0.45) - 8, "압출기 특성 (Eq. 8.18)", { size: 12, weight: 700 });
    s += D.text(ch.sx(pDieEnd * 0.5) + 8, ch.sy(ks * pDieEnd * 0.5) + 18, "다이 특성 Qx = Ks·p", { size: 12, weight: 700, fill: "#1864ab" });
    s += `<line x1="${ch.sx(pOp)}" y1="${ch.sy(qOp)}" x2="${ch.sx(pOp)}" y2="${ch.sy(0)}" stroke="${D.INK2}" stroke-dasharray="3 3"/>`;
    s += `<line x1="${ch.sx(0)}" y1="${ch.sy(qOp)}" x2="${ch.sx(pOp)}" y2="${ch.sy(qOp)}" stroke="${D.INK2}" stroke-dasharray="3 3"/>`;
    s += `<circle cx="${ch.sx(pOp)}" cy="${ch.sy(qOp)}" r="8" fill="#e8590c" stroke="#fff" stroke-width="2"/>`;
    s += D.label(ch.sx(pOp) + 14, ch.sy(qOp) - 14, `운전점 (${D.fmt(pOp, 2)} MPa, ${D.fmt(qOp, 2)} cm³/s)`, { size: 12, weight: 700 });

    // 다이 단면 (Dd, Ld 를 비례로)
    const k = 6;
    const dh = p.Dd * k, dl = p.Ld * 2.2;
    const cx = 680, cy = 220;
    s += D.text(cx, 90, "원형 다이 단면", { anchor: "middle", size: 13, weight: 700 });
    s += `<path d="M${cx - 70},${cy - 70} L${cx - dl / 2 - 20},${cy - 70} L${cx - dl / 2},${cy - dh / 2} L${cx + dl / 2},${cy - dh / 2} L${cx + dl / 2},${cy - 70} L${cx + 70},${cy - 70} L${cx + 70},${cy - 100} L${cx - 70},${cy - 100} z" fill="url(#steel)" stroke="${D.INK}"/>`;
    s += `<path d="M${cx - 70},${cy + 70} L${cx - dl / 2 - 20},${cy + 70} L${cx - dl / 2},${cy + dh / 2} L${cx + dl / 2},${cy + dh / 2} L${cx + dl / 2},${cy + 70} L${cx + 70},${cy + 70} L${cx + 70},${cy + 100} L${cx - 70},${cy + 100} z" fill="url(#steel)" stroke="${D.INK}"/>`;
    s += `<path d="M${cx - 70},${cy - 70} L${cx - dl / 2 - 20},${cy - 70} L${cx - dl / 2},${cy - dh / 2} L${cx + dl / 2},${cy - dh / 2} L${cx + dl / 2},${cy + dh / 2} L${cx - dl / 2},${cy + dh / 2} L${cx - dl / 2 - 20},${cy + 70} L${cx - 70},${cy + 70} z" fill="${D.POLY}" opacity="0.6"/>`;
    s += D.dim(cx - dl / 2, cy + 125, cx + dl / 2, cy + 125, `Ld ${D.fmt(p.Ld, 0)} mm`);
    s += D.text(cx, cy + 165, `Dd ${D.fmt(p.Dd, 1)} mm`, { anchor: "middle", size: 12, weight: 700 });
    s += D.text(cx, cy + 186, `Ks = ${r.Ks.toExponential(2)} m⁵/(N·s)`, { anchor: "middle", size: 12 });
    return s;
  }

  // ---------- 5단계: 다이 스웰 ----------
  function drawSwell(p, r, t) {
    const k = Math.min(14, 220 / r.Dx), cy = 200;
    const dd = p.Dd * k, dx = r.Dx * k;
    const exitX = 300;
    let s = "";
    s += `<path d="M60,${cy - 130} L180,${cy - 130} L${exitX - 100},${cy - dd / 2} L${exitX},${cy - dd / 2} L${exitX},${cy - 150} L60,${cy - 150} z" fill="url(#steel)" stroke="${D.INK}"/>`;
    s += `<path d="M60,${cy + 130} L180,${cy + 130} L${exitX - 100},${cy + dd / 2} L${exitX},${cy + dd / 2} L${exitX},${cy + 150} L60,${cy + 150} z" fill="url(#steel)" stroke="${D.INK}"/>`;
    // 용융체: 다이 안 → 출구에서 부풂
    const grow = 40;
    s += `<path d="M60,${cy - 130} L180,${cy - 130} L${exitX - 100},${cy - dd / 2} L${exitX},${cy - dd / 2} C${exitX + grow * 0.5},${cy - dd / 2} ${exitX + grow * 0.6},${cy - dx / 2} ${exitX + grow},${cy - dx / 2} L760,${cy - dx / 2} L760,${cy + dx / 2} L${exitX + grow},${cy + dx / 2} C${exitX + grow * 0.6},${cy + dx / 2} ${exitX + grow * 0.5},${cy + dd / 2} ${exitX},${cy + dd / 2} L${exitX - 100},${cy + dd / 2} L180,${cy + 130} L60,${cy + 130} z" fill="${D.POLY}" opacity="0.75" stroke="${D.INK}" stroke-width="0.8"/>`;
    // 흐름 표시 줄무늬
    for (let i = 0; i < 6; i++) {
      const x = exitX + 60 + ((t * 40 + i * 70) % 400);
      if (x < 750) s += `<line x1="${x}" y1="${cy - dx / 2 + 4}" x2="${x}" y2="${cy + dx / 2 - 4}" stroke="#fff" stroke-width="1.5" opacity="0.7"/>`;
    }
    s += D.dim(exitX - 20, cy - dd / 2, exitX - 20, cy + dd / 2, `Dd ${D.fmt(p.Dd, 1)}`, { dx: -40 });
    s += D.dim(560, cy - dx / 2, 560, cy + dx / 2, `Dx ${D.fmt(r.Dx, 2)} mm`, { dx: 50 });
    s += D.text(exitX, cy + 175, "다이 출구", { anchor: "middle", size: 12 });
    // 정면도 비교
    // 정면도: 압출물 반지름을 55 px 로 고정해 비교
    const fx = 700, fy = 400, fr = 55;
    s += `<circle cx="${fx}" cy="${fy}" r="${fr}" fill="${D.POLY}" opacity="0.5" stroke="${D.INK}"/>`;
    s += `<circle cx="${fx}" cy="${fy}" r="${fr / p.rs}" fill="none" stroke="${D.INK}" stroke-dasharray="4 3" stroke-width="1.5"/>`;
    s += D.text(fx - fr - 14, fy - 4, "정면: 점선 = 다이 구멍, 채움 = 압출물", { size: 12, anchor: "end" });
    s += D.text(fx - fr - 14, fy + 16, `단면적 ${D.fmt(r.Dx ** 2 / p.Dd ** 2, 2)}배`, { size: 12, weight: 700, anchor: "end" });
    s += D.text(400, 30, "출구를 벗어난 용융체가 좁은 다이에 들어가기 전 모양을 '기억'해 부푼다", { anchor: "middle", size: 13 });
    return s;
  }

  window.PROCESSES = window.PROCESSES || [];
  window.PROCESSES.push({
    id: "extrusion", color: "#1971c2", name: "플라스틱 압출", en: "Polymer extrusion", chapter: "8.1–8.2절",
    params, compute, terms,
    steps: [
      {
        title: "압출기 구조와 스크루의 세 구역", short: "압출기 구조", params: ["N", "A", "D"], draw: drawExtruder, animated: true,
        cites: [
          "8.2.1 Process and Equipment, pp.152–154, Fig. 8.4 (압출기 구성), Fig. 8.5 (스크루 상세)",
          "Eq. (8.4) 나선각, p.154",
        ],
        formulas: [["tan A = p / (πD)", "Eq. (8.4), p = 피치"]],
        phenomenon: "호퍼의 펠릿이 회전하는 스크루를 따라 배럴 안을 이동한다. 공급부에서 예열되고, 채널이 얕아지는 압축부에서 녹으며 공기가 빠지고, 가장 얕은 계량부에서 균질해지고 압력이 올라 스크린 팩을 지나 다이로 밀려난다.",
        variables: ["N: 스크루 회전수 (교재: 약 60 rev/min)", "D: 배럴 안지름 (25–150 mm)", "A: 나선각, 피치 p ≈ D 일 때 약 17.7°", "dc: 채널 깊이 (구역마다 다름)"],
        assumptions: ["세 구역의 길이를 같게 그렸다 — 교재는 LDPE 처럼 서서히 녹는 재료에 맞다고 설명 (p.154).", "날개가 한 바퀴에 피치 하나만큼 전진하는 것으로 애니메이션을 그렸다."],
        limits: ["L/D 비(10–30)는 그림에서 줄였다 (교재 Fig. 8.4 도 같음).", "나일론(짧은 압축부), PVC(긴 압축부) 같은 재료별 스크루는 다루지 않는다."],
        readout: (p, r) => [
          ["피치 p = πD tanA", D.fmt(r.pitch, 1), "mm", "Eq. 8.4", true],
          ["피치 / 지름", D.fmt(r.pitch / p.D, 2), "", "보통 1 에 가까움"],
          ["회전수", D.fmt(p.N / 60, 2), "rev/s"],
        ],
        alerts: (p, r) => Math.abs(r.pitch / p.D - 1) > 0.35 ? [{ level: "warn", text: `피치가 지름의 ${D.fmt(r.pitch / p.D, 2)}배다. 교재는 피치가 보통 D 에 가깝다고 한다 (p.154).` }] : [],
      },
      {
        title: "드래그 유동", short: "드래그 유동", params: ["D", "N", "dc", "A"], draw: drawDrag, animated: true,
        cites: [
          "8.2.2 Analysis of Extrusion — Melt Flow in the Extruder, pp.154–155",
          "Eq. (8.5)–(8.10), 평판 모델은 Fig. 3.17 참조",
        ],
        formulas: [
          ["Qd = 0.5 v d w", "Eq. (8.5)"],
          ["v = πDN cosA,  d = dc,  w = πD sinA", "Eq. (8.6), (8.7), (8.9)"],
          ["Qd = 0.5 π² D² N dc sinA cosA", "Eq. (8.10)"],
        ],
        phenomenon: "용융체는 정지한 배럴 면과 회전하는 스크루 채널 사이의 마찰로 끌려간다(드래그 유동). 두 평판 사이 점성 유체처럼 속도가 바닥 0 에서 위 v 까지 직선으로 분포하므로 평균 속도는 v/2 다.",
        variables: ["D: 스크루 지름 (m)", "N: 회전수 (rev/s)", "dc: 채널 깊이 (m)", "A: 나선각"],
        assumptions: ["날개 랜드 폭 wf 는 무시 (Eq. 8.8 → 8.9).", "배럴 압력이 없는 경우 — 이 값이 최대 유량 Qmax (Eq. 8.14)."],
        limits: ["채널의 곡률과 옆벽 효과는 무시한 평판 근사다."],
        readout: (p, r) => [
          ["배럴 상대 속도 v", D.fmt(r.v * 1000, 1), "mm/s", "Eq. 8.6"],
          ["채널 폭 w", D.fmt(r.w * 1000, 1), "mm", "Eq. 8.9"],
          ["드래그 유량 Qd", D.fmt(cm3(r.Qd), 2), "cm³/s", "Eq. 8.10", true],
        ],
        alerts: () => [{ level: "ok", text: "검증: D 75 mm, N 1 rev/s, dc 6 mm, A 20° → Qd = 53.5 cm³/s (Example 8.1: 53,525 × 10⁻⁹ m³/s)." }],
      },
      {
        title: "역압 유동과 실제 유량", short: "역압 유동", params: ["p", "eta", "L"], draw: drawBack, animated: true,
        cites: [
          "8.2.2 Analysis of Extrusion, pp.155–156, Eq. (8.11)–(8.13)",
          "Fig. 8.6 배럴 압력 분포, p.156 · Example 8.1, p.156",
        ],
        formulas: [
          ["Qb = p π D dc³ sin²A / (12 η L)", "Eq. (8.12)"],
          ["Qx = Qd − Qb", "Eq. (8.13)"],
        ],
        phenomenon: "다이로 용융체를 밀어 넣으려면 배럴 끝에 압력이 생기고, 이 압력이 드래그 유동을 거꾸로 밀어낸다. 역압 유동은 실제로 따로 흐르는 흐름이 아니라 드래그 유동의 감소분이다. 역압이 크면 채널 바닥 근처에서는 용융체가 뒤로 흐른다(빨간 화살표).",
        variables: ["p: 헤드 압력 (Pa)", "η: 용융체 점도 (Pa·s)", "L: 배럴 길이 (m)", "dc³ 에 비례 — 채널 깊이가 가장 민감"],
        assumptions: ["압력 기울기를 직선 p/L 로 근사 (Fig. 8.6 점선).", "날개와 배럴 틈 누설 유동은 무시 (마모가 심하지 않은 압출기).", "점도는 일정 (실제 고분자는 전단률·온도에 따라 바뀜, Eq. 8.2)."],
        limits: ["속도 분포 그림은 평판 사이 뉴턴 유체의 드래그 + 압력 유동 중첩이다.", "점도의 온도 의존(Fig. 8.2)은 슬라이더로 직접 바꿔야 한다."],
        readout: (p, r) => [
          ["드래그 유량 Qd", D.fmt(cm3(r.Qd), 2), "cm³/s"],
          ["역압 유량 Qb", D.fmt(cm3(r.Qb), 2), "cm³/s", "Eq. 8.12"],
          ["실제 유량 Qx", D.fmt(cm3(r.Qx), 2), "cm³/s", "Eq. 8.13", true],
          ["Qb / Qd", D.fmt(r.ratio, 3), ""],
        ],
        alerts: (p, r) => {
          if (r.Qx < 0) return [{ level: "error", text: `헤드 압력 ${D.fmt(p.p, 1)} MPa 가 최대 압력 pmax ${D.fmt(r.pmax / 1e6, 2)} MPa 를 넘었다. 이 조건에서는 압출되지 않는다 (Qx < 0 은 물리적으로 의미 없음). 압력을 낮추거나 회전수를 높여라.` }];
          const a = [];
          if (r.ratio > 1 / 3) a.push({ level: "warn", text: "Qb/Qd > 1/3 이라 채널 바닥 근처 용융체가 뒤로 흐른다(빨간 화살표). 1/3 을 조금 넘으면 역류는 아주 작다." });
          a.push({ level: "ok", text: "검증: 기본값에서 Qb = 18.28 cm³/s, Qx = 35.25 cm³/s (Example 8.1 과 일치)." });
          return a;
        },
      },
      {
        title: "압출기 특성과 다이 특성: 운전점", short: "운전점", params: ["Dd", "Ld", "N", "eta"], draw: drawOperating,
        cites: [
          "8.2.2 Extruder and Die Characteristics, pp.156–157, Eq. (8.14)–(8.17)",
          "Fig. 8.7 운전점, p.157 · Example 8.2, p.158, Eq. (8.18)",
        ],
        formulas: [
          ["Qmax = 0.5 π² D² N dc sinA cosA", "Eq. (8.14)"],
          ["pmax = 6π D N L η cotA / dc²", "Eq. (8.15)"],
          ["Qx = Ks p,  Ks = π Dd⁴ / (128 η Ld)", "Eq. (8.16), (8.17)"],
        ],
        phenomenon: "압출기는 압력이 0 이면 Qmax, 압력이 pmax 이면 0 을 내보내는 직선 특성을 갖는다. 다이는 압력이 클수록 많이 흘리는 직선 특성을 갖는다. 두 직선의 교점이 실제로 운전되는 압력과 유량이다. 다이 구멍이 크면(Ks↑) 압력은 낮고 유량은 Qmax 에 가까워진다.",
        variables: ["Dd: 다이 구멍 지름 — Ks 가 Dd⁴ 에 비례해 가장 민감", "Ld: 다이 랜드 길이", "N, η: 압출기 직선과 다이 직선을 함께 움직인다"],
        assumptions: ["원형 다이 (Eq. 8.17). 원형이 아니면 같은 면적이라도 Ks 가 더 작다 (p.157).", "압출기 특성은 직선 (Eq. 8.18)."],
        limits: ["η 는 압출기와 다이에서 같다고 본다.", "다이 입구의 수축 손실, 다이 스웰은 이 계산에 들어가지 않는다."],
        readout: (p, r) => [
          ["Qmax", D.fmt(cm3(r.Qd), 2), "cm³/s", "Eq. 8.14"],
          ["pmax", D.fmt(r.pmax / 1e6, 2), "MPa", "Eq. 8.15"],
          ["다이 형상 계수 Ks", r.Ks.toExponential(3), "m⁵/N·s", "Eq. 8.17"],
          ["운전 압력 p", D.fmt(r.op.p / 1e6, 3), "MPa", "교점", true],
          ["운전 유량 Qx", D.fmt(cm3(r.op.Q), 2), "cm³/s", "교점", true],
        ],
        alerts: (p, r) => {
          const a = [];
          if (r.op.p / r.pmax > 0.9) a.push({ level: "warn", text: "운전점이 pmax 에 가깝다. 다이가 너무 좁아 유량이 거의 나오지 않는다." });
          a.push({ level: "ok", text: "검증: 기본값에서 p = 2.18 MPa, Qx = 47.8 cm³/s (Example 8.2: 2.184 MPa, 47.82 × 10⁻⁶ m³/s)." });
          return a;
        },
      },
      {
        title: "다이 스웰과 압출물", short: "다이 스웰", params: ["rs", "Dd"], draw: drawSwell, animated: true,
        cites: [
          "8.1 Viscoelasticity, pp.151–152, Fig. 8.3, Eq. (8.3)",
          "8.2.3 Die Configurations, pp.158–159, Fig. 8.8, 8.9",
        ],
        formulas: [["rs = Dx / Dd", "Eq. (8.3) 스웰 비"]],
        phenomenon: "고분자 용융체는 점탄성이 있어, 넓은 배럴에서 좁은 다이로 들어갈 때 받은 압축 응력이 바로 풀리지 않는다. 다이를 빠져나와 구속이 사라지면 그 응력 때문에 단면이 커진다. 다이 랜드를 길게 하면 머무는 시간이 늘어 스웰이 줄어든다.",
        variables: ["rs: 스웰 비 (재료에 따라 다름)", "Dd: 다이 구멍 지름", "Dx: 압출물 지름"],
        assumptions: ["원형 단면 (Eq. 8.3 은 원형에서 가장 쉽게 잰다).", "rs 기본값 1.3 은 교재 값이 아닌 예시다."],
        limits: ["rs 를 Ld, 재료로부터 예측하는 식은 교재에 없어 직접 입력한다.", "사각 단면의 형상 보정(Fig. 8.9), 멜트 프랙처·샤크스킨(8.2.4)은 설명만 한다."],
        readout: (p, r) => [
          ["압출물 지름 Dx = rs·Dd", D.fmt(r.Dx, 2), "mm", "Eq. 8.3", true],
          ["지름 증가", D.fmt((p.rs - 1) * 100, 0), "%"],
        ],
        alerts: () => [{ level: "ok", text: "다이 스웰 보정: 다이 구멍을 원하는 단면보다 작게 하거나 다이를 길게 하고, 압출물을 당겨(drawing) 늘린다 (p.159)." }],
      },
    ],
  });
})();
