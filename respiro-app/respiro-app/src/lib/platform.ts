import { Capacitor } from "@capacitor/core";

/** Vero quando l'app gira come app Android/iOS impacchettata con Capacitor. */
export const isNative = (): boolean => Capacitor.isNativePlatform();
