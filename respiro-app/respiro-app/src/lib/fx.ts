import type { View } from "../data/course";

/** Effetti di un segmento di lezione, scritti come testo: "bowl", "bowl:20", "pulse:5", "view:dark", "bowl+view:dark". */
export interface Fx {
  /** Campana all'inizio della pausa, e poi ogni `every` secondi se indicato. */
  bowl?: { every: number | null };
  /** Impulso (vibrazione e battito grave) ogni `every` secondi per tutta la pausa. */
  pulse?: { every: number };
  /** Cambia l'immagine mostrata. */
  view?: View;
}

export const VIEWS: View[] = ["orb", "flame", "pulse", "dark"];

/** Legge un effetto. Se il testo non è valido restituisce null. */
export function parseFxStrict(s: string | undefined): Fx | null {
  const fx: Fx = {};
  if (!s) return fx;
  for (const part of s.split("+")) {
    const [k, v] = part.split(":");
    if (k === "bowl") {
      if (v !== undefined && !(Number(v) >= 5)) return null;
      fx.bowl = { every: v === undefined ? null : Number(v) };
    } else if (k === "pulse") {
      if (!(Number(v) >= 1)) return null;
      fx.pulse = { every: Number(v) };
    } else if (k === "view") {
      if (!VIEWS.includes(v as View)) return null;
      fx.view = v as View;
    } else return null;
  }
  return fx;
}

/** Come parseFxStrict, ma ignora ciò che non capisce. */
export const parseFx = (s: string | undefined): Fx => parseFxStrict(s) ?? {};
