import { useEffect } from 'react';

import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * Fades controls out and back in almost instantly. Reanimated skips or shortens
 * the animation when the system's reduce-motion setting is on.
 */
export function useChromeFade(hidden: boolean) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(hidden ? 0 : 1, {
      duration: hidden ? 60 : 100,
    });
  }, [hidden, opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}
