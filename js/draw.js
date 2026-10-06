// SVG 문자열 조각을 만드는 작은 도우미들. 각 공정의 draw() 가 사용한다.
(function (root) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const D = {
    INK: "#1b2430",
    INK2: "#4a5563",
    SAND: "#e6d3a8",
    SAND_DARK: "#c9b07a",
    STEEL: "#9aa5b1",
    STEEL_DARK: "#6b7785",
    MELT: "#f76707",
    MELT_HOT: "#ffd43b",
    SOLID: "#868e96",
    POLY: "#4dabf7",
    POWDER: "#c69b5a",

    defs() {
      return `<defs>
        <pattern id="sand" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="${D.SAND}"/>
          <circle cx="2" cy="3" r="0.9" fill="${D.SAND_DARK}"/><circle cx="7" cy="7" r="0.8" fill="${D.SAND_DARK}"/>
          <circle cx="8" cy="2" r="0.5" fill="${D.SAND_DARK}"/>
        </pattern>
        <pattern id="steel" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="${D.STEEL}"/><line x1="0" y1="0" x2="0" y2="8" stroke="${D.STEEL_DARK}" stroke-width="1"/>
        </pattern>
        <linearGradient id="melt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${D.MELT_HOT}"/><stop offset="1" stop-color="${D.MELT}"/>
        </linearGradient>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="${D.INK}"/>
        </marker>
      </defs>`;
    },

    text(x, y, s, o = {}) {
      const size = o.size || 13;
      const anchor = o.anchor || "start";
      const weight = o.weight || 400;
      const fill = o.fill || D.INK;
      return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}" fill="${fill}">${esc(s)}</text>`;
    },

    // 흰 바탕 라벨 (도면 위에서 읽히도록)
    label(x, y, s, o = {}) {
      const size = o.size || 12;
      // 한글은 거의 정사각, 라틴·숫자는 약 0.6 em
      const w = [...String(s)].reduce((a, c) => a + (/[ㄱ-힝]/.test(c) ? size * 1.0 : c === " " ? size * 0.3 : size * 0.6), 0) + 10;
      const anchor = o.anchor || "start";
      const bx = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
      return `<rect x="${bx}" y="${y - size - 2}" width="${w}" height="${size + 8}" rx="3" fill="#fff" fill-opacity="0.92" stroke="${D.INK}" stroke-width="0.6"/>` +
        D.text(anchor === "middle" ? x : anchor === "end" ? x - 5 : x + 5, y + 1, s, { size, anchor, weight: o.weight || 500 });
    },

    arrow(x1, y1, x2, y2, o = {}) {
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.color || D.INK}" stroke-width="${o.width || 1.5}" marker-end="url(#arr)" ${o.dash ? `stroke-dasharray="${o.dash}"` : ""}/>`;
    },

    // 치수선: 양쪽 화살표 + 가운데 값
    dim(x1, y1, x2, y2, s, o = {}) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${D.INK2}" stroke-width="1" marker-start="url(#arr)" marker-end="url(#arr)"/>` +
        D.label(mx + (o.dx || 0), my + (o.dy || 4), s, { anchor: "middle", size: 11 });
    },

    // 단순 선 차트 틀. series: [{pts:[[x,y]...], color, dash, width}], 축 범위 고정
    chart(box, o) {
      const { x, y, w, h } = box;
      const sx = (v) => x + ((v - o.xMin) / (o.xMax - o.xMin)) * w;
      const sy = (v) => y + h - ((v - o.yMin) / (o.yMax - o.yMin)) * h;
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="${D.INK2}" stroke-width="0.8"/>`;
      s += D.text(x + w / 2, y + h + 30, o.xLabel, { size: 12, anchor: "middle", fill: D.INK2 });
      s += `<text x="${x - 34}" y="${y + h / 2}" font-size="12" fill="${D.INK2}" text-anchor="middle" transform="rotate(-90 ${x - 34} ${y + h / 2})">${esc(o.yLabel)}</text>`;
      (o.xTicks || []).forEach((t) => {
        s += `<line x1="${sx(t)}" y1="${y + h}" x2="${sx(t)}" y2="${y + h + 4}" stroke="${D.INK2}"/>` + D.text(sx(t), y + h + 16, o.fmtX ? o.fmtX(t) : t, { size: 11, anchor: "middle", fill: D.INK2 });
      });
      (o.yTicks || []).forEach((t) => {
        s += `<line x1="${x - 4}" y1="${sy(t)}" x2="${x}" y2="${sy(t)}" stroke="${D.INK2}"/>` + D.text(x - 7, sy(t) + 4, o.fmtY ? o.fmtY(t) : t, { size: 11, anchor: "end", fill: D.INK2 });
      });
      (o.series || []).forEach((se) => {
        const d = se.pts.map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(" ");
        s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="${se.width || 2.5}" ${se.dash ? `stroke-dasharray="${se.dash}"` : ""}/>`;
      });
      return { svg: s, sx, sy };
    },

    // 결정론적 의사난수 (애니메이션마다 입자 위치가 튀지 않도록)
    rng(seed) {
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    fmt(v, digits = 3) {
      if (!isFinite(v)) return "—";
      const a = Math.abs(v);
      if (a !== 0 && (a >= 1e6 || a < 1e-3)) return v.toExponential(2);
      return v.toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
    },
  };
  root.D = D;
})(this);
