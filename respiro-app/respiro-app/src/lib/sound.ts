import { getState } from "../store";
import { getCtx } from "./audio";

/**
 * Suoni del coach generati al volo con Web Audio: nessun file da scaricare, nessun
 * problema di licenza, funzionano anche offline.
 */

/** Gong: una nota grave con armoniche non esatte (come un metallo che vibra) e una lunga coda. */
export function gong() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const { volume } = getState().settings;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = Math.max(0.05, 0.9 * volume);
    master.connect(ctx.destination);
    // [rapporto, ampiezza, durata della coda in secondi]
    const partials: [number, number, number][] = [
      [1, 1, 6],
      [2.01, 0.55, 4.2],
      [2.76, 0.45, 3.2],
      [4.07, 0.25, 2.2],
      [5.4, 0.16, 1.6],
      [8.93, 0.08, 1],
    ];
    const base = 164.8; // Mi3
    for (const [ratio, amp, decay] of partials) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = base * ratio;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.32 * amp, now + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      o.connect(g);
      g.connect(master);
      o.start(now);
      o.stop(now + decay + 0.05);
      // leggero battimento: la stessa armonica un filo scordata
      if (ratio === 1) {
        const o2 = ctx.createOscillator();
        o2.type = "sine";
        o2.frequency.value = base * 1.004;
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.0001, now);
        g2.gain.exponentialRampToValueAtTime(0.18, now + 0.012);
        g2.gain.exponentialRampToValueAtTime(0.0001, now + 5);
        o2.connect(g2);
        g2.connect(master);
        o2.start(now);
        o2.stop(now + 5.05);
      }
    }
  } catch {
    /* ignora */
  }
}

/** Rumore marrone: rumore bianco integrato (potenza che cala con la frequenza), profondo e morbido. */
export function makeBrownNoise(ctx: BaseAudioContext, seconds = 24, fade = 2): AudioBuffer {
  const rate = ctx.sampleRate;
  const total = Math.floor(seconds * rate);
  const f = Math.floor(fade * rate);
  const raw = new Float32Array(total + f);
  let last = 0;
  for (let i = 0; i < raw.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02; // integratore con perdita: niente deriva
    raw[i] = last * 3.5;
  }
  // chiude il giro: la coda sfuma nell'inizio, così il ciclo non ha scatti
  const out = new Float32Array(total);
  for (let i = 0; i < total; i++) out[i] = raw[i];
  for (let i = 0; i < f; i++) {
    const a = i / f;
    out[i] = raw[i] * Math.sin((a * Math.PI) / 2) + raw[total + i] * Math.cos((a * Math.PI) / 2);
  }
  let peak = 0;
  for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(out[i]));
  const k = peak > 0 ? 0.7 / peak : 1;
  for (let i = 0; i < total; i++) out[i] *= k;
  const buf = ctx.createBuffer(1, total, rate);
  buf.copyToChannel(out, 0);
  return buf;
}

/** Note del pad (Re maggiore con nona), molto lente e soffici. */
export const PAD_NOTES: [freq: number, gain: number, lfoHz: number][] = [
  [73.42, 0.5, 0.045],
  [110, 0.42, 0.06],
  [146.83, 0.34, 0.05],
  [185, 0.22, 0.075],
  [220, 0.22, 0.055],
  [277.18, 0.12, 0.09],
  [329.63, 0.09, 0.07],
];

export type MusicKind = "brown" | "pad";

interface Music {
  kind: MusicKind;
  gain: GainNode;
  stop: () => void;
}

let music: Music | null = null;
let userVolume = 0.5;
let ducked = false;
let muted = false;

const level = () => (muted ? 0.0001 : Math.max(0.0001, userVolume * userVolume * (ducked ? 0.4 : 1))); // curva quadratica: il volume basso è davvero basso

function ramp(gain: GainNode, ctx: AudioContext, to: number, secs: number) {
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
  gain.gain.linearRampToValueAtTime(to, now + secs);
}

export function startMusic(kind: MusicKind, volume: number) {
  stopMusic(0);
  const ctx = getCtx();
  if (!ctx) return;
  try {
    userVolume = volume;
    ducked = false;
    muted = false;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.connect(ctx.destination);
    const stops: (() => void)[] = [];

    if (kind === "brown") {
      const src = ctx.createBufferSource();
      src.buffer = makeBrownNoise(ctx);
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 28;
      src.connect(lp);
      lp.connect(hp);
      hp.connect(gain);
      src.start();
      stops.push(() => src.stop());
    } else {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1100;
      lp.connect(gain);
      // eco morbido per dare spazio al suono
      const delay = ctx.createDelay(1);
      delay.delayTime.value = 0.42;
      const fb = ctx.createGain();
      fb.gain.value = 0.38;
      const dl = ctx.createBiquadFilter();
      dl.type = "lowpass";
      dl.frequency.value = 700;
      lp.connect(delay);
      delay.connect(dl);
      dl.connect(fb);
      fb.connect(delay);
      dl.connect(gain);
      for (const [freq, g, lfoHz] of PAD_NOTES) {
        for (const cents of [-4, 4]) {
          const o = ctx.createOscillator();
          o.type = "sine";
          o.frequency.value = freq;
          o.detune.value = cents;
          const v = ctx.createGain();
          v.gain.value = g * 0.12;
          // ogni nota sale e scende molto lentamente, a tempi diversi
          const lfo = ctx.createOscillator();
          lfo.frequency.value = lfoHz * (cents < 0 ? 1 : 1.13);
          const depth = ctx.createGain();
          depth.gain.value = g * 0.1;
          lfo.connect(depth);
          depth.connect(v.gain);
          o.connect(v);
          v.connect(lp);
          o.start();
          lfo.start();
          stops.push(() => o.stop(), () => lfo.stop());
        }
      }
    }
    ramp(gain, ctx, level(), 2.5);
    music = {
      kind,
      gain,
      stop: () => {
        for (const s of stops) {
          try {
            s();
          } catch {
            /* già fermo */
          }
        }
        gain.disconnect();
      },
    };
  } catch {
    music = null;
  }
}

/** Ferma il sottofondo con una dissolvenza (in secondi). */
export function stopMusic(fade = 1.5) {
  const m = music;
  music = null;
  if (!m) return;
  const ctx = getCtx();
  if (!ctx || fade <= 0) return m.stop();
  try {
    ramp(m.gain, ctx, 0.0001, fade);
    setTimeout(() => m.stop(), fade * 1000 + 100);
  } catch {
    m.stop();
  }
}

export function setMusicVolume(volume: number) {
  userVolume = volume;
  const ctx = getCtx();
  if (music && ctx) ramp(music.gain, ctx, level(), 0.3);
}

/** Abbassa un po' il sottofondo mentre parla la voce. */
export function duckMusic(on: boolean) {
  ducked = on;
  const ctx = getCtx();
  if (music && ctx) ramp(music.gain, ctx, level(), 0.4);
}

export const musicPlaying = () => music?.kind ?? null;

/** Silenzia il sottofondo (per esempio in pausa) con una breve dissolvenza, e lo riporta al volume scelto. */
export function muteMusic(on: boolean) {
  muted = on;
  const ctx = getCtx();
  if (music && ctx) ramp(music.gain, ctx, level(), on ? 0.6 : 1.2);
}

/** Campana tibetana: un colpo morbido con armoniche non esatte e una coda lunga. */
export function bowl() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const { volume } = getState().settings;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = Math.max(0.05, 0.8 * volume);
    master.connect(ctx.destination);
    // [rapporto, ampiezza, durata della coda in secondi]
    const partials: [number, number, number][] = [
      [1, 1, 11],
      [2.71, 0.5, 7],
      [5.2, 0.28, 4.5],
      [8.6, 0.12, 2.5],
    ];
    const base = 261.6; // Do4
    for (const [ratio, amp, decay] of partials) {
      for (const detune of ratio === 1 ? [0, 1.6] : [0]) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = base * ratio + detune; // lo scarto di 1,6 Hz crea il battimento della campana
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.28 * amp, now + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
        o.connect(g);
        g.connect(master);
        o.start(now);
        o.stop(now + decay + 0.05);
      }
    }
  } catch {
    /* ignora */
  }
}

/** Battito grave, per chi non sente la vibrazione del telefono (iPhone, computer). */
export function thump() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const { volume } = getState().settings;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(90, now);
    o.frequency.exponentialRampToValueAtTime(55, now + 0.3);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(Math.max(0.05, 0.6 * volume), now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(now);
    o.stop(now + 0.5);
  } catch {
    /* ignora */
  }
}
