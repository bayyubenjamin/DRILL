'use client';

export default function MiningDrill({ active }: { active: boolean }) {
  const sparks = [
    { x: 46, y: 78, dx: -28, dy: -36, delay: '0s', dur: '0.72s' },
    { x: 50, y: 80, dx: 6, dy: -48, delay: '0.08s', dur: '0.64s' },
    { x: 54, y: 78, dx: 30, dy: -34, delay: '0.16s', dur: '0.78s' },
    { x: 48, y: 82, dx: -16, dy: -22, delay: '0.24s', dur: '0.58s' },
    { x: 52, y: 82, dx: 18, dy: -24, delay: '0.32s', dur: '0.7s' },
    { x: 44, y: 76, dx: -38, dy: -18, delay: '0.4s', dur: '0.86s' },
    { x: 56, y: 76, dx: 40, dy: -16, delay: '0.48s', dur: '0.82s' },
    { x: 50, y: 84, dx: -8, dy: -14, delay: '0.12s', dur: '0.5s' },
    { x: 49, y: 79, dx: -22, dy: -42, delay: '0.56s', dur: '0.9s' },
    { x: 51, y: 79, dx: 24, dy: -40, delay: '0.2s', dur: '0.74s' },
  ];

  return (
    <div className={`drill-hero ${active ? 'is-live' : 'is-idle'}`} aria-hidden>
      <span className="drill-hero-glow" />
      <img className="drill-machine" src="/drill-hero.svg" alt="" />
      <img className="drill-ground" src="/drill-ground.svg" alt="" />
      <span className="drill-impact" />
      <div className="drill-spark-bits">
        {sparks.map((s, i) => (
          <span
            key={i}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              ['--dx' as string]: `${s.dx}px`,
              ['--dy' as string]: `${s.dy}px`,
              animationDelay: s.delay,
              animationDuration: s.dur,
            }}
          />
        ))}
      </div>
    </div>
  );
}
