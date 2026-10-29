import { describe, expect, it } from "vitest";
import { coachPhrases } from "../data/coach";
import { buildTableCoach, buildTestCoach, gongTimes, type CoachEvent, type CoachStep } from "./coach";

const all = [
  ...Object.entries(coachPhrases)
    .filter(([k]) => k !== "testRecord")
    .flatMap(([, v]) => v as string[]),
  ...Object.values(coachPhrases.testRecord),
];
const gongs = (e: CoachEvent[]) => e.filter((x) => x.kind === "gong").map((x) => x.at);
const says = (e: CoachEvent[]) => e.flatMap((x) => (x.kind === "say" ? [x] : []));

const hold = (seconds: number, round = 1): CoachStep => ({ kind: "hold", seconds, round });

describe("frasi del coach", () => {
  it("sono brevi, leggibili durante l'apnea", () => {
    for (const t of all) {
      expect(t.split(/\s+/).length, t).toBeLessThanOrEqual(16);
      expect(t.trim().length).toBeGreaterThan(10);
    }
  });
});

describe("gong ogni 30 secondi", () => {
  it("suona a 30, 60, 90 s ma non negli ultimi 4 secondi", () => {
    expect(gongTimes(100)).toEqual([30, 60, 90]);
    expect(gongTimes(60)).toEqual([30]);
    expect(gongTimes(29)).toEqual([]);
    expect(gongTimes(34)).toEqual([30]);
  });

  it("nelle tabelle i tempi sono relativi all'inizio di ogni apnea", () => {
    const steps: CoachStep[] = [{ kind: "prep", seconds: 10 }, { kind: "rec", seconds: 60, round: 1 }, hold(70, 1)];
    expect(gongs(buildTableCoach(steps, "co2", 1, { gong: true, phrases: false }))).toEqual([100, 130]);
  });

  it("nel test suona ogni 30 s fino a 10 minuti", () => {
    const g = gongs(buildTestCoach(null, { gong: true, phrases: false }));
    expect(g[0]).toBe(30);
    expect(g.at(-1)).toBe(600);
    expect(g).toHaveLength(20);
  });
});

describe("opzioni", () => {
  it("senza gong e senza frasi non c'è nessun evento", () => {
    const steps: CoachStep[] = [{ kind: "prep", seconds: 10 }, hold(60)];
    expect(buildTableCoach(steps, "co2", 1, { gong: false, phrases: false })).toEqual([]);
    expect(buildTestCoach(60, { gong: false, phrases: false })).toEqual([]);
  });

  it("solo frasi: nessun gong. Solo gong: nessuna frase", () => {
    const steps: CoachStep[] = [{ kind: "prep", seconds: 10 }, { kind: "rec", seconds: 60, round: 1 }, hold(90)];
    const f = buildTableCoach(steps, "co2", 1, { gong: false, phrases: true });
    expect(gongs(f)).toEqual([]);
    expect(says(f).length).toBeGreaterThan(0);
    const g = buildTableCoach(steps, "co2", 1, { gong: true, phrases: false });
    expect(says(g)).toEqual([]);
    expect(gongs(g).length).toBeGreaterThan(0);
  });
});

describe("pianificazione delle frasi", () => {
  const steps: CoachStep[] = [
    { kind: "prep", seconds: 10 },
    ...[1, 2, 3, 4].flatMap((r) => [{ kind: "rec", seconds: 60, round: r }, hold(60 + r * 20, r)]),
    { kind: "cool", seconds: 120 },
  ];
  const total = steps.reduce((a, s) => a + s.seconds, 0);

  for (const type of ["co2", "o2"] as const) {
    it(`tabella ${type}: eventi ordinati, dentro la sessione, frasi note`, () => {
      const e = buildTableCoach(steps, type, 4, { gong: true, phrases: true });
      expect(e.length).toBeGreaterThan(10);
      for (let i = 1; i < e.length; i++) expect(e[i].at).toBeGreaterThanOrEqual(e[i - 1].at);
      for (const x of e) {
        expect(x.at).toBeGreaterThanOrEqual(0);
        expect(x.at).toBeLessThan(total);
        if (x.kind === "say") expect(all).toContain(x.text);
      }
    });
  }

  it("le frasi non cadono sul gong e distano almeno 8 secondi tra loro", () => {
    const e = buildTableCoach(steps, "co2", 4, { gong: true, phrases: true });
    const g = gongs(e);
    const s = says(e);
    for (const x of s) for (const t of g) expect(x.at > t - 1.5 && x.at < t + 3, `${x.text} @${x.at} gong@${t}`).toBe(false);
    for (let i = 1; i < s.length; i++) {
      const sameHold = s[i].at - s[i - 1].at;
      // da un'apnea al recupero seguente ci sono sempre più di 8 secondi
      expect(sameHold).toBeGreaterThanOrEqual(8);
    }
  });

  it("nessuna frase resta in coda dopo la fine dell'apnea", () => {
    const e = buildTableCoach([hold(40)], "co2", 1, { gong: true, phrases: true });
    for (const x of says(e)) expect(x.at).toBeLessThanOrEqual(36);
  });

  it("l'ultimo round e il primo hanno le loro frasi, la fine della tabella saluta", () => {
    const e = says(buildTableCoach(steps, "co2", 4, { gong: false, phrases: true }));
    expect(e.some((x) => coachPhrases.primoRound.includes(x.text))).toBe(true);
    expect(e.some((x) => coachPhrases.ultimoRound.includes(x.text))).toBe(true);
    expect(e.at(-1)!.text).toBe(coachPhrases.fineTabella[0]);
  });

  it("negli ultimi 10 secondi di un'apnea lunga c'è la frase di chiusura", () => {
    const e = says(buildTableCoach([hold(60)], "o2", 1, { gong: false, phrases: true }));
    expect(e.some((x) => x.at === 50 && coachPhrases.fine.includes(x.text))).toBe(true);
  });

  it("non ripete la stessa frase di seguito", () => {
    const e = says(buildTableCoach(steps, "co2", 4, { gong: true, phrases: true }));
    for (let i = 1; i < e.length; i++) expect(e[i].text).not.toBe(e[i - 1].text);
  });
});

describe("test del massimo", () => {
  it("con il PB noto compaiono le frasi sul record, nell'ordine giusto", () => {
    const e = says(buildTestCoach(120, { gong: false, phrases: true }));
    const r = coachPhrases.testRecord;
    const at = (text: string) => e.find((x) => x.text === text)?.at;
    expect(at(r.vicino)).toBe(80);
    expect(at(r.dieci)).toBe(110);
    expect(at(r.raggiunto)).toBe(120);
    expect(at(r.oltre)).toBe(135);
  });

  it("con il PB noto e il gong le frasi evitano il gong", () => {
    const e = buildTestCoach(90, { gong: true, phrases: true });
    for (const x of says(e)) for (const g of gongs(e)) expect(x.at > g - 1.5 && x.at < g + 3).toBe(false);
    expect(says(e).some((x) => x.text === coachPhrases.testRecord.raggiunto)).toBe(true);
  });

  it("senza PB non ci sono frasi sul record", () => {
    const e = says(buildTestCoach(null, { gong: true, phrases: true }));
    const rec = Object.values(coachPhrases.testRecord);
    expect(e.some((x) => rec.includes(x.text))).toBe(false);
    expect(e.length).toBeGreaterThan(5);
  });

  it("la prima frase arriva dopo pochi secondi e ricorda la sicurezza", () => {
    const e = says(buildTestCoach(null, { gong: false, phrases: true }));
    expect(e[0].at).toBe(6);
    expect(coachPhrases.testInizio.includes(e[0].text)).toBe(true);
    expect(e.some((x) => coachPhrases.sicurezza.includes(x.text))).toBe(true);
  });
});
