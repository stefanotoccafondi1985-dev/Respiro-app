import { getState } from "../store";

let ctx: AudioContext | null = null;

/** Da chiamare dentro un tocco dell'utente: i browser bloccano l'audio prima. */
export function initAudio() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

/** Tono sinusoidale generato al volo: nessun file audio necessario. */
export function beep(freq: number, dur = 0.15) {
  const { sound, volume } = getState().settings;
  if (!ctx || !sound) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    const peak = Math.max(0.0002, 0.35 * volume);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
  } catch {
    /* ignora */
  }
}

export function vibrate(ms: number | number[]) {
  try {
    if (getState().settings.vibration && "vibrate" in navigator) navigator.vibrate(ms);
  } catch {
    /* ignora */
  }
}

/** Segnale combinato tono + vibrazione. */
export function cue(freq: number, vibMs = 60, dur = 0.15) {
  beep(freq, dur);
  vibrate(vibMs);
}
