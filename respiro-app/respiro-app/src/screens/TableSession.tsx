import { useEffect, useMemo, useRef, useState } from "react";
import { Summary, type Result } from "../components/Dialogs";
import { Ring } from "../components/ui";
import { beep, cue, initAudio } from "../lib/audio";
import { fmt } from "../lib/format";
import { useRunner, useWakeLock, type Step } from "../lib/hooks";
import { useStore } from "../store";
import type { Row, TableType } from "../types";

const NAMES: Record<string, string> = { prep: "Preparati", rec: "Recupero", hold: "Apnea", cool: "Defaticamento" };

function buildSteps(rows: Row[]): Step[] {
  const s: Step[] = [{ kind: "prep", label: NAMES.prep, seconds: 10 }];
  rows.forEach((r, i) => {
    s.push({ kind: "rec", label: NAMES.rec, seconds: r.rec, round: i + 1 });
    s.push({ kind: "hold", label: NAMES.hold, seconds: r.hold, round: i + 1 });
  });
  s.push({ kind: "cool", label: NAMES.cool, seconds: 120 });
  return s;
}

/**
 * Sessione a schermo intero. Ogni round: recupero (respiro libero), poi apnea.
 * "Respira" chiude subito l'apnea e segna il round come interrotto, senza messaggi di fallimento.
 */
export function TableSession({ type, rows, onClose }: { type: TableType; rows: Row[]; onClose: () => void }) {
  const steps = useMemo(() => buildSteps(rows), [rows]);
  const r = useRunner(steps);
  const { settings } = useStore();
  useWakeLock();
  const interrupted = useRef(new Set<number>());
  const startedAt = useRef(new Date().toISOString());
  const [summary, setSummary] = useState<{ result: Result; manual: boolean } | null>(null);

  useEffect(() => {
    initAudio();
  }, []);

  const finish = (manual: boolean) => {
    if (summary) return;
    const e = r.elapsed;
    let done = 0;
    steps.forEach((s, i) => {
      if (s.kind === "hold" && e >= r.ends[i] && !interrupted.current.has(s.round!)) done++;
    });
    setSummary({
      manual,
      result: {
        type,
        title: `Tabella ${type === "co2" ? "CO2" : "O2"}`,
        startedAt: startedAt.current,
        durationSec: Math.round(e),
        roundsDone: done,
        roundsInterrupted: interrupted.current.size,
        roundsTotal: rows.length,
      },
    });
  };

  useEffect(() => {
    if (r.finished) finish(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.finished]);

  // segnali di cambio fase
  useEffect(() => {
    if (!r.step) return;
    if (r.step.kind === "hold") cue(880, 200, 0.25);
    else if (r.step.kind === "rec" || r.step.kind === "cool") cue(440, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.index]);

  // conto alla rovescia sul recupero: 10, 3, 2, 1 secondi
  const sec = Math.ceil(r.remaining);
  useEffect(() => {
    if (r.step?.kind === "rec" && [10, 3, 2, 1].includes(sec)) cue(sec === 10 ? 660 : 520, sec === 10 ? 120 : 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.index, sec]);

  // avviso facoltativo ogni 30 s durante l'apnea
  const inPhase = Math.floor(r.elapsed - (r.starts[r.index] ?? 0));
  useEffect(() => {
    if (settings.holdCue30 && r.step?.kind === "hold" && inPhase > 0 && inPhase % 30 === 0) beep(440, 0.1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.index, inPhase]);

  if (summary) return <Summary result={summary.result} manual={summary.manual} onClose={onClose} />;
  if (!r.step) return null;

  const isHold = r.step.kind === "hold";
  const next = steps[r.index + 1];
  const color = isHold ? "var(--hold)" : "var(--accent)";

  return (
    <div className="session" role="dialog" aria-label="Sessione di apnea">
      <div className="top">
        <span>Tabella {type === "co2" ? "CO2" : "O2"}</span>
        <span>{r.step.round ? `Round ${r.step.round}/${rows.length}` : ""}</span>
      </div>
      <div className="mid">
        <Ring progress={r.progress} color={color}>
          <div className="orb" />
          <div className="time">{fmt(sec)}</div>
        </Ring>
        <div className="phase" aria-live="polite">
          {r.step.label}
        </div>
        <div className="next">{next ? `Poi: ${next.label} ${fmt(next.seconds)}` : "Ultima fase"}</div>
      </div>
      <div className="ctl">
        {isHold && (
          <button
            className="btn big"
            onClick={() => {
              interrupted.current.add(r.step!.round!);
              r.skip();
            }}
          >
            Respira
          </button>
        )}
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
