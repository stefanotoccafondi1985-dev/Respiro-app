import { fmt } from "./lib/format";

/** Linea semplice con punti, disegnata in SVG con i colori del tema. */
export function LineChart({ points, labels }: { points: number[]; labels: string[] }) {
  if (points.length === 0) return null;
  const W = 320,
    H = 140,
    L = 36,
    R = 10,
    T = 12,
    B = 22;
  const min = Math.min(...points) - 10;
  const max = Math.max(...points) + 10;
  const x = (i: number) => (points.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (points.length - 1));
  const y = (v: number) => T + ((max - v) * (H - T - B)) / (max - min || 1);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const ticks = [min, (min + max) / 2, max].map((v) => Math.round(v));
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Andamento del PB: ${points.map(fmt).join(", ")}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
          <text x={L - 4} y={y(t) + 3} textAnchor="end">
            {fmt(t)}
          </text>
        </g>
      ))}
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
      {points.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === points.length - 1 ? 4 : 2.5} fill="var(--accent)" />
      ))}
      <text x={L} y={H - 4} textAnchor="start">
        {labels[0]}
      </text>
      {labels.length > 1 && (
        <text x={W - R} y={H - 4} textAnchor="end">
          {labels[labels.length - 1]}
        </text>
      )}
    </svg>
  );
}

/** Barre verticali (sessioni per settimana). */
export function BarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const W = 320,
    H = 140,
    L = 24,
    R = 10,
    T = 14,
    B = 22;
  const max = Math.max(1, ...values);
  const slot = (W - L - R) / values.length;
  const bw = Math.min(26, slot * 0.6);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Sessioni per settimana: ${values.join(", ")}`}>
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--line)" strokeWidth="1" />
      {values.map((v, i) => {
        const h = (v / max) * (H - T - B);
        const cx = L + slot * i + slot / 2;
        return (
          <g key={i}>
            <rect x={cx - bw / 2} y={H - B - h} width={bw} height={h} rx="3" fill="var(--accent)" />
            {v > 0 && (
              <text x={cx} y={H - B - h - 3} textAnchor="middle">
                {v}
              </text>
            )}
            <text x={cx} y={H - 6} textAnchor="middle">
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
