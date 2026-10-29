import type { ComponentType, RefObject } from 'react';

import Slider from '@react-native-community/slider';
import {
  FlipHorizontal2,
  Minus,
  Pause,
  Play,
  Plus,
  Rabbit,
  RotateCcw,
  Turtle,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GlassPalette } from '../lib/glass';
import {
  FONT_SIZE_RANGE,
  type PrompterSettings,
  SPEED_RANGE,
} from '../lib/prompter-settings';
import { useChromeFade } from '../lib/use-chrome-fade';
import { GlassView } from './glass-view';

type IconComponent = ComponentType<{ color?: string; size?: number }>;

type Props = {
  speed: number;
  fontSize: number;
  mirror: boolean;
  playing: boolean;
  palette: GlassPalette;
  target: RefObject<View | null>;
  onChange: (patch: Partial<PrompterSettings>) => void;
  onToggle: () => void;
  onRestart: () => void;
  /** Fades the controls out of the way, e.g. while the script is dragged. */
  hidden: boolean;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function PrompterControls({
  speed,
  fontSize,
  mirror,
  playing,
  hidden,
  palette,
  target,
  onChange,
  onToggle,
  onRestart,
}: Props) {
  const insets = useSafeAreaInsets();
  const fade = useChromeFade(hidden);
  const dockStyle = [
    styles.dock,
    {
      bottom: insets.bottom + 12,
      left: 12 + insets.left,
      right: 12 + insets.right,
    },
  ];

  // While playing, keep just pause and speed within reach.
  if (playing) {
    return (
      <Animated.View
        key="playing"
        entering={FadeInDown.duration(180)}
        exiting={FadeOutDown.duration(140)}
        pointerEvents="box-none"
        style={dockStyle}
      >
        <Animated.View
          style={fade}
          pointerEvents={hidden ? 'none' : 'box-none'}
          importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
          accessibilityElementsHidden={hidden}
        >
          <GlassView target={target} palette={palette} style={styles.compact}>
            <RoundButton
              icon={Pause}
              label="Pause"
              palette={palette}
              size={52}
              active
              onPress={onToggle}
            />

            <RoundButton
              icon={Minus}
              label={`Slower, speed ${speed}`}
              palette={palette}
              disabled={speed <= SPEED_RANGE.min}
              onPress={() => onChange({ speed: speed - 1 })}
            />

            <Text
              maxFontSizeMultiplier={1.5}
              style={[styles.value, { color: palette.fg }]}
            >
              {speed}
            </Text>

            <RoundButton
              icon={Plus}
              label={`Faster, speed ${speed}`}
              palette={palette}
              disabled={speed >= SPEED_RANGE.max}
              onPress={() => onChange({ speed: speed + 1 })}
            />
          </GlassView>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      key="paused"
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(140)}
      pointerEvents="box-none"
      style={dockStyle}
    >
      <Animated.View
        style={fade}
        pointerEvents={hidden ? 'none' : 'box-none'}
        importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={hidden}
      >
        <GlassView target={target} palette={palette} style={styles.panel}>
          <View style={styles.speedRow}>
            <Turtle color={palette.muted} size={22} />

            <Slider
              accessibilityLabel="Scroll speed"
              accessibilityValue={{
                min: SPEED_RANGE.min,
                max: SPEED_RANGE.max,
                now: speed,
              }}
              style={styles.slider}
              minimumValue={SPEED_RANGE.min}
              maximumValue={SPEED_RANGE.max}
              step={1}
              value={speed}
              onValueChange={(value) => onChange({ speed: value })}
              minimumTrackTintColor={palette.track}
              maximumTrackTintColor={palette.trackRest}
              thumbTintColor={palette.thumb}
            />

            <Rabbit color={palette.muted} size={22} />

            <Text
              maxFontSizeMultiplier={1.5}
              style={[styles.value, { color: palette.fg }]}
            >
              {speed}
            </Text>
          </View>

          <View style={styles.actions}>
            <RoundButton
              icon={RotateCcw}
              label="Back to start"
              palette={palette}
              onPress={onRestart}
            />

            <RoundButton
              icon={FlipHorizontal2}
              label="Mirror text"
              palette={palette}
              switchState={mirror}
              onPress={() => onChange({ mirror: !mirror })}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start"
              onPress={onToggle}
              hitSlop={2}
              android_ripple={{ color: 'rgba(255,255,255,0.35)' }}
              style={[styles.start, { backgroundColor: palette.accent }]}
            >
              <Play color={palette.onAccent} size={20} />

              <Text
                maxFontSizeMultiplier={1.5}
                style={[styles.startText, { color: palette.onAccent }]}
              >
                Start
              </Text>
            </Pressable>

            <GlyphButton
              label="Smaller text"
              glyphSize={15}
              palette={palette}
              disabled={fontSize <= FONT_SIZE_RANGE.min}
              onPress={() =>
                onChange({
                  fontSize: clamp(
                    fontSize - FONT_SIZE_RANGE.step,
                    FONT_SIZE_RANGE.min,
                    FONT_SIZE_RANGE.max,
                  ),
                })
              }
            />

            <GlyphButton
              label="Larger text"
              glyphSize={24}
              palette={palette}
              disabled={fontSize >= FONT_SIZE_RANGE.max}
              onPress={() =>
                onChange({
                  fontSize: clamp(
                    fontSize + FONT_SIZE_RANGE.step,
                    FONT_SIZE_RANGE.min,
                    FONT_SIZE_RANGE.max,
                  ),
                })
              }
            />
          </View>
        </GlassView>
      </Animated.View>
    </Animated.View>
  );
}

type ButtonProps = {
  label: string;
  palette: GlassPalette;
  onPress: () => void;
  disabled?: boolean;
};

function RoundButton(
  props: ButtonProps & {
    icon: IconComponent;
    size?: number;
    /** A filled accent button, for the main action. */
    active?: boolean;
    /** Makes this a switch showing the given on/off state. */
    switchState?: boolean;
  },
) {
  const { palette, icon: Icon, size = 44, switchState } = props;
  const filled = props.active || switchState === true;

  return (
    <Pressable
      accessibilityRole={switchState === undefined ? 'button' : 'switch'}
      accessibilityLabel={props.label}
      accessibilityState={{
        disabled: props.disabled,
        checked: switchState,
      }}
      disabled={props.disabled}
      onPress={props.onPress}
      hitSlop={2}
      android_ripple={{ color: 'rgba(255,255,255,0.35)', borderless: true }}
      style={[
        styles.round,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: filled ? palette.accent : palette.control,
          opacity: props.disabled ? 0.4 : 1,
          // A ring as well as the fill, so "on" doesn't rely on colour alone.
          borderWidth: switchState ? 2 : 0,
          borderColor: palette.fg,
        },
      ]}
    >
      <Icon color={filled ? palette.onAccent : palette.fg} size={size * 0.45} />
    </Pressable>
  );
}

function GlyphButton(props: ButtonProps & { glyphSize: number }) {
  const { palette } = props;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      accessibilityState={{ disabled: props.disabled }}
      disabled={props.disabled}
      onPress={props.onPress}
      hitSlop={2}
      android_ripple={{ color: 'rgba(255,255,255,0.35)', borderless: true }}
      style={[
        styles.round,
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: palette.control,
          opacity: props.disabled ? 0.4 : 1,
        },
      ]}
    >
      <Text
        importantForAccessibility="no"
        style={{
          color: palette.fg,
          fontSize: props.glyphSize,
          fontWeight: '600',
        }}
      >
        A
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dock: { position: 'absolute', left: 12, right: 12 },
  // Capped and centred, so it doesn't stretch across a tablet.
  panel: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  speedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slider: { flex: 1, height: 48 },
  value: {
    minWidth: 24,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  start: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 26,
    overflow: 'hidden',
  },
  startText: { fontSize: 16, fontWeight: '600' },
  round: { alignItems: 'center', justifyContent: 'center' },
  compact: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 34,
    padding: 8,
  },
});
