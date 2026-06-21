/**
 * Semantic design tokens for Spendly.
 *
 * Centralized color system for theming scalability
 * and future dark mode support. Tailwind utility classes
 * remain in components; these tokens are for programmatic
 * color usage (charts, SVGs, dynamic styles).
 */

export const tokens = {
  /** Primary brand color (emerald) */
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    400: '#34d399',
    500: '#10B981',
    600: '#059669',
  },

  /** Secondary brand color (teal) */
  secondary: {
    400: '#2dd4bf',
    500: '#14B8A6',
  },

  /** Success feedback (alias of primary for consistency) */
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10B981',
    600: '#059669',
  },

  /** Warning feedback */
  warning: {
    50: '#fffbeb',
    500: '#F59E0B',
  },

  /** Danger / destructive */
  danger: {
    50: '#fff1f2',
    100: '#ffe4e6',
    400: '#fb7185',
    500: '#F43F5E',
  },

  /** Informational */
  info: {
    50: '#eff6ff',
    500: '#0EA5E9',
  },

  /** Chart palette — ordered for visual harmony */
  chart: [
    '#10B981', // emerald
    '#14B8A6', // teal
    '#0EA5E9', // sky
    '#F59E0B', // amber
    '#F43F5E', // rose
    '#8B5CF6', // violet
    '#6366F1', // indigo
  ],
} as const;

/**
 * Tailwind gradient class pairs used for primary CTAs.
 * Ready for dark mode variants (e.g., dark:from-emerald-600).
 */
export const gradients = {
  primary: 'from-emerald-500 to-teal-500',
  primaryHover: 'from-emerald-600 to-teal-600',
  dark: 'from-slate-800 to-slate-900',
} as const;
