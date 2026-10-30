import { useSyncExternalStore } from "react";
import type { AppState, CustomPreset, Profile, SessionRecord, Settings } from "./types";

const KEY = "respiro:v1";

const defaults: AppState = {
  version: 1,
  profile: { onboarded: false, safetyAcceptedAt: null, level: "intermediate", pb: null, pbHistory: [] },
  settings: { sound: true, volume: 0.7, vibration: true, coachGong: false, coachPhrases: false, coachMusic: "off", coachMusicVolume: 0.5, meditationMusic: "off", meditationMusicVolume: 0.5, voiceURI: null, rate: 0.85 },
  sessions: [],
  customPresets: [],
};

/** Unisce i dati salvati ai valori predefiniti: un punto unico dove aggiungere future migrazioni. */
function migrate(raw: unknown): AppState {
  const p = (raw ?? {}) as Partial<AppState>;
  // la vecchia opzione "avviso ogni 30 s" diventa il gong del coach
  const old = (p.settings ?? {}) as { holdCue30?: boolean; coachGong?: boolean };
  const carried = old.coachGong === undefined && old.holdCue30 ? { coachGong: true } : {};
  return {
    version: 1,
    profile: { ...defaults.profile, ...(p.profile ?? {}) },
    settings: { ...defaults.settings, ...(p.settings ?? {}), ...carried },
    sessions: Array.isArray(p.sessions) ? p.sessions : [],
    customPresets: Array.isArray(p.customPresets) ? p.customPresets : [],
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? migrate(JSON.parse(raw)) : migrate(null);
  } catch {
    return migrate(null);
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

export const getState = () => state;

function commit(next: AppState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* archiviazione non disponibile: i dati restano in memoria */
  }
  listeners.forEach((l) => l());
}

export function useStore(): AppState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getState,
  );
}

export const updateSettings = (s: Partial<Settings>) => commit({ ...state, settings: { ...state.settings, ...s } });
export const updateProfile = (p: Partial<Profile>) => commit({ ...state, profile: { ...state.profile, ...p } });
export const addSession = (r: SessionRecord) => commit({ ...state, sessions: [r, ...state.sessions] });

/** Il PB cambia solo da qui, su conferma dell'utente. */
export function setPB(seconds: number) {
  const v = Math.max(30, Math.round(seconds));
  commit({
    ...state,
    profile: {
      ...state.profile,
      pb: v,
      pbHistory: [...state.profile.pbHistory, { date: new Date().toISOString(), seconds: v }],
    },
  });
}

export const saveCustomPreset = (p: CustomPreset) => commit({ ...state, customPresets: [...state.customPresets, p] });
export const deleteCustomPreset = (id: string) =>
  commit({ ...state, customPresets: state.customPresets.filter((p) => p.id !== id) });

export const exportJson = () => JSON.stringify(state, null, 2);

export function resetAll() {
  commit(migrate(null));
}
