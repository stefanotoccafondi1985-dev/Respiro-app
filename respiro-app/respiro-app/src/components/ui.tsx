import { useEffect, useRef, type ReactNode } from "react";

export function Modal({ title, children, actions }: { title: string; children?: ReactNode; actions: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, []);
  return (
    <div className="overlay">
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <h3>{title}</h3>
        {children}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          {actions}
        </div>
      </div>
    </div>
  );
}

export function Seg<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v) => String(v),
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v * 1000) / 1000)));
  return (
    <div className="stepper">
      <span>{label}</span>
      <div className="ctl">
        <button aria-label={`Diminuisci ${label}`} onClick={() => set(value - step)} disabled={value <= min}>
          −
        </button>
        <output aria-live="polite">{format(value)}</output>
        <button aria-label={`Aumenta ${label}`} onClick={() => set(value + step)} disabled={value >= max}>
          +
        </button>
      </div>
    </div>
  );
}

const C = 2 * Math.PI * 92;

/** Anello di avanzamento con contenuto al centro. */
export function Ring({ progress, color, children }: { progress: number; color: string; children: ReactNode }) {
  return (
    <div className="stage" style={{ ["--rc" as string]: color }}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="92" fill="none" stroke="var(--track)" strokeWidth="6" />
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - Math.min(1, Math.max(0, progress)))}
        />
      </svg>
      {children}
    </div>
  );
}

/** Torna alla pagina precedente. */
export function BackButton({ onClick, label = "Indietro" }: { onClick: () => void; label?: string }) {
  return (
    <button className="btn ghost small back" onClick={onClick}>
      <span aria-hidden="true">←</span> {label}
    </button>
  );
}

/** Voce di un menu a riquadri: titolo, riga di descrizione e freccia. */
export function MenuBox({ title, text, onClick }: { title: string; text?: string; onClick: () => void }) {
  return (
    <button className="item" onClick={onClick}>
      <span>
        <b>{title}</b>
        {text && <small>{text}</small>}
      </span>
      <span className="pat">→</span>
    </button>
  );
}

/** Avviso giallo con simbolo di pericolo (triangolo con punto esclamativo). */
export function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="warning">
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
        <path d="M12 2.8 22.2 20.5H1.8Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 9.5v5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="12" cy="17.5" r="1.4" fill="currentColor" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
