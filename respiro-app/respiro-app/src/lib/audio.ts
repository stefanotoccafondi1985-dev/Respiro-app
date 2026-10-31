import { Haptics } from "@capacitor/haptics";
import { getState } from "../store";
import { isNative } from "./platform";

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

/** Contesto audio condiviso (null se il browser non lo supporta o prima del primo tocco). */
export const getCtx = () => ctx;

let out: { ctx: AudioContext; node: AudioNode } | null = null;

/**
 * Uscita comune di tutti i suoni: un limitatore morbido che impedisce ai picchi
 * (gong o campana sopra al sottofondo) di superare il massimo e "gracchiare".
 */
export function getOut(c: AudioContext): AudioNode {
  if (out && out.ctx === c) return out.node;
  try {
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 12;
    comp.ratio.value = 14;
    comp.attack.value = 0.004;
    comp.release.value = 0.3;
    const trim = c.createGain();
    trim.gain.value = 0.9;
    comp.connect(trim);
    trim.connect(c.destination);
    out = { ctx: c, node: comp };
  } catch {
    out = { ctx: c, node: c.destination };
  }
  return out.node;
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
    g.connect(getOut(ctx));
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
  } catch {
    /* ignora */
  }
}

/** Vibrazione: nativa nell'app Android, Vibration API nel browser (non disponibile su iPhone). */
export function vibrate(ms: number) {
  if (!getState().settings.vibration) return;
  try {
    if (isNative()) {
      void Haptics.vibrate({ duration: Math.max(10, ms) }).catch(() => undefined);
    } else if ("vibrate" in navigator) {
      navigator.vibrate(ms);
    }
  } catch {
    /* ignora */
  }
}

/** Segnale combinato tono + vibrazione. */
export function cue(freq: number, vibMs = 60, dur = 0.15) {
  beep(freq, dur);
  vibrate(vibMs);
}
