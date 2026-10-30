/**
 * Illustrazioni stilizzate negli angoli dello sfondo: medusa, balena, polpo e faro.
 * Sono disegni originali in SVG (nessun file da scaricare), in tonalità di azzurro e blu,
 * dietro ai contenuti e senza interferire con i tocchi.
 */
const STROKE = "#8fd3f4";
const FILL = "rgba(70, 150, 215, 0.22)";
const DEEP = "rgba(40, 105, 175, 0.35)";

const common = {
  fill: "none",
  stroke: STROKE,
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Jellyfish() {
  return (
    <svg className="tl" viewBox="0 0 120 170" aria-hidden="true">
      <g {...common}>
        <path d="M14,72 C14,32 36,10 60,10 C84,10 106,32 106,72 C96,80 88,66 78,76 C70,84 66,70 60,76 C54,70 50,84 42,76 C32,66 24,80 14,72 Z" fill={FILL} />
        <path d="M30,62 C32,42 44,28 60,24" opacity="0.7" />
        <path d="M46,66 C46,48 52,36 60,32" opacity="0.5" />
        <path d="M34,80 C26,100 42,108 34,128 C28,142 38,152 32,166" />
        <path d="M50,80 C44,98 56,110 50,130 C46,144 54,154 50,168" />
        <path d="M66,80 C72,98 60,110 68,130 C72,144 64,154 70,168" />
        <path d="M82,78 C90,96 76,108 84,126 C88,140 80,150 86,162" />
        <path d="M56,82 C60,96 52,104 58,118" strokeWidth="4" opacity="0.5" />
        <path d="M64,82 C62,96 70,104 64,118" strokeWidth="4" opacity="0.5" />
      </g>
      <g fill={STROKE} opacity="0.7">
        <circle cx="100" cy="100" r="3" />
        <circle cx="108" cy="124" r="2" />
        <circle cx="16" cy="108" r="2.4" />
      </g>
    </svg>
  );
}

function Whale() {
  return (
    <svg className="tr" viewBox="0 0 240 140" aria-hidden="true">
      <g {...common}>
        {/* spruzzo */}
        <path d="M70,30 C70,18 62,10 52,6 M70,30 C70,18 78,10 88,6 M70,30 L70,12" opacity="0.8" />
        <circle cx="46" cy="12" r="2" fill={STROKE} />
        <circle cx="94" cy="12" r="2" fill={STROKE} />
        {/* corpo e coda */}
        <path
          d="M14,76 C14,48 46,30 90,32 C136,34 176,52 198,70 C204,58 202,44 192,34 C206,36 220,34 232,24 C230,40 226,54 214,66 C222,78 230,86 238,94 C222,94 208,92 198,84 C176,104 130,114 88,112 C46,110 14,100 14,76 Z"
          fill={FILL}
        />
        {/* pancia */}
        <path d="M26,86 C60,102 120,106 176,84" opacity="0.8" />
        <path d="M32,94 C66,108 118,110 168,92" opacity="0.6" />
        <path d="M44,100 C72,110 112,112 150,100" opacity="0.4" />
        {/* pinna */}
        <path d="M92,96 C94,112 108,120 120,118 C112,110 110,102 112,96" fill={DEEP} />
        {/* occhio */}
        <circle cx="40" cy="72" r="3.6" fill={STROKE} stroke="none" />
      </g>
      <g {...common} opacity="0.6">
        <path d="M0,126 q10,-8 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0" />
        <path d="M0,136 q10,-8 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0" opacity="0.6" />
      </g>
    </svg>
  );
}

function Octopus() {
  return (
    <svg className="bl" viewBox="0 0 150 150" aria-hidden="true">
      <g {...common}>
        <path d="M34,66 C30,28 52,8 74,8 C96,8 118,28 114,66 C114,76 108,82 100,84 L48,84 C40,82 34,76 34,66 Z" fill={FILL} />
        <path d="M48,30 C54,22 62,18 70,18" opacity="0.7" />
        {/* tentacoli */}
        <path d="M48,84 C34,98 16,96 14,114 C12,130 28,134 34,124 C38,116 30,110 24,114" />
        <path d="M58,86 C52,106 36,114 42,132 C46,144 58,142 58,134" />
        <path d="M70,86 C68,106 74,120 66,138 C64,144 70,148 76,144" />
        <path d="M82,86 C86,106 80,120 88,138 C92,146 102,144 100,136" />
        <path d="M94,86 C100,104 116,112 110,130 C106,142 94,140 96,132" />
        <path d="M102,84 C116,96 134,92 136,110 C138,124 124,130 118,122 C114,114 122,110 126,114" />
      </g>
      {/* occhi */}
      <g stroke={STROKE} strokeWidth="2.2" fill="none">
        <circle cx="58" cy="52" r="8" fill={DEEP} />
        <circle cx="92" cy="52" r="8" fill={DEEP} />
      </g>
      <circle cx="60" cy="54" r="3" fill={STROKE} />
      <circle cx="94" cy="54" r="3" fill={STROKE} />
      <g fill={STROKE} opacity="0.7">
        <circle cx="132" cy="70" r="2.4" />
        <circle cx="140" cy="52" r="1.8" />
        <circle cx="12" cy="80" r="2" />
      </g>
    </svg>
  );
}

function Lighthouse() {
  return (
    <svg className="br" viewBox="0 0 130 230" aria-hidden="true">
      <defs>
        <linearGradient id="beam" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#bfe8ff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#bfe8ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* fascio di luce verso sinistra */}
      <path d="M44,56 L-70,24 L-70,92 Z" fill="url(#beam)" stroke="none" />
      <g {...common}>
        {/* torre a fasce */}
        <path d="M48,86 L82,86 L90,196 L40,196 Z" fill={FILL} />
        <path d="M46.5,112 L83.5,112 L85,132 L45,132 Z" fill={DEEP} />
        <path d="M43.5,156 L86.5,156 L88,176 L42,176 Z" fill={DEEP} />
        {/* balconcino */}
        <path d="M42,78 L88,78 L88,86 L42,86 Z" fill={FILL} />
        <path d="M44,78 L44,70 M52,78 L52,70 M60,78 L60,70 M70,78 L70,70 M78,78 L78,70 M86,78 L86,70" opacity="0.7" />
        {/* lanterna */}
        <path d="M50,48 L80,48 L80,78 L50,78 Z" fill="rgba(200, 235, 255, 0.35)" />
        <path d="M65,48 L65,78 M50,63 L80,63" opacity="0.6" />
        {/* tetto */}
        <path d="M46,48 L65,28 L84,48 Z" fill={FILL} />
        <path d="M65,28 L65,18 M60,18 L70,18" />
        {/* porta */}
        <path d="M57,196 L57,182 C57,176 73,176 73,182 L73,196" opacity="0.8" />
        {/* scoglio */}
        <path d="M22,200 C30,190 100,190 110,200 L120,210 L12,210 Z" fill={DEEP} />
      </g>
      <g {...common} opacity="0.65">
        <path d="M0,218 q10,-8 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0" />
        <path d="M-6,228 q10,-8 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0" opacity="0.6" />
      </g>
    </svg>
  );
}

export function BackgroundArt() {
  return (
    <div className="bgart" aria-hidden="true">
      <Jellyfish />
      <Whale />
      <Octopus />
      <Lighthouse />
    </div>
  );
}
