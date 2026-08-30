'use client';

import { DRILL_ENGINE_MP4 } from '@/lib/drillAsset';

export default function MiningDrill({ active }: { active: boolean }) {
  return (
    <div className={`drill-hero ${active ? 'is-live' : 'is-idle'}`} aria-hidden>
      <span className="drill-hero-glow" />
      <video
        className="drill-machine-video"
        src={DRILL_ENGINE_MP4}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
}
