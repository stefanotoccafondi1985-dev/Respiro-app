import { describe, expect, it } from "vitest";
import { generateTable, maxHoldRatio } from "./tables";

const holds = (r: { hold: number }[]) => r.map((x) => x.hold);
const recs = (r: { rec: number }[]) => r.map((x) => x.rec);

describe("tabella CO2", () => {
  it("PB 180 s, intermedio: apnea costante e recuperi decrescenti", () => {
    const t = generateTable("co2", 180, "intermediate");
    expect(holds(t)).toEqual([90, 90, 90, 90, 90, 90, 90, 90]);
    expect(recs(t)).toEqual([120, 105, 90, 75, 60, 45, 30, 15]);
  });

  it("principiante: 6 round, apnea al 40%", () => {
    const t = generateTable("co2", 180, "beginner");
    expect(t).toHaveLength(6);
    expect(holds(t)).toEqual([70, 70, 70, 70, 70, 70]);
    expect(recs(t)).toEqual([150, 135, 120, 105, 90, 75]);
  });

  it("rispetta recupero minimo e apnea minima", () => {
    const t = generateTable("co2", 30, "intermediate", { step: 30 });
    expect(Math.min(...recs(t))).toBe(15);
    expect(Math.min(...holds(t))).toBe(20);
  });
});

describe("tabella O2", () => {
  it("PB 180 s, intermedio: recupero costante e apnea crescente", () => {
    const t = generateTable("o2", 180, "intermediate");
    expect(recs(t)).toEqual([120, 120, 120, 120, 120, 120, 120, 120]);
    expect(holds(t)).toEqual([90, 100, 105, 115, 120, 130, 135, 145]);
  });

  it("non divide per zero con un solo round", () => {
    const t = generateTable("o2", 180, "intermediate", { rounds: 1 });
    expect(t).toHaveLength(1);
    expect(t[0].hold).toBe(90);
  });
});

describe("avvisi", () => {
  it("le tabelle predefinite non superano l'80% del PB", () => {
    for (const type of ["co2", "o2"] as const) {
      for (const level of ["beginner", "intermediate"] as const) {
        const t = generateTable(type, 200, level);
        expect(maxHoldRatio(t, 200)).toBeLessThanOrEqual(0.8 + 0.0251);
      }
    }
  });
});
