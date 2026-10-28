import { describe, expect, it } from "vitest";
import { meditations } from "../data/meditations";
import { estimateMinutes, estimateSeconds, toSSML } from "./meditation";

describe("libreria meditazioni", () => {
  it("ha almeno 40 meditazioni, tutte con id univoci", () => {
    expect(meditations.length).toBeGreaterThanOrEqual(40);
    expect(new Set(meditations.map((m) => m.id)).size).toBe(meditations.length);
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

  const durate = (ids: string[], min: number, max: number, minuti: number) => {
    for (const id of ids) {
      const m = meditations.find((x) => x.id === id);
      expect(m, `manca la meditazione ${id}`).toBeDefined();
      const s = estimateSeconds(m!, 0.85);
      expect(s, id).toBeGreaterThan(min);
      expect(s, id).toBeLessThan(max);
      expect(estimateMinutes(m!, 0.85), id).toBe(minuti);
    }
  };

  it("le meditazioni da 10 minuti durano circa 10 minuti a velocità 0,85", () => {
    durate(
      [
        "scansione-completa", "respiro-dieci-minuti", "sonno-profondo", "presenza-aperta", "passeggiata-bosco",
        "rilassamento-progressivo", "gentilezza-cinque-cerchi", "la-montagna", "espirazione-lunga", "rain-emozione",
      ],
      570,
      630,
      10,
    );
  });

  it("le meditazioni da 20 minuti durano circa 20 minuti a velocità 0,85", () => {
    durate(
      [
        "scansione-corpo-20", "yoga-nidra", "respiro-quattro-tappe", "gentilezza-completa", "seduti-in-silenzio",
        "discesa-nel-sonno", "il-lago", "compassione-respirare-insieme", "camminata-lunga", "calma-profonda-apnea",
      ],
      1140,
      1260,
      20,
    );
  });

  it("le altre durano meno di 5 minuti", () => {
    const lunghe = estimateMinutes;
    for (const m of meditations.filter((x) => lunghe(x, 0.85) < 10)) {
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
