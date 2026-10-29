/** Numero di versione: cambialo a ogni aggiornamento importante. */
export const APP_VERSION = "1.4.0";

/** Data e ora della compilazione, scritta da vite.config.ts. */
export const BUILD_TIME: string = typeof __BUILD_TIME__ === "string" ? __BUILD_TIME__ : "";

export function buildLabel(): string {
  if (!BUILD_TIME) return "";
  const d = new Date(BUILD_TIME);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("it-IT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
