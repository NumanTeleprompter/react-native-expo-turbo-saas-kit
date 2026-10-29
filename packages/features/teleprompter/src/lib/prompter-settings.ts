import { createPersistedStore } from './persisted-store';

export type PrompterSettings = {
  /** Reading speed level; see `scrollSpeed`. */
  speed: number;
  fontSize: number;
  mirror: boolean;
};

export const SPEED_RANGE = { min: 1, max: 20 } as const;
export const FONT_SIZE_RANGE = { min: 20, max: 120, step: 4 } as const;

const DEFAULTS: PrompterSettings = { speed: 5, fontSize: 44, mirror: false };

const store = createPersistedStore<Partial<PrompterSettings>>(
  'teleprompter.settings',
  {},
);

export function usePrompterSettings() {
  const { value } = store.use();

  return { ...DEFAULTS, ...value };
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
