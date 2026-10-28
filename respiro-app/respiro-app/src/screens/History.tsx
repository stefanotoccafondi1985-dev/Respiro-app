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

const FILTERS: { value: SessionType | "all"; label: string }[] = [
  { value: "all", label: "Tutte" },
  { value: "test", label: "Test" },
  { value: "co2", label: "CO2" },
  { value: "o2", label: "O2" },
  { value: "pranayama", label: "Pranayama" },
  { value: "meditation", label: "Meditazione" },
  { value: "guided", label: "Guidate" },
];

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
  const [filter, setFilter] = useState<SessionType | "all">("all");
  const [detail, setDetail] = useState<SessionRecord | null>(null);

  const list = useMemo(() => sessions.filter((s) => filter === "all" || s.type === filter), [sessions, filter]);
  const groups = useMemo(() => {
    const m = new Map<string, SessionRecord[]>();
    for (const s of list) {
      const k = weekStart(s.startedAt);
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [list]);
  const weeks = useMemo(() => lastWeeks(sessions), [sessions]);

  return (
    <>
      <header>
        <h1>Storico</h1>
        <p className="sub">Le tue sessioni e l'andamento del personal best.</p>
      </header>

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

      <div className="chips" role="group" aria-label="Filtro per tipo">
        {FILTERS.map((f) => (
          <button key={f.value} className="chip" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 && <p className="empty">Nessuna sessione{filter === "all" ? " ancora" : " di questo tipo"}.</p>}
      {groups.map(([wk, items]) => (
        <section key={wk}>
          <h2>Settimana del {fmtDate(wk + "T12:00:00")}</h2>
          <div className="list">
            {items.map((s) => (
              <button key={s.id} className="item" onClick={() => setDetail(s)}>
                <span>
                  <b>{s.title}</b>
                  <small>
                    {TYPE_LABEL[s.type]} · {fmtDateTime(s.startedAt)}
                  </small>
                </span>
                <span className="pat">{fmt(s.durationSec)}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

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
