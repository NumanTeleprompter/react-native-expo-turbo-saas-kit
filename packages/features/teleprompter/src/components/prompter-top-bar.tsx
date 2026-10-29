import { type RefObject, useEffect, useState } from 'react';

import { ArrowLeft, Clock, SlidersHorizontal } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GlassPalette } from '../lib/glass';
import { useChromeFade } from '../lib/use-chrome-fade';
import { GlassView } from './glass-view';
import { ScriptTitle } from './script-title';

type Props = {
  title: string;
  palette: GlassPalette;
  target: RefObject<View | null>;
  /** Scroll speed in px/s, used to work out the time left. */
  pxPerSecond: number;
  getProgress: () => { offset: number; max: number };
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenList: () => void;
  onRename: (title: string) => Promise<void>;
  /** Fades the bar out of the way, e.g. while the script is dragged. */
  hidden: boolean;
};

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export function PrompterTopBar({
  title,
  palette,
  target,
  pxPerSecond,
  getProgress,
  onBack,
  onOpenSettings,
  onOpenList,
  onRename,
  hidden,
}: Props) {
  const insets = useSafeAreaInsets();
  const fade = useChromeFade(hidden);
  const [{ seconds, fraction }, setProgress] = useState({
    seconds: 0,
    fraction: 0,
  });

  // Polled a few times a second, so only this bar re-renders as time passes.
  useEffect(() => {
    const update = () => {
      const { offset, max } = getProgress();
      const next = {
        seconds: max > 0 ? Math.ceil((max - offset) / pxPerSecond) : 0,
        fraction: max > 0 ? Math.min(offset / max, 1) : 0,
      };

      setProgress((previous) =>
        previous.seconds === next.seconds &&
        Math.abs(previous.fraction - next.fraction) < 0.005
          ? previous
          : next,
      );
    };

    update();

    const timer = setInterval(update, 400);

    return () => clearInterval(timer);
  }, [getProgress, pxPerSecond]);

  const timeLeft = `${formatTime(seconds)} left`;

  return (
    <>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Script progress"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(fraction * 100),
        }}
        pointerEvents="none"
        style={[
          styles.progress,
          { width: `${fraction * 100}%`, backgroundColor: palette.track },
        ]}
      />

      <Animated.View
        pointerEvents={hidden ? 'none' : 'box-none'}
        importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={hidden}
        style={[
          styles.rowWrap,
          {
            top: insets.top + 12,
            left: 12 + insets.left,
            right: 12 + insets.right,
          },
          fade,
        ]}
      >
        <View style={styles.row}>
          <GlassView target={target} palette={palette} style={styles.round}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={onBack}
              android_ripple={{ color: palette.control, borderless: true }}
              style={styles.fill}
            >
              <ArrowLeft color={palette.fg} size={22} />
            </Pressable>
          </GlassView>

          <ScriptTitle
            title={title}
            palette={palette}
            target={target}
            onOpenList={onOpenList}
            onRename={onRename}
          />

          <GlassView target={target} palette={palette} style={styles.chip}>
            <View
              accessible
              accessibilityLabel={timeLeft}
              style={styles.chipInner}
            >
              <Clock color={palette.muted} size={16} />

              <Text
                maxFontSizeMultiplier={1.5}
                style={[styles.chipText, { color: palette.fg }]}
              >
                {formatTime(seconds)}
              </Text>
            </View>
          </GlassView>

          <GlassView target={target} palette={palette} style={styles.round}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={onOpenSettings}
              android_ripple={{ color: palette.control, borderless: true }}
              style={styles.fill}
            >
              <SlidersHorizontal color={palette.fg} size={22} />
            </Pressable>
          </GlassView>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  progress: { position: 'absolute', left: 0, top: 0, height: 3 },
  // Centred and capped in width, so it doesn't stretch across a tablet.
  rowWrap: { position: 'absolute', alignItems: 'center' },
  row: {
    width: '100%',
    maxWidth: 720,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  round: { width: 48, height: 48, borderRadius: 24 },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chip: { height: 48, borderRadius: 24, justifyContent: 'center' },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  chipText: { fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
