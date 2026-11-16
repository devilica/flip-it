/** Darkens (negative) or lightens (positive) a #RRGGBB color by a fraction in [-1, 1]. */
export function shade(hex: string, amount: number): string {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  const target = amount < 0 ? 0 : 255;
  const factor = Math.abs(amount);
  const mixed = channels.map((c) => Math.round(c + (target - c) * factor));
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
  return `${hex}${a.toString(16).padStart(2, '0')}`;
}
