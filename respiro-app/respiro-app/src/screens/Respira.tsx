import { useState } from "react";
import { BackButton, MenuBox } from "../components/ui";
import { meditations } from "../data/meditations";
import { MeditationHub } from "./MeditationHub";
import { Meditations } from "./Meditations";
import { Pranayama } from "./Pranayama";

export type RespiraSub = "pranayama" | "guided" | "timer";

/** Pagina Respira: tre riquadri (Meditazione, Audio Meditazioni, Pranayama), ognuno apre la sua pagina. */
export function Respira({ initial }: { initial?: RespiraSub }) {
  const [sub, setSub] = useState<RespiraSub | null>(initial ?? null);
  const back = () => setSub(null);

  if (sub === "timer") return <MeditationHub onBack={back} />;
  if (sub === "guided") return <Meditations onBack={back} />;
  if (sub === "pranayama") {
    return (
      <>
        <BackButton onClick={back} label="Respira" />
        <header>
          <h1>Pranayama</h1>
        </header>
        <Pranayama />
      </>
    );
  }

  return (
    <>
      <header>
        <h1>Respira</h1>
        <p className="sub">Meditazione, audio meditazioni e pranayama.</p>
      </header>
      <div className="list">
        <MenuBox title="Meditazione" text="In autonomia, oppure con il corso guidato" onClick={() => setSub("timer")} />
        <MenuBox title="Audio Meditazioni" text={`${meditations.length} meditazioni guidate in italiano`} onClick={() => setSub("guided")} />
        <MenuBox title="Pranayama" text="Le tecniche di respirazione" onClick={() => setSub("pranayama")} />
      </div>
    </>
  );
}
