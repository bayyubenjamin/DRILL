'use client';

export default function AppBackground() {
  return (
    <div className="drill-bg" aria-hidden>
      <div className="drill-bg-image" />
      <div className="drill-bg-fog" />
      <div className="drill-bg-scan" />
      <div className="drill-bg-particles">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} style={{ left: `${6 + (i * 5.3) % 88}%`, animationDelay: `${i * 0.35}s`, animationDuration: `${7 + (i % 5)}s` }} />
        ))}
      </div>
    </div>
  );
}
