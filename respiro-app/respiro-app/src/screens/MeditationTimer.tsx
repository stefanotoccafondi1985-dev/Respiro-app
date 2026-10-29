import { useEffect, useMemo, useRef, useState } from "react";
import { Summary, type Result } from "../components/Dialogs";
import { Seg } from "../components/ui";
import { beep, initAudio, vibrate } from "../lib/audio";
import { fmt } from "../lib/format";
import { useRunner, useWakeLock } from "../lib/hooks";

const DURATIONS = [5, 10, 15, 20, 30, 45, 60];

export function MeditationTimer() {
  const [minutes, setMinutes] = useState(10);
  const [interval, setIntervalMin] = useState(0);
  const [running, setRunning] = useState(false);

  if (running) return <Running minutes={minutes} interval={interval} onClose={() => setRunning(false)} />;

  return (
    <div className="card">
      <h2>Meditazione libera</h2>
      <div className="chips" role="group" aria-label="Durata">
        {DURATIONS.map((d) => (
          <button key={d} className="chip" aria-pressed={d === minutes} onClick={() => setMinutes(d)}>
            {d} min
          </button>
        ))}
      </div>
      <div className="field">
        <label>Campana a intervalli</label>
        <Seg
          label="Intervallo"
          value={String(interval)}
          onChange={(v) => setIntervalMin(Number(v))}
          options={[
            { value: "0", label: "Nessuna" },
            { value: "5", label: "5 min" },
            { value: "10", label: "10 min" },
          ]}
        />
      </div>
      <p className="hint">10 secondi di preparazione, campana all'inizio e alla fine. Schermo scuro con solo il tempo rimasto.</p>
      <button
        className="btn full"
        onClick={() => {
          initAudio();
          setRunning(true);
        }}
      >
        Avvia
      </button>
    </div>
  );
}

function Running({ minutes, interval, onClose }: { minutes: number; interval: number; onClose: () => void }) {
  const steps = useMemo(
    () => [
      { kind: "prep", label: "Preparati", seconds: 10 },
      { kind: "med", label: "Meditazione", seconds: minutes * 60 },
    ],
    [minutes],
  );
  const r = useRunner(steps);
  useWakeLock();
  const startedAt = useRef(new Date().toISOString());
  const [summary, setSummary] = useState<{ result: Result; manual: boolean } | null>(null);

  const finish = (manual: boolean) => {
    if (summary) return;
    beep(528, 0.9);
    setSummary({
      manual,
      result: {
        type: "meditation",
        title: `Meditazione ${minutes} min`,
        startedAt: startedAt.current,
        durationSec: Math.round(Math.max(0, r.elapsed - 10)),
      },
    });
  };
  useEffect(() => {
    if (r.finished) finish(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.finished]);

  useEffect(() => {
    if (r.step?.kind === "med") {
      beep(528, 0.7);
      vibrate(80);
    }
  }, [r.index, r.step?.kind]);

  const inMed = r.step?.kind === "med" ? r.elapsed - r.starts[r.index] : 0;
  const mark = interval > 0 ? Math.floor(inMed / (interval * 60)) : 0;
  useEffect(() => {
    if (mark > 0 && r.step?.kind === "med" && inMed < minutes * 60 - 5) beep(660, 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mark]);

  if (summary) return <Summary result={summary.result} manual={summary.manual} onClose={onClose} />;
  if (!r.step) return null;

  return (
    <div className="session" role="dialog" aria-label="Meditazione in corso">
      <div className="top">
        <span>{r.step.kind === "prep" ? "Preparati" : "Meditazione"}</span>
        <span />
      </div>
      <div className="mid">
        <div className="bigtime" aria-live="off">
          {fmt(Math.ceil(r.remaining))}
        </div>
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
