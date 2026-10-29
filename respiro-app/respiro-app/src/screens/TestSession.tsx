import { useEffect, useRef, useState } from "react";
import { CoachOptions } from "../components/CoachOptions";
import { Modal } from "../components/ui";
import { buildTestCoach, type CoachEvent } from "../lib/coach";
import { cue, initAudio } from "../lib/audio";
import { fmt, uid } from "../lib/format";
import { useWakeLock } from "../lib/hooks";
import { useCoach } from "../lib/useCoach";
import { addSession, getState, setPB } from "../store";

type Phase = "intro" | "running" | "result";

/** Test del massimo: cronometro in avanti. Il PB cambia solo se l'utente conferma. */
export function TestSession({ onClose, showCoach = false }: { onClose: () => void; showCoach?: boolean }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [, force] = useState(0);
  const t0 = useRef(0);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef("");
  const [events, setEvents] = useState<CoachEvent[]>([]);
  useWakeLock();
  useCoach(events, () => (performance.now() - t0.current) / 1000, phase === "running");

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => force((n) => n + 1), 200);
    return () => clearInterval(id);
  }, [phase]);

  const start = () => {
    initAudio();
    t0.current = performance.now();
    startedAt.current = new Date().toISOString();
    cue(880, 150, 0.25);
    const { coachGong, coachPhrases } = getState().settings;
    setEvents(buildTestCoach(getState().profile.pb, { gong: coachGong, phrases: coachPhrases }));
    setPhase("running");
  };
  const stop = () => {
    setSeconds(Math.floor((performance.now() - t0.current) / 1000));
    setPhase("result");
  };
  const record = (asPB: boolean) => {
    addSession({ id: uid(), type: "test", title: "Test del massimo", startedAt: startedAt.current, durationSec: seconds, testSeconds: seconds });
    if (asPB) setPB(Math.min(599, seconds));
    onClose();
  };

  if (phase === "result") {
    return (
      <Modal
        title="Risultato del test"
        actions={
          <>
            <button className="btn ghost" onClick={() => record(false)}>
              Non salvare come PB
            </button>
            <button className="btn" data-autofocus onClick={() => record(true)} disabled={seconds < 30}>
              Salva come PB
            </button>
          </>
        }
      >
        <p className="pbbig">{fmt(seconds)}</p>
        <p className="hint">
          Salvalo come PB solo se è un massimo reale e hai rispettato le regole di sicurezza. {seconds < 30 && "Sotto i 30 secondi il PB non si può salvare."}
        </p>
      </Modal>
    );
  }

  if (phase === "intro") {
    return (
      <div className="session" role="dialog" aria-label="Test del massimo">
        <div className="top">
          <span>Test del massimo</span>
        </div>
        <div className="mid" style={{ maxWidth: 420 }}>
          <h1>Prepara il test</h1>
          <ol className="hint" style={{ textAlign: "left", display: "grid", gap: 6, paddingLeft: 20 }}>
            <li>Seduto o sdraiato, a secco, in un posto sicuro.</li>
            <li>Respira in modo calmo e normale per 2-3 minuti, senza iperventilare.</li>
            <li>Un respiro tranquillo, poi apnea fino a un chiaro bisogno di respirare.</li>
            <li>Tocca Respira: l'app ti mostra il tempo.</li>
          </ol>
          {showCoach && <CoachOptions />}
        </div>
        <div className="ctl">
          <button className="btn big" onClick={start}>
            Inizia apnea
          </button>
          <button className="btn ghost" onClick={onClose}>
            Annulla
          </button>
        </div>
      </div>
    );
  }

  const e = Math.floor((performance.now() - t0.current) / 1000);
  return (
    <div className="session" role="dialog" aria-label="Test in corso">
      <div className="top">
        <span>Test del massimo</span>
      </div>
      <div className="mid">
        <div className="bigtime" aria-live="off">
          {fmt(e)}
        </div>
        <div className="phase">Apnea libera</div>
        <div className="next">Tocca Respira quando senti un chiaro bisogno di respirare</div>
      </div>
      <div className="ctl">
        <button className="btn big" onClick={stop}>
          Respira
        </button>
      </div>
    </div>
  );
}
