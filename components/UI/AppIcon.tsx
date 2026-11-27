// Generated icon set (public/icons/*.webp): soft sky-blue artwork on a
// pure black background, matte, no gloss — made 27 Nov 2026 so the UI
// reads visually instead of all text. mix-blend-screen makes the black
// background disappear into the dark UI; only the blue artwork shows.
// NOTE: on a bright blue surface (primary buttons) the blue artwork is
// invisible — there, wrap the icon in a small black chip first.
export type AppIconName =
  | 'mine'
  | 'tasks'
  | 'drill'
  | 'friends'
  | 'profile'
  | 'wallet'
  | 'engine'
  | 'reward'
  | 'withdraw'
  | 'history'
  | 'level'
  | 'speed';

export default function AppIcon({
  name,
  size = 24,
  className = '',
  alt = '',
}: {
  name: AppIconName;
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={`/icons/icon-${name}.webp`}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={`mix-blend-screen shrink-0 ${className}`}
    />
  );
}
