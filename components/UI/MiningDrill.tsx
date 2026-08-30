'use client';

const SPARKS = [
  { x: 44.8, y: 84.5, dx: -28, dy: -36, d: '0s', t: '0.62s' },
  { x: 45.6, y: 85.2, dx: -6, dy: -48, d: '0.08s', t: '0.55s' },
  { x: 46.4, y: 84.6, dx: 24, dy: -34, d: '0.14s', t: '0.7s' },
  { x: 45.2, y: 86.0, dx: -18, dy: -20, d: '0.22s', t: '0.48s' },
  { x: 46.0, y: 86.0, dx: 16, dy: -22, d: '0.3s', t: '0.58s' },
  { x: 44.2, y: 83.8, dx: -36, dy: -14, d: '0.18s', t: '0.8s' },
  { x: 47.0, y: 83.8, dx: 34, dy: -12, d: '0.36s', t: '0.76s' },
  { x: 45.5, y: 86.6, dx: 4, dy: -16, d: '0.1s', t: '0.42s' },
  { x: 44.6, y: 84.8, dx: -14, dy: -42, d: '0.26s', t: '0.68s' },
  { x: 46.6, y: 84.8, dx: 18, dy: -40, d: '0.4s', t: '0.64s' },
];

export default function MiningDrill({ active }: { active: boolean }) {
  return (
    <div className={`drill-hero ${active ? 'is-live' : 'is-idle'}`} aria-hidden>
      <span className="drill-hero-glow" />
      <svg className="auger-rig" viewBox="0 0 280 360" fill="none">
        <g className="rock-bed">
          <ellipse cx="116" cy="328" rx="78" ry="16" fill="#050605" />
          <path d="M42 332 78 304 118 328 84 346Z" fill="#1a1c14" />
          <path d="M70 334 104 312 136 332 96 348Z" fill="#2a2e22" />
          <path d="M128 312 176 328 140 348 108 330Z" fill="#16180f" />
          <path d="M154 322 198 308 222 330 168 344Z" fill="#242818" />
          <path d="M28 338 52 322 68 336 46 348Z" fill="#12140c" />
          <path d="M210 334 246 318 262 336 224 350Z" fill="#10120c" />
          <circle cx="96" cy="336" r="6" fill="#2f3324" />
          <circle cx="148" cy="340" r="8" fill="#1e2216" />
          <circle cx="188" cy="334" r="5" fill="#323626" />
        </g>

        <rect x="54" y="308" width="84" height="18" rx="2" fill="#1a1d22" />
        <rect x="154" y="308" width="84" height="18" rx="2" fill="#1a1d22" />
        <rect x="62" y="300" width="68" height="10" fill="#111318" />
        <rect x="162" y="300" width="68" height="10" fill="#111318" />

        <g transform="translate(148,168)">
          <rect x="0" y="0" width="96" height="132" rx="4" fill="#8fd400" />
          <rect x="6" y="8" width="84" height="116" rx="3" fill="#b6ff14" />
          <rect x="14" y="18" width="38" height="52" rx="2" fill="#111" />
          <circle cx="26" cy="34" r="6" fill="#3a3a3a" />
          <circle cx="40" cy="34" r="6" fill="#3a3a3a" />
          <rect x="20" y="48" width="26" height="14" fill="#222" />
          <rect x="58" y="16" width="26" height="18" fill="#111" />
          <rect x="10" y="84" width="76" height="10" fill="#6aa000" />
          <rect x="-28" y="40" width="36" height="16" rx="2" fill="#8fd400" />
          <rect x="-18" y="8" width="22" height="48" fill="#b6ff14" />
        </g>

        <g transform="translate(78,18)">
          <rect x="18" y="8" width="4" height="210" fill="#4a4e55" />
          <rect x="54" y="8" width="4" height="210" fill="#4a4e55" />
          <ellipse cx="38" cy="20" rx="28" ry="8" stroke="#6b7280" strokeWidth="3" />
          <ellipse cx="38" cy="62" rx="28" ry="8" stroke="#6b7280" strokeWidth="3" />
          <ellipse cx="38" cy="104" rx="28" ry="8" stroke="#6b7280" strokeWidth="3" />
          <ellipse cx="38" cy="146" rx="28" ry="8" stroke="#6b7280" strokeWidth="3" />
          <g className="auger-bit">
            <rect x="32" y="12" width="12" height="220" rx="6" fill="#cfd3d8" />
            <path d="M26 28 C58 44 18 60 50 76 C18 92 58 108 26 124 C58 140 18 156 50 172 C18 188 58 204 38 220" stroke="#e8eaee" strokeWidth="7" fill="none" />
            <rect x="26" y="196" width="24" height="28" rx="3" fill="#9aa0a6" />
            <path d="M28 248 L48 248 L38 286 Z" fill="#b8bcc2" />
            <path d="M32 252 L44 252 L38 274 Z" fill="#c8ff3a" opacity=".85" />
          </g>
        </g>
      </svg>
      <span className="drill-impact" />
      <div className="drill-spark-bits">
        {SPARKS.map((s, i) => (
          <span
            key={i}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              ['--dx' as string]: `${s.dx}px`,
              ['--dy' as string]: `${s.dy}px`,
              animationDelay: s.d,
              animationDuration: s.t,
            }}
          />
        ))}
      </div>
    </div>
  );
}
