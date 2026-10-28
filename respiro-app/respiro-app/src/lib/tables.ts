import type { Level, Row, TableType } from "../types";

export interface TableParams {
  rounds: number;
  holdPct: number; // CO2: apnea costante, % del PB
  rec1: number; // CO2: recupero del primo round (s)
  step: number; // CO2: riduzione del recupero a ogni round (s)
  o2rec: number; // O2: recupero costante (s)
  o2s: number; // O2: apnea iniziale, % del PB
  o2e: number; // O2: apnea finale, % del PB
}

export const LEVELS: Record<Level, TableParams> = {
  beginner: { rounds: 6, holdPct: 0.4, rec1: 150, step: 15, o2rec: 150, o2s: 0.4, o2e: 0.65 },
  intermediate: { rounds: 8, holdPct: 0.5, rec1: 120, step: 15, o2rec: 120, o2s: 0.5, o2e: 0.8 },
};

export const MIN_HOLD = 20;
export const MIN_REC = 15;
export const WARN_RATIO = 0.85;

export const round5 = (x: number) => Math.round(x / 5) * 5;

export function defaultParams(level: Level): TableParams {
  return { ...LEVELS[level] };
}

/**
 * Genera una tabella di apnea a partire dal personal best (in secondi).
 * Tutti i valori sono arrotondati ai 5 secondi, con apnea minima 20 s e recupero minimo 15 s.
 */
export function generateTable(
  type: TableType,
  pb: number,
  level: Level,
  overrides: Partial<TableParams> = {},
): Row[] {
  const p = { ...LEVELS[level], ...overrides };
  const n = Math.max(1, Math.round(p.rounds));
  const rows: Row[] = [];
  for (let i = 1; i <= n; i++) {
    if (type === "co2") {
      rows.push({
        hold: Math.max(MIN_HOLD, round5(pb * p.holdPct)),
        rec: Math.max(MIN_REC, p.rec1 - (i - 1) * p.step),
      });
    } else {
      const frac = n === 1 ? 0 : (i - 1) / (n - 1);
      rows.push({
        hold: Math.max(MIN_HOLD, round5(pb * (p.o2s + (p.o2e - p.o2s) * frac))),
        rec: Math.max(MIN_REC, p.o2rec),
      });
    }
  }
  return rows;
}

/** Rapporto massimo tra apnea e PB nella tabella (per l'avviso oltre l'85%). */
export function maxHoldRatio(rows: Row[], pb: number): number {
  return rows.reduce((m, r) => Math.max(m, r.hold / pb), 0);
}

/** Durata totale: preparazione 10 s + round + defaticamento 120 s. */
export function totalSeconds(rows: Row[]): number {
  return 10 + rows.reduce((t, r) => t + r.rec + r.hold, 0) + 120;
}
