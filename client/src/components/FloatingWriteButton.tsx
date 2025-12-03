import { Link } from "react-router-dom";

export function FloatingWriteButton() {
  return (
    <Link to="/write" className="fixed bottom-6 right-4 z-50">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          <defs>
            <radialGradient
              id="ipGradient"
              cx="30"
              cy="20"
              r="60"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="40%" stopColor="#fde68a" />
              <stop offset="70%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </radialGradient>
          </defs>
          <g fill="url(#ipGradient)">
            <circle cx="50" cy="25" r="22" />
            <circle cx="75" cy="50" r="22" />
            <circle cx="50" cy="75" r="22" />
            <circle cx="25" cy="50" r="22" />
          </g>
          <g stroke="black" strokeWidth="5" strokeLinecap="round">
            <line x1="50" y1="38" x2="50" y2="62" />
            <line x1="38" y1="50" x2="62" y2="50" />
          </g>
        </svg>
      </div>
    </Link>
  );
}
