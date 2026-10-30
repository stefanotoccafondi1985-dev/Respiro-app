import { useMemo, useState } from "react";
import { BarChart, LineChart } from "../charts";
import { Modal } from "../components/ui";
import { fmt, fmtDate, fmtDateTime, weekStart } from "../lib/format";
import { useStore } from "../store";
import type { SessionRecord, SessionType } from "../types";

const TYPE_LABEL: Record<SessionType, string> = {
  test: "Test",
  co2: "CO2",
  o2: "O2",
  pranayama: "Pranayama",
  meditation: "Meditazione",
  guided: "Guidata",
};

/** Ultime 8 settimane, dalla più vecchia alla più recente. */
function lastWeeks(sessions: SessionRecord[]) {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    keys.push(weekStart(d.toISOString()));
  }
  const counts = keys.map((k) => sessions.filter((s) => weekStart(s.startedAt) === k).length);
  const labels = keys.map((k) => fmtDate(k + "T12:00:00").replace(/\s?\w+\.?$/, "") || k.slice(8));
  return { counts, labels };
}

export function History() {
  const { sessions, profile } = useStore();
  const [selected, setSelected] = useState<SessionType | null>(null);
  const [detail, setDetail] = useState<SessionRecord | null>(null);

  const cats = useMemo(
    () => (Object.keys(TYPE_LABEL) as SessionType[]).map((t) => ({ t, n: sessions.filter((s) => s.type === t).length })).filter((c) => c.n > 0),
    [sessions],
  );
  const list = useMemo(() => (selected ? sessions.filter((s) => s.type === selected) : []), [sessions, selected]);
  const weeks = useMemo(() => lastWeeks(sessions), [sessions]);

  return (
    <>
      <header>
        <h1>Storico</h1>
        <p className="sub">Le tue sessioni e l'andamento del personal best.</p>
      </header>

      {!selected && (
        <>
          <section className="card">
            <h2>Personal best nel tempo</h2>
            {profile.pbHistory.length === 0 ? (
              <p className="empty">Nessun PB salvato. Fai un test del massimo per iniziare.</p>
            ) : (
              <LineChart points={profile.pbHistory.map((p) => p.seconds)} labels={profile.pbHistory.map((p) => fmtDate(p.date))} />
            )}
          </section>

          <section className="card">
            <h2>Sessioni per settimana</h2>
            <BarChart values={weeks.counts} labels={weeks.labels} />
          </section>
        </>
      )}

      {cats.length === 0 ? (
        <p className="empty">Nessuna sessione ancora.</p>
      ) : (
        <div className="chips" role="group" aria-label="Categorie">
          {cats.map(({ t, n }) => (
            <button key={t} className="chip" aria-pressed={selected === t} onClick={() => setSelected(selected === t ? null : t)}>
              {TYPE_LABEL[t]} ({n})
            </button>
          ))}
        </div>
      )}

      {selected && (
        <section>
          <h2>{TYPE_LABEL[selected]}</h2>
          <div className="list">
            {list.map((s) => (
              <button key={s.id} className="item" onClick={() => setDetail(s)}>
                <span>
                  <b>{s.title}</b>
                  <small>{fmtDateTime(s.startedAt)}</small>
                </span>
                <span className="pat">{s.testSeconds !== undefined ? fmt(s.testSeconds) : fmt(s.durationSec)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {detail && (
        <Modal
          title={detail.title}
          actions={
            <button className="btn" data-autofocus onClick={() => setDetail(null)}>
              Chiudi
            </button>
          }
        >
          <p>
            {TYPE_LABEL[detail.type]} · {fmtDateTime(detail.startedAt)}
            <br />
            Durata: <b className="num">{fmt(detail.durationSec)}</b>
            {detail.roundsTotal !== undefined && (
              <>
                <br />
                Round completati: {detail.roundsDone} su {detail.roundsTotal}, interrotti: {detail.roundsInterrupted}
              </>
            )}
            {detail.testSeconds !== undefined && (
              <>
                <br />
                Risultato del test: <b className="num">{fmt(detail.testSeconds)}</b>
              </>
            )}
            {detail.effort && (
              <>
                <br />
                Sforzo percepito: {detail.effort}/5
              </>
            )}
          </p>
          {detail.note && <p className="hint">{detail.note}</p>}
        </Modal>
      )}
    </>
  );
}
