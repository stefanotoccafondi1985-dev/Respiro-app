export type Phases = [inhale: number, holdFull: number, exhale: number, holdEmpty: number];

export interface Technique {
  id: string;
  name: string;
  sub: string;
  kind: "phases" | "rhythm";
  phases?: Phases;
  minutes?: number;
  cycles?: number;
  /** Richiede l'avviso di cautela prima della sessione. */
  caution?: boolean;
  /** Mostra quale narice usare (Anulom Vilom). */
  nostril?: boolean;
  rhythm?: { bpm: number; rounds: number; strokes: number; rest: number };
}

export const techniques: Technique[] = [
  { id: "coerente", name: "Respirazione coerente", sub: "Calma e recupero, circa 5-6 respiri al minuto", kind: "phases", phases: [5.5, 0, 5.5, 0], minutes: 5 },
  { id: "diaframmatica", name: "Respirazione diaframmatica", sub: "Espirazione più lunga dell'inspirazione", kind: "phases", phases: [4, 0, 6, 0], minutes: 5 },
  { id: "box", name: "Box breathing", sub: "Quattro fasi uguali", kind: "phases", phases: [4, 4, 4, 4], minutes: 4 },
  { id: "478", name: "4-7-8", sub: "Per la sera, 4 cicli", kind: "phases", phases: [4, 7, 8, 0], cycles: 4 },
  { id: "anulom", name: "Anulom Vilom", sub: "Narici alternate", kind: "phases", phases: [4, 0, 4, 0], minutes: 5, nostril: true },
  { id: "bhramari", name: "Bhramari", sub: "Espirazione con ronzio sommesso", kind: "phases", phases: [4, 0, 8, 0], minutes: 5 },
  { id: "ujjayi", name: "Ujjayi", sub: "Respiro lento con leggera costrizione della gola", kind: "phases", phases: [5, 0, 5, 0], minutes: 5 },
  { id: "kapalabhati", name: "Kapalabhati", sub: "Espirazioni attive, 3 round da 30 colpi", kind: "rhythm", caution: true, rhythm: { bpm: 60, rounds: 3, strokes: 30, rest: 45 } },
  { id: "bhastrika", name: "Bhastrika", sub: "Soffi forzati, 3 round da 20", kind: "rhythm", caution: true, rhythm: { bpm: 60, rounds: 3, strokes: 20, rest: 45 } },
];
