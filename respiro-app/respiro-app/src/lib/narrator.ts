import type { Segment } from "../types";
import { wordCount } from "./meditation";

export const speechSupported = () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

/** Voci italiane del dispositivo, con le più naturali in cima. */
export function italianVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return [];
  const pref = /natural|neural|premium|enhanced|alice|elsa|federica|luca|google/i;
  return speechSynthesis
    .getVoices()
    .filter((v) => /^it/i.test(v.lang))
    .sort((a, b) => Number(pref.test(b.name)) - Number(pref.test(a.name)));
}

function pickVoice(uri: string | null): SpeechSynthesisVoice | undefined {
  const list = italianVoices();
  return list.find((v) => v.voiceURI === uri) ?? list[0];
}

export interface SpeakOpts {
  voiceURI: string | null;
  rate: number;
  volume?: number;
}

/** Legge un testo; chiama done() alla fine (o se la sintesi si interrompe per errore). */
export function speak(text: string, o: SpeakOpts, done?: () => void) {
  if (!speechSupported()) {
    done?.();
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(o.voiceURI);
  u.lang = v?.lang ?? "it-IT";
  if (v) u.voice = v;
  u.rate = o.rate;
  u.pitch = 0.95;
  u.volume = o.volume ?? 1;
  let fired = false;
  const fin = () => {
    if (!fired) {
      fired = true;
      done?.();
    }
  };
  u.onend = fin;
  u.onerror = (e) => {
    if (e.error === "canceled" || e.error === "interrupted") return;
    fin();
  };
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (speechSupported()) {
    try {
      speechSynthesis.cancel();
    } catch {
      /* ignora */
    }
  }
}

export interface NarratorEvents {
  onSegment: (index: number, text: string) => void;
  onEnd: () => void;
}

/**
 * Legge una meditazione segmento per segmento: parla, aspetta la pausa, passa al successivo.
 * Le attese usano orari assoluti. Se l'evento "end" della sintesi non arriva mai
 * (succede su alcuni telefoni), un timer di sicurezza fa proseguire comunque.
 */
export class Narrator {
  private i = -1;
  private tok = 0;
  private phase: "idle" | "speak" | "wait" = "idle";
  private waitUntil = 0;
  private remain = 0;
  private waitTimer: ReturnType<typeof setInterval> | null = null;
  private safety: ReturnType<typeof setTimeout> | null = null;
  paused = false;

  constructor(
    private segments: Segment[],
    private opts: SpeakOpts,
    private ev: NarratorEvents,
  ) {}

  start() {
    stopSpeaking();
    this.next();
  }

  private clearTimers() {
    if (this.waitTimer) clearInterval(this.waitTimer);
    if (this.safety) clearTimeout(this.safety);
    this.waitTimer = null;
    this.safety = null;
  }

  private next() {
    this.i += 1;
    if (this.i >= this.segments.length) {
      this.phase = "idle";
      this.ev.onEnd();
      return;
    }
    this.say();
  }

  private say() {
    const [text] = this.segments[this.i];
    const tok = ++this.tok;
    this.phase = "speak";
    this.ev.onSegment(this.i, text);
    this.clearTimers();
    this.safety = setTimeout(() => this.afterSpeech(tok), (wordCount(text) / (1.4 * this.opts.rate) + 6) * 1000);
    speak(text, this.opts, () => this.afterSpeech(tok));
  }

  private afterSpeech(tok: number) {
    if (tok !== this.tok || this.paused || this.phase !== "speak") return;
    this.clearTimers();
    this.phase = "wait";
    this.waitUntil = performance.now() + this.segments[this.i][1] * 1000;
    this.waitTimer = setInterval(() => this.check(), 200);
  }

  private check() {
    if (this.paused) return;
    if (performance.now() >= this.waitUntil) {
      this.clearTimers();
      this.next();
    }
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    if (this.phase === "wait") {
      this.remain = Math.max(0, this.waitUntil - performance.now());
      this.clearTimers();
    } else if (this.phase === "speak") {
      this.tok += 1; // invalida la fine della frase interrotta
      this.clearTimers();
      stopSpeaking();
    }
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    if (this.phase === "wait") {
      this.waitUntil = performance.now() + this.remain;
      this.waitTimer = setInterval(() => this.check(), 200);
    } else if (this.phase === "speak") {
      this.say(); // rilegge la frase interrotta
    }
  }

  stop() {
    this.tok += 1;
    this.phase = "idle";
    this.clearTimers();
    stopSpeaking();
  }
}
