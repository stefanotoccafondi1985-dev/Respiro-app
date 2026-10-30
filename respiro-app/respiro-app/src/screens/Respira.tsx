import { useState } from "react";
import { Seg } from "../components/ui";
import { MeditationHub } from "./MeditationHub";
import { Meditations } from "./Meditations";
import { Pranayama } from "./Pranayama";

export type RespiraSub = "pranayama" | "guided" | "timer";

export function Respira({ initial }: { initial?: RespiraSub }) {
  const [sub, setSub] = useState<RespiraSub>(initial ?? "pranayama");
  return (
    <>
      <header>
        <h1>Respira</h1>
        <p className="sub">Meditazione libera, audio meditazioni e pranayama.</p>
      </header>
      <Seg
        label="Sezione"
        value={sub}
        onChange={setSub}
        options={[
          { value: "timer", label: "Meditazione\nLibera" },
          { value: "guided", label: "Audio\nMeditazioni" },
          { value: "pranayama", label: "Pranayama" },
        ]}
      />
      {sub === "pranayama" && <Pranayama />}
      {sub === "guided" && <Meditations />}
      {sub === "timer" && <MeditationHub />}
    </>
  );
}
