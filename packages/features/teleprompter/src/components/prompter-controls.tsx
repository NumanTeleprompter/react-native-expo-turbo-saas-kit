import type { ComponentType } from 'react';

import {
  ArrowLeft,
  FlipHorizontal2,
  Minus,
  Play,
  Plus,
  RotateCcw,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FONT_SIZE_RANGE,
  type PrompterSettings,
  SPEED_RANGE,
} from '../lib/prompter-settings';

type IconComponent = ComponentType<{ color?: string; size?: number }>;

type Props = {
  settings: PrompterSettings;
  playing: boolean;
  onChange: (patch: Partial<PrompterSettings>) => void;
  onToggle: () => void;
  onRestart: () => void;
  onBack: () => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function PrompterControls({
  settings,
  playing,
  onChange,
  onToggle,
  onRestart,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();

  const speedStepper = (
    <Stepper
      label="Speed"
      value={settings.speed}
      onDecrease={() =>
        onChange({
          speed: clamp(settings.speed - 1, SPEED_RANGE.min, SPEED_RANGE.max),
        })
      }
      onIncrease={() =>
        onChange({
          speed: clamp(settings.speed + 1, SPEED_RANGE.min, SPEED_RANGE.max),
        })
      }
    />
  );

  // While playing, keep only a dimmed speed control within reach.
  if (playing) {
    return (
      <View
        style={[styles.compact, { bottom: insets.bottom + 16 }]}
        pointerEvents="box-none"
      >
        <View style={styles.dimmed}>{speedStepper}</View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <RoundButton icon={ArrowLeft} label="Back" onPress={onBack} />
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.row}>
          {speedStepper}

          <Stepper
            label="Size"
            value={settings.fontSize}
            onDecrease={() =>
              onChange({
                fontSize: clamp(
                  settings.fontSize - FONT_SIZE_RANGE.step,
                  FONT_SIZE_RANGE.min,
                  FONT_SIZE_RANGE.max,
                ),
              })
            }
            onIncrease={() =>
              onChange({
                fontSize: clamp(
                  settings.fontSize + FONT_SIZE_RANGE.step,
                  FONT_SIZE_RANGE.min,
                  FONT_SIZE_RANGE.max,
                ),
              })
            }
          />
        </View>

        <View style={styles.row}>
          <RoundButton
            icon={FlipHorizontal2}
            label="Mirror"
            active={settings.mirror}
            onPress={() => onChange({ mirror: !settings.mirror })}
          />

          <RoundButton
            icon={Play}
            label="Start"
            size={72}
            active
            onPress={onToggle}
          />

          <RoundButton
            icon={RotateCcw}
            label="Back to start"
            onPress={onRestart}
          />
        </View>
      </View>
    </>
  );
}

function Stepper(props: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <RoundButton
        icon={Minus}
        label={`Decrease ${props.label}`}
        onPress={props.onDecrease}
      />

      <View style={styles.stepperValue}>
        <Text style={styles.stepperNumber}>{props.value}</Text>
        <Text style={styles.stepperLabel}>{props.label}</Text>
      </View>

      <RoundButton
        icon={Plus}
        label={`Increase ${props.label}`}
        onPress={props.onIncrease}
      />
    </View>
  );
}

function RoundButton(props: {
  icon: IconComponent;
  label: string;
  onPress: () => void;
  size?: number;
  active?: boolean;
}) {
  const size = props.size ?? 48;
  const Icon = props.icon;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      onPress={props.onPress}
      hitSlop={8}
      android_ripple={{ color: 'rgba(255,255,255,0.35)', borderless: true }}
      style={[
        styles.roundButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: props.active ? '#2563eb' : 'rgba(255,255,255,0.18)',
        },
      ]}
    >
      <Icon color="#ffffff" size={size * 0.45} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: { position: 'absolute', left: 16 },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-around',
    rowGap: 12,
  },
  compact: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  dimmed: { opacity: 0.35 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperValue: { minWidth: 56, alignItems: 'center' },
  stepperNumber: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  stepperLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  roundButton: { alignItems: 'center', justifyContent: 'center' },
});
