import { useState } from "react";
import { Seg } from "../components/ui";
import { MeditationTimer } from "./MeditationTimer";
import { Meditations } from "./Meditations";
import { Pranayama } from "./Pranayama";

export type RespiraSub = "pranayama" | "guided" | "timer";

export function Respira({ initial }: { initial?: RespiraSub }) {
  const [sub, setSub] = useState<RespiraSub>(initial ?? "pranayama");
  return (
    <>
      <header>
        <h1>Respira</h1>
        <p className="sub">Pranayama, audiomeditazioni e meditazione libera.</p>
      </header>
      <Seg
        label="Sezione"
        value={sub}
        onChange={setSub}
        options={[
          { value: "pranayama", label: "Pranayama" },
          { value: "guided", label: "Audiomeditazioni" },
          { value: "timer", label: "Meditazione libera" },
        ]}
      />
      {sub === "pranayama" && <Pranayama />}
      {sub === "guided" && <Meditations />}
      {sub === "timer" && <MeditationTimer />}
    </>
  );
}
