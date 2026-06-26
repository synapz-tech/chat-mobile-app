// Light theme for the network-diagnostics feature, aligned with the app palette
// (Radix light scales used app-wide via twrnc). Token keys are kept stable so the
// feature components keep working; values now follow the light/white design system.
export const colors = {
  // Surfaces
  bg: '#FFFFFF', // app screen background (bg-white)
  surface: '#F7F7F7', // subtle raised surface (gray-50)
  sheet: '#FFFFFF', // bottom sheet background
  menu: '#FFFFFF', // popover/menu background

  // Borders
  border: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.12)',

  // Text (gray scale, primary -> muted)
  text: '#1F1F1F', // gray-950
  textDim: '#646464', // gray-900
  textMuted: '#8C8C8C', // gray-800
  eyebrow: '#8C8C8C',

  // Accents (Radix-aligned hues, light-mode legible)
  brand: '#3B82F6',
  amber: '#D97706',
  red: '#DC2626',
  green: '#16A34A',

  // Soft tinted backgrounds for badges/chips (light-mode)
  brandSoft: 'rgba(59,130,246,0.12)',
  brandBorder: 'rgba(59,130,246,0.45)',
  brandText: '#1D4ED8',
  amberSoft: 'rgba(217,119,6,0.14)',
  redSoft: 'rgba(220,38,38,0.12)',
  greenSoft: 'rgba(22,163,74,0.14)',
  neutralSoft: 'rgba(0,0,0,0.04)',

  // On-brand contrast text (e.g. text over the brand-filled button)
  onBrand: '#FFFFFF',
};

export type Tone = 'brand' | 'warning' | 'danger' | 'info' | 'success' | 'churn' | 'neutral';

export function tone(name: Tone): string {
  switch (name) {
    case 'brand':
      return colors.brand;
    case 'warning':
      return colors.amber;
    case 'danger':
      return colors.red;
    case 'info':
      return colors.brand;
    case 'success':
      return colors.green;
    case 'churn':
      return colors.red;
    default:
      return colors.textDim;
  }
}
