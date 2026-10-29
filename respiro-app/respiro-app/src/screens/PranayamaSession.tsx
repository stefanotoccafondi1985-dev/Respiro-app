import { useEffect, useMemo, useRef, useState } from "react";
import { Summary, type Result } from "../components/Dialogs";
import { BreathShape, Nose } from "../components/BreathShape";
import { Ring } from "../components/ui";
import { cue, initAudio, vibrate } from "../lib/audio";
import { fmt } from "../lib/format";
import { useRunner, useWakeLock, type Step } from "../lib/hooks";
import { speak, stopSpeaking } from "../lib/narrator";
import { nostrilText } from "../lib/shape";
import { getState } from "../store";
import type { Phases } from "../data/pranayama";

export type CueMode = "tone" | "voice" | "vibration";

export type SessionPlan =
  | { mode: "phases"; title: string; phases: Phases; cycles: number; nostril?: boolean; cueMode: CueMode }
  | { mode: "rhythm"; title: string; bpm: number; rounds: number; strokes: number; rest: number; cueMode: CueMode };

const PH = ["Inspira", "Trattieni", "Espira", "Trattieni"];
const KINDS = ["in", "h1", "out", "h2"];
const FREQ: Record<string, number> = { in: 600, h1: 500, out: 420, h2: 500 };

function buildSteps(plan: SessionPlan): Step[] {
  const s: Step[] = [{ kind: "prep", label: "Preparati", seconds: 5 }];
  if (plan.mode === "phases") {
    for (let c = 1; c <= plan.cycles; c++) {
      plan.phases.forEach((d, j) => {
        if (d > 0) s.push({ kind: KINDS[j], label: PH[j], seconds: d, round: c });
      });
    }
  } else {
    for (let r = 1; r <= plan.rounds; r++) {
      s.push({ kind: "beat", label: "Colpi", seconds: (plan.strokes * 60) / plan.bpm, round: r });
      if (r < plan.rounds) s.push({ kind: "rest", label: "Respira normalmente", seconds: plan.rest, round: r });
    }
  }
  return s;
}

export function PranayamaSession({ plan, onClose }: { plan: SessionPlan; onClose: () => void }) {
  const steps = useMemo(() => buildSteps(plan), [plan]);
  const r = useRunner(steps);
  useWakeLock();
  const startedAt = useRef(new Date().toISOString());
  const [summary, setSummary] = useState<{ result: Result; manual: boolean } | null>(null);
  const total = plan.mode === "phases" ? plan.cycles : plan.rounds;

  useEffect(() => {
    initAudio();
    return () => stopSpeaking();
  }, []);

  const finish = (manual: boolean) => {
    if (summary) return;
    stopSpeaking();
    setSummary({
      manual,
      result: { type: "pranayama", title: plan.title, startedAt: startedAt.current, durationSec: Math.round(r.elapsed) },
    });
  };
  useEffect(() => {
    if (r.finished) finish(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.finished]);

  // segnale di cambio fase secondo la modalità scelta
  useEffect(() => {
    const st = r.step;
    if (!st || st.kind === "prep" || plan.cueMode === undefined) return;
    if (st.kind === "beat" || st.kind === "rest") {
      if (st.kind === "rest") cue(440, 100);
      return;
    }
    if (plan.cueMode === "tone") cue(FREQ[st.kind] ?? 500, 30);
    else if (plan.cueMode === "vibration") vibrate(40);
    else speak(st.label, { voiceURI: getState().settings.voiceURI, rate: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.index]);

  // metronomo per Kapalabhati e Bhastrika
  const inPhase = r.step ? r.elapsed - (r.starts[r.index] ?? 0) : 0;
  const beatNo = plan.mode === "rhythm" && r.step?.kind === "beat" ? Math.floor((inPhase * plan.bpm) / 60) : -1;
  useEffect(() => {
    if (beatNo >= 0) cue(beatNo % 10 === 9 ? 700 : 520, 20, 0.05);
  }, [beatNo]);

  if (summary) return <Summary result={summary.result} manual={summary.manual} onClose={onClose} />;
  if (!r.step) return null;

  const st = r.step;
  const scale =
    st.kind === "in" ? 0.5 + 0.5 * r.progress : st.kind === "out" ? 1 - 0.5 * r.progress : st.kind === "h1" ? 1 : st.kind === "beat" ? 0.75 + 0.25 * ((beatNo % 2 === 0) ? 1 : 0) : 0.5;
  const hint = plan.mode === "phases" && plan.nostril && st.round ? nostrilText(st.kind, st.round) : "";
  const sec = Math.ceil(r.remaining);
  const beatsLeft = plan.mode === "rhythm" && st.kind === "beat" ? plan.strokes - Math.min(plan.strokes, beatNo + 1) : null;

  return (
    <div className="session" role="dialog" aria-label={plan.title}>
      <div className="top">
        <span>{plan.title}</span>
        <span>{st.round ? `${plan.mode === "phases" ? "Ciclo" : "Round"} ${st.round}/${total}` : ""}</span>
      </div>
      <div className="mid">
        {plan.mode === "phases" ? (
          <>
            {plan.nostril && <Nose kind={st.kind} cycle={st.round ?? 1} />}
            <BreathShape
              phases={plan.phases}
              steps={r.steps}
              starts={r.starts}
              ends={r.ends}
              getElapsed={r.getElapsed}
              activeKind={st.kind}
            />
            <div className="time small">{fmt(sec)}</div>
          </>
        ) : (
          <Ring progress={r.progress} color="var(--accent)">
            <div
              className="orb"
              style={{ transform: `scale(${0.6 + 0.4 * scale})`, opacity: 0.12 + 0.22 * scale, transition: "none" }}
            />
            <div className="time">{beatsLeft !== null ? beatsLeft : fmt(sec)}</div>
          </Ring>
        )}
        <div className="phase" aria-live="polite">
          {st.label}
        </div>
        <div className="next">{hint || (beatsLeft !== null ? "Colpi rimasti" : "")}</div>
      </div>
      <div className="ctl">
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn ghost" onClick={() => (r.paused ? r.resume() : r.pause())}>
            {r.paused ? "Riprendi" : "Pausa"}
          </button>
          <button className="btn ghost" onClick={() => finish(true)}>
            Termina
          </button>
        </div>
      </div>
    </div>
  );
}
