'use client';

const CUBES = [
  { x: 6, y: 8, s: 1, d: '0s' },
  { x: 22, y: 5, s: 0.8, d: '0.4s' },
  { x: 38, y: 11, s: 1.15, d: '0.8s' },
  { x: 56, y: 4, s: 0.9, d: '1.1s' },
  { x: 72, y: 9, s: 1.2, d: '0.2s' },
  { x: 86, y: 6, s: 0.75, d: '1.6s' },
  { x: 10, y: 24, s: 0.95, d: '0.6s' },
  { x: 28, y: 28, s: 1.25, d: '1.3s' },
  { x: 48, y: 22, s: 1, d: '0.3s' },
  { x: 66, y: 26, s: 0.85, d: '1.8s' },
  { x: 82, y: 23, s: 1.1, d: '0.9s' },
  { x: 4, y: 44, s: 0.9, d: '1.4s' },
  { x: 18, y: 48, s: 1.15, d: '0.1s' },
  { x: 36, y: 42, s: 0.8, d: '2s' },
  { x: 54, y: 46, s: 1.2, d: '0.7s' },
  { x: 72, y: 43, s: 1, d: '1.5s' },
  { x: 88, y: 50, s: 0.85, d: '0.5s' },
  { x: 8, y: 64, s: 1.1, d: '1.2s' },
  { x: 24, y: 68, s: 0.9, d: '1.9s' },
  { x: 42, y: 62, s: 1.3, d: '0.35s' },
  { x: 60, y: 66, s: 0.95, d: '1.05s' },
  { x: 78, y: 63, s: 1.15, d: '1.7s' },
  { x: 14, y: 82, s: 0.85, d: '0.25s' },
  { x: 32, y: 80, s: 1.05, d: '1.45s' },
  { x: 58, y: 84, s: 0.9, d: '0.85s' },
  { x: 76, y: 81, s: 1.2, d: '2.1s' },
];

const NODES = [
  { x: 18, y: 18 }, { x: 42, y: 14 }, { x: 70, y: 20 },
  { x: 14, y: 42 }, { x: 50, y: 40 }, { x: 84, y: 38 },
  { x: 24, y: 64 }, { x: 60, y: 62 }, { x: 80, y: 78 },
];

function Cube({ x, y, s, d }: { x: number; y: number; s: number; d: string }) {
  return (
    <span className="iso-cube" style={{ left: `${x}%`, top: `${y}%`, ['--s' as string]: String(s), animationDelay: d }}>
      <i className="iso-top" />
      <i className="iso-left" />
      <i className="iso-right" />
    </span>
  );
}

export default function AppBackground() {
  return (
    <div className="drill-bg" aria-hidden>
      <div className="chain-aurora" />
      <div className="chain-grid" />
      <div className="chain-field">
        {CUBES.map((c, i) => (
          <Cube key={i} {...c} />
        ))}
        {NODES.map((n, i) => (
          <span key={`n${i}`} className="chain-node" style={{ left: `${n.x}%`, top: `${n.y}%`, animationDelay: `${i * 0.35}s` }} />
        ))}
      </div>
      <div className="chain-packet" />
      <div className="drill-bg-fog" />
      <div className="drill-bg-scan" />
      <div className="drill-bg-particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            style={{
              left: `${8 + (i * 6.4) % 84}%`,
              animationDelay: `${i * 0.42}s`,
              animationDuration: `${8 + (i % 5)}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
