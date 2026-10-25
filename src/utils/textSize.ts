/** Article text-size choices. `scale` is what AppContext stores (`textScale`);
 * "Default" matches the app's default of 0.4. */
export const TEXT_SIZES = [
  { label: 'Small', scale: 0.1 },
  { label: 'Default', scale: 0.4 },
  { label: 'Large', scale: 0.7 },
  { label: 'Extra large', scale: 1 },
] as const;

/** Body font size in px for a stored scale: 13 / 16 / 19 / 22. */
export function bodyFontSize(scale: number): number {
  return Math.round(12 + scale * 10);
}

/** The choice closest to a stored scale (older saved values may sit between steps). */
export function nearestTextSize(scale: number) {
  return TEXT_SIZES.reduce((best, s) => (Math.abs(s.scale - scale) < Math.abs(best.scale - scale) ? s : best));
}
