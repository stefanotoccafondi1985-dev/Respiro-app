import { useState } from "react";
import { MusicPicker } from "../components/MusicPicker";
import { Modal } from "../components/ui";
import { lessons, type Lesson } from "../data/course";
import { resetCourse, updateSettings, useStore } from "../store";
import { CoursePlayer } from "./CoursePlayer";

function LessonDetail({ lesson, onBack, onStart }: { lesson: Lesson; onBack: () => void; onStart: () => void }) {
  const { settings } = useStore();
  return (
    <div className="card">
      <h2>
        Lezione {lesson.n} · {lesson.tag}
      </h2>
      <h3>{lesson.title}</h3>
      <p className="hint">Circa {lesson.minutes} minuti.</p>
      <p>{lesson.intro}</p>
      <div className="field">
        <label>Come prepararti</label>
        <ul className="prep">
          {lesson.prepare.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <MusicPicker
        id="lesson"
        kind={settings.meditationMusic}
        volume={settings.meditationMusicVolume}
        onKind={(v) => updateSettings({ meditationMusic: v })}
        onVolume={(v) => updateSettings({ meditationMusicVolume: v })}
      />
      <p className="hint">La voce e la velocità si scelgono in Audio Meditazioni. Ascolta da seduto o in piedi nel posto indicato, mai alla guida.</p>
      <button className="btn full" onClick={onStart}>
        Inizia la lezione
      </button>
      <button className="btn ghost full" onClick={onBack}>
        Torna alle lezioni
      </button>
    </div>
  );
}

/** Corso di meditazione: 13 lezioni guidate dalle basi alle tecniche diverse. */
export function Course() {
  const { course } = useStore();
  const [open, setOpen] = useState<Lesson | null>(null);
  const [playing, setPlaying] = useState<Lesson | null>(null);
  const [confirm, setConfirm] = useState(false);

  if (playing)
    return (
      <CoursePlayer
        lesson={playing}
        onClose={() => {
          setPlaying(null);
          setOpen(null); // alla fine si torna all'elenco, con i progressi aggiornati
        }}
      />
    );
  if (open) return <LessonDetail lesson={open} onBack={() => setOpen(null)} onStart={() => setPlaying(open)} />;

  const done = new Set(course.done);
  const next = lessons.find((l) => !done.has(l.id));
  const count = lessons.filter((l) => done.has(l.id)).length;

  return (
    <>
      <section className="card">
        <h2>Corso di meditazione</h2>
        <p>
          Imparare a meditare, una tecnica alla volta: respiro, corpo, suono, sguardo, vibrazione, mente, parola, emozioni, cuore, movimento e presenza aperta. Una voce calma ti guida passo passo.
        </p>
        <div className="pbar" aria-hidden="true">
          <i style={{ width: `${(count / lessons.length) * 100}%` }} />
        </div>
        <p className="hint">
          Lezioni completate: {count} su {lessons.length}.
          {next ? ` Prossima: ${next.n}. ${next.title}.` : " Hai completato il corso. Puoi rifare le lezioni quando vuoi."}
        </p>
      </section>
      <div className="list">
        {lessons.map((l) => (
          <button key={l.id} className="item lesson" onClick={() => setOpen(l)}>
            <span className={`num${done.has(l.id) ? " done" : ""}`} aria-hidden="true">
              {done.has(l.id) ? "✓" : l.n}
            </span>
            <span style={{ flex: 1 }}>
              <b>{l.title}</b>
              <small>{l.intro}</small>
              <div className="meta">
                {l.tag} · circa {l.minutes} min{next?.id === l.id ? " · consigliata" : ""}
                {done.has(l.id) ? " · completata" : ""}
              </div>
            </span>
          </button>
        ))}
      </div>
      {count > 0 && (
        <button className="btn ghost small" onClick={() => setConfirm(true)}>
          Azzera i progressi del corso
        </button>
      )}
      {confirm && (
        <Modal
          title="Azzerare i progressi?"
          actions={
            <>
              <button className="btn ghost" data-autofocus onClick={() => setConfirm(false)}>
                Annulla
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  resetCourse();
                  setConfirm(false);
                }}
              >
                Azzera
              </button>
            </>
          }
        >
          <p className="hint">Le lezioni risulteranno di nuovo da fare. Lo storico delle sessioni non cambia.</p>
        </Modal>
      )}
    </>
  );
}
