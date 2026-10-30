import { TextToSpeech } from "@capacitor-community/text-to-speech";
import type { Segment } from "../types";
import { wordCount } from "./meditation";
import { isNative } from "./platform";

export interface VoiceInfo {
  voiceURI: string;
  name: string;
  lang: string;
  /** Posizione nell'elenco delle voci del dispositivo (solo app nativa). */
  nativeIndex?: number;
}

const webSpeech = () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

/** Nell'app Android la voce è quella nativa del telefono, più affidabile di quella del browser. */
export const speechSupported = () => isNative() || webSpeech();

const PREFERRED = /natural|neural|premium|enhanced|alice|elsa|federica|luca|google/i;
const byQuality = (a: VoiceInfo, b: VoiceInfo) => Number(PREFERRED.test(b.name)) - Number(PREFERRED.test(a.name));

let nativeVoices: VoiceInfo[] = [];

/** Voci italiane disponibili, con le più naturali in cima. */
export async function loadItalianVoices(): Promise<VoiceInfo[]> {
  try {
    if (isNative()) {
      const { voices } = await TextToSpeech.getSupportedVoices();
      nativeVoices = voices
        .map((v, i) => ({ voiceURI: v.voiceURI, name: v.name, lang: v.lang, nativeIndex: i }))
        .filter((v) => /^it/i.test(v.lang.replace("_", "-")));
      return [...nativeVoices].sort(byQuality);
    }
    if (webSpeech()) {
      return speechSynthesis
        .getVoices()
        .filter((v) => /^it/i.test(v.lang))
        .map((v) => ({ voiceURI: v.voiceURI, name: v.name, lang: v.lang }))
        .sort(byQuality);
    }
  } catch {
    /* ignora */
  }
  return [];
}

export interface SpeakOpts {
  voiceURI: string | null;
  rate: number;
  volume?: number;
  /** Tono della voce, 1 = normale. Predefinito 0,95. */
  pitch?: number;
}

/** Legge un testo; chiama done() alla fine (o se la sintesi si interrompe per errore). */
export function speak(text: string, o: SpeakOpts, done?: () => void) {
  let fired = false;
  const fin = () => {
    if (!fired) {
      fired = true;
      done?.();
    }
  };

  if (isNative()) {
    const v = nativeVoices.find((x) => x.voiceURI === o.voiceURI) ?? nativeVoices[0];
    TextToSpeech.speak({
      text,
      lang: v?.lang.replace("_", "-") ?? "it-IT",
      rate: o.rate,
      pitch: o.pitch ?? 0.95,
      volume: o.volume ?? 1,
      voice: v?.nativeIndex,
    })
      .then(fin)
      .catch(fin);
    return;
  }

  if (!webSpeech()) return fin();
  const u = new SpeechSynthesisUtterance(text);
  const wv = speechSynthesis.getVoices().filter((v) => /^it/i.test(v.lang));
  const v = wv.find((x) => x.voiceURI === o.voiceURI) ?? wv[0];
  u.lang = v?.lang ?? "it-IT";
  if (v) u.voice = v;
  u.rate = o.rate;
  u.pitch = o.pitch ?? 0.95;
  u.volume = o.volume ?? 1;
  u.onend = fin;
  u.onerror = (e) => {
    if (e.error === "canceled" || e.error === "interrupted") return;
    fin();
  };
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  try {
    if (isNative()) void TextToSpeech.stop().catch(() => undefined);
    else if (webSpeech()) speechSynthesis.cancel();
  } catch {
    /* ignora */
  }
}

export interface NarratorEvents {
  onSegment: (index: number, text: string) => void;
  /** Inizio della pausa dopo una frase. `resumed` è vero se riparte dopo una pausa dell'utente. */
  onPause?: (index: number, seconds: number, fx: string | undefined, resumed: boolean) => void;
  onEnd: () => void;
}

/**
 * Legge una meditazione segmento per segmento: parla, aspetta la pausa, passa al successivo.
 * Le attese usano orari assoluti. Se la fine della sintesi non viene mai segnalata
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

  async start() {
    stopSpeaking();
    if (isNative()) await loadItalianVoices(); // serve l'indice della voce scelta
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
    this.ev.onPause?.(this.i, this.segments[this.i][1], this.segments[this.i][2], false);
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
      this.ev.onPause?.(this.i, this.remain / 1000, this.segments[this.i][2], true);
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
