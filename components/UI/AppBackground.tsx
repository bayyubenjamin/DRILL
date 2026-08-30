'use client';

const CUBES = [
  { x: 8, y: 10, s: 42, r: -18, d: '0s', z: 2 },
  { x: 28, y: 6, s: 28, r: 12, d: '0.4s', z: 1 },
  { x: 48, y: 12, s: 54, r: -8, d: '0.8s', z: 3 },
  { x: 70, y: 4, s: 24, r: 20, d: '1.2s', z: 1 },
  { x: 84, y: 14, s: 36, r: -14, d: '0.2s', z: 2 },
  { x: 4, y: 32, s: 22, r: 8, d: '1.6s', z: 1 },
  { x: 18, y: 28, s: 48, r: -22, d: '0.6s', z: 3 },
  { x: 40, y: 34, s: 30, r: 16, d: '1s', z: 2 },
  { x: 62, y: 26, s: 58, r: -6, d: '0.3s', z: 4 },
  { x: 82, y: 36, s: 26, r: 10, d: '1.4s', z: 1 },
  { x: 10, y: 52, s: 34, r: -16, d: '0.9s', z: 2 },
  { x: 32, y: 56, s: 20, r: 24, d: '1.8s', z: 1 },
  { x: 52, y: 48, s: 44, r: -10, d: '0.5s', z: 3 },
  { x: 74, y: 54, s: 38, r: 14, d: '1.1s', z: 2 },
  { x: 6, y: 72, s: 26, r: -12, d: '1.5s', z: 1 },
  { x: 24, y: 70, s: 50, r: 6, d: '0.15s', z: 3 },
  { x: 46, y: 76, s: 22, r: -20, d: '2s', z: 1 },
  { x: 66, y: 68, s: 46, r: 18, d: '0.7s', z: 3 },
  { x: 86, y: 74, s: 28, r: -4, d: '1.3s', z: 2 },
  { x: 14, y: 88, s: 18, r: 15, d: '0.25s', z: 1 },
  { x: 58, y: 90, s: 32, r: -18, d: '1.7s', z: 2 },
];

const LINKS = [
  [0, 2], [2, 4], [1, 2], [6, 8], [8, 12], [7, 8], [10, 12], [12, 13], [15, 17], [17, 18], [2, 8], [8, 17], [6, 10], [13, 17],
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
      <svg className="chain-wires" viewBox="0 0 100 100" preserveAspectRatio="none">
        {LINKS.map(([a, b], i) => (
          <line
            key={i}
            x1={CUBES[a].x + 4}
            y1={CUBES[a].y + 4}
            x2={CUBES[b].x + 4}
            y2={CUBES[b].y + 4}
            className="chain-wire"
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
      <div className="chain-packet" />
      <div className="drill-bg-fog" />
      <div className="drill-bg-scan" />
    </div>
  );
}
