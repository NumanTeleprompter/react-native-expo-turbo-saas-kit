import { createPersistedStore } from './persisted-store';

export type TextAlign = 'left' | 'center' | 'right';

export type PrompterSettings = {
  /** Reading speed level; see `scrollSpeed`. */
  speed: number;
  fontSize: number;
  mirror: boolean;
  /** `#rrggbb` */
  textColor: string;
  /** `#rrggbb` */
  backgroundColor: string;
  align: TextAlign;
};

export const SPEED_RANGE = { min: 1, max: 20 } as const;
export const FONT_SIZE_RANGE = { min: 20, max: 120, step: 4 } as const;

export const TEXT_COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Yellow', value: '#fde047' },
  { name: 'Green', value: '#4ade80' },
  { name: 'Cyan', value: '#22d3ee' },
  { name: 'Orange', value: '#fb923c' },
  { name: 'Pink', value: '#f472b6' },
  { name: 'Black', value: '#000000' },
] as const;

export const BACKGROUND_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Charcoal', value: '#1f2937' },
  { name: 'Navy', value: '#0b1b3a' },
  { name: 'Cream', value: '#fef3c7' },
  { name: 'White', value: '#ffffff' },
] as const;

const DEFAULTS: PrompterSettings = {
  speed: 5,
  fontSize: 44,
  mirror: false,
  textColor: TEXT_COLORS[0].value,
  backgroundColor: BACKGROUND_COLORS[0].value,
  align: 'left',
};

const store = createPersistedStore<Partial<PrompterSettings>>(
  'teleprompter.settings',
  {},
);

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const ALIGNMENTS: readonly TextAlign[] = ['left', 'center', 'right'];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Stored values may be missing or corrupt, so keep each one usable.
function sanitize(settings: PrompterSettings): PrompterSettings {
  return {
    speed: clamp(
      Number(settings.speed) || DEFAULTS.speed,
      SPEED_RANGE.min,
      SPEED_RANGE.max,
    ),
    fontSize: clamp(
      Number(settings.fontSize) || DEFAULTS.fontSize,
      FONT_SIZE_RANGE.min,
      FONT_SIZE_RANGE.max,
    ),
    mirror: settings.mirror === true,
    textColor: HEX_COLOR.test(settings.textColor)
      ? settings.textColor
      : DEFAULTS.textColor,
    backgroundColor: HEX_COLOR.test(settings.backgroundColor)
      ? settings.backgroundColor
      : DEFAULTS.backgroundColor,
    align: ALIGNMENTS.includes(settings.align)
      ? settings.align
      : DEFAULTS.align,
  };
}

export function usePrompterSettings() {
  const { value } = store.use();

  return sanitize({ ...DEFAULTS, ...value });
}

export function updatePrompterSettings(patch: Partial<PrompterSettings>) {
  return store.update((current) => ({ ...current, ...patch }));
}

/**
 * Scroll speed in px/s. It scales with the font size so a given speed level
 * keeps the same reading pace (lines per second) at any text size.
 */
export function scrollSpeed({ speed, fontSize }: PrompterSettings) {
  return speed * fontSize * 0.1;
}
