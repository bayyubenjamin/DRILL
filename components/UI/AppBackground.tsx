'use client';

const BLOCKS = [
  { x: 8, y: 10, s: 18, d: '0s' },
  { x: 22, y: 7, s: 14, d: '0.4s' },
  { x: 36, y: 12, s: 20, d: '0.8s' },
  { x: 52, y: 6, s: 16, d: '1.1s' },
  { x: 68, y: 11, s: 22, d: '0.2s' },
  { x: 82, y: 8, s: 15, d: '1.6s' },
  { x: 12, y: 28, s: 16, d: '0.6s' },
  { x: 28, y: 32, s: 24, d: '1.3s' },
  { x: 48, y: 26, s: 18, d: '0.3s' },
  { x: 64, y: 30, s: 14, d: '1.8s' },
  { x: 80, y: 27, s: 20, d: '0.9s' },
  { x: 6, y: 48, s: 15, d: '1.4s' },
  { x: 20, y: 52, s: 19, d: '0.1s' },
  { x: 38, y: 46, s: 13, d: '2s' },
  { x: 56, y: 50, s: 21, d: '0.7s' },
  { x: 74, y: 47, s: 17, d: '1.5s' },
  { x: 88, y: 54, s: 14, d: '0.5s' },
  { x: 10, y: 70, s: 20, d: '1.2s' },
  { x: 26, y: 74, s: 15, d: '1.9s' },
  { x: 44, y: 68, s: 23, d: '0.35s' },
  { x: 62, y: 72, s: 16, d: '1.05s' },
  { x: 78, y: 69, s: 19, d: '1.7s' },
  { x: 16, y: 88, s: 14, d: '0.25s' },
  { x: 34, y: 86, s: 18, d: '1.45s' },
  { x: 58, y: 90, s: 15, d: '0.85s' },
  { x: 76, y: 87, s: 21, d: '2.1s' },
];

const NODES = [
  { x: 18, y: 18 }, { x: 42, y: 14 }, { x: 70, y: 20 },
  { x: 14, y: 42 }, { x: 50, y: 40 }, { x: 84, y: 38 },
  { x: 24, y: 64 }, { x: 60, y: 62 }, { x: 80, y: 78 },
];

export default function AppBackground() {
  return (
    <div className="drill-bg" aria-hidden>
      <div className="chain-aurora" />
      <div className="chain-grid" />
      <div className="chain-field">
        {BLOCKS.map((b, i) => (
          <span
            key={i}
            className="chain-block"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.s,
              height: b.s,
              animationDelay: b.d,
            }}
          />
        ))}
        {NODES.map((n, i) => (
          <span key={`n${i}`} className="chain-node" style={{ left: `${n.x}%`, top: `${n.y}%`, animationDelay: `${i * 0.35}s` }} />
        ))}
      </div>
      <div className="chain-packet" />
      <div className="drill-bg-fog" />
      <div className="drill-bg-scan" />
      <div className="drill-bg-particles">
        {Array.from({ length: 14 }).map((_, i) => (
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
