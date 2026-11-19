'use client';

/**
 * Lightweight shimmer placeholder used while a section is loading.
 * Pure CSS (see .skeleton in globals.css) — no JS animation loop.
 */
export default function Skeleton({
  className = '',
  label,
}: {
  className?: string;
  /** Accessible label for the loading region, e.g. "Loading tasks". */
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label || 'Loading'}
      className={`skeleton ${className}`}
    />
  );
}
