import { useEffect, useRef } from "react";
import { getState } from "../store";
import { initAudio } from "./audio";
import type { CoachEvent } from "./coach";
import { speak, stopSpeaking } from "./narrator";
import { duckMusic, gong, startMusic, stopMusic } from "./sound";

/** Legge una frase del coach con la voce scelta e abbassa un po' il sottofondo mentre parla. */
export function sayCoach(text: string) {
  const { voiceURI, rate } = getState().settings;
  duckMusic(true);
  const back = setTimeout(() => duckMusic(false), 9000); // rete di sicurezza se la voce non risponde
  speak(text, { voiceURI, rate: Math.max(0.85, rate) }, () => {
    clearTimeout(back);
    duckMusic(false);
  });
}

/**
 * Fa suonare gong e frasi agli istanti previsti e gestisce il sottofondo.
 * `getElapsed` restituisce i secondi trascorsi: in pausa resta fermo, e se il tempo salta
 * (per esempio con "Respira") gli eventi saltati non vengono recuperati.
 */
export function useCoach(events: CoachEvent[], getElapsed: () => number, active: boolean) {
  const elapsed = useRef(getElapsed);
  elapsed.current = getElapsed;
  const next = useRef(0);

  // gong e frasi
  useEffect(() => {
    if (!active || events.length === 0) return;
    initAudio();
    const id = setInterval(() => {
      const t = elapsed.current();
      while (next.current < events.length && events[next.current].at <= t) {
        const e = events[next.current++];
        if (t - e.at > 3) continue;
        if (e.kind === "gong") gong();
        else sayCoach(e.text);
      }
    }, 200);
    return () => {
      clearInterval(id);
      stopSpeaking();
    };
  }, [events, active]);

  // sottofondo
  useEffect(() => {
    const { coachMusic, coachMusicVolume } = getState().settings;
    if (!active || coachMusic === "off") return;
    initAudio();
    startMusic(coachMusic, coachMusicVolume);
    return () => stopMusic();
  }, [active]);
}
