import { useEffect, useRef, useState } from "react";
import { Summary, type Result } from "../components/Dialogs";
import { beep } from "../lib/audio";
import { fmt } from "../lib/format";
import { useWakeLock } from "../lib/hooks";
import { Narrator, speechSupported } from "../lib/narrator";
import { getState } from "../store";
import type { Meditation } from "../types";

/**
 * Lettore a schermo intero. Se la meditazione ha un file audio (audioUrl) lo riproduce,
 * altrimenti la legge con la voce italiana del dispositivo.
 */
export function MeditationPlayer({ meditation, onClose }: { meditation: Meditation; onClose: () => void }) {
  const total = meditation.segments.length;
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [paused, setPaused] = useState(false);
  const [summary, setSummary] = useState<{ result: Result; manual: boolean } | null>(null);
  const narrator = useRef<Narrator | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [audioPos, setAudioPos] = useState({ t: 0, d: 0 });
  const startedAt = useRef(new Date().toISOString());
  const t0 = useRef(performance.now());
  const ended = useRef(false);
  useWakeLock();

  const end = (manual: boolean) => {
    if (ended.current) return;
    ended.current = true;
    narrator.current?.stop();
    audio.current?.pause();
    if (!manual) beep(528, 0.9);
    setSummary({
      manual,
      result: {
        type: "guided",
        title: meditation.title,
        startedAt: startedAt.current,
        durationSec: Math.round((performance.now() - t0.current) / 1000),
      },
    });
  };

  useEffect(() => {
    const s = getState().settings;
    if (meditation.audioUrl) {
      const a = new Audio(meditation.audioUrl);
      audio.current = a;
      a.onended = () => end(false);
      a.ontimeupdate = () => setAudioPos({ t: a.currentTime, d: a.duration || 0 });
      beep(528, 0.6);
      void a.play().catch(() => undefined);
      return () => a.pause();
    }
    const n = new Narrator(
      meditation.segments,
      { voiceURI: s.voiceURI, rate: s.rate },
      {
        onSegment: (i, t) => {
          setIdx(i);
          setText(t);
        },
        onEnd: () => end(false),
      },
    );
    narrator.current = n;
    beep(528, 0.6);
    const id = setTimeout(() => n.start(), 900);
    return () => {
      clearTimeout(id);
      n.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    if (paused) {
      narrator.current?.resume();
      void audio.current?.play();
    } else {
      narrator.current?.pause();
      audio.current?.pause();
    }
    setPaused(!paused);
  };

  if (summary) return <Summary result={summary.result} manual={summary.manual} onClose={onClose} />;

  const usingAudio = Boolean(meditation.audioUrl);
  const pct = usingAudio ? (audioPos.d ? (audioPos.t / audioPos.d) * 100 : 0) : (idx / total) * 100;

  return (
    <div className="session" role="dialog" aria-label={meditation.title}>
      <div className="top">
        <span>{meditation.title}</span>
        <span>{usingAudio ? `${fmt(audioPos.t)} / ${fmt(audioPos.d)}` : `${Math.min(idx + 1, total)}/${total}`}</span>
      </div>
      <div className="mid" style={{ gap: 24 }}>
        <div className="gorb" aria-hidden="true" />
        {!usingAudio && !speechSupported() ? (
          <p className="gtext">Questo browser non supporta la sintesi vocale. Leggi il testo a mente o esportalo in SSML.</p>
        ) : (
          <p className="gtext" aria-live="polite">
            {usingAudio ? "In ascolto…" : text}
          </p>
        )}
      </div>
      <div className="ctl">
        <div className="pbar">
          <i style={{ width: `${pct}%` }} />
        </div>
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn ghost" onClick={toggle}>
            {paused ? "Riprendi" : "Pausa"}
          </button>
          <button className="btn ghost" onClick={() => end(true)}>
            Termina
          </button>
        </div>
      </div>
    </div>
  );
}
