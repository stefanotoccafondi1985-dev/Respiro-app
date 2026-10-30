import { useMemo, useRef, useState } from "react";
import { BarChart, LineChart } from "../charts";
import { Modal } from "../components/ui";
import { fmt, fmtDate, fmtDateTime, weekStart } from "../lib/format";
import { useStore } from "../store";
import type { SessionRecord, SessionType } from "../types";

const TYPE_LABEL: Record<SessionType, string> = {
  test: "Test del massimale",
  co2: "Tabella CO2",
  o2: "Tabella O2",
  pranayama: "Pranayama",
  meditation: "Meditazione libera",
  course: "Corso di meditazione",
  guided: "Audio meditazioni",
};

/** Ordine delle categorie nel carosello. */
const ORDER: SessionType[] = ["meditation", "course", "guided", "pranayama", "test", "co2", "o2"];

/** Le lezioni del corso salvate con la vecchia versione avevano tipo "guided" e titolo "Corso ...". */
const catOf = (s: SessionRecord): SessionType => (s.type === "guided" && s.title.startsWith("Corso ") ? "course" : s.type);

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
  const [detail, setDetail] = useState<SessionRecord | null>(null);
  const [page, setPage] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  const cats = useMemo(
    () => ORDER.map((t) => ({ t, items: sessions.filter((s) => catOf(s) === t) })).filter((c) => c.items.length > 0),
    [sessions],
  );
  const weeks = useMemo(() => lastWeeks(sessions), [sessions]);
  const count = cats.length + 1;

  const onScroll = () => {
    const el = track.current;
    if (el) setPage(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goTo = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <>
      <header>
        <h1>Storico</h1>
        <p className="sub">Le tue sessioni e l'andamento del personal best. Scorri per vedere le categorie.</p>
      </header>

      <div className="carousel" ref={track} onScroll={onScroll}>
        <div className="slide">
          <section className="card">
            <h2>Personal best nel tempo</h2>
            {profile.pbHistory.length === 0 ? (
              <p className="empty">Nessun PB salvato. Fai un test del massimale per iniziare.</p>
            ) : (
              <LineChart points={profile.pbHistory.map((p) => p.seconds)} labels={profile.pbHistory.map((p) => fmtDate(p.date))} />
            )}
          </section>
          <section className="card">
            <h2>Sessioni per settimana</h2>
            <BarChart values={weeks.counts} labels={weeks.labels} />
          </section>
        </div>
        {cats.map(({ t, items }) => (
          <div className="slide" key={t}>
            <section>
              <h2>
                {TYPE_LABEL[t]} ({items.length})
              </h2>
              <div className="list">
                {items.map((s) => (
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
          </div>
        ))}
      </div>

      <div className="dots" role="tablist" aria-label="Schermate dello storico">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            role="tab"
            className="dot"
            aria-selected={i === page}
            aria-label={i === 0 ? "Panoramica" : TYPE_LABEL[cats[i - 1].t]}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

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
            {TYPE_LABEL[catOf(detail)]} · {fmtDateTime(detail.startedAt)}
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
