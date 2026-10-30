import { meditations } from "../data/meditations";
import { APP_VERSION, buildLabel } from "../version";
import { CoachOptions } from "../components/CoachOptions";
import { useState } from "react";
import { Modal, Seg } from "../components/ui";
import { fmt } from "../lib/format";
import { exportJson, resetAll, setPB, updateProfile, updateSettings, useStore } from "../store";
import type { Level } from "../types";

export function Settings({ onClose }: { onClose: () => void }) {
  const { profile, settings } = useStore();
  const [min, setMin] = useState(profile.pb ? String(Math.floor(profile.pb / 60)) : "");
  const [sec, setSec] = useState(profile.pb ? String(profile.pb % 60) : "");
  const [confirm, setConfirm] = useState(false);
  const [exported, setExported] = useState<string | null>(null);

  const savePB = () => {
    const total = (parseInt(min, 10) || 0) * 60 + Math.min(59, parseInt(sec, 10) || 0);
    if (total >= 30) setPB(total);
  };

  return (
    <div className="app">
      <div className="page">
        <header className="head">
          <div>
            <h1>Impostazioni</h1>
          </div>
          <button className="btn ghost small" onClick={onClose}>
            Chiudi
          </button>
        </header>

        <section className="card">
          <h2>Livello</h2>
          <Seg
            label="Livello"
            value={profile.level}
            onChange={(v: Level) => updateProfile({ level: v })}
            options={[
              { value: "beginner", label: "Principiante" },
              { value: "intermediate", label: "Intermedio" },
            ]}
          />
        </section>

        <section className="card">
          <h2>Personal best</h2>
          <p className="hint">Attuale: {profile.pb ? fmt(profile.pb) : "non impostato"}. Cambialo a mano solo se conosci il valore reale.</p>
          <div className="row">
            <input type="number" inputMode="numeric" min={0} max={9} aria-label="Minuti" value={min} onChange={(e) => setMin(e.target.value)} style={{ width: 90 }} />
            <span className="num">:</span>
            <input type="number" inputMode="numeric" min={0} max={59} aria-label="Secondi" value={sec} onChange={(e) => setSec(e.target.value)} style={{ width: 90 }} />
            <button className="btn ghost small" onClick={savePB}>
              Salva
            </button>
          </div>
        </section>

        <section className="card">
          <h2>Suoni e vibrazione</h2>
          <label className="chk" style={{ color: "var(--fg)" }}>
            <input type="checkbox" checked={settings.sound} onChange={(e) => updateSettings({ sound: e.target.checked })} />
            Suoni
          </label>
          <div className="field">
            <label htmlFor="vol">Volume dei segnali</label>
            <input id="vol" type="range" min={0.1} max={1} step={0.1} value={settings.volume} onChange={(e) => updateSettings({ volume: Number(e.target.value) })} />
          </div>
          <label className="chk" style={{ color: "var(--fg)" }}>
            <input type="checkbox" checked={settings.vibration} onChange={(e) => updateSettings({ vibration: e.target.checked })} />
            Vibrazione (dove supportata)
          </label>
          <p className="hint">La voce e la velocità delle meditazioni si scelgono in Respira, sezione Audio Meditazioni.</p>
        </section>

        <section className="card">
          <h2>Apnea</h2>
          <CoachOptions />
        </section>

        <section className="card">
          <h2>Dati</h2>
          <p className="hint">Tutti i dati restano su questo dispositivo.</p>
          <button className="btn ghost" onClick={() => setExported(exportJson())}>
            Esporta in JSON
          </button>
          <button className="btn danger" onClick={() => setConfirm(true)}>
            Cancella tutti i dati
          </button>
        </section>

        <section className="card">
          <h2>Informazioni</h2>
          <p className="hint">
            Versione <b>{APP_VERSION}</b>
            {buildLabel() && <> · compilata il {buildLabel()}</>}
            <br />
            {meditations.length} meditazioni guidate.
          </p>
          <p className="hint">Se dopo un aggiornamento qui vedi ancora la data vecchia, chiudi l'app del tutto e riaprila due volte.</p>
        </section>
      </div>

      {confirm && (
        <Modal
          title="Cancellare tutto?"
          actions={
            <>
              <button className="btn ghost" data-autofocus onClick={() => setConfirm(false)}>
                Annulla
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  resetAll();
                  setConfirm(false);
                  onClose();
                }}
              >
                Cancella
              </button>
            </>
          }
        >
          <p className="hint">Profilo, personal best, storico e preset personali verranno eliminati. L'operazione non si può annullare.</p>
        </Modal>
      )}
      {exported !== null && (
        <Modal
          title="Esportazione dati"
          actions={
            <>
              <button className="btn ghost" onClick={() => setExported(null)}>
                Chiudi
              </button>
              <button className="btn" onClick={() => navigator.clipboard?.writeText(exported).catch(() => undefined)}>
                Copia
              </button>
            </>
          }
        >
          <textarea className="mono" readOnly value={exported} />
        </Modal>
      )}
    </div>
  );
}
