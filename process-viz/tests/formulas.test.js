// 교재 예제 풀이와 formulas.js 결과를 비교한다.  실행: node tests/formulas.test.js
const F = require("../js/formulas.js");

let fail = 0;
function check(name, got, want, relTol = 0.005) {
  const ok = Math.abs(got - want) <= Math.abs(want) * relTol;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}: ${got.toPrecision(5)} (교재 ${want})`);
}

// Example 5.1 (p.103): h = 20 cm, A = 2.5 cm², V = 1560 cm³
const v = F.sprueVelocity(20);
const Q = F.flowRate(v, 2.5);
check("Ex5.1 v [cm/s]", v, 198.1);
check("Ex5.1 Q [cm³/s]", Q, 495);
check("Ex5.1 TMF [s]", F.fillTime(1560, Q), 3.2, 0.02);

// Example 5.2 (p.109): 판 7.5×12.5×2.0 cm, TTS = 1.6 min → Cm = 3.26, 라이저 D = 4.7 cm
const plate = F.plateVA(7.5, 12.5, 2.0);
check("Ex5.2 V [cm³]", plate.V, 187.5);
check("Ex5.2 A [cm²]", plate.A, 267.5);
const Cm = 1.6 / (plate.V / plate.A) ** 2;
check("Ex5.2 Cm [min/cm²]", Cm, 3.26);
const riser = F.cylinderVA(4.7, 4.7);
check("Ex5.2 riser V/A = D/6", riser.V / riser.A, 4.7 / 6);
check("Ex5.2 riser TTS [min]", F.chvorinov(3.26, riser.V, riser.A), 2.0, 0.01);

// Problem 5.6 해석: 백주철 2.1% → 1 ft(12 in) 당 0.252 in
check("Shrink rule 12 in × 2.1%", F.patternSize(12, 0.021) - 12, 0.252);

// Example 8.1 (p.156) / 8.2 (p.158)
const D = 0.075, N = 1, dc = 0.006, A = 20, p = 7e6, L = 1.9, eta = 100;
const Qd = F.dragFlow(D, N, dc, A);
const Qb = F.backFlow(p, D, dc, A, eta, L);
check("Ex8.1 Qd [m³/s]", Qd, 53525e-9);
check("Ex8.1 Qb [m³/s]", Qb, 18276e-9);
check("Ex8.1 Qx [m³/s]", Qd - Qb, 35249e-9);
const pmax = F.maxPressure(D, N, L, eta, dc, A);
check("Ex8.2 pmax [Pa]", pmax, 20499874);
const Ks = F.dieShapeFactor(0.0065, eta, 0.02);
check("Ex8.2 Ks [m⁵/Ns]", Ks, 21.9e-12);
const op = F.operatingPoint(Qd, pmax, Ks);
check("Ex8.2 operating p [Pa]", op.p, 2.184e6);
check("Ex8.2 operating Qx [m³/s]", op.Q, 47.82e-6);
// pmax 에서 Qd = Qb 이어야 함 (Eq.8.15 유도 조건)
check("Qb(pmax) = Qd", F.backFlow(pmax, D, dc, A, eta, L), Qd);

// 10장: F = Ap pc, 부싱 30/15 mm, 400 MPa (강의자료 Ch10 보충 예)
const Ap = F.bushingArea(30, 15);
check("Bushing Ap [mm²]", Ap, 530.14);
check("Press F [kN]", F.pressForce(Ap, 400) / 1000, 212.06);
// A10.1: 200 mesh, tw = 0.001 in → PS = 0.004 in
check("PS 200 mesh", F.particleSize(200, 0.001), 0.004);
// 충전율 + 기공률 = 1
const pk = F.packing(4.72, 7.87);
check("Packing+porosity", pk.packingFactor + pk.porosity, 1);
// Table 10.1 철 1100°C, Table 3.10 Tm 1539°C → 0.70~0.9 범위 안
check("Iron T/Tm", F.homologous(1100, 1539), 0.7577);

console.log(fail ? `\n${fail}개 실패` : "\n모두 통과");
process.exit(fail ? 1 : 0);
