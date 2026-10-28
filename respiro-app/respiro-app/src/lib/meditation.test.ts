import { describe, expect, it } from "vitest";
import { meditations } from "../data/meditations";
import { estimateMinutes, estimateSeconds, toSSML } from "./meditation";

describe("libreria meditazioni", () => {
  it("contiene 25 meditazioni con id univoci", () => {
    expect(meditations).toHaveLength(25);
    expect(new Set(meditations.map((m) => m.id)).size).toBe(25);
  });

  it("ogni meditazione ha testi non vuoti e pause valide", () => {
    for (const m of meditations) {
      expect(m.segments.length).toBeGreaterThan(3);
      for (const [text, pause] of m.segments) {
        expect(text.trim().length).toBeGreaterThan(5);
        expect(pause).toBeGreaterThanOrEqual(0);
        expect(pause).toBeLessThanOrEqual(90);
      }
    }
  });

  it("le cinque meditazioni lunghe durano circa 10 minuti a velocità 0,85", () => {
    const long = ["scansione-completa", "respiro-dieci-minuti", "sonno-profondo", "presenza-aperta", "passeggiata-bosco"];
    for (const id of long) {
      const m = meditations.find((x) => x.id === id)!;
      const s = estimateSeconds(m, 0.85);
      expect(s).toBeGreaterThan(570);
      expect(s).toBeLessThan(630);
      expect(estimateMinutes(m, 0.85)).toBe(10);
    }
  });

  it("le altre durano meno di 5 minuti", () => {
    for (const m of meditations.filter((x) => estimateMinutes(x, 0.85) < 10)) {
      expect(estimateSeconds(m, 0.85)).toBeLessThan(300);
    }
  });

  it("una velocità più bassa allunga la durata", () => {
    const m = meditations[0];
    expect(estimateSeconds(m, 0.7)).toBeGreaterThan(estimateSeconds(m, 1));
  });
});

describe("SSML", () => {
  it("avvolge in <speak> e inserisce le pause", () => {
    const ssml = toSSML({
      id: "x",
      title: "t",
      category: "c",
      description: "d",
      segments: [
        ["Respira & rilassati.", 5],
        ["Fine.", 0],
      ],
    });
    expect(ssml.startsWith('<speak xml:lang="it-IT">')).toBe(true);
    expect(ssml).toContain("<p>Respira &amp; rilassati.</p>");
    expect(ssml).toContain('<break time="5s"/>');
    expect(ssml).not.toContain('<break time="0s"/>');
    expect(ssml.endsWith("</speak>")).toBe(true);
  });
});
