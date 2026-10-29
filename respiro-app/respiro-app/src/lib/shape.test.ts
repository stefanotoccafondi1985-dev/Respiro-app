import { describe, expect, it } from "vitest";
import type { Phases } from "../data/pranayama";
import { buildShape, dotPosition, nostrilState, nostrilText } from "./shape";

describe("figura del respiro", () => {
  it("usa una linea con sole inspirazione ed espirazione", () => {
    const s = buildShape([4, 0, 6, 0]);
    expect(s.kind).toBe("line");
    expect(s.sides.map((x) => x.phase)).toEqual([0, 2]);
  });

  it("usa un triangolo con una sola pausa, piena o vuota", () => {
    const piena = buildShape([4, 7, 8, 0]);
    expect(piena.kind).toBe("triangle");
    expect(piena.sides.map((x) => x.phase)).toEqual([0, 1, 2]);
    const vuota = buildShape([4, 0, 4, 4]);
    expect(vuota.kind).toBe("triangle");
    expect(vuota.sides.map((x) => x.phase)).toEqual([0, 2, 3]);
  });

  it("usa un quadrato con due pause", () => {
    const s = buildShape([4, 4, 4, 4]);
    expect(s.kind).toBe("square");
    expect(s.sides.map((x) => x.phase)).toEqual([0, 1, 2, 3]);
  });

  it("le figure sono chiuse: ogni lato inizia dove finisce il precedente", () => {
    for (const p of [[4, 7, 8, 0], [4, 0, 4, 4], [4, 4, 4, 4]] as Phases[]) {
      const s = buildShape(p);
      s.sides.forEach((side, i) => {
        const next = s.sides[(i + 1) % s.sides.length];
        expect(side.to).toEqual(next.from);
      });
    }
  });

  it("il triangolo è equilatero, con la base in basso e il vertice in alto", () => {
    for (const p of [[4, 7, 8, 0], [4, 0, 4, 4]] as Phases[]) {
      const s = buildShape(p);
      const len = (i: number) => Math.hypot(s.sides[i].to.x - s.sides[i].from.x, s.sides[i].to.y - s.sides[i].from.y);
      expect(len(0)).toBeCloseTo(len(1), 0);
      expect(len(1)).toBeCloseTo(len(2), 0);
      const ys = s.sides.map((x) => x.from.y);
      const base = s.sides.find((x) => x.from.y === x.to.y)!;
      expect(base.from.y).toBe(Math.max(...ys));
      expect(Math.min(...ys)).toBeLessThan(base.from.y);
      expect(s.sides.filter((x) => x.from.y === x.to.y)).toHaveLength(1);
    }
  });

  it("pausa a polmoni pieni: l'espirazione è la base. Pausa a polmoni vuoti: l'espirazione è un lato inclinato", () => {
    const piena = buildShape([4, 7, 8, 0]);
    const espPiena = piena.sides.find((x) => x.phase === 2)!;
    expect(espPiena.from.y).toBe(espPiena.to.y);
    const vuota = buildShape([4, 0, 4, 4]);
    const espVuota = vuota.sides.find((x) => x.phase === 2)!;
    expect(espVuota.from.y).not.toBe(espVuota.to.y);
    const pausaVuota = vuota.sides.find((x) => x.phase === 3)!;
    expect(pausaVuota.from.y).toBe(pausaVuota.to.y);
  });

  it("inspirando il punto sale, e espirando non sale mai (linea, triangolo, quadrato)", () => {
    for (const p of [[4, 0, 6, 0], [4, 7, 8, 0], [4, 0, 4, 4], [4, 4, 4, 4]] as Phases[]) {
      const s = buildShape(p);
      expect(dotPosition(s, "in", 1).y).toBeLessThan(dotPosition(s, "in", 0).y);
      expect(dotPosition(s, "out", 1).y).toBeGreaterThanOrEqual(dotPosition(s, "out", 0).y);
    }
  });

  it("nel quadrato le pause sono lati orizzontali", () => {
    const s = buildShape([4, 4, 4, 4]);
    for (const k of ["h1", "h2"]) expect(dotPosition(s, k, 0).y).toBeCloseTo(dotPosition(s, k, 1).y);
  });

  it("il punto va dall'inizio alla fine del lato e non esce mai dal lato", () => {
    const s = buildShape([4, 4, 4, 4]);
    expect(dotPosition(s, "in", 0)).toEqual(s.sides[0].from);
    expect(dotPosition(s, "in", 1)).toEqual(s.sides[0].to);
    expect(dotPosition(s, "in", 0.5)).toEqual({ x: 50, y: 100 });
    expect(dotPosition(s, "in", 5)).toEqual(s.sides[0].to);
    expect(dotPosition(s, "in", -3)).toEqual(s.sides[0].from);
    expect(dotPosition(s, "in", Number.NaN)).toEqual(s.sides[0].from);
  });

  it("durante la preparazione il punto aspetta all'inizio dell'inspirazione", () => {
    const s = buildShape([4, 7, 8, 0]);
    expect(dotPosition(s, "prep", 0.7)).toEqual(s.sides[0].from);
  });

  it("le etichette dei secondi restano dentro il riquadro", () => {
    for (const p of [[4, 0, 6, 0], [4, 7, 8, 0], [4, 0, 4, 4], [4, 4, 4, 4]] as Phases[]) {
      for (const side of buildShape(p).sides) {
        expect(side.label.x).toBeGreaterThan(10);
        expect(side.label.x).toBeLessThan(190);
        expect(side.label.y).toBeGreaterThan(10);
        expect(side.label.y).toBeLessThan(190);
      }
    }
  });
});

describe("narici alternate", () => {
  it("ciclo dispari: inspira a sinistra, espira a destra", () => {
    expect(nostrilState("in", 1)).toEqual({ left: "open", right: "closed", flow: "in" });
    expect(nostrilState("out", 1)).toEqual({ left: "closed", right: "open", flow: "out" });
  });

  it("ciclo pari: inspira a destra, espira a sinistra", () => {
    expect(nostrilState("in", 2)).toEqual({ left: "closed", right: "open", flow: "in" });
    expect(nostrilState("out", 2)).toEqual({ left: "open", right: "closed", flow: "out" });
  });

  it("nelle pause e nella preparazione le narici sono chiuse", () => {
    for (const k of ["h1", "h2", "prep"]) {
      expect(nostrilState(k, 1)).toEqual({ left: "closed", right: "closed", flow: null });
    }
  });

  it("il testo corrisponde alla narice aperta", () => {
    expect(nostrilText("in", 1)).toBe("Inspira dalla narice sinistra");
    expect(nostrilText("out", 1)).toBe("Espira dalla narice destra");
    expect(nostrilText("in", 2)).toBe("Inspira dalla narice destra");
    expect(nostrilText("out", 2)).toBe("Espira dalla narice sinistra");
    expect(nostrilText("h1", 2)).toBe("Chiudi entrambe le narici");
  });
});
