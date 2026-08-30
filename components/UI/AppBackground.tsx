'use client';

const STARS = Array.from({ length: 72 }, (_, i) => ({
  x: (i * 13 + 7) % 100,
  y: (i * 19 + 4) % 100,
  s: 1 + (i % 4 === 0 ? 2 : i % 3),
  d: `${(i % 14) * 0.22}s`,
  t: `${2.2 + (i % 7) * 0.4}s`,
}));

export default function AppBackground() {
  return (
    <div className="drill-bg" aria-hidden>
      <div className="space-void" />
      <div className="galaxy g1" />
      <div className="galaxy g2" />
      <div className="galaxy g3" />
      <div className="galaxy g4" />
      <div className="galaxy-band" />
      <div className="space-stars">
        {STARS.map((s, i) => (
          <span
            key={i}
            className={i % 9 === 0 ? 'star-bright' : ''}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.s,
              height: s.s,
              animationDelay: s.d,
              animationDuration: s.t,
            }}
          />
        ))}
      </div>
      <div className="space-dust">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            style={{
              left: `${5 + (i * 6.1) % 90}%`,
              animationDelay: `${i * 0.45}s`,
              animationDuration: `${9 + (i % 5)}s`,
            }}
          />
        ))}
      </div>
      <div className="drill-center-mist" />
      <div className="drill-center-veil" />
      <div className="drill-bg-scan" />
    </div>
  );
}
