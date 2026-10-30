import { coachPhrases, type PhrasePool } from "../data/coach";

/** Un evento del coach: un gong o una frase, a un certo istante (secondi dall'inizio della sessione). */
export type CoachEvent = { at: number; kind: "gong" } | { at: number; kind: "say"; text: string };

export interface CoachOptions {
  gong: boolean;
  phrases: boolean;
  /** Per i test: numero casuale tra 0 e 1. Il valore predefinito è Math.random. */
  rng?: () => number;
}

export interface CoachStep {
  kind: string;
  seconds: number;
  round?: number;
}

type Rng = () => number;

/** Sceglie una frase da una lista senza ripetere quelle già dette, finché ce ne sono di nuove. */
function makeChooser(rng: Rng) {
  const used = new Set<string>();
  return (list: readonly string[]): string => {
    let fresh = list.filter((t) => !used.has(t));
    if (fresh.length === 0) {
      list.forEach((t) => used.delete(t));
      fresh = [...list];
    }
    const t = fresh[Math.min(fresh.length - 1, Math.floor(rng() * fresh.length))];
    used.add(t);
    return t;
  };
}

/** Gong ogni 30 s di apnea, ma non negli ultimi secondi (lì c'è già il segnale di fine). */
export function gongTimes(duration: number | null, max = 600): number[] {
  const end = duration === null ? max : duration - 4;
  const out: number[] = [];
  for (let g = 30; g <= end; g += 30) out.push(g);
  return out;
}

interface Cand {
  t: number;
  text: string;
  pri: number;
}

/** Sposta una frase che cadrebbe sul gong subito dopo la sua coda; poi elimina quelle troppo vicine. */
function settle(cands: Cand[], gongs: number[], limit: number): Cand[] {
  const moved = cands
    .map((c) => {
      const g = gongs.find((x) => c.t > x - 1.5 && c.t < x + 3);
      return g === undefined ? c : { ...c, t: g + 3.2 };
    })
    .filter((c) => c.t <= limit);
  const kept: Cand[] = [];
  for (const c of [...moved].sort((a, b) => b.pri - a.pri || a.t - b.t)) {
    if (kept.every((k) => Math.abs(k.t - c.t) >= 8)) kept.push(c);
  }
  return kept.sort((a, b) => a.t - b.t);
}

/** Pool delle frasi "regolari" della k-esima finestra (a 15 s, 45 s, 75 s...) di un'apnea. */
function regularPool(k: number): PhrasePool {
  if (k === 0) return "calma";
  if (k === 1) return "contrazioni";
  if (k === 2) return "avanti";
  return (["contrazioni", "avanti", "contrazioni", "sicurezza"] as PhrasePool[])[(k - 3) % 4];
}

/** Frasi di un'apnea. `duration` è null se non si sa quando finisce (test del massimale). */
function regularCands(duration: number | null, pick: (l: readonly string[]) => string, max: number): Cand[] {
  const last = duration === null ? max : duration - 14;
  const out: Cand[] = [];
  for (let k = 0, t = 15; t <= last; k++, t += 30) out.push({ t, text: pick(coachPhrases[regularPool(k)]), pri: 1 });
  return out;
}

/** Eventi di una sessione a tabella: prepara, poi recupero e apnea per ogni round, poi defaticamento. */
export function buildTableCoach(steps: CoachStep[], type: "co2" | "o2", rounds: number, o: CoachOptions): CoachEvent[] {
  if (!o.gong && !o.phrases) return [];
  const pick = makeChooser(o.rng ?? Math.random);
  const events: CoachEvent[] = [];
  let start = 0;
  for (const s of steps) {
    const d = s.seconds;
    if (s.kind === "hold") {
      const gongs = gongTimes(d);
      if (o.gong) gongs.forEach((g) => events.push({ at: start + g, kind: "gong" }));
      if (o.phrases) {
        const round = s.round ?? 1;
        const cands: Cand[] = regularCands(d, pick, 0);
        if (d >= 20) {
          let pool: PhrasePool = "inizio";
          if (round === 1) pool = "primoRound";
          else if (round === rounds) pool = "ultimoRound";
          else if (round % 2 === 0) pool = type;
          cands.push({ t: 6, text: pick(coachPhrases[pool]), pri: 2 });
        }
        if (d >= 30) cands.push({ t: d - 10, text: pick(coachPhrases.fine), pri: 3 });
        for (const c of settle(cands, o.gong ? gongs : [], d - 4)) events.push({ at: start + c.t, kind: "say", text: c.text });
      }
    } else if (o.phrases && s.kind === "rec") {
      if (d >= 20) events.push({ at: start + 3, kind: "say", text: pick(coachPhrases.recupero) });
      if (d >= 34) events.push({ at: start + d - 16, kind: "say", text: pick(coachPhrases.prepara) });
    } else if (o.phrases && s.kind === "prep" && d >= 8) {
      events.push({ at: start + 1, kind: "say", text: pick(coachPhrases.inizioSessione) });
    } else if (o.phrases && s.kind === "cool") {
      events.push({ at: start + 3, kind: "say", text: pick(coachPhrases.fineTabella) });
    }
    start += d;
  }
  return events.sort((a, b) => a.at - b.at);
}

/** Eventi del test del massimale (durata massima 10 minuti). Con il PB noto, frasi legate al record. */
export function buildTestCoach(pb: number | null, o: CoachOptions, max = 600): CoachEvent[] {
  if (!o.gong && !o.phrases) return [];
  const pick = makeChooser(o.rng ?? Math.random);
  const events: CoachEvent[] = [];
  const gongs = gongTimes(null, max);
  if (o.gong) gongs.forEach((g) => events.push({ at: g, kind: "gong" }));
  if (o.phrases) {
    const cands: Cand[] = regularCands(null, pick, max);
    cands.push({ t: 6, text: pick(coachPhrases.testInizio), pri: 2 });
    if (pb && pb >= 30) {
      const r = coachPhrases.testRecord;
      if (pb >= 45) cands.push({ t: Math.round((pb * 2) / 3), text: r.vicino, pri: 3 });
      cands.push({ t: pb - 10, text: r.dieci, pri: 3 });
      cands.push({ t: pb, text: r.raggiunto, pri: 4 });
      cands.push({ t: pb + 15, text: r.oltre, pri: 3 });
    }
    for (const c of settle(cands, o.gong ? gongs : [], max)) events.push({ at: c.t, kind: "say", text: c.text });
  }
  return events.sort((a, b) => a.at - b.at);
}
