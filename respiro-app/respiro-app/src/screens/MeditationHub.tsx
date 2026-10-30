import { useState } from "react";
import { BackButton, MenuBox } from "../components/ui";
import { lessons } from "../data/course";
import { Course } from "./Course";
import { MeditationTimer } from "./MeditationTimer";

type Mode = "free" | "course" | null;

/** Pagina "Meditazione": due riquadri, Meditazione Libera e Corso di Meditazione. */
export function MeditationHub({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>(null);

  if (mode === "free") {
    return (
      <>
        <BackButton onClick={() => setMode(null)} label="Meditazione" />
        <MeditationTimer />
      </>
    );
  }
  if (mode === "course") {
    return (
      <>
        <BackButton onClick={() => setMode(null)} label="Meditazione" />
        <Course />
      </>
    );
  }
  return (
    <>
      <BackButton onClick={onBack} label="Respira" />
      <header>
        <h1>Meditazione</h1>
        <p className="sub">Scegli come meditare.</p>
      </header>
      <div className="list">
        <MenuBox title="Meditazione Libera" text="Scegli durata e campana, poi avvia" onClick={() => setMode("free")} />
        <MenuBox title="Corso di Meditazione" text={`${lessons.length} lezioni guidate, dalle basi alle varie tecniche`} onClick={() => setMode("course")} />
      </div>
    </>
  );
}
