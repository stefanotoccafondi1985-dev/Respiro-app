import type { Meditation } from "../types";

const WORDS_PER_SEC = 2.2; // lettura a velocità 1.0

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Durata stimata (s) = tempo di lettura + pause. La velocità 'rate' rallenta la lettura. */
export function estimateSeconds(m: Meditation, rate: number): number {
  let t = 0;
  for (const [text, pause] of m.segments) t += wordCount(text) / (WORDS_PER_SEC * rate) + pause;
  return t;
}

export function estimateMinutes(m: Meditation, rate: number): number {
  return Math.max(1, Math.round(estimateSeconds(m, rate) / 60));
}

const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Testo in SSML con le pause, pronto per un servizio di sintesi vocale con voci neurali italiane. */
export function toSSML(m: Meditation): string {
  const body = m.segments
    .map(([text, pause]) => `<p>${esc(text)}</p>` + (pause > 0 ? `\n<break time="${pause}s"/>` : ""))
    .join("\n");
  return `<speak xml:lang="it-IT">\n${body}\n</speak>`;
}
