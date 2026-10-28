import { useState } from "react";
import { CautionModal } from "../components/Dialogs";
import { Modal, Seg, Stepper } from "../components/ui";
import { techniques, type Phases, type Technique } from "../data/pranayama";
import { uid } from "../lib/format";
import { deleteCustomPreset, saveCustomPreset, useStore } from "../store";
import { PranayamaSession, type CueMode, type SessionPlan } from "./PranayamaSession";

const LABELS = ["Inspira", "Trattieni (pieno)", "Espira", "Trattieni (vuoto)"];

interface Setup {
  title: string;
  phases: Phases;
  minutes: number;
  cycles?: number;
  nostril?: boolean;
}

export function Pranayama() {
  const { customPresets } = useStore();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [caution, setCaution] = useState<Technique | null>(null);
  const [plan, setPlan] = useState<SessionPlan | null>(null);

  const open = (t: Technique) => {
    if (t.caution) return setCaution(t);
    launch(t);
  };
  const launch = (t: Technique) => {
    setCaution(null);
    if (t.kind === "rhythm" && t.rhythm) {
      setPlan({ mode: "rhythm", title: t.name, cueMode: "tone", ...t.rhythm });
    } else if (t.phases) {
      const len = t.phases.reduce((a, b) => a + b, 0);
      const minutes = t.minutes ?? (t.cycles ? Math.max(1, Math.round((t.cycles * len) / 60)) : 5);
      setSetup({ title: t.name, phases: [...t.phases] as Phases, minutes, cycles: t.cycles, nostril: t.nostril });
    }
  };

  if (plan) return <PranayamaSession plan={plan} onClose={() => setPlan(null)} />;

  return (
    <>
      <div className="list">
        {techniques.map((t) => (
          <button key={t.id} className="item" onClick={() => open(t)}>
            <span>
              <b>{t.name}</b>
              <small>{t.sub}</small>
            </span>
            <span className="pat">{t.phases ? t.phases.join("-") : `${t.rhythm?.bpm}/min`}</span>
          </button>
        ))}
      </div>
      {customPresets.length > 0 && (
        <>
          <h2>I tuoi preset</h2>
          <div className="list">
            {customPresets.map((p) => (
              <div key={p.id} className="med">
                <button className="item" onClick={() => setSetup({ title: p.name, phases: p.phases, minutes: p.minutes })}>
                  <span>
                    <b>{p.name}</b>
                    <small>{p.minutes} min</small>
                  </span>
                  <span className="pat">{p.phases.join("-")}</span>
                </button>
                <button className="btn ghost small" aria-label={`Elimina ${p.name}`} onClick={() => deleteCustomPreset(p.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      {caution && <CautionModal onCancel={() => setCaution(null)} onConfirm={() => launch(caution)} />}
      {setup && <SetupDialog setup={setup} onCancel={() => setSetup(null)} onStart={(p) => (setSetup(null), setPlan(p))} />}
    </>
  );
}

function SetupDialog({ setup, onCancel, onStart }: { setup: Setup; onCancel: () => void; onStart: (p: SessionPlan) => void }) {
  const [phases, setPhases] = useState<Phases>(setup.phases);
  const [minutes, setMinutes] = useState(setup.minutes);
  const [cueMode, setCueMode] = useState<CueMode>("tone");
  const [name, setName] = useState("");
  // il numero fisso di cicli (es. 4-7-8) vale solo finché non cambi durata o fasi
  const [custom, setCustom] = useState(false);
  const cycleLen = phases.reduce((a, b) => a + b, 0);
  const cycles = setup.cycles && !custom ? setup.cycles : Math.max(1, Math.floor((minutes * 60) / Math.max(1, cycleLen)));
  const setPhase = (i: number, v: number) => {
    setCustom(true);
    setPhases((p) => p.map((x, j) => (j === i ? v : x)) as Phases);
  };
  const valid = phases[0] > 0 && phases[2] > 0;

  return (
    <Modal
      title={setup.title}
      actions={
        <>
          <button className="btn ghost" onClick={onCancel}>
            Annulla
          </button>
          <button
            className="btn"
            data-autofocus
            disabled={!valid}
            onClick={() => onStart({ mode: "phases", title: setup.title, phases, cycles, nostril: setup.nostril, cueMode })}
          >
            Avvia
          </button>
        </>
      }
    >
      {phases.map((v, i) => (
        <Stepper key={i} label={LABELS[i]} value={v} min={0} max={20} step={0.5} format={(x) => `${x} s`} onChange={(x) => setPhase(i, x)} />
      ))}
      <Stepper label="Durata" value={minutes} min={1} max={30} step={1} format={(x) => `${x} min`} onChange={(x) => {
          setCustom(true);
          setMinutes(x);
        }}
      />
      <p className="hint">Circa {cycles} cicli da {cycleLen} s.</p>
      <div className="field">
        <label>Segnali</label>
        <Seg
          label="Tipo di segnale"
          value={cueMode}
          onChange={setCueMode}
          options={[
            { value: "tone", label: "Tono" },
            { value: "voice", label: "Voce" },
            { value: "vibration", label: "Vibrazione" },
          ]}
        />
      </div>
      <div className="field">
        <label htmlFor="pname">Salva come preset personale</label>
        <div className="row" style={{ flexWrap: "nowrap" }}>
          <input id="pname" type="text" placeholder="Nome del preset" value={name} onChange={(e) => setName(e.target.value)} />
          <button
            className="btn ghost small"
            disabled={!name.trim() || !valid}
            onClick={() => {
              saveCustomPreset({ id: uid(), name: name.trim(), phases, minutes });
              setName("");
            }}
          >
            Salva
          </button>
        </div>
      </div>
    </Modal>
  );
}
