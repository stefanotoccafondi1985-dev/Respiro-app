import { useEffect, useState } from "react";
import { initAudio } from "../lib/audio";
import { gong, musicPlaying, setMusicVolume, startMusic, stopMusic } from "../lib/sound";
import { updateSettings, useStore } from "../store";
import type { CoachMusic } from "../types";

/**
 * Caselle per gong, frasi e sottofondo durante le sessioni di apnea.
 * Compaiono nell'avviso prima di ogni sessione e in Impostazioni; la scelta resta salvata.
 */
export function CoachOptions() {
  const { settings } = useStore();
  const [playing, setPlaying] = useState(false);

  // l'anteprima del sottofondo si ferma quando si chiude la finestra
  useEffect(() => () => stopMusic(0.3), []);

  const preview = () => {
    initAudio();
    if (playing || musicPlaying()) {
      stopMusic(0.5);
      setPlaying(false);
    } else if (settings.coachMusic !== "off") {
      startMusic(settings.coachMusic, settings.coachMusicVolume);
      setPlaying(true);
    }
  };

  const changeMusic = (v: CoachMusic) => {
    updateSettings({ coachMusic: v });
    if (playing) {
      if (v === "off") {
        stopMusic(0.5);
        setPlaying(false);
      } else startMusic(v, settings.coachMusicVolume);
    }
  };

  return (
    <fieldset className="coach">
      <legend>Coach durante l'apnea</legend>
      <label className="chk" style={{ color: "var(--fg)" }}>
        <input type="checkbox" checked={settings.coachGong} onChange={(e) => updateSettings({ coachGong: e.target.checked })} />
        Gong ogni 30 secondi di apnea
      </label>
      <label className="chk" style={{ color: "var(--fg)" }}>
        <input type="checkbox" checked={settings.coachPhrases} onChange={(e) => updateSettings({ coachPhrases: e.target.checked })} />
        Frasi di incoraggiamento (voce)
      </label>
      <div className="field">
        <label htmlFor="coach-music">Sottofondo</label>
        <select id="coach-music" value={settings.coachMusic} onChange={(e) => changeMusic(e.target.value as CoachMusic)}>
          <option value="off">Nessuno</option>
          <option value="brown">Rumore marrone</option>
          <option value="pad">Musica rilassante</option>
        </select>
      </div>
      {settings.coachMusic !== "off" && (
        <div className="field">
          <label htmlFor="coach-vol">Volume del sottofondo</label>
          <input
            id="coach-vol"
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={settings.coachMusicVolume}
            onChange={(e) => {
              const v = Number(e.target.value);
              updateSettings({ coachMusicVolume: v });
              setMusicVolume(v);
            }}
          />
        </div>
      )}
      <div className="row">
        <button
          className="btn ghost small"
          onClick={() => {
            initAudio();
            gong();
          }}
        >
          Prova il gong
        </button>
        {settings.coachMusic !== "off" && (
          <button className="btn ghost small" onClick={preview}>
            {playing ? "Ferma anteprima" : "Ascolta il sottofondo"}
          </button>
        )}
      </div>
      <p className="hint">Le frasi usano la voce scelta in Respira, Audio Meditazioni. Puoi sempre respirare quando vuoi, a prescindere dai suggerimenti.</p>
    </fieldset>
  );
}
