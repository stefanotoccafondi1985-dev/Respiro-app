import { describe, expect, it } from "vitest";
import { estimateSeconds } from "../lib/meditation";
import { parseFxStrict } from "../lib/fx";
import { lessons } from "./course";

describe("corso di meditazione", () => {
  it("ha 13 lezioni numerate di seguito, con id univoci", () => {
    expect(lessons).toHaveLength(13);
    expect(lessons.map((l) => l.n)).toEqual(Array.from({ length: 13 }, (_, i) => i + 1));
    expect(new Set(lessons.map((l) => l.id)).size).toBe(13);
  });

  it("ogni lezione ha testi, descrizione e preparazione", () => {
    for (const l of lessons) {
      expect(l.title.length, l.id).toBeGreaterThan(3);
      expect(l.intro.length, l.id).toBeGreaterThan(20);
      expect(l.prepare.length, l.id).toBeGreaterThan(0);
      expect(l.segments.length, l.id).toBeGreaterThan(8);
      for (const [text, pause, fx] of l.segments) {
        expect(text.trim().length, l.id).toBeGreaterThan(5);
        expect(pause).toBeGreaterThanOrEqual(0);
        expect(pause, `${l.id}: ${text}`).toBeLessThanOrEqual(90);
        expect(parseFxStrict(fx), `${l.id}: effetto ${fx}`).not.toBeNull();
      }
    }
  });

  it("la durata prevista corrisponde ai minuti dichiarati (±5%) a velocità 0,85", () => {
    for (const l of lessons) {
      const s = estimateSeconds({ id: l.id, title: l.title, category: l.tag, description: l.intro, segments: l.segments }, 0.85);
      expect(s, l.id).toBeGreaterThan(l.minutes * 60 * 0.95);
      expect(s, l.id).toBeLessThan(l.minutes * 60 * 1.05);
    }
  });

  it("le lezioni dedicate alle tecniche hanno i loro effetti", () => {
    const fx = (id: string) => lessons.find((l) => l.id === id)!.segments.map((s) => s[2] ?? "").join(" ");
    expect(fx("suono")).toContain("bowl");
    expect(fx("fiamma")).toContain("view:flame");
    expect(fx("fiamma")).toContain("view:dark");
    expect(fx("vibrazione")).toContain("pulse:");
    expect(lessons.find((l) => l.id === "vibrazione")!.view).toBe("pulse");
  });

  it("le lezioni con la fiamma tornano alla sfera alla fine", () => {
    const f = lessons.find((l) => l.id === "fiamma")!;
    expect(f.segments.at(-1)![2]).toContain("view:orb");
  });

  it("ogni lezione si chiude senza pausa finale", () => {
    for (const l of lessons) expect(l.segments.at(-1)![1], l.id).toBe(0);
  });
});
