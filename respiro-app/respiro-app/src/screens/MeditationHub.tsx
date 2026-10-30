import { useState } from "react";
import { Seg } from "../components/ui";
import { Course } from "./Course";
import { MeditationTimer } from "./MeditationTimer";

type Mode = "free" | "course";

/** Scheda "Meditazione Libera": timer libero come prima, oppure il corso guidato. */
export function MeditationHub() {
  const [mode, setMode] = useState<Mode>("free");
  return (
    <>
      <Seg
        label="Tipo di meditazione"
        value={mode}
        onChange={setMode}
        options={[
          { value: "free", label: "Meditazione libera" },
          { value: "course", label: "Corso di meditazione" },
        ]}
      />
      {mode === "free" ? <MeditationTimer /> : <Course />}
    </>
  );
}
