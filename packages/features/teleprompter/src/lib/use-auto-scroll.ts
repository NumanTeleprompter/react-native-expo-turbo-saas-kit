import { useCallback, useEffect } from 'react';

import type Animated from 'react-native-reanimated';
import {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const MAX_FRAME_MS = 100;

type Options = {
  playing: boolean;
  /** Scroll speed in px/s. */
  speed: number;
  /** Called when playback reaches the end of the script. */
  onEnd: () => void;
  /** Called when the user starts dragging the script by hand. */
  onDrag: () => void;
  /** True while the user drags or flings the script, false once it settles. */
  onScrollingChange: (scrolling: boolean) => void;
};

/**
 * Advances a ScrollView by elapsed time on the UI thread, so the speed is
 * constant regardless of frame rate or JS-thread load.
 */
export function useAutoScroll({
  playing,
  speed,
  onEnd,
  onDrag,
  onScrollingChange,
}: Options) {
  const ref = useAnimatedRef<Animated.ScrollView>();
  const offset = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const viewHeight = useSharedValue(0);
  const isPlaying = useSharedValue(false);
  const pxPerSecond = useSharedValue(speed);

  useEffect(() => {
    const max = contentHeight.value - viewHeight.value;

    // Starting again after the end begins from the top.
    if (playing && max > 0 && offset.value >= max) {
      offset.value = 0;
      ref.current?.scrollTo({ y: 0, animated: false });
    }

    isPlaying.value = playing;
  }, [playing, isPlaying, offset, contentHeight, viewHeight, ref]);

  useEffect(() => {
    pxPerSecond.value = speed;
  }, [speed, pxPerSecond]);

  useFrameCallback(({ timeSincePreviousFrame }) => {
    const max = contentHeight.value - viewHeight.value;

    if (!isPlaying.value || max <= 0) {
      return;
    }

    // Clamp the frame time so a long pause (app backgrounded) can't jump the
    // script forward.
    const elapsed = Math.min(timeSincePreviousFrame ?? 0, MAX_FRAME_MS);

    offset.value = Math.min(
      offset.value + (pxPerSecond.value * elapsed) / 1000,
      max,
    );

    scrollTo(ref, 0, offset.value, false);

    if (offset.value >= max) {
      isPlaying.value = false;
      scheduleOnRN(onEnd);
    }
  });

  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      // Stop on the UI thread right away; waiting for React to commit lets the
      // frame callback keep scrolling against the finger.
      isPlaying.value = false;
      scheduleOnRN(onDrag);
      scheduleOnRN(onScrollingChange, true);
    },
    onEndDrag: (event) => {
      // With no fling, the scroll has already settled.
      if (Math.abs(event.velocity?.y ?? 0) < 0.05) {
        scheduleOnRN(onScrollingChange, false);
      }
    },
    onMomentumEnd: () => {
      scheduleOnRN(onScrollingChange, false);
    },
    onScroll: (event) => {
      // Follow manual scrolling so playback resumes from where the user left.
      if (!isPlaying.value) {
        offset.value = event.contentOffset.y;
      }
    },
  });

  // Read from JS on demand (for a time-left readout), not on every frame.
  const getProgress = useCallback(
    () => ({
      offset: offset.value,
      max: Math.max(contentHeight.value - viewHeight.value, 0),
    }),
    [offset, contentHeight, viewHeight],
  );

  return {
    ref,
    onScroll,
    getProgress,
    onContentSizeChange: (_width: number, height: number) => {
      contentHeight.value = height;
    },
    onLayout: (event: { nativeEvent: { layout: { height: number } } }) => {
      viewHeight.value = event.nativeEvent.layout.height;
    },
    restart: () => {
      offset.value = 0;
      ref.current?.scrollTo({ y: 0, animated: false });
    },
  };
}
