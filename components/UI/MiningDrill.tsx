'use client';

export default function MiningDrill({ active }: { active: boolean }) {
  return (
    <div className={`drill3d ${active ? 'is-live' : 'is-idle'}`} aria-hidden>
      <div className="drill3d-stage">
        <div className="drill3d-floor" />
        <div className="drill3d-ring drill3d-ring-a" />
        <div className="drill3d-ring drill3d-ring-b" />
        <div className="drill3d-core">
          <span className="drill3d-facet f1" />
          <span className="drill3d-facet f2" />
          <span className="drill3d-facet f3" />
        </div>

        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="drill3d-orbit" style={{ animationDelay: `${i * 0.18}s`, ['--a' as string]: `${i * 45}deg` }} />
        ))}

        <div className="drill3d-rig">
          <div className="drill3d-head">
            <i /><i /><i /><i />
          </div>
          <div className="drill3d-auger">
            {Array.from({ length: 7 }).map((_, i) => (
              <b key={i} style={{ ['--i' as string]: i }} />
            ))}
          </div>
          <div className="drill3d-tip" />
        </div>
      </div>
      <p className="drill3d-label">{active ? 'EXTRACTING' : 'STANDBY'}</p>
    </div>
  );
}
