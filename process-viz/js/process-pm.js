// 공정 3: 분말 야금 — 교재 10장(10.2 기본 압축·소결), 부록 A10(분말의 특성)
(function () {
  // Table 3.10 (p.72) 진밀도·녹는점, Table 10.1 (p.224) 소결 온도·시간, 10.2.2 압축 압력
  const MATS = [
    { label: "철 (Iron)", rho: 7.87, Tm: 1539, sinter: 1100, time: "30 min", pc: "약 700 MPa (철·강)" },
    { label: "구리 (Copper)", rho: 8.97, Tm: 1083, sinter: 850, time: "25 min", pc: "교재 값 없음" },
    { label: "알루미늄 (Aluminum)", rho: 2.70, Tm: 660, sinter: null, time: null, pc: "약 70 MPa" },
    { label: "텅스텐 (Tungsten)", rho: 19.30, Tm: 3410, sinter: 2300, time: "480 min", pc: "교재 값 없음" },
  ];
  const PRESS_KN = 450; // Fig. 10.8 의 450 kN(50 ton) 유압 프레스
  const STAGES = ["① 다이 채우기", "② 압축 시작", "③ 압축 끝", "④ 꺼내기"];
  const NECK = ["① 접촉점 결합 시작", "② 넥 성장", "③ 기공 축소", "④ 입계 형성"];

  const params = {
    MC: { label: "체 메시 수 MC", unit: "개/in", min: 50, max: 400, step: 5, value: 200, digits: 0, hint: "체 눈 수 (1 inch 당). 400 정도가 체의 실용 한계 (p.234)" },
    tw: { label: "체 철사 굵기 tw", unit: "in", min: 0.0005, max: 0.004, step: 0.0001, value: 0.001, digits: 4 },
    mat: { label: "분말 재료 (Table 3.10)", type: "select", options: MATS, value: 0 },
    bulk: { label: "겉보기 밀도 (부어 놓은 상태)", unit: "g/cm³", min: 0.5, max: 20, step: 0.05, value: 4.72, digits: 2 },
    fill: { label: "혼합 용기 채움 비율", unit: "%", min: 5, max: 90, step: 1, value: 30, digits: 0, hint: "교재: 20–40% 일 때 결과가 가장 좋다 (p.220)" },
    fine: { label: "작은 입자 비율", unit: "%", min: 0, max: 50, step: 1, value: 25, digits: 0 },
    Do: { label: "부싱 바깥지름 Do", unit: "mm", min: 10, max: 80, step: 1, value: 30, digits: 0 },
    Di: { label: "부싱 안지름 Di", unit: "mm", min: 0, max: 70, step: 1, value: 15, digits: 0 },
    pc: { label: "압축 압력 pc", unit: "MPa", min: 50, max: 800, step: 10, value: 400, digits: 0, hint: "교재: 알루미늄 70 MPa ~ 철·강 700 MPa (p.222)" },
    stroke: { label: "프레스 단계 (Fig. 10.6)", unit: "", min: 0, max: 3, step: 1, value: 2, digits: 0, names: STAGES },
    T: { label: "소결 온도", unit: "°C", min: 300, max: 3500, step: 10, value: 1100, digits: 0 },
    neck: { label: "소결 진행 (Fig. 10.9)", unit: "", min: 0, max: 3, step: 1, value: 1, digits: 0, names: NECK },
  };

  function compute(p) {
    const m = MATS[p.mat];
    const PSin = F.particleSize(p.MC, p.tw);
    const pk = F.packing(p.bulk, m.rho);
    const Ap = F.bushingArea(p.Do, p.Di);
    const Fn = F.pressForce(Ap, p.pc);
    return {
      m, PSin, PSum: PSin * 25400, ...pk,
      Ap, FkN: Fn / 1000, Ft: Fn / 9810, // 1 metric ton = 9.81 kN
      hom: F.homologous(p.T, m.Tm),
      homTable: m.sinter ? F.homologous(m.sinter, m.Tm) : null,
    };
  }

  // ---------- 1단계: 분말 특성 ----------
  function drawPowder(p, r) {
    let s = "";
    // 체 단면: 철사 단면(원) 사이 구멍 = PS
    // 눈 간격(1/MC)을 항상 100 px 로 맞춘 확대도 → 철사 굵기와 구멍의 비율이 보인다
    const pitch = 100, k = pitch * p.MC; // px/in
    const wire = Math.min(pitch * 1.4, Math.max(3, p.tw * k));
    const open = Math.max(0, r.PSin * k);
    const y = 250, x0 = 70;
    s += D.text(220, 60, "체 단면 확대 (Fig. A10.1)", { anchor: "middle", size: 14, weight: 700 });
    s += D.text(220, 80, "눈 간격 1/MC 를 같은 길이로 맞춰 그림", { anchor: "middle", size: 11, fill: D.INK2 });
    for (let i = 0; i < 4; i++) s += `<circle cx="${x0 + i * pitch}" cy="${y}" r="${wire / 2}" fill="#495057"/>`;
    s += D.dim(x0, y + 60, x0 + pitch, y + 60, `1/MC = ${D.fmt(1 / p.MC, 4)} in`, { dy: 22 });
    if (open > 0) {
      s += D.dim(x0 + pitch + wire / 2, y - 60, x0 + 2 * pitch - wire / 2, y - 60, `PS ${D.fmt(r.PSum, 0)} µm`, { dy: -8 });
      // 구멍보다 작은 입자는 통과, 큰 입자는 걸린다
      const cx = x0 + pitch * 2.5, rs = open * 0.4;
      s += `<circle cx="${cx}" cy="${y - 90}" r="${rs}" fill="${D.POWDER}" stroke="${D.INK}"/>`;
      s += D.arrow(cx, y - 90 + rs + 4, cx, y + 50);
      s += D.text(cx, y + 70, "통과", { size: 11, anchor: "middle", fill: D.INK2 });
      const big = Math.min(pitch * 0.62, open * 0.62 + 4);
      const cx2 = x0 + pitch * 0.5;
      s += `<circle cx="${cx2}" cy="${y - big}" r="${big}" fill="${D.POWDER}" stroke="${D.INK}" opacity="0.8"/>`;
      s += D.text(cx2, y - 2 * big - 8, "걸림", { size: 11, anchor: "middle", fill: D.INK2 });
    } else {
      s += D.label(220, y - 90, "구멍이 없다: tw ≥ 1/MC", { anchor: "middle" });
    }

    // 오른쪽: 부어 놓은 분말 (충전율 만큼 점이 찬다)
    const bx = 450, by = 90, bw = 160, bh = 260;
    s += D.text(bx + bw / 2, 60, "부어 놓은 분말", { anchor: "middle", size: 14, weight: 700 });
    s += `<path d="M${bx},${by} L${bx},${by + bh} L${bx + bw},${by + bh} L${bx + bw},${by}" fill="#fff" stroke="${D.INK}" stroke-width="2"/>`;
    const pf = Math.max(0, Math.min(1, r.packingFactor));
    const rnd = D.rng(11);
    const R = 7;
    const n = Math.round((pf * bw * (bh - 30)) / (Math.PI * R * R));
    for (let i = 0; i < n; i++) {
      s += `<circle cx="${bx + R + rnd() * (bw - 2 * R)}" cy="${by + 30 + R + rnd() * (bh - 30 - 2 * R)}" r="${R}" fill="${D.POWDER}" stroke="#7a5426" stroke-width="0.6"/>`;
    }
    // 밀도 막대
    const gx = 660, gh = 260, gy = 90;
    const rhoMax = Math.max(r.m.rho, p.bulk) * 1.05;
    const bar = (xx, val, c, name) =>
      `<rect x="${xx}" y="${gy + gh - (val / rhoMax) * gh}" width="40" height="${(val / rhoMax) * gh}" fill="${c}"/>` +
      D.text(xx + 20, gy + gh + 18, name, { anchor: "middle", size: 11 }) +
      D.text(xx + 20, gy + gh - (val / rhoMax) * gh - 6, D.fmt(val, 2), { anchor: "middle", size: 11, weight: 700 });
    s += bar(gx, r.m.rho, "#495057", "진밀도");
    s += bar(gx + 56, p.bulk, D.POWDER, "겉보기");
    s += D.text(gx + 48, 60, "g/cm³", { anchor: "middle", size: 12, fill: D.INK2 });
    s += D.label(530, 410, `충전율 ${D.fmt(r.packingFactor, 3)}  +  기공률 ${D.fmt(r.porosity, 3)}  =  1`, { anchor: "middle", size: 15, weight: 700 });
    return s;
  }

  // ---------- 2단계: 블렌딩 (회전 드럼) ----------
  function drawBlend(p, r, t) {
    const cx = 230, cy = 240, R = 150;
    const ang = (t * 40) % 360;
    let s = "";
    s += `<circle cx="${cx}" cy="${cy}" r="${R + 10}" fill="url(#steel)" stroke="${D.INK}" stroke-width="2"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#fff"/>`;
    // 채움 높이: 원의 활꼴 면적 비 = fill
    const f = p.fill / 100;
    let lo = -R, hi = R;
    for (let i = 0; i < 40; i++) {
      const hgt = (lo + hi) / 2; // 바닥에서 위로 수위 (cy + R - (hgt + R))
      const d = -hgt; // 중심에서 수면까지 (아래쪽 +)
      const seg = R * R * Math.acos(Math.max(-1, Math.min(1, d / R))) - d * Math.sqrt(Math.max(0, R * R - d * d));
      if (seg / (Math.PI * R * R) < f) lo = hgt; else hi = hgt;
    }
    const level = cy - lo;
    // 회전하는 드럼에서는 분말 면이 기울어진다(안식각 개념) — 30° 기울여 표시
    s += `<clipPath id="drum"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>`;
    s += `<g clip-path="url(#drum)"><g transform="rotate(-25 ${cx} ${level})">`;
    const rnd = D.rng(3);
    s += `<rect x="${cx - R * 1.5}" y="${level}" width="${R * 3}" height="${R * 2.5}" fill="#e3c99d"/>`;
    const nBig = 220, nFine = Math.round(nBig * (p.fine / 100) * 4);
    for (let i = 0; i < nBig; i++) {
      s += `<circle cx="${cx - R * 1.5 + rnd() * R * 3}" cy="${level + 4 + rnd() * R * 2.4}" r="9" fill="${D.POWDER}" stroke="#7a5426" stroke-width="0.6"/>`;
    }
    for (let i = 0; i < nFine; i++) {
      s += `<circle cx="${cx - R * 1.5 + rnd() * R * 3}" cy="${level + 3 + rnd() * R * 2.4}" r="3.5" fill="#8c5a1f"/>`;
    }
    s += `</g></g>`;
    // 배플 (회전)
    for (let i = 0; i < 4; i++) {
      const a = ((ang + i * 90) * Math.PI) / 180;
      s += `<line x1="${cx + Math.cos(a) * R}" y1="${cy + Math.sin(a) * R}" x2="${cx + Math.cos(a) * (R - 26)}" y2="${cy + Math.sin(a) * (R - 26)}" stroke="${D.INK}" stroke-width="5"/>`;
    }
    s += `<path d="M${cx + R + 30},${cy - 40} A60 60 0 0 1 ${cx + R + 30},${cy + 40}" fill="none" stroke="${D.INK}" stroke-width="1.5" marker-end="url(#arr)"/>`;
    s += D.text(cx, 52, "회전 드럼 (Fig. 10.5a)", { anchor: "middle", size: 14, weight: 700 });
    s += D.label(cx, cy + R + 40, `채움 ${p.fill}%`, { anchor: "middle", size: 13, weight: 700 });

    // 오른쪽: 큰 입자 틈을 메우는 작은 입자 (개념)
    const gx = 520, gy = 120, Rb = 26;
    s += D.text(gx + 100, 52, "블렌딩: 크기가 다른 입자", { anchor: "middle", size: 14, weight: 700 });
    const fillGaps = Math.round((p.fine / 50) * 9);
    let gi = 0;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        s += `<circle cx="${gx + col * 2 * Rb + Rb}" cy="${gy + row * 2 * Rb + Rb}" r="${Rb}" fill="${D.POWDER}" stroke="#7a5426"/>`;
      }
    }
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (gi++ < fillGaps) s += `<circle cx="${gx + (col + 1) * 2 * Rb}" cy="${gy + (row + 1) * 2 * Rb}" r="${Rb * 0.41}" fill="#8c5a1f"/>`;
      }
    }
    s += D.text(gx + 100, gy + 8 * Rb + 30, "작은 입자가 큰 입자 틈을 메워 기공이 줄어든다", { anchor: "middle", size: 12 });
    s += D.text(gx + 100, gy + 8 * Rb + 50, "(교재 A10.2, 10.2.1 — 정성적 표현)", { anchor: "middle", size: 11, fill: D.INK2 });
    return s;
  }

  // ---------- 3단계: 압축 ----------
  function drawCompact(p, r) {
    const st = p.stroke;
    const k = Math.min(4.2, 300 / Math.max(p.Do, 1));
    const cx = 260, dieTop = 140, dieBot = 400;
    const wo = (p.Do * k) / 2, wi = (p.Di * k) / 2;
    const fillH = 200, finalH = 95;
    const powderH = st === 0 || st === 1 ? fillH : finalH;
    const lowerTop = st === 3 ? dieTop + 0 : dieBot - 20;            // 꺼낼 때 아래 펀치가 올라옴
    const partBot = st === 3 ? dieTop : dieBot - 20;
    const partTop = partBot - powderH;
    const upperBot = st === 0 ? dieTop - 60 : st === 3 ? dieTop - 120 : partTop;
    let s = "";
    // 다이 (양쪽 벽)
    s += `<rect x="${cx - wo - 70}" y="${dieTop}" width="70" height="${dieBot - dieTop}" fill="url(#steel)" stroke="${D.INK}"/>`;
    s += `<rect x="${cx + wo}" y="${dieTop}" width="70" height="${dieBot - dieTop}" fill="url(#steel)" stroke="${D.INK}"/>`;
    // 코어 막대 (안지름)
    if (wi > 0) s += `<rect x="${cx - wi}" y="${Math.min(upperBot, dieTop) - 20}" width="${2 * wi}" height="${dieBot + 40 - Math.min(upperBot, dieTop) + 20}" fill="#ced4da" stroke="${D.INK}"/>`;
    // 분말 / 압분체
    const region = (x1, x2) => {
      if (x2 - x1 < 1) return "";
      let q = `<rect x="${x1}" y="${partTop}" width="${x2 - x1}" height="${powderH}" fill="${st >= 2 ? "#d9b37a" : "#fff"}" stroke="${D.INK}" stroke-width="0.8"/>`;
      const rnd = D.rng(Math.round(x1));
      const dense = st >= 2;
      const R = 5;
      const n = Math.round(((x2 - x1) * powderH) / (dense ? 60 : 130));
      for (let i = 0; i < n; i++) {
        const px = x1 + R + rnd() * (x2 - x1 - 2 * R), py = partTop + R + rnd() * (powderH - 2 * R);
        q += dense
          ? `<ellipse cx="${px}" cy="${py}" rx="${R * 1.25}" ry="${R * 0.7}" fill="${D.POWDER}" stroke="#7a5426" stroke-width="0.5"/>`
          : `<circle cx="${px}" cy="${py}" r="${R}" fill="${D.POWDER}" stroke="#7a5426" stroke-width="0.5"/>`;
      }
      return q;
    };
    s += region(cx - wo, cx - wi) + region(cx + wi, cx + wo);
    // 위·아래 펀치 (환형)
    const punch = (yTop, yBot, fill) =>
      `<rect x="${cx - wo}" y="${yTop}" width="${wo - wi}" height="${yBot - yTop}" fill="${fill}" stroke="${D.INK}"/>` +
      `<rect x="${cx + wi}" y="${yTop}" width="${wo - wi}" height="${yBot - yTop}" fill="${fill}" stroke="${D.INK}"/>`;
    s += punch(upperBot - 90, upperBot, "#868e96");
    s += punch(st === 3 ? partBot : lowerTop, st === 3 ? partBot + 260 : dieBot + 60, "#adb5bd");
    if (st === 1 || st === 2) s += D.arrow(cx + wo + 110, upperBot - 70, cx + wo + 110, upperBot - 10, { width: 2.5 });
    s += D.text(cx + wo + 120, upperBot - 74, st === 1 || st === 2 ? `F = ${D.fmt(r.FkN, 0)} kN` : "", { size: 13, weight: 700 });
    s += D.text(cx, 40, STAGES[st], { anchor: "middle", size: 16, weight: 700 });
    s += D.text(cx - wo - 74, upperBot - 50, "위 펀치", { anchor: "end", size: 11 });
    s += D.text(cx - wo - 74, dieBot - 10, "다이", { anchor: "end", size: 11 });

    // Fig. 10.7(b): 압력에 따른 밀도 (정성적)
    const ch = D.chart({ x: 560, y: 120, w: 200, h: 170 }, {
      xMin: 0, xMax: 800, yMin: 0, yMax: 1, xLabel: "압력 (MPa)", yLabel: "밀도 (정성적)",
      xTicks: [0, 400, 800],
      series: [{ pts: Array.from({ length: 21 }, (_, i) => [i * 40, 0.35 + 0.6 * (1 - Math.exp(-(i * 40) / 250))]), color: D.POWDER }],
    });
    s += ch.svg;
    const yv = 0.35 + 0.6 * (1 - Math.exp(-p.pc / 250));
    s += `<circle cx="${ch.sx(p.pc)}" cy="${ch.sy(yv)}" r="6" fill="#e8590c" stroke="#fff" stroke-width="2"/>`;
    s += D.text(660, 100, "재배열 → 소성 변형 (Fig. 10.7)", { anchor: "middle", size: 12, weight: 700 });
    s += D.text(660, 360, `투영 면적 Ap = ${D.fmt(r.Ap, 1)} mm²`, { anchor: "middle", size: 13 });
    s += D.label(660, 395, `F = Ap·pc = ${D.fmt(r.FkN, 1)} kN`, { anchor: "middle", size: 15, weight: 700 });
    return s;
  }

  // ---------- 4단계: 소결 ----------
  function drawSinter(p, r) {
    const st = p.neck;
    const R = 62, cx = 220, cy = 230;
    const d = [2 * R, 1.86 * R, 1.72 * R, 1.62 * R][st];
    const ctr = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => [cx + (a * d) / 2, cy + (b * d) / 2]);
    let s = "";
    const melted = p.T >= r.m.Tm;
    const fill = melted ? "url(#melt)" : "#c69b5a";
    ctr.forEach(([x, y]) => (s += `<circle cx="${x}" cy="${y}" r="${R}" fill="${fill}" stroke="${st === 3 ? "none" : "#7a5426"}" stroke-width="1.2"/>`));
    // 넥: 접촉점 위에 덮어 그려 접촉 경계가 굵어지는 모습을 보인다
    const neckW = [4, 40, 64, 84][st];
    const neckL = 30;
    [[0, 1], [2, 3], [0, 2], [1, 3]].forEach(([i, j]) => {
      const mx = (ctr[i][0] + ctr[j][0]) / 2, my = (ctr[i][1] + ctr[j][1]) / 2;
      const horiz = ctr[i][1] === ctr[j][1];
      s += horiz
        ? `<rect x="${mx - neckL / 2}" y="${my - neckW / 2}" width="${neckL}" height="${neckW}" rx="${neckW / 4}" fill="${fill}"/>`
        : `<rect x="${mx - neckW / 2}" y="${my - neckL / 2}" width="${neckW}" height="${neckL}" rx="${neckW / 4}" fill="${fill}"/>`;
      if (st > 0 && st < 3) s += horiz
        ? `<line x1="${mx}" y1="${my - neckW / 2}" x2="${mx}" y2="${my + neckW / 2}" stroke="#7a5426" stroke-width="1" stroke-dasharray="2 2"/>`
        : `<line x1="${mx - neckW / 2}" y1="${my}" x2="${mx + neckW / 2}" y2="${my}" stroke="#7a5426" stroke-width="1" stroke-dasharray="2 2"/>`;
    });
    if (st === 3) {
      s += `<line x1="${cx}" y1="${cy - d / 2 - R}" x2="${cx}" y2="${cy + d / 2 + R}" stroke="#5c3b12" stroke-width="1.5" stroke-dasharray="6 4"/>`;
      s += `<line x1="${cx - d / 2 - R}" y1="${cy}" x2="${cx + d / 2 + R}" y2="${cy}" stroke="#5c3b12" stroke-width="1.5" stroke-dasharray="6 4"/>`;
      s += `<circle cx="${cx}" cy="${cy}" r="9" fill="#fff" stroke="#5c3b12"/>`;
      s += D.text(cx + 100, cy + d / 2 + R + 26, "점선: 입계", { size: 11, fill: D.INK2 });
    }
    s += D.text(cx, 46, NECK[st], { anchor: "middle", size: 16, weight: 700 });
    s += D.text(cx, 448, `입자 중심 간격 ${D.fmt(d / (2 * R), 2)} × 지름 → 부품이 수축한다`, { anchor: "middle", size: 12 });
    if (melted) s += D.label(cx, cy, "녹는점 이상: 고상 소결이 아님", { anchor: "middle", size: 12, weight: 700 });

    // Fig. 10.10(a) 소결 열처리 사이클
    const Tm = r.m.Tm;
    const ch = D.chart({ x: 520, y: 80, w: 240, h: 230 }, {
      xMin: 0, xMax: 10, yMin: 0, yMax: Math.max(Tm, p.T) * 1.1, xLabel: "시간 (개념)", yLabel: "온도 (°C)",
      yTicks: [0, Math.round(Tm)], fmtY: (v) => v,
      series: [
        { pts: [[0, 20], [1.5, 0.45 * p.T], [3, 0.45 * p.T], [4, p.T], [7, p.T], [9.5, 40]], color: D.POWDER },
        { pts: [[0, Tm], [10, Tm]], color: "#b42318", dash: "6 4", width: 1.5 },
        { pts: [[0, 0.7 * (Tm + 273) - 273], [10, 0.7 * (Tm + 273) - 273]], color: D.INK2, dash: "2 3", width: 1 },
        { pts: [[0, 0.9 * (Tm + 273) - 273], [10, 0.9 * (Tm + 273) - 273]], color: D.INK2, dash: "2 3", width: 1 },
      ],
    });
    s += ch.svg;
    s += `<rect x="${ch.sx(0)}" y="${ch.sy(0.9 * (Tm + 273) - 273)}" width="240" height="${ch.sy(0.7 * (Tm + 273) - 273) - ch.sy(0.9 * (Tm + 273) - 273)}" fill="${D.POWDER}" opacity="0.15"/>`;
    s += D.text(ch.sx(0.2), ch.sy(Tm) - 6, "녹는점 Tm", { size: 11, fill: "#b42318" });
    s += D.text(ch.sx(9.8), ch.sy(0.8 * (Tm + 273) - 273) + 4, "0.7–0.9 Tm", { size: 10, anchor: "end", fill: D.INK2 });
    s += D.text(ch.sx(1.5), ch.sy(0.45 * p.T) - 8, "예열", { size: 11, anchor: "middle" });
    s += D.text(ch.sx(5.5), ch.sy(p.T) - 8, "소결", { size: 11, anchor: "middle" });
    s += D.text(ch.sx(8.6), ch.sy(p.T * 0.4), "냉각", { size: 11, anchor: "middle" });
    s += D.text(640, 64, "열처리 사이클 (Fig. 10.10a)", { anchor: "middle", size: 13, weight: 700 });
    s += D.label(640, 395, `T / Tm = ${D.fmt(r.hom, 3)} (절대 온도)`, { anchor: "middle", size: 15, weight: 700 });
    return s;
  }

  window.PROCESSES = window.PROCESSES || [];
  window.PROCESSES.push({
    id: "pm", color: "#9c6b30", name: "분말 야금", en: "Powder metallurgy", chapter: "10.2절 · 부록 A10",
    params, compute,
    steps: [
      {
        title: "분말의 크기와 충전", short: "분말 특성", params: ["MC", "tw", "mat", "bulk"], draw: drawPowder,
        cites: [
          "A10.1 Geometric Features, pp.234–236, Eq. (A10.1), Fig. A10.1",
          "A10.2 Packing, Density, and Porosity, p.237, Eq. (A10.6)",
          "Table 3.10 진밀도, p.72",
        ],
        formulas: [
          ["PS = 1 / MC − tw", "Eq. (A10.1) [in]"],
          ["충전율 = 겉보기 밀도 / 진밀도", "A10.2"],
          ["기공률 + 충전율 = 1", "Eq. (A10.6)"],
        ],
        phenomenon: "분말 크기는 체로 가른다. 메시 수가 클수록 눈이 작고, 실제 구멍은 철사 굵기만큼 더 작다. 부어 놓은 분말은 입자 사이 빈틈 때문에 겉보기 밀도가 진밀도보다 작고, 그 비가 충전율이다. 느슨한 분말의 충전율은 보통 0.5–0.7 이다.",
        variables: ["MC: 메시 수 (1 inch 당 구멍 수)", "tw: 철사 굵기 (in)", "진밀도: 녹여 한 덩어리로 만든 밀도", "겉보기 밀도: 부어 놓은 상태 밀도"],
        assumptions: ["입자의 제한 치수가 체 구멍과 같다고 본다 (Eq. A10.1).", "입자 내부의 닫힌 기공도 기공률에 포함한다 (그래야 Eq. A10.6 이 정확, p.237)."],
        limits: ["체 분류는 MC ≈ 400 이 한계다 — 더 작은 입자는 현미경·X선으로 잰다 (p.234).", "통에 그린 입자 수는 충전율을 면적비로 나타낸 개념도다."],
        readout: (p, r) => [
          ["입자 크기 PS", D.fmt(r.PSin, 5), "in", "Eq. A10.1"],
          ["입자 크기 PS", D.fmt(r.PSum, 1), "µm", "", true],
          ["충전율", D.fmt(r.packingFactor, 3), ""],
          ["기공률", D.fmt(r.porosity, 3), "", "Eq. A10.6"],
        ],
        alerts: (p, r) => {
          const a = [];
          if (r.PSin <= 0) a.push({ level: "error", text: `철사 굵기(${p.tw} in)가 눈 간격 1/MC(${D.fmt(1 / p.MC, 4)} in)보다 크거나 같다. 구멍이 없는 체라 입자 크기를 정할 수 없다.` });
          else if (r.PSum < 25 || r.PSum > 300) a.push({ level: "warn", text: `PS = ${D.fmt(r.PSum, 0)} µm. 일반 압축·소결용 분말은 25–300 µm 범위다 (p.235).` });
          if (r.packingFactor > 1) a.push({ level: "error", text: `겉보기 밀도(${p.bulk})가 ${r.m.label} 진밀도(${r.m.rho} g/cm³)보다 크다. 충전율은 1 을 넘을 수 없다.` });
          else if (r.packingFactor < 0.5 || r.packingFactor > 0.7) a.push({ level: "warn", text: `충전율 ${D.fmt(r.packingFactor, 2)}. 부어 놓은 분말은 보통 0.5–0.7 이다 (p.237).` });
          return a;
        },
      },
      {
        title: "블렌딩과 혼합", short: "블렌딩", params: ["fill", "fine"], draw: drawBlend, animated: true,
        cites: [
          "10.2 Conventional Pressing and Sintering, p.219, Fig. 10.4",
          "10.2.1 Blending and Mixing of the Powders, pp.219–220, Fig. 10.5",
        ],
        formulas: [],
        phenomenon: "같은 성분에서 크기만 다른 분말을 섞는 것이 블렌딩, 성분이 다른 분말을 섞는 것이 혼합이다. 크기를 섞으면 작은 입자가 큰 입자 틈을 메워 기공이 줄어든다. 윤활제(스테아르산 아연 등), 결합제, 해교제도 이 단계에서 넣는다.",
        variables: ["용기 채움 비율 (20–40% 권장)", "작은 입자 비율", "첨가제: 윤활제 · 결합제 · 해교제"],
        assumptions: ["드럼 안 분말 면의 기울기는 그림용이다."],
        limits: ["이 단계는 교재에 식이 없어 정성적으로만 보여 준다.", "진동은 크기별 분리(segregation)를 일으켜 피해야 한다 — 시뮬레이션하지 않는다."],
        readout: (p) => [
          ["용기 채움", p.fill, "%", "권장 20–40%", true],
          ["작은 입자 비율", p.fine, "%"],
        ],
        alerts: (p) => (p.fill < 20 || p.fill > 40)
          ? [{ level: "warn", text: `채움 ${p.fill}%. 교재는 용기가 20–40% 찼을 때 결과가 가장 좋다고 한다 (p.220).` }]
          : [{ level: "ok", text: "채움 비율이 교재 권장 범위(20–40%) 안이다." }],
      },
      {
        title: "압축 (프레싱)", short: "압축", params: ["stroke", "Do", "Di", "pc"], draw: drawCompact,
        cites: [
          "10.2.2 Compaction, pp.220–222, Eq. (10.1)",
          "Fig. 10.6 프레스 사이클, Fig. 10.7 압력과 밀도, p.221 · Fig. 10.8 450 kN 프레스, p.222",
        ],
        formulas: [["F = A<sub>p</sub> · p<sub>c</sub>", "Eq. (10.1)"]],
        phenomenon: "다이에 채운 분말을 위아래 펀치로 누른다. 처음에는 입자가 재배열되어 다리(bridge)가 무너지고 빈틈이 줄며, 압력이 더 커지면 입자가 소성 변형해 접촉 면적이 넓어진다. 눌러 만든 부품은 압분체(green compact)라 하며 다룰 수는 있지만 소결 전이라 약하다.",
        variables: ["Ap: 누르는 방향의 투영 면적 (부싱 = π/4 (Do² − Di²))", "pc: 압축 압력 (Al 70 MPa ~ 철·강 700 MPa)", "F: 필요한 프레스 힘"],
        assumptions: ["부싱(원통 링) 형상.", "압력은 투영 면적 전체에 고르게 걸린다."],
        limits: ["다이 벽 마찰로 생기는 밀도 불균일은 계산하지 않는다.", "밀도-압력 곡선은 Fig. 10.7(b) 모양을 따른 정성적 곡선이다."],
        readout: (p, r) => [
          ["투영 면적 Ap", D.fmt(r.Ap, 1), "mm²"],
          ["프레스 힘 F", D.fmt(r.FkN, 1), "kN", "Eq. 10.1", true],
          ["프레스 힘 F", D.fmt(r.Ft, 1), "t", "1 t = 9.81 kN"],
          [`${r.m.label} 압축 압력`, r.m.pc, ""],
        ],
        alerts: (p, r) => {
          const a = [];
          if (p.Di >= p.Do) a.push({ level: "error", text: `안지름(${p.Di} mm)이 바깥지름(${p.Do} mm) 이상이다. 부싱이 만들어지지 않는다.` });
          if (r.FkN > PRESS_KN) a.push({ level: "warn", text: `필요한 힘 ${D.fmt(r.FkN, 0)} kN 이 Fig. 10.8 의 450 kN(50 t) 프레스 용량을 넘는다. 더 큰 프레스가 필요하다.` });
          if (p.pc < 70 || p.pc > 700) a.push({ level: "warn", text: "압축 압력이 교재의 일반 범위 70–700 MPa 밖이다." });
          if (!a.length) a.push({ level: "ok", text: "검증: Do 30, Di 15 mm, 400 MPa → F = 212 kN (강의자료 Ch10 풀이 예와 일치)." });
          return a;
        },
      },
      {
        title: "소결", short: "소결", params: ["neck", "mat", "T"], draw: drawSinter,
        cites: [
          "10.2.3 Sintering, pp.222–224, Fig. 10.9 (미세 변화), Fig. 10.10 (열처리 사이클)",
          "Table 10.1 소결 온도·시간, p.224 · Table 3.10 녹는점, p.72",
        ],
        formulas: [["0.7 ≤ T / T<sub>m</sub> ≤ 0.9", "10.2.3 (절대 온도)"]],
        phenomenon: "압분체를 녹는점 아래(절대 온도로 0.7–0.9 Tm)에서 가열하면 접촉점에서 결합이 시작되어 넥으로 자라고, 입자 사이 기공이 줄어 입계로 바뀐다. 주된 구동력은 표면 에너지의 감소이며 주된 기구는 확산이다. 기공이 줄면서 부품 전체가 수축한다.",
        variables: ["T: 소결 온도", "Tm: 녹는점 (Table 3.10)", "분위기: 산화 방지 · 환원 · 침탄 · 윤활제 제거"],
        assumptions: ["순금속 녹는점 기준이다.", "넥·입계 그림은 Fig. 10.9 의 네 단계를 따른 개념도다."],
        limits: ["소결 시간에 따른 수축량은 계산하지 않는다.", "알루미늄은 Table 10.1 에 값이 없다."],
        readout: (p, r) => [
          ["T / Tm (절대 온도)", D.fmt(r.hom, 3), "", "0.7–0.9 권장", true],
          ["Table 10.1 소결 온도", r.m.sinter ? `${r.m.sinter} °C` : "—", ""],
          ["Table 10.1 기준 T / Tm", r.homTable ? D.fmt(r.homTable, 3) : "—", ""],
          ["Table 10.1 소결 시간", r.m.time || "—", ""],
        ],
        alerts: (p, r) => {
          if (p.T >= r.m.Tm) return [{ level: "error", text: `${p.T} °C 는 ${r.m.label} 녹는점(${r.m.Tm} °C) 이상이다. 부품이 녹아 형상이 무너진다 — 고상 소결이 아니다.` }];
          if (r.hom < 0.7) return [{ level: "warn", text: `T/Tm = ${D.fmt(r.hom, 2)}. 0.7 보다 낮아 확산이 느려 결합이 잘 일어나지 않는다.` }];
          if (r.hom > 0.9) return [{ level: "warn", text: `T/Tm = ${D.fmt(r.hom, 2)}. 0.9 보다 높아 녹는점에 너무 가깝다.` }];
          return [{ level: "ok", text: `교재 소결 범위(0.7–0.9 Tm) 안이다.${r.m.sinter ? ` Table 10.1 값 ${r.m.sinter} °C 는 ${D.fmt(r.homTable, 2)} Tm.` : ""}` }];
        },
      },
    ],
  });
})();
