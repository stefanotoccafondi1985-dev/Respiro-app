import type { Phases } from "../data/pranayama";

/** Punto in un riquadro 200 x 200. */
export interface Pt {
  x: number;
  y: number;
}

export type ShapeKind = "line" | "triangle" | "square";

/** Un lato della figura = una fase del respiro. */
export interface Side {
  /** 0 inspira, 1 trattieni a polmoni pieni, 2 espira, 3 trattieni a polmoni vuoti */
  phase: 0 | 1 | 2 | 3;
  from: Pt;
  to: Pt;
  /** Dove scrivere i secondi della fase. */
  label: Pt;
  seconds: number;
}

export interface Shape {
  kind: ShapeKind;
  sides: Side[];
}

/** Tipi di fase usati dal timer (stessi di PranayamaSession). */
export const PHASE_KINDS = ["in", "h1", "out", "h2"] as const;

const BL: Pt = { x: 50, y: 155 };
const TL: Pt = { x: 50, y: 45 };
const TR: Pt = { x: 150, y: 45 };
const BR: Pt = { x: 150, y: 155 };

const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** Sposta il punto p lontano da c di d unità. */
function away(p: Pt, c: Pt, d: number): Pt {
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const n = Math.hypot(dx, dy) || 1;
  return { x: p.x + (dx / n) * d, y: p.y + (dy / n) * d };
}

function make(kind: ShapeKind, phases: Phases, route: [Pt, Pt][], ids: (0 | 1 | 2 | 3)[]): Shape {
  const all = route.flatMap(([a, b]) => [a, b]);
  const c = { x: all.reduce((s, p) => s + p.x, 0) / all.length, y: all.reduce((s, p) => s + p.y, 0) / all.length };
  return {
    kind,
    sides: route.map(([from, to], i) => ({
      phase: ids[i],
      from,
      to,
      label: away(mid(from, to), c, 17),
      seconds: phases[ids[i]],
    })),
  };
}

/**
 * Sceglie la figura dal numero di fasi con durata maggiore di zero:
 * 2 fasi = linea, 3 = triangolo, 4 = quadrato.
 * Nella linea e nel quadrato salire significa riempire i polmoni, scendere svuotarli,
 * un lato orizzontale è una pausa. Il triangolo è sempre equilatero.
 */
export function buildShape(phases: Phases): Shape {
  const [, h1, , h2] = phases;
  if (h1 > 0 && h2 > 0) {
    // quadrato: su, pausa in alto, giù, pausa in basso
    return make("square", phases, [[BL, TL], [TL, TR], [TR, BR], [BR, BL]], [0, 1, 2, 3]);
  }
  if (h1 > 0 || h2 > 0) {
    // triangolo equilatero, base in basso e vertice in alto: il punto parte dall'angolo
    // in basso a sinistra e gira in senso orario. L'inspirazione è sempre il lato sinistro.
    // Pausa a polmoni pieni:  su (inspira), lato destro (pausa), base (espira).
    // Pausa a polmoni vuoti:  su (inspira), lato destro (espira), base (pausa).
    const A: Pt = { x: 40, y: 152 };
    const B: Pt = { x: 100, y: 48 };
    const C: Pt = { x: 160, y: 152 };
    return make("triangle", phases, [[A, B], [B, C], [C, A]], h1 > 0 ? [0, 1, 2] : [0, 2, 3]);
  }
  // linea verticale: si sale inspirando, si scende espirando
  const bottom: Pt = { x: 100, y: 155 };
  const top: Pt = { x: 100, y: 45 };
  const line = make("line", phases, [[bottom, top], [top, bottom]], [0, 2]);
  line.sides[0].label = { x: 78, y: 104 };
  line.sides[1].label = { x: 122, y: 104 };
  return line;
}

/** Posizione del punto durante una fase. `progress` va da 0 a 1. Prima di iniziare resta all'inizio dell'inspirazione. */
export function dotPosition(shape: Shape, kind: string, progress: number): Pt {
  const phase = PHASE_KINDS.indexOf(kind as (typeof PHASE_KINDS)[number]);
  const side = shape.sides.find((s) => s.phase === phase);
  if (!side) return shape.sides[0].from;
  const t = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  return { x: side.from.x + (side.to.x - side.from.x) * t, y: side.from.y + (side.to.y - side.from.y) * t };
}

export interface NostrilState {
  left: "open" | "closed";
  right: "open" | "closed";
  /** Direzione dell'aria: entra, esce, oppure nessuna (pausa). */
  flow: "in" | "out" | null;
}

/**
 * Narici alternate: ciclo dispari inspira a sinistra ed espira a destra,
 * ciclo pari inspira a destra ed espira a sinistra. Nelle pause sono chiuse entrambe.
 */
export function nostrilState(kind: string, cycle: number): NostrilState {
  const odd = cycle % 2 === 1;
  if (kind === "in") return odd ? { left: "open", right: "closed", flow: "in" } : { left: "closed", right: "open", flow: "in" };
  if (kind === "out") return odd ? { left: "closed", right: "open", flow: "out" } : { left: "open", right: "closed", flow: "out" };
  return { left: "closed", right: "closed", flow: null };
}

export function nostrilText(kind: string, cycle: number): string {
  const n = nostrilState(kind, cycle);
  const side = n.left === "open" ? "sinistra" : "destra";
  if (kind === "in") return `Inspira dalla narice ${side}`;
  if (kind === "out") return `Espira dalla narice ${side}`;
  return "Chiudi entrambe le narici";
}
