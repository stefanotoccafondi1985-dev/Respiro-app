import { KeepAwake } from "@capacitor-community/keep-awake";
import { useEffect, useMemo, useRef, useState } from "react";
import { isNative } from "./platform";

/** Tiene lo schermo acceso mentre il componente è visibile (se il browser lo permette). */
export function useWakeLock() {
  useEffect(() => {
    if (isNative()) {
      void KeepAwake.keepAwake().catch(() => undefined);
      return () => void KeepAwake.allowSleep().catch(() => undefined);
    }
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const request = async () => {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") {
          lock = await navigator.wakeLock.request("screen");
          if (cancelled) void lock.release();
        }
      } catch {
        /* non concesso: nessun problema */
      }
    };
    void request();
    const onVis = () => void request();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release().catch(() => undefined);
    };
  }, []);
}

export interface Step {
  /** Tipo di fase, per esempio "prep", "rec", "hold". */
  kind: string;
  label: string;
  seconds: number;
  round?: number;
}

/**
 * Esegue una sequenza di fasi. Il tempo si calcola sempre da orari assoluti
 * (performance.now), mai contando i tick: resta preciso in pausa, in background
 * e dopo rallentamenti del telefono.
 */
export function useRunner(steps: Step[]) {
  const t0 = useRef(performance.now());
  const offset = useRef(0); // secondi saltati con skip()
  const pausedAt = useRef<number | null>(null);
  const [, force] = useState(0);

  const { starts, ends, total } = useMemo(() => {
    const starts: number[] = [];
    const ends: number[] = [];
    let t = 0;
    for (const s of steps) {
      starts.push(t);
      t += s.seconds;
      ends.push(t);
    }
    return { starts, ends, total: t };
  }, [steps]);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 100);
    return () => clearInterval(id);
  }, []);

  const elapsedNow = () => ((pausedAt.current ?? performance.now()) - t0.current) / 1000 + offset.current;
  const elapsed = Math.min(elapsedNow(), total);
  let index = ends.findIndex((e) => elapsed < e);
  const finished = index === -1;
  if (finished) index = steps.length;
  const step = steps[index] as Step | undefined;
  const remaining = step ? ends[index] - elapsed : 0;
  const progress = step ? Math.min(1, (elapsed - starts[index]) / step.seconds) : 1;

  return {
    steps,
    starts,
    ends,
    total,
    index,
    step,
    elapsed,
    remaining,
    progress,
    finished,
    /** Tempo trascorso in questo istante (per animazioni fluide fuori da React). */
    getElapsed: () => Math.min(elapsedNow(), total),
    paused: pausedAt.current !== null,
    pause() {
      if (pausedAt.current === null) {
        pausedAt.current = performance.now();
        force((n) => n + 1);
      }
    },
    resume() {
      if (pausedAt.current !== null) {
        t0.current += performance.now() - pausedAt.current;
        pausedAt.current = null;
        force((n) => n + 1);
      }
    },
    /** Salta alla fine della fase corrente (usato dal pulsante "Respira"). */
    skip() {
      const i = ends.findIndex((e) => elapsedNow() < e);
      if (i >= 0) offset.current += ends[i] - elapsedNow() + 0.001;
      force((n) => n + 1);
    },
  };
}
