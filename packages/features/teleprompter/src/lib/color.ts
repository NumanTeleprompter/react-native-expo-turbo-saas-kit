/** Whether a `#rrggbb` colour is light enough to need dark text on top. */
export const isLight = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

  return 0.299 * r! + 0.587 * g! + 0.114 * b! > 150;
};

/** Adds an alpha channel (0 to 1) to a `#rrggbb` colour. */
export const withAlpha = (hex: string, alpha: number) =>
  hex +
  Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
