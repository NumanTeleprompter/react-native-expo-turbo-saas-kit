import type { ComponentType } from 'react';

import {
  ArrowLeft,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SPEED_RANGE } from '../lib/prompter-settings';

type IconComponent = ComponentType<{ color?: string; size?: number }>;

type Props = {
  speed: number;
  playing: boolean;
  onSpeedChange: (speed: number) => void;
  onToggle: () => void;
  onRestart: () => void;
  onBack: () => void;
  onOpenSettings: () => void;
};

const clampSpeed = (speed: number) =>
  Math.min(SPEED_RANGE.max, Math.max(SPEED_RANGE.min, speed));

export function PrompterControls({
  speed,
  playing,
  onSpeedChange,
  onToggle,
  onRestart,
  onBack,
  onOpenSettings,
}: Props) {
  const insets = useSafeAreaInsets();

  const speedStepper = (
    <Stepper
      label="Speed"
      value={speed}
      onDecrease={() => onSpeedChange(clampSpeed(speed - 1))}
      onIncrease={() => onSpeedChange(clampSpeed(speed + 1))}
    />
  );

  // While playing, keep only a dimmed speed control and a pause button.
  if (playing) {
    return (
      <View
        style={[styles.compact, { bottom: insets.bottom + 16 }]}
        pointerEvents="box-none"
      >
        <View style={[styles.stepper, styles.dimmed]}>
          {speedStepper}

          <RoundButton icon={Pause} label="Pause" onPress={onToggle} />
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <RoundButton icon={ArrowLeft} label="Back" onPress={onBack} />
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + 16 }]}>
        {speedStepper}

        <View style={styles.actions}>
          <RoundButton
            icon={RotateCcw}
            label="Back to start"
            onPress={onRestart}
          />

          <RoundButton
            icon={Play}
            label="Start"
            size={72}
            active
            onPress={onToggle}
          />

          <RoundButton
            icon={SlidersHorizontal}
            label="Settings"
            onPress={onOpenSettings}
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
        label={`Decrease ${props.label}, now ${props.value}`}
        onPress={props.onDecrease}
      />

      <View style={styles.stepperValue}>
        <Text style={styles.stepperNumber}>{props.value}</Text>
        <Text style={styles.stepperLabel}>{props.label}</Text>
      </View>

      <RoundButton
        icon={Plus}
        label={`Increase ${props.label}, now ${props.value}`}
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
    alignItems: 'center',
    gap: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    alignSelf: 'stretch',
  },
  compact: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  dimmed: { opacity: 0.35 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperValue: { minWidth: 56, alignItems: 'center' },
  stepperNumber: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  stepperLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  roundButton: { alignItems: 'center', justifyContent: 'center' },
});
