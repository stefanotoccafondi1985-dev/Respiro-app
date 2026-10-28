import { useEffect, useMemo, useState } from "react";
import { Modal } from "../components/ui";
import { meditations } from "../data/meditations";
import { initAudio, beep } from "../lib/audio";
import { estimateMinutes, toSSML } from "../lib/meditation";
import { italianVoices, speak, speechSupported, stopSpeaking } from "../lib/narrator";
import { updateSettings, useStore } from "../store";
import type { Meditation } from "../types";
import { MeditationPlayer } from "./MeditationPlayer";

export function useItalianVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => italianVoices());
  useEffect(() => {
    if (!speechSupported()) return;
    const update = () => setVoices(italianVoices());
    update();
    speechSynthesis.addEventListener("voiceschanged", update);
    return () => speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);
  return voices;
}

export function VoiceCard() {
  const { settings } = useStore();
  const voices = useItalianVoices();
  const supported = speechSupported();
  return (
    <section className="card">
      <h2>Voce narrante</h2>
      {!supported && <p className="hint">Questo browser non supporta la sintesi vocale.</p>}
      {supported && voices.length === 0 && (
        <p className="hint">Nessuna voce italiana trovata. Installa una voce italiana nelle impostazioni del dispositivo.</p>
      )}
      <div className="field">
        <label htmlFor="voice">Voce italiana</label>
        <select
          id="voice"
          value={settings.voiceURI ?? voices[0]?.voiceURI ?? ""}
          onChange={(e) => updateSettings({ voiceURI: e.target.value || null })}
          disabled={voices.length === 0}
        >
          {voices.length === 0 && <option value="">Voce predefinita del dispositivo</option>}
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="rate">Velocità: {settings.rate.toFixed(2)} (più bassa = più lenta)</label>
        <input id="rate" type="range" min={0.7} max={1} step={0.05} value={settings.rate} onChange={(e) => updateSettings({ rate: Number(e.target.value) })} />
      </div>
      <button
        className="btn ghost"
        disabled={!supported}
        onClick={() => {
          initAudio();
          stopSpeaking();
          speak("Ciao. Questa è la voce della meditazione. Respira con calma, e lascia andare le spalle.", {
            voiceURI: settings.voiceURI,
            rate: settings.rate,
          });
        }}
      >
        Ascolta anteprima
      </button>
      <p className="hint">La qualità dipende dalle voci installate sul dispositivo. Per una voce professionale, esporta il testo in SSML.</p>
    </section>
  );
}

export function Meditations() {
  const { settings } = useStore();
  const [cat, setCat] = useState("Tutte");
  const [playing, setPlaying] = useState<Meditation | null>(null);
  const [ssml, setSsml] = useState<Meditation | null>(null);
  const cats = useMemo(() => ["Tutte", ...Array.from(new Set(meditations.map((m) => m.category)))], []);
  const list = meditations.filter((m) => cat === "Tutte" || m.category === cat);

  if (playing) return <MeditationPlayer meditation={playing} onClose={() => setPlaying(null)} />;

  return (
    <>
      <VoiceCard />
      <p className="note">Ascolta da seduto o sdraiato, mai alla guida. Le meditazioni non sostituiscono un supporto medico o psicologico.</p>
      <div className="chips" role="group" aria-label="Categorie">
        {cats.map((c) => (
          <button key={c} className="chip" aria-pressed={c === cat} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="list">
        {list.map((m) => (
          <div key={m.id} className="med">
            <button
              className="item"
              onClick={() => {
                initAudio();
                beep(528, 0.01);
                setPlaying(m);
              }}
            >
              <span>
                <b>{m.title}</b>
                <small>{m.description}</small>
                <div className="meta">
                  {m.category} · circa {estimateMinutes(m, settings.rate)} min
                </div>
              </span>
            </button>
            <button className="btn ghost small" aria-label={`Esporta ${m.title} in SSML`} onClick={() => setSsml(m)}>
              SSML
            </button>
          </div>
        ))}
      </div>
      {ssml && (
        <Modal
          title={`SSML: ${ssml.title}`}
          actions={
            <>
              <button className="btn ghost" onClick={() => setSsml(null)}>
                Chiudi
              </button>
              <button
                className="btn"
                onClick={() => {
                  navigator.clipboard?.writeText(toSSML(ssml)).catch(() => undefined);
                }}
              >
                Copia
              </button>
            </>
          }
        >
          <p className="hint">Incolla il testo in un servizio di sintesi vocale che supporta SSML e le voci neurali italiane, poi salva l'audio.</p>
          <textarea className="mono" readOnly value={toSSML(ssml)} />
        </Modal>
      )}
    </>
  );
}
