export type Level = "beginner" | "intermediate";
export type TableType = "co2" | "o2";

/** Un round di una tabella: apnea (hold) e recupero (rec) in secondi. */
export interface Row {
  hold: number;
  rec: number;
}

export type SessionType = "test" | "co2" | "o2" | "pranayama" | "meditation" | "guided";

export interface SessionRecord {
  id: string;
  type: SessionType;
  title: string;
  startedAt: string; // ISO
  durationSec: number;
  roundsDone?: number;
  roundsInterrupted?: number;
  roundsTotal?: number;
  effort?: number; // 1-5
  note?: string;
  testSeconds?: number;
}

export interface Settings {
  sound: boolean;
  volume: number; // 0-1
  vibration: boolean;
  holdCue30: boolean;
  voiceURI: string | null;
  rate: number; // 0.7-1
}

export interface Profile {
  onboarded: boolean;
  safetyAcceptedAt: string | null;
  level: Level;
  pb: number | null; // secondi
  pbHistory: { date: string; seconds: number }[];
}

export interface CustomPreset {
  id: string;
  name: string;
  phases: [number, number, number, number]; // inspira, trattieni, espira, trattieni
  minutes: number;
}

export interface AppState {
  version: 1;
  profile: Profile;
  settings: Settings;
  sessions: SessionRecord[];
  customPresets: CustomPreset[];
}

/** [testo da leggere, pausa in secondi dopo il testo] */
export type Segment = [text: string, pauseSec: number];

export interface Meditation {
  id: string;
  title: string;
  category: string;
  description: string;
  /** Se presente, si riproduce questo file audio invece della sintesi vocale. */
  audioUrl?: string;
  segments: Segment[];
}
