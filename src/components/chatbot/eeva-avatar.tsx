"use client";

type EevaExpression = "happy" | "thinking" | "waving" | "idle";

interface EevaAvatarProps {
  expression?: EevaExpression;
  size?: number;
  className?: string;
}

export function EevaAvatar({ expression = "idle", size = 40, className = "" }: EevaAvatarProps) {
  const eyeAnimation = expression === "thinking" ? "eeva-look-around" : "";
  const mouthPath =
    expression === "happy" || expression === "waving"
      ? "M 16 26 Q 20 30 24 26" // smile
      : expression === "thinking"
        ? "M 17 27 Q 20 26 23 27" // flat/thinking
        : "M 16.5 26 Q 20 29 23.5 26"; // gentle smile

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className}`}
    >
      <defs>
        <linearGradient id="eevaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
        <linearGradient id="eevaShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <filter id="eevaShadow" x="-2" y="-2" width="44" height="44">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#6D28D9" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Body / Head circle */}
      <circle cx="20" cy="20" r="18" fill="url(#eevaGrad)" filter="url(#eevaShadow)" />
      <circle cx="20" cy="20" r="18" fill="url(#eevaShine)" />

      {/* Inner face area */}
      <ellipse cx="20" cy="21" rx="13" ry="12" fill="#EDE9FE" opacity="0.95" />

      {/* Left eye */}
      <g className={eyeAnimation}>
        <ellipse cx="15" cy="19" rx="2.5" ry="3" fill="#4C1D95" />
        <ellipse cx="15.8" cy="18" rx="1" ry="1.2" fill="white" opacity="0.8" />
      </g>

      {/* Right eye */}
      <g className={eyeAnimation}>
        <ellipse cx="25" cy="19" rx="2.5" ry="3" fill="#4C1D95" />
        <ellipse cx="25.8" cy="18" rx="1" ry="1.2" fill="white" opacity="0.8" />
      </g>

      {/* Eyebrows */}
      {expression === "thinking" ? (
        <>
          <path d="M 12 15 Q 14 12 17 14" stroke="#4C1D95" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 23 14.5 Q 26 12 28 15.5" stroke="#4C1D95" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M 12 15.5 Q 14.5 13.5 17 15" stroke="#4C1D95" strokeWidth="1" fill="none" strokeLinecap="round" />
          <path d="M 23 15 Q 25.5 13.5 28 15.5" stroke="#4C1D95" strokeWidth="1" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Mouth */}
      <path d={mouthPath} stroke="#4C1D95" strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* Blush */}
      <ellipse cx="11.5" cy="23" rx="2.5" ry="1.5" fill="#C4B5FD" opacity="0.5" />
      <ellipse cx="28.5" cy="23" rx="2.5" ry="1.5" fill="#C4B5FD" opacity="0.5" />

      {/* Antenna / sparkle */}
      <line x1="20" y1="2" x2="20" y2="6" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="20" cy="1.5" r="1.8" fill="#A78BFA" className="eeva-pulse" />

      {/* Waving hand */}
      {expression === "waving" && (
        <g className="eeva-wave">
          <ellipse cx="35" cy="14" rx="3" ry="4" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.5" />
          <rect x="33.5" y="8" width="1.2" height="4" rx="0.6" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.3" transform="rotate(-15 34 10)" />
          <rect x="35" y="8.5" width="1.2" height="3.5" rx="0.6" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.3" transform="rotate(0 35.5 10)" />
          <rect x="36.5" y="9" width="1.2" height="3" rx="0.6" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.3" transform="rotate(10 37 10)" />
        </g>
      )}

      {/* Thinking dots */}
      {expression === "thinking" && (
        <>
          <circle cx="33" cy="10" r="1.5" fill="#A78BFA" opacity="0.6" className="eeva-dot-1" />
          <circle cx="36" cy="7" r="1" fill="#A78BFA" opacity="0.4" className="eeva-dot-2" />
          <circle cx="38" cy="4" r="0.7" fill="#A78BFA" opacity="0.3" className="eeva-dot-3" />
        </>
      )}
    </svg>
  );
}

/** Mini version for message bubbles */
export function EevaMiniAvatar({ className = "" }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="20" cy="20" r="18" fill="#7C3AED" />
      <ellipse cx="20" cy="21" rx="13" ry="12" fill="#EDE9FE" opacity="0.95" />
      <ellipse cx="15" cy="19" rx="2.2" ry="2.8" fill="#4C1D95" />
      <ellipse cx="15.7" cy="18" rx="0.8" ry="1" fill="white" opacity="0.8" />
      <ellipse cx="25" cy="19" rx="2.2" ry="2.8" fill="#4C1D95" />
      <ellipse cx="25.7" cy="18" rx="0.8" ry="1" fill="white" opacity="0.8" />
      <path d="M 16.5 26 Q 20 29 23.5 26" stroke="#4C1D95" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <ellipse cx="11.5" cy="23" rx="2.5" ry="1.5" fill="#C4B5FD" opacity="0.5" />
      <ellipse cx="28.5" cy="23" rx="2.5" ry="1.5" fill="#C4B5FD" opacity="0.5" />
      <circle cx="20" cy="1.5" r="1.8" fill="#A78BFA" />
      <line x1="20" y1="2" x2="20" y2="6" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
