'use client';

export default function MiningDrill({ active }: { active: boolean }) {
  return (
    <div className={`drill-hero ${active ? 'is-live' : 'is-idle'}`} aria-hidden>
      <span className="drill-hero-glow" />
      <img src="/drill-hero.svg" alt="" />
      <div className="drill-spark-bits">
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            style={{
              left: `${18 + i * 3.4}%`,
              bottom: `${22 + (i % 3) * 4}%`,
              animationDelay: `${i * 0.14}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
