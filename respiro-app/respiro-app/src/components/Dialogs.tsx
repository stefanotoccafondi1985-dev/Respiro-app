import { useState } from "react";
import { addSession } from "../store";
import type { SessionRecord } from "../types";
import { fmt, uid } from "../lib/format";
import { Modal } from "./ui";

export const SAFETY_RULES = [
  "L'apnea si pratica solo a secco, seduti o sdraiati, in un luogo sicuro. Mai in acqua, in vasca o sotto la doccia.",
  "Mai alla guida, in bicicletta o mentre si usano macchinari.",
  "Niente iperventilazione prima dell'apnea: respira in modo calmo e normale.",
  "Interrompi subito se compaiono vertigini, formicolii, vista offuscata o malessere.",
  "Kapalabhati e Bhastrika sono respirazioni forzate: da evitare, o da praticare solo con parere medico, in gravidanza o con problemi cardiovascolari, di pressione, epilessia, asma o altre patologie respiratorie.",
  "Con patologie o dubbi, consulta un medico prima di iniziare. L'app non è un dispositivo medico.",
];

/** Promemoria breve prima di ogni sessione di apnea. */
export function SafetyReminder({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal
      title="Prima di iniziare"
      actions={
        <>
          <button className="btn ghost" onClick={onCancel}>
            Annulla
          </button>
          <button className="btn" data-autofocus onClick={onConfirm}>
            Ho capito, inizia
          </button>
        </>
      }
    >
      <ul>
        <li>Seduto o sdraiato, a secco.</li>
        <li>Mai in acqua, alla guida o con macchinari.</li>
        <li>Respira in modo calmo, senza iperventilare.</li>
        <li>Il pulsante Respira chiude l'apnea in qualsiasi momento.</li>
      </ul>
    </Modal>
  );
}

/** Avviso prima di Kapalabhati e Bhastrika. */
export function CautionModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal
      title="Respirazione forzata"
      actions={
        <>
          <button className="btn ghost" onClick={onCancel}>
            Annulla
          </button>
          <button className="btn" data-autofocus onClick={onConfirm}>
            Ho capito, inizia
          </button>
        </>
      }
    >
      <p className="hint">
        Questa tecnica è un'iperventilazione controllata. Praticala seduto, mai in acqua o alla guida. Fermati se senti vertigini o formicolii.
        Da evitare in gravidanza e con problemi cardiovascolari, di pressione, epilessia o asma, salvo parere medico.
      </p>
    </Modal>
  );
}

export interface Result {
  type: SessionRecord["type"];
  title: string;
  startedAt: string;
  durationSec: number;
  roundsDone?: number;
  roundsInterrupted?: number;
  roundsTotal?: number;
}

/** Riepilogo di fine sessione: sforzo percepito, note, salvataggio nello storico. */
export function Summary({ result, manual, onClose }: { result: Result; manual: boolean; onClose: () => void }) {
  const [effort, setEffort] = useState<number | undefined>();
  const [note, setNote] = useState("");
  const save = () => {
    addSession({ id: uid(), ...result, effort, note: note.trim() || undefined });
    onClose();
  };
  const hasRounds = result.roundsTotal !== undefined;
  return (
    <Modal
      title={manual ? "Sessione interrotta" : "Sessione completata"}
      actions={
        <>
          <button className="btn ghost" onClick={onClose}>
            Scarta
          </button>
          <button className="btn" data-autofocus onClick={save}>
            Salva
          </button>
        </>
      }
    >
      <p>
        <b>{result.title}</b>
        <br />
        Durata: <b className="num">{fmt(result.durationSec)}</b>
        {hasRounds && (
          <>
            <br />
            Round completati: <b>{result.roundsDone}</b> su {result.roundsTotal}. Interrotti: <b>{result.roundsInterrupted}</b>.
          </>
        )}
      </p>
      <div className="field">
        <label>Sforzo percepito (1 = leggero, 5 = molto intenso)</label>
        <div className="effort">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} aria-pressed={effort === n} onClick={() => setEffort(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="note">Note</label>
        <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Come ti sei sentito?" />
      </div>
    </Modal>
  );
}
