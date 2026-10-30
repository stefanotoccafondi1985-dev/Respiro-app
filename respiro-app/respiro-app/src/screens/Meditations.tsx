import { useEffect, useMemo, useState } from "react";
import { BackButton, Warning } from "../components/ui";
import { meditations } from "../data/meditations";
import { initAudio, beep } from "../lib/audio";
import { estimateMinutes } from "../lib/meditation";
import { loadItalianVoices, speak, speechSupported, stopSpeaking, type VoiceInfo } from "../lib/narrator";
import { updateSettings, useStore } from "../store";
import type { Meditation } from "../types";
import { MeditationPlayer } from "./MeditationPlayer";

export function useItalianVoices(): VoiceInfo[] {
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  useEffect(() => {
    let alive = true;
    const update = () => void loadItalianVoices().then((v) => alive && setVoices(v));
    update();
    // sul browser l'elenco delle voci arriva in ritardo
    if ("speechSynthesis" in window) speechSynthesis.addEventListener("voiceschanged", update);
    return () => {
      alive = false;
      if ("speechSynthesis" in window) speechSynthesis.removeEventListener("voiceschanged", update);
    };
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

export function Meditations({ onBack }: { onBack: () => void }) {
  const { settings } = useStore();
  const [cat, setCat] = useState("Tutte");
  const [len, setLen] = useState<"all" | "short" | "10" | "20">("all");
  const [pre, setPre] = useState<Meditation | null>(null);
  const [playing, setPlaying] = useState<Meditation | null>(null);
  const cats = useMemo(() => ["Tutte", ...Array.from(new Set(meditations.map((m) => m.category)))], []);
  const inLength = (m: Meditation) => {
    const min = estimateMinutes(m, settings.rate);
    return len === "all" || (len === "short" && min <= 5) || (len === "10" && min > 5 && min < 15) || (len === "20" && min >= 15);
  };
  const list = meditations.filter((m) => (cat === "Tutte" || m.category === cat) && inLength(m));

  if (playing)
    return (
      <MeditationPlayer
        meditation={playing}
        onClose={() => {
          setPlaying(null);
          setPre(null);
        }}
      />
    );

  if (pre) {
    return (
      <>
        <BackButton onClick={() => setPre(null)} label="Elenco" />
        <section className="card">
          <h2>{pre.title}</h2>
          <p className="hint">
            {pre.category} · circa {estimateMinutes(pre, settings.rate)} min
          </p>
          <p>{pre.description}</p>
        </section>
        <VoiceCard />
        <button
          className="btn full big"
          onClick={() => {
            initAudio();
            beep(528, 0.01);
            setPlaying(pre);
          }}
        >
          Avvia
        </button>
      </>
    );
  }

  return (
    <>
      <BackButton onClick={onBack} label="Respira" />
      <header>
        <h1>Audio Meditazioni</h1>
        <p className="sub">Meditazioni guidate da una voce italiana.</p>
      </header>
      <Warning>Ascolta da seduto o sdraiato, mai alla guida. Le meditazioni non sostituiscono un supporto medico o psicologico.</Warning>
      <div className="chips" role="group" aria-label="Categorie">
        {cats.map((c) => (
          <button key={c} className="chip" aria-pressed={c === cat} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="chips" role="group" aria-label="Durata">
        {(
          [
            ["all", "Tutte le durate"],
            ["short", "Brevi (2-5 min)"],
            ["10", "10 min"],
            ["20", "20 min"],
          ] as const
        ).map(([v, label]) => (
          <button key={v} className="chip" aria-pressed={len === v} onClick={() => setLen(v)}>
            {label}
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="empty">Nessuna meditazione con questi filtri.</p>}
      <div className="list">
        {list.map((m) => (
          <button key={m.id} className="item" onClick={() => setPre(m)}>
            <span>
              <b>{m.title}</b>
              <small>{m.description}</small>
              <small>
                {m.category} · circa {estimateMinutes(m, settings.rate)} min
              </small>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
