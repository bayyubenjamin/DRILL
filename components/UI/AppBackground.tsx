'use client';

const CUBES = [
  { x: 6, y: 8, s: 38, r: -22, d: '0s', z: 2 },
  { x: 24, y: 4, s: 22, r: 14, d: '0.5s', z: 1 },
  { x: 78, y: 6, s: 26, r: -16, d: '0.2s', z: 1 },
  { x: 90, y: 16, s: 34, r: 10, d: '0.9s', z: 2 },
  { x: 4, y: 28, s: 20, r: 18, d: '1.3s', z: 1 },
  { x: 16, y: 22, s: 46, r: -28, d: '0.4s', z: 3 },
  { x: 86, y: 32, s: 40, r: 20, d: '0.7s', z: 3 },
  { x: 8, y: 48, s: 28, r: -12, d: '1.1s', z: 2 },
  { x: 92, y: 52, s: 24, r: 8, d: '1.6s', z: 1 },
  { x: 12, y: 68, s: 44, r: 16, d: '0.15s', z: 3 },
  { x: 28, y: 82, s: 20, r: -20, d: '1.8s', z: 1 },
  { x: 72, y: 78, s: 48, r: 12, d: '0.6s', z: 3 },
  { x: 88, y: 86, s: 22, r: -8, d: '1.4s', z: 1 },
  { x: 4, y: 86, s: 18, r: 22, d: '2s', z: 1 },
  { x: 38, y: 8, s: 18, r: -6, d: '0.8s', z: 1 },
  { x: 62, y: 10, s: 20, r: 24, d: '1.2s', z: 1 },
  { x: 70, y: 62, s: 32, r: -18, d: '0.35s', z: 2 },
  { x: 20, y: 58, s: 18, r: 14, d: '1.7s', z: 1 },
];

const LINKS = [
  [0, 5], [5, 7], [7, 9], [3, 6], [6, 8], [6, 11], [9, 11], [5, 6], [15, 16], [10, 11],
];

function Cube3D({ s, r, d }: { s: number; r: number; d: string }) {
  const half = s / 2;
  return (
    <span className="cube3d" style={{ width: s, height: s, animationDelay: d, ['--sz' as string]: `${s}px`, ['--tilt' as string]: `${r}deg` }}>
      <i className="c-face c-front" style={{ transform: `translateZ(${half}px)` }} />
      <i className="c-face c-back" style={{ transform: `rotateY(180deg) translateZ(${half}px)` }} />
      <i className="c-face c-right" style={{ transform: `rotateY(90deg) translateZ(${half}px)` }} />
      <i className="c-face c-left" style={{ transform: `rotateY(-90deg) translateZ(${half}px)` }} />
      <i className="c-face c-top" style={{ transform: `rotateX(90deg) translateZ(${half}px)` }} />
      <i className="c-face c-bottom" style={{ transform: `rotateX(-90deg) translateZ(${half}px)` }} />
    </span>
  );
}

export default function AppBackground() {
  return (
    <div className="drill-bg" aria-hidden>
      <div className="chain-aurora" />
      <div className="chain-depth" />
      <div className="mist-core" />
      <div className="mist-soft" />
      <div className="mist-bloom" />
      <div className="mist-ring r1" />
      <div className="mist-ring r2" />
      <svg className="chain-wires" viewBox="0 0 100 100" preserveAspectRatio="none">
        {LINKS.map(([a, b], i) => (
          <line
            key={i}
            x1={CUBES[a].x + 3}
            y1={CUBES[a].y + 3}
            x2={CUBES[b].x + 3}
            y2={CUBES[b].y + 3}
            className="chain-wire"
            style={{ animationDelay: `${i * 0.4}s` }}
          />
        ))}
      </svg>
      <div className="chain-field">
        {CUBES.map((c, i) => (
          <span key={i} className={`cube-slot z${c.z}`} style={{ left: `${c.x}%`, top: `${c.y}%` }}>
            <Cube3D s={c.s} r={c.r} d={c.d} />
          </span>
        ))}
      </div>
      <div className="chain-packet p1" />
      <div className="chain-packet p2" />
      <div className="mist-motes">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            style={{
              left: `${26 + (i * 2.8) % 48}%`,
              animationDelay: `${i * 0.35}s`,
              animationDuration: `${6.5 + (i % 5)}s`,
            }}
          />
        ))}
      </div>
      <div className="drill-bg-scan" />
    </div>
  );
}
