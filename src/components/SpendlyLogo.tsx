import { useId } from 'react';

interface SpendlyLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Custom Spendly SVG Logo Component.
 *
 * Uses React.useId() to generate unique IDs for the
 * linearGradient and filter elements, preventing DOM ID
 * collisions when multiple logos are rendered on the same page.
 *
 * SSR-safe and fully reusable — no hardcoded IDs.
 */
export function SpendlyLogo({ className = 'w-10 h-10', style }: SpendlyLogoProps) {
  const uniqueId = useId();
  const gradientId = `spendlyGrad-${uniqueId}`;
  const shadowId = `spendlyShadow-${uniqueId}`;

  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="18" floodOpacity="0.18" />
        </filter>
      </defs>
      <rect
        x="56" y="56" width="400" height="400" rx="96"
        fill={`url(#${gradientId})`}
        filter={`url(#${shadowId})`}
      />
      <circle cx="256" cy="256" r="110" fill="white" fillOpacity="0.95" />
      <path
        d="M205 260 L240 295 L315 220"
        fill="none" stroke="#10B981" strokeWidth="22"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
