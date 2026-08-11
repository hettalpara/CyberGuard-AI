export default function CyberIllustration() {
  return (
    <svg
      viewBox="0 0 560 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full max-w-xl"
      role="img"
      aria-label="AI-powered cybersecurity illustration"
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
      </defs>

      <circle cx="280" cy="260" r="230" fill="url(#glow)" />

      {/* orbit rings representing AI network */}
      <circle
        cx="280"
        cy="260"
        r="190"
        stroke="#bfdbfe"
        strokeWidth="1.5"
        strokeDasharray="4 8"
      />
      <circle
        cx="280"
        cy="260"
        r="150"
        stroke="#93c5fd"
        strokeWidth="1.5"
        strokeDasharray="2 6"
      />

      {/* connection lines */}
      <g stroke="#60a5fa" strokeWidth="1.5" opacity="0.6">
        <line x1="280" y1="260" x2="115" y2="150" />
        <line x1="280" y1="260" x2="455" y2="160" />
        <line x1="280" y1="260" x2="120" y2="380" />
        <line x1="280" y1="260" x2="450" y2="400" />
        <line x1="280" y1="260" x2="280" y2="80" />
      </g>

      {/* network nodes */}
      <circle cx="115" cy="150" r="7" fill="#2563eb" />
      <circle cx="455" cy="160" r="6" fill="#0f172a" />
      <circle cx="120" cy="380" r="6" fill="#0f172a" />
      <circle cx="450" cy="400" r="7" fill="#2563eb" />
      <circle cx="280" cy="80" r="6" fill="#2563eb" />

      {/* secure cloud */}
      <g transform="translate(340,320)">
        <path
          d="M20 40c-16 0-28-12-28-27 0-13 9-24 22-27 4-15 18-26 34-26 17 0 32 12 35 28 13 2 23 13 23 26 0 15-12 27-27 27H20Z"
          fill="url(#cloudGrad)"
          stroke="#93c5fd"
          strokeWidth="2"
        />
        <rect x="34" y="20" width="24" height="20" rx="3" fill="#2563eb" />
        <path
          d="M39 20v-5a7 7 0 0114 0v5"
          stroke="#2563eb"
          strokeWidth="3"
          fill="none"
        />
      </g>

      {/* abstract tech elements */}
      <rect
        x="70"
        y="230"
        width="26"
        height="26"
        rx="6"
        fill="none"
        stroke="#2563eb"
        strokeWidth="2"
        transform="rotate(15 83 243)"
      />
      <polygon
        points="420,90 434,116 406,116"
        fill="none"
        stroke="#0f172a"
        strokeWidth="2"
      />

      {/* central shield */}
      <g transform="translate(210,150)">
        <path
          d="M70 0 130 22v58c0 46-30 82-70 96C90 162 60 126 60 80V22Z"
          fill="url(#shieldGrad)"
        />
        <path
          d="M70 0 130 22v58c0 46-30 82-70 96C90 162 60 126 60 80V22Z"
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="2"
          opacity="0.5"
        />
        {/* lock icon inside shield */}
        <rect x="52" y="72" width="36" height="28" rx="4" fill="#ffffff" />
        <path
          d="M58 72v-10a12 12 0 0124 0v10"
          stroke="#ffffff"
          strokeWidth="5"
          fill="none"
        />
        <circle cx="70" cy="86" r="4" fill="#2563eb" />
      </g>
    </svg>
  );
}
