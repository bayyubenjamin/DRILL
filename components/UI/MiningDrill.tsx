'use client';

export default function MiningDrill({ active }: { active: boolean }) {
  return (
    <div className={`drill-hero ${active ? 'is-live' : 'is-idle'}`} aria-hidden>
      <span className="drill-hero-glow" />
      <svg className="auger-rig" viewBox="0 0 280 360" fill="none">
        <ellipse cx="96" cy="332" rx="42" ry="8" fill="#000" opacity=".45" />
        <ellipse cx="196" cy="332" rx="42" ry="8" fill="#000" opacity=".45" />
        <rect x="54" y="308" width="84" height="18" rx="2" fill="#1a1d22" />
        <rect x="154" y="308" width="84" height="18" rx="2" fill="#1a1d22" />
        <rect x="62" y="300" width="68" height="10" fill="#111318" />
        <rect x="162" y="300" width="68" height="10" fill="#111318" />

        <g className="auger-dirt">
          {Array.from({ length: 14 }).map((_, i) => (
            <circle key={i} className={`dirt-bit d${i}`} cx={88 + (i % 7) * 8} cy="318" r={1.2 + (i % 3) * 0.6} fill={i % 2 ? '#c8ff3a' : '#2a2a2a'} />
          ))}
        </g>

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

        <g className="auger-stack" transform="translate(78,18)">
          <rect x="18" y="8" width="4" height="210" fill="#4a4e55" />
          <rect x="54" y="8" width="4" height="210" fill="#4a4e55" />
          <ellipse cx="38" cy="20" rx="28" ry="8" stroke="#6b7280" strokeWidth="3" />
          <ellipse cx="38" cy="62" rx="28" ry="8" stroke="#6b7280" strokeWidth="3" />
          <ellipse cx="38" cy="104" rx="28" ry="8" stroke="#6b7280" strokeWidth="3" />
          <ellipse cx="38" cy="146" rx="28" ry="8" stroke="#6b7280" strokeWidth="3" />
          <rect x="26" y="196" width="24" height="28" rx="3" fill="#9aa0a6" />
          <g className="auger-bit">
            <rect x="32" y="12" width="12" height="220" rx="6" fill="#cfd3d8" />
            <path d="M26 28 C58 44 18 60 50 76 C18 92 58 108 26 124 C58 140 18 156 50 172 C18 188 58 204 38 220" stroke="#e8eaee" strokeWidth="7" fill="none" />
            <path d="M28 248 L48 248 L38 286 Z" fill="#b8bcc2" />
            <path d="M32 252 L44 252 L38 274 Z" fill="#c8ff3a" opacity=".7" />
          </g>
        </g>
      </svg>
    </div>
  );
}
