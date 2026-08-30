'use client';

const STARS = Array.from({ length: 48 }, (_, i) => ({
  x: (i * 17 + 9) % 100,
  y: (i * 29 + 6) % 100,
  s: 1 + (i % 3),
  d: `${(i % 12) * 0.28}s`,
  t: `${2.4 + (i % 6) * 0.45}s`,
}));

const PLANETS = [
  { x: 14, y: 16, s: 86, c: 'p-a', d: '0s' },
  { x: 82, y: 22, s: 54, c: 'p-b', d: '1.2s' },
  { x: 78, y: 74, s: 120, c: 'p-c', d: '0.4s' },
  { x: 8, y: 68, s: 42, c: 'p-d', d: '2s' },
];

export default function AppBackground() {
  return (
    <div className="drill-bg" aria-hidden>
      <div className="space-void" />
      <div className="space-nebula n1" />
      <div className="space-nebula n2" />
      {PLANETS.map((p, i) => (
        <span
          key={i}
          className={`space-planet ${p.c}`}
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, animationDelay: p.d }}
        />
      ))}
      <div className="space-stars">
        {STARS.map((s, i) => (
          <span
            key={i}
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
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} style={{ left: `${8 + (i * 7.4) % 84}%`, animationDelay: `${i * 0.5}s`, animationDuration: `${10 + (i % 4)}s` }} />
        ))}
      </div>
      <div className="drill-center-mist" />
      <div className="drill-center-veil" />
      <div className="drill-bg-scan" />
    </div>
  );
}
