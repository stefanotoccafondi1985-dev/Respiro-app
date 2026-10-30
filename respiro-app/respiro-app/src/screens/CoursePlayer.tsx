import { useEffect, useRef, useState } from "react";
import { Flame } from "../components/Flame";
import { Summary, type Result } from "../components/Dialogs";
import type { Lesson, View } from "../data/course";
import { initAudio } from "../lib/audio";
import { vibrate } from "../lib/audio";
import { parseFx } from "../lib/fx";
import { useWakeLock } from "../lib/hooks";
import { Narrator, speechSupported } from "../lib/narrator";
import { bowl, muteMusic, startMusic, stopMusic, thump } from "../lib/sound";
import { getState, markLessonDone } from "../store";

/**
 * Lezione del corso a schermo intero: la voce guida come un maestro, e gli effetti
 * (campana, impulsi con vibrazione, fiamma, schermo scuro) partono dopo ogni frase.
 */
export function CoursePlayer({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const total = lesson.segments.length;
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [view, setView] = useState<View>(lesson.view);
  const [pulse, setPulse] = useState(0);
  const [paused, setPaused] = useState(false);
  const [summary, setSummary] = useState<{ result: Result; manual: boolean } | null>(null);
  const narrator = useRef<Narrator | null>(null);
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);
  const startedAt = useRef(new Date().toISOString());
  const t0 = useRef(performance.now());
  const ended = useRef(false);
  useWakeLock();

  const clearFx = () => {
    timers.current.forEach(clearInterval);
    timers.current = [];
  };

  const end = (manual: boolean) => {
    if (ended.current) return;
    ended.current = true;
    clearFx();
    narrator.current?.stop();
    if (!manual) {
      bowl();
      markLessonDone(lesson.id);
    }
    setSummary({
      manual,
      result: {
        type: "guided",
        title: `Corso ${lesson.n}. ${lesson.title}`,
        startedAt: startedAt.current,
        durationSec: Math.round((performance.now() - t0.current) / 1000),
      },
    });
  };

  // effetti all'inizio di ogni pausa
  const onPause = (_i: number, seconds: number, fxText: string | undefined, resumed: boolean) => {
    clearFx();
    const fx = parseFx(fxText);
    if (fx.view) setView(fx.view);
    if (fx.bowl) {
      if (!resumed) bowl();
      const every = fx.bowl.every;
      if (every) timers.current.push(setInterval(() => bowl(), every * 1000));
    }
    if (fx.pulse) {
      const beat = () => {
        vibrate(70);
        thump();
        setPulse((n) => n + 1);
      };
      beat();
      timers.current.push(setInterval(beat, fx.pulse.every * 1000));
    }
    // le pulsazioni finiscono con la pausa
    if (fx.pulse || (fx.bowl && fx.bowl.every)) {
      const stop = setTimeout(clearFx, Math.max(0, seconds * 1000 - 300));
      timers.current.push(stop as unknown as ReturnType<typeof setInterval>);
    }
  };

  useEffect(() => {
    const s = getState().settings;
    const n = new Narrator(
      lesson.segments,
      { voiceURI: s.voiceURI, rate: s.rate, pitch: 0.88 }, // tono un po' più grave: voce da maestro
      {
        onSegment: (i, t) => {
          clearFx();
          setIdx(i);
          setText(t);
        },
        onPause,
        onEnd: () => end(false),
      },
    );
    narrator.current = n;
    initAudio();
    bowl();
    const id = setTimeout(() => n.start(), 2500);
    return () => {
      clearTimeout(id);
      clearFx();
      n.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sottofondo scelto prima di cominciare
  useEffect(() => {
    const { meditationMusic, meditationMusicVolume } = getState().settings;
    if (summary || meditationMusic === "off") return;
    startMusic(meditationMusic, meditationMusicVolume);
    return () => stopMusic(2.5);
  }, [summary]);
  useEffect(() => {
    muteMusic(paused);
  }, [paused]);

  const toggle = () => {
    if (paused) narrator.current?.resume();
    else {
      clearFx();
      narrator.current?.pause();
    }
    setPaused(!paused);
  };

  if (summary) return <Summary result={summary.result} manual={summary.manual} onClose={onClose} />;

  return (
    <div className="session" role="dialog" aria-label={lesson.title}>
      <div className="top">
        <span>
          Lezione {lesson.n}. {lesson.title}
        </span>
        <span>
          {Math.min(idx + 1, total)}/{total}
        </span>
      </div>
      <div className="mid" style={{ gap: 20 }}>
        {view === "flame" && <Flame />}
        {view === "orb" && <div className="gorb" aria-hidden="true" />}
        {view === "pulse" && <div key={pulse} className={`pulse-orb${pulse > 0 ? " beat" : ""}`} aria-hidden="true" />}
        {view === "dark" && <div className="dark-view" aria-hidden="true" />}
        {!speechSupported() ? (
          <p className="gtext">Questo browser non supporta la sintesi vocale.</p>
        ) : (
          <p className={`gtext${view === "dark" ? " dim" : ""}`} aria-live="polite">
            {text}
          </p>
        )}
      </div>
      <div className="ctl">
        <div className="pbar">
          <i style={{ width: `${(idx / total) * 100}%` }} />
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
