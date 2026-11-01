import type { Stage } from "../lib/rot";

/** Blend two hex colours. */
function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

const BODY: Record<Stage, string> = {
  fresh: "#f5932e",
  carved: "#f28522",
  worried: "#ee7a1c",
  angry: "#e8641a",
  rotting: "#c27a2e",
  ghost: "#7d7a45",
};

/**
 * A hand-drawn pumpkin. Its face and colour follow the task's stage,
 * and `rot` (0–1) adds mould, droop and flies while it's rotting.
 */
export function Pumpkin({ stage, rot = 0, seed = 1, size = 120 }: { stage: Stage; rot?: number; seed?: number; size?: number }) {
  const wide = 0.92 + ((seed * 37) % 17) / 100; // each pumpkin a slightly different shape
  const rotting = stage === "rotting" || stage === "ghost";
  const body = rotting ? mix(BODY.rotting, BODY.ghost, stage === "ghost" ? 1 : rot) : BODY[stage];
  const edge = mix(body, "#5a2a00", 0.35);
  const rib = mix(body, "#7a3a00", 0.18);
  const glow = stage === "angry" ? "#ff5a1f" : "#ffd43b";
  const carved = stage !== "fresh";
  const droop = rotting ? 1 - 0.18 * (stage === "ghost" ? 1 : rot) : 1;
  const id = `g${seed}-${stage}`;

  return (
    <svg viewBox="0 0 120 112" width={size} height={size * (112 / 120)} className={`pumpkin stage-${stage}`} aria-hidden>
      <defs>
        <radialGradient id={`${id}-shine`} cx="38%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity={rotting ? 0.08 : 0.35} />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="60" cy="104" rx={40 * wide} ry="6" fill="#000" opacity="0.25" />

      <g transform={`translate(60 104) scale(${wide} ${droop}) translate(-60 -104)`}>
        {/* stem */}
        <path
          d={stage === "fresh" ? "M57 30 C55 20 58 12 66 8 L69 12 C63 16 62 22 64 31 Z" : "M56 31 C55 22 57 15 64 11 L67 15 C62 18 61 24 63 32 Z"}
          fill={rotting ? "#5b4a2a" : "#4f7d2b"}
          stroke="#2f4a17"
          strokeWidth="1.2"
        />
        {stage === "fresh" && <path d="M66 14 C78 6 90 12 88 22 C80 16 74 18 66 14 Z" fill="#6aa53a" stroke="#3f6b1f" strokeWidth="1" />}

        {/* ribs */}
        <ellipse cx="32" cy="66" rx="26" ry="36" fill={rib} stroke={edge} strokeWidth="1.5" />
        <ellipse cx="88" cy="66" rx="26" ry="36" fill={rib} stroke={edge} strokeWidth="1.5" />
        <ellipse cx="46" cy="66" rx="24" ry="38" fill={body} stroke={edge} strokeWidth="1.5" />
        <ellipse cx="74" cy="66" rx="24" ry="38" fill={body} stroke={edge} strokeWidth="1.5" />
        <ellipse cx="60" cy="66" rx="20" ry="39" fill={body} stroke={edge} strokeWidth="1.5" />
        <ellipse cx="60" cy="66" rx="52" ry="38" fill={`url(#${id}-shine)`} />

        {/* face */}
        {carved && <Face stage={stage} glow={glow} filter={`url(#${id}-glow)`} />}

        {/* mould */}
        {rotting && (
          <g opacity={0.35 + 0.55 * (stage === "ghost" ? 1 : rot)}>
            <circle cx="30" cy="78" r="7" fill="#9bbf6a" />
            <circle cx="36" cy="84" r="4" fill="#b7d48a" />
            <circle cx="86" cy="54" r="6" fill="#9bbf6a" />
            {rot > 0.3 && <circle cx="74" cy="92" r="5" fill="#8fb35e" />}
            {rot > 0.6 && <circle cx="52" cy="40" r="4" fill="#b7d48a" />}
          </g>
        )}
      </g>

      {/* flies */}
      {stage === "rotting" && (
        <g className="flies">
          <text x="18" y="22" fontSize="11">🪰</text>
          {rot > 0.4 && <text x="92" y="30" fontSize="9">🪰</text>}
        </g>
      )}
      {stage === "rotting" && rot > 0.5 && (
        <g stroke="#7d8f3a" strokeWidth="2" fill="none" opacity="0.7" className="stink">
          <path d="M44 18 q-4 -6 0 -12 q4 -6 0 -12" />
          <path d="M80 20 q-4 -6 0 -12 q4 -6 0 -12" />
        </g>
      )}
    </svg>
  );
}

function Face({ stage, glow, filter }: { stage: Stage; glow: string; filter: string }) {
  const dark = "#3a1a00";
  if (stage === "rotting" || stage === "ghost") {
    // Droopy, defeated face
    return (
      <g fill={dark} stroke={dark} strokeWidth="1">
        <path d="M36 56 l10 8 M46 56 l-10 8" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M74 56 l10 8 M84 56 l-10 8" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M42 88 Q60 74 78 88" fill="none" strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  }
  const brows =
    stage === "worried" ? (
      <g stroke={dark} strokeWidth="3" strokeLinecap="round">
        <path d="M34 46 L48 41" />
        <path d="M86 46 L72 41" />
      </g>
    ) : stage === "angry" ? (
      <g stroke={dark} strokeWidth="3.5" strokeLinecap="round">
        <path d="M33 40 L49 48" />
        <path d="M87 40 L71 48" />
      </g>
    ) : null;
  const mouth =
    stage === "carved" ? (
      <path d="M38 76 Q60 98 82 76 L74 80 L68 75 L60 82 L52 75 L46 80 Z" />
    ) : stage === "worried" ? (
      <path d="M40 86 q5 -6 10 0 q5 6 10 0 q5 -6 10 0 q5 6 10 0 l0 4 q-5 6 -10 0 q-5 -6 -10 0 q-5 6 -10 0 q-5 -6 -10 0 Z" />
    ) : (
      <path d="M36 90 L44 78 L50 86 L56 76 L62 86 L68 76 L74 86 L80 78 L86 90 L72 84 L60 92 L48 84 Z" />
    );
  return (
    <g>
      <g fill={glow} filter={filter} className={stage === "angry" ? "flicker" : undefined}>
        <path d={stage === "angry" ? "M36 52 L50 52 L44 64 Z" : "M42 48 L52 64 L32 64 Z"} />
        <path d={stage === "angry" ? "M84 52 L70 52 L76 64 Z" : "M78 48 L88 64 L68 64 Z"} />
        <path d="M60 64 L65 72 L55 72 Z" />
        {mouth}
      </g>
      {stage === "worried" && <path d="M92 50 q3 6 0 9 q-3 -3 0 -9" fill="#8fd3ff" />}
      {brows}
    </g>
  );
}

export function Ghost({ size = 90, mood = "spooky" }: { size?: number; mood?: "spooky" | "sad" }) {
  return (
    <svg viewBox="0 0 100 110" width={size} height={size * 1.1} aria-hidden className="ghost-svg">
      <path
        d="M50 6 C24 6 12 28 12 52 L12 96 L22 88 L32 98 L42 88 L50 98 L58 88 L68 98 L78 88 L88 96 L88 52 C88 28 76 6 50 6 Z"
        fill="#f4f1ff"
        stroke="#bdb5e8"
        strokeWidth="2"
      />
      <ellipse cx="37" cy="44" rx="6" ry={mood === "sad" ? 5 : 8} fill="#2b2240" />
      <ellipse cx="63" cy="44" rx="6" ry={mood === "sad" ? 5 : 8} fill="#2b2240" />
      {mood === "sad" ? (
        <path d="M40 70 Q50 62 60 70" stroke="#2b2240" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <ellipse cx="50" cy="68" rx="7" ry="9" fill="#2b2240" />
      )}
      <ellipse cx="28" cy="56" rx="5" ry="3" fill="#ffb3c7" opacity="0.7" />
      <ellipse cx="72" cy="56" rx="5" ry="3" fill="#ffb3c7" opacity="0.7" />
      {/* tiny pumpkin stem hat, so you know who it used to be */}
      <path d="M47 8 C46 2 49 -1 53 -1 L54 2 C51 3 50 5 51 9 Z" fill="#4f7d2b" />
    </svg>
  );
}
