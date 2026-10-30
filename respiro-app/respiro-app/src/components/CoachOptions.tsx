import { initAudio } from "../lib/audio";
import { gong } from "../lib/sound";
import { MusicPicker } from "./MusicPicker";
import { updateSettings, useStore } from "../store";

/**
 * Caselle per gong, frasi e sottofondo durante le sessioni di apnea.
 * Compaiono nell'avviso prima di ogni sessione e in Impostazioni; la scelta resta salvata.
 */
export function CoachOptions() {
  const { settings } = useStore();
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
      <MusicPicker
        id="coach"
        kind={settings.coachMusic}
        volume={settings.coachMusicVolume}
        onKind={(v) => updateSettings({ coachMusic: v })}
        onVolume={(v) => updateSettings({ coachMusicVolume: v })}
      />
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
      </div>
      <p className="hint">Le frasi usano la voce scelta in Respira, Audio Meditazioni. Puoi sempre respirare quando vuoi, a prescindere dai suggerimenti.</p>
    </fieldset>
  );
}
