import { useState } from "react";
import { SAFETY_RULES } from "../components/Dialogs";
import { Seg } from "../components/ui";
import { setPB, updateProfile } from "../store";
import type { Level } from "../types";

export function Onboarding({ onTest }: { onTest: () => void }) {
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [level, setLevel] = useState<Level>("beginner");
  const [min, setMin] = useState("");
  const [sec, setSec] = useState("");

  const finish = (startTest: boolean) => {
    const total = (parseInt(min, 10) || 0) * 60 + (parseInt(sec, 10) || 0);
    if (total >= 30) setPB(total);
    updateProfile({ onboarded: true, level, safetyAcceptedAt: new Date().toISOString() });
    if (startTest) onTest();
  };

  return (
    <div className="app">
      <div className="page" style={{ justifyContent: "center" }}>
        {step === 0 && (
          <>
            <h1>Respiro</h1>
            <p className="sub">Tabelle CO2 e O2, pranayama e meditazioni guidate in italiano. Funziona anche senza connessione.</p>
            <button className="btn full" onClick={() => setStep(1)}>
              Comincia
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <h1>Sicurezza</h1>
            <div className="card">
              <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
                {SAFETY_RULES.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <label className="chk" style={{ color: "var(--fg)" }}>
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              Ho letto e accetto
            </label>
            <button className="btn full" disabled={!accepted} onClick={() => setStep(2)}>
              Continua
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <h1>Il tuo livello</h1>
            <Seg
              label="Livello"
              value={level}
              onChange={setLevel}
              options={[
                { value: "beginner", label: "Principiante" },
                { value: "intermediate", label: "Intermedio" },
              ]}
            />
            <div className="card">
              <h2>Personal best di apnea</h2>
              <p className="hint">Se lo conosci, inseriscilo. Altrimenti misuralo ora con il test del massimale, da riposato e in un posto sicuro.</p>
              <div className="row">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={9}
                  placeholder="min"
                  aria-label="Minuti"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  style={{ width: 90 }}
                />
                <span className="num">:</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={59}
                  placeholder="sec"
                  aria-label="Secondi"
                  value={sec}
                  onChange={(e) => setSec(e.target.value)}
                  style={{ width: 90 }}
                />
              </div>
            </div>
            <button className="btn full" onClick={() => finish(false)}>
              Entra nell'app
            </button>
            <button className="btn ghost full" onClick={() => finish(true)}>
              Misura il mio massimo ora
            </button>
          </>
        )}
      </div>
    </div>
  );
}
