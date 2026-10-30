/** Candela con fiamma che vibra piano, per la meditazione dello sguardo (trataka). */
export function Flame() {
  return (
    <svg className="flame" viewBox="0 0 160 260" aria-hidden="true">
      <defs>
        <radialGradient id="glow" cx="50%" cy="38%" r="55%">
          <stop offset="0" stopColor="#ffb347" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#ff8a1f" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ff8a1f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fl" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff8a1f" />
          <stop offset="0.55" stopColor="#ffc24a" />
          <stop offset="1" stopColor="#fff2b0" />
        </linearGradient>
        <linearGradient id="wax" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d9cdb6" />
          <stop offset="0.5" stopColor="#f3ead8" />
          <stop offset="1" stopColor="#c9bca4" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="82" r="78" fill="url(#glow)" />
      <g className="flame-fire">
        <path d="M80,22 C98,52 106,76 80,106 C54,76 62,52 80,22 Z" fill="url(#fl)" />
        <path d="M80,56 C88,72 90,86 80,98 C70,86 72,72 80,56 Z" fill="#fff8d8" opacity="0.9" />
        <path d="M80,92 C74,98 74,106 80,110 C86,106 86,98 80,92 Z" fill="#5b8cff" opacity="0.75" />
      </g>
      <line x1="80" y1="108" x2="80" y2="124" stroke="#3a2c20" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="58" y="124" width="44" height="120" rx="6" fill="url(#wax)" />
      <ellipse cx="80" cy="124" rx="22" ry="5" fill="#fff7e6" />
      <path d="M58,130 C66,128 66,152 72,154" stroke="#cfc1a5" strokeWidth="2" fill="none" opacity="0.7" />
    </svg>
  );
}
