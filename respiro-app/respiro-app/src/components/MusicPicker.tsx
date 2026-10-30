import { useEffect, useState } from "react";
import { initAudio } from "../lib/audio";
import { musicPlaying, setMusicVolume, startMusic, stopMusic } from "../lib/sound";
import type { CoachMusic } from "../types";

/** Scelta del sottofondo (nessuno, rumore marrone, musica rilassante) con volume e anteprima. */
export function MusicPicker({
  id,
  kind,
  volume,
  onKind,
  onVolume,
}: {
  id: string;
  kind: CoachMusic;
  volume: number;
  onKind: (v: CoachMusic) => void;
  onVolume: (v: number) => void;
}) {
  const [playing, setPlaying] = useState(false);

  // l'anteprima si ferma quando la finestra si chiude
  useEffect(() => () => stopMusic(0.3), []);

  const preview = () => {
    initAudio();
    if (playing || musicPlaying()) {
      stopMusic(0.5);
      setPlaying(false);
    } else if (kind !== "off") {
      startMusic(kind, volume);
      setPlaying(true);
    }
  };

  const change = (v: CoachMusic) => {
    onKind(v);
    if (playing) {
      if (v === "off") {
        stopMusic(0.5);
        setPlaying(false);
      } else startMusic(v, volume);
    }
  };

  return (
    <>
      <div className="field">
        <label htmlFor={`${id}-kind`}>Sottofondo</label>
        <select id={`${id}-kind`} value={kind} onChange={(e) => change(e.target.value as CoachMusic)}>
          <option value="off">Nessuno</option>
          <option value="brown">Rumore marrone</option>
          <option value="pad">Musica rilassante</option>
        </select>
      </div>
      {kind !== "off" && (
        <>
          <div className="field">
            <label htmlFor={`${id}-vol`}>Volume del sottofondo</label>
            <input
              id={`${id}-vol`}
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                onVolume(v);
                setMusicVolume(v);
              }}
            />
          </div>
          <div className="row">
            <button className="btn ghost small" onClick={preview}>
              {playing ? "Ferma anteprima" : "Ascolta il sottofondo"}
            </button>
          </div>
        </>
      )}
    </>
  );
}
