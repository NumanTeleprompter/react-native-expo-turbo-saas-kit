import { Platform } from 'react-native';

import { isLight } from './color';

/**
 * Real blur works on iOS and on Android 12 (API 31) or newer. Anything else
 * gets an opaque panel instead, so text on it stays readable.
 */
export const BLUR_SUPPORTED =
  Platform.OS === 'ios' ||
  (Platform.OS === 'android' && Number(Platform.Version) >= 31);

/**
 * Colours for glass controls over the script. They follow the script's
 * background, so icons and text keep their contrast on light and dark pages.
 * White on the accent is about 5:1, above the 4.5:1 text minimum.
 */
export function glassPalette(backgroundColor: string) {
  const dark = !isLight(backgroundColor);

  return {
    scheme: dark ? ('dark' as const) : ('light' as const),
    fg: dark ? '#ffffff' : '#111111',
    muted: dark ? 'rgba(255,255,255,0.72)' : 'rgba(17,17,17,0.72)',
    // Frosted fill when blurred, opaque when it can't be.
    fill: dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)',
    solid: dark ? '#1c1c1f' : '#f4f4f5',
    border: dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)',
    control: dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
    accent: '#2563eb',
    onAccent: '#ffffff',
    track: dark ? '#60a5fa' : '#2563eb',
    trackRest: dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.2)',
    thumb: dark ? '#ffffff' : '#2563eb',
  };
}

export type GlassPalette = ReturnType<typeof glassPalette>;
