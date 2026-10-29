import { useEffect, useMemo, useRef } from "react";
import type { Phases } from "../data/pranayama";
import type { Step } from "../lib/hooks";
import { buildShape, dotPosition, nostrilState, PHASE_KINDS, type Shape } from "../lib/shape";

function outline(shape: Shape): string {
  const pts = shape.sides.map((s) => s.from);
  if (shape.kind === "line") return `M${shape.sides[0].from.x},${shape.sides[0].from.y} L${shape.sides[0].to.x},${shape.sides[0].to.y}`;
  return `M${pts.map((p) => `${p.x},${p.y}`).join(" L")} Z`;
}

function Figure({ shape, activeKind, dotRef, haloRef, labels }: {
  shape: Shape;
  activeKind: string | null;
  dotRef?: React.Ref<SVGCircleElement>;
  haloRef?: React.Ref<SVGCircleElement>;
  labels: boolean;
}) {
  const active = shape.sides.find((s) => s.phase === PHASE_KINDS.indexOf(activeKind as (typeof PHASE_KINDS)[number]));
  const start = shape.sides[0].from;
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={shape.kind === "line" ? "Linea" : shape.kind === "triangle" ? "Triangolo" : "Quadrato"}>
      <path d={outline(shape)} fill="none" stroke="var(--track)" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
      {active && (
        <line x1={active.from.x} y1={active.from.y} x2={active.to.x} y2={active.to.y} stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
      )}
      {shape.kind === "line" && (
        <>
          <line x1="88" y1="45" x2="112" y2="45" stroke="var(--track)" strokeWidth="4" strokeLinecap="round" />
          <line x1="88" y1="155" x2="112" y2="155" stroke="var(--track)" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {labels &&
        shape.sides.map((s) => (
          <text key={s.phase} x={s.label.x} y={s.label.y} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="var(--muted)">
            {s.seconds} s
          </text>
        ))}
      <circle ref={haloRef} cx={start.x} cy={start.y} r="17" fill="var(--accent)" opacity="0.22" />
      <circle ref={dotRef} cx={start.x} cy={start.y} r="9" fill="var(--accent)" />
    </svg>
  );
}

/** Anteprima ferma della figura, per la finestra di impostazione. */
export function ShapePreview({ phases }: { phases: Phases }) {
  const shape = useMemo(() => buildShape(phases), [phases]);
  return (
    <div className="shape small">
      <Figure shape={shape} activeKind={null} labels />
    </div>
  );
}

/**
 * Figura animata. Il punto si muove ad ogni frame con il tempo assoluto del timer,
 * senza passare da React, così è fluido e resta preciso in pausa e dopo i rallentamenti.
 */
export function BreathShape({ phases, steps, starts, ends, getElapsed, activeKind }: {
  phases: Phases;
  steps: Step[];
  starts: number[];
  ends: number[];
  getElapsed: () => number;
  activeKind: string;
}) {
  const shape = useMemo(() => buildShape(phases), [phases]);
  const dot = useRef<SVGCircleElement>(null);
  const halo = useRef<SVGCircleElement>(null);
  const getRef = useRef(getElapsed);
  getRef.current = getElapsed;

  useEffect(() => {
    let raf = 0;
    const frame = () => {
      const t = getRef.current();
      let i = ends.findIndex((e) => t < e);
      if (i < 0) i = steps.length - 1;
      const st = steps[i];
      const progress = st && st.seconds > 0 ? (t - starts[i]) / st.seconds : 0;
      const p = dotPosition(shape, st?.kind ?? "prep", progress);
      for (const el of [dot.current, halo.current]) {
        el?.setAttribute("cx", String(p.x));
        el?.setAttribute("cy", String(p.y));
      }
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [shape, steps, starts, ends]);

  return (
    <div className="shape">
      <Figure shape={shape} activeKind={activeKind} dotRef={dot} haloRef={halo} labels />
    </div>
  );
}

/** Naso stilizzato, visto di fronte come allo specchio: la narice aperta è colorata, quella chiusa è spenta. */
export function Nose({ kind, cycle }: { kind: string; cycle: number }) {
  const n = nostrilState(kind, cycle);
  const nostril = (cx: number, open: boolean) => (
    <g key={cx}>
      <ellipse cx={cx} cy="50" rx="11" ry="7" fill={open ? "var(--accent)" : "var(--track)"} opacity={open ? 1 : 0.9} />
      {!open && <path d={`M${cx - 6},47 L${cx + 6},53 M${cx + 6},47 L${cx - 6},53`} stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" />}
      {open && n.flow === "in" && <path d={`M${cx},78 L${cx},62 M${cx - 5},67 L${cx},61 L${cx + 5},67`} stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {open && n.flow === "out" && <path d={`M${cx},62 L${cx},78 M${cx - 5},73 L${cx},79 L${cx + 5},73`} stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  );
  return (
    <div className="nose">
      <svg viewBox="25 0 110 96" role="img" aria-label="Naso: narice usata">
        {/* ponte e punta del naso */}
        <path d="M70,4 C68,22 62,34 50,40 C40,46 40,58 52,62 C62,66 70,60 80,60 C90,60 98,66 108,62 C120,58 120,46 110,40 C98,34 92,22 90,4" fill="none" stroke="var(--line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {nostril(62, n.left === "open")}
        {nostril(98, n.right === "open")}
        <text x="56" y="93" textAnchor="middle" fontSize="9" fill="var(--muted)">
          Sinistra
        </text>
        <text x="104" y="93" textAnchor="middle" fontSize="9" fill="var(--muted)">
          Destra
        </text>
      </svg>
    </div>
  );
}
