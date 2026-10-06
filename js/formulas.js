// 교재 공식 모음 (Groover, Introduction to Manufacturing Processes, Wiley 2012)
// 화면 코드와 분리해 두어 tests/formulas.test.js 에서 교재 예제로 검증한다.
(function (root) {
  const G_CM = 981; // cm/s², Eq.(5.2) 아래 정의
  const rad = (deg) => (deg * Math.PI) / 180;

  // ---------- 5장 주조 ----------
  // Eq.(5.4) v = sqrt(2gh)   [h: cm → v: cm/s]
  const sprueVelocity = (h) => Math.sqrt(2 * G_CM * h);
  // Eq.(5.5) Q = vA          [A: cm² → Q: cm³/s]
  const flowRate = (v, A) => v * A;
  // Eq.(5.6) T_MF = V/Q      [V: cm³ → s]
  const fillTime = (V, Q) => V / Q;
  // Eq.(5.7) T_TS = Cm (V/A)^n   [Cm: min/cm², n = 2 → min]
  const chvorinov = (Cm, V, A, n = 2) => Cm * Math.pow(V / A, n);

  // 직사각 판 주물의 부피·표면적 (Example 5.2 과 같은 방식)
  const plateVA = (L, W, t) => ({
    V: L * W * t,
    A: 2 * (L * W + L * t + W * t),
  });
  // 원통 라이저, D/H = 1 → V/A = D/6 (Example 5.2)
  const cylinderVA = (D, H) => ({
    V: (Math.PI * D * D * H) / 4,
    A: Math.PI * D * H + (2 * Math.PI * D * D) / 4,
  });
  // 5.3.3 수축 여유: 패턴 치수 = 주물 치수 × (1 + 선수축률)  (Problem 5.6 의 shrink rule 해석)
  const patternSize = (castDim, linearShrink) => castDim * (1 + linearShrink);

  // ---------- 8장 압출 ----------
  // Eq.(8.4) tan A = p / (πD) → 나선각
  const flightAngleDeg = (pitch, D) => (Math.atan(pitch / (Math.PI * D)) * 180) / Math.PI;
  // Eq.(8.10) Qd = 0.5 π² D² N dc sinA cosA   [SI: m, rev/s → m³/s]
  const dragFlow = (D, N, dc, Adeg) =>
    0.5 * Math.PI ** 2 * D ** 2 * N * dc * Math.sin(rad(Adeg)) * Math.cos(rad(Adeg));
  // Eq.(8.12) Qb = p π D dc³ sin²A / (12 η L)
  const backFlow = (p, D, dc, Adeg, eta, L) =>
    (p * Math.PI * D * dc ** 3 * Math.sin(rad(Adeg)) ** 2) / (12 * eta * L);
  // Eq.(8.15) pmax = 6π D N L η cotA / dc²
  const maxPressure = (D, N, L, eta, dc, Adeg) =>
    (6 * Math.PI * D * N * L * eta) / (Math.tan(rad(Adeg)) * dc ** 2);
  // Eq.(8.17) Ks = π Dd⁴ / (128 η Ld)
  const dieShapeFactor = (Dd, eta, Ld) => (Math.PI * Dd ** 4) / (128 * eta * Ld);
  // Eq.(8.18) 와 Eq.(8.16) 의 교점 → 운전점
  const operatingPoint = (Qmax, pmax, Ks) => {
    const p = Qmax / (Qmax / pmax + Ks);
    return { p, Q: Ks * p };
  };
  // Eq.(8.3) rs = Dx / Dd
  const swellDiameter = (Dd, rs) => Dd * rs;

  // ---------- 10장 분말 야금 ----------
  // Eq.(A10.1) PS = 1/MC − tw   [in]
  const particleSize = (MC, tw) => 1 / MC - tw;
  // Eq.(A10.6) 기공률 + 충전율 = 1, 충전율 = 겉보기 밀도 / 진밀도
  const packing = (bulk, trueDensity) => {
    const pf = bulk / trueDensity;
    return { packingFactor: pf, porosity: 1 - pf };
  };
  // Eq.(10.1) F = Ap pc   [mm², MPa → N]
  const bushingArea = (Do, Di) => (Math.PI / 4) * (Do * Do - Di * Di);
  const pressForce = (Ap, pc) => Ap * pc;
  // 10.2.3 소결 온도 비 (절대 온도 기준)
  const homologous = (Tc, TmC) => (Tc + 273) / (TmC + 273);

  const api = {
    sprueVelocity, flowRate, fillTime, chvorinov, plateVA, cylinderVA, patternSize,
    flightAngleDeg, dragFlow, backFlow, maxPressure, dieShapeFactor, operatingPoint, swellDiameter,
    particleSize, packing, bushingArea, pressForce, homologous,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.F = api;
})(this);
