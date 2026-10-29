import type { ReactNode } from 'react';

import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import {
  BACKGROUND_COLORS,
  FONT_SIZE_RANGE,
  type PrompterSettings,
  TEXT_COLORS,
  type TextAlign,
} from '../lib/prompter-settings';
import { BottomSheet } from './bottom-sheet';
import { ColorSwatches } from './color-swatches';

const ACCENT = '#3b82f6';

const ALIGNMENTS = [
  { value: 'left', label: 'Align left', icon: AlignLeft },
  { value: 'center', label: 'Align centre', icon: AlignCenter },
  { value: 'right', label: 'Align right', icon: AlignRight },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  settings: PrompterSettings;
  onChange: (patch: Partial<PrompterSettings>) => void;
};

const tick = () => {
  void Haptics.selectionAsync().catch(() => undefined);
};

/** Settings that apply to the prompter behind the sheet as they change. */
export function SettingsSheet({ open, onClose, settings, onChange }: Props) {
  const change = (patch: Partial<PrompterSettings>) => {
    tick();
    onChange(patch);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Settings">
      <View style={styles.body}>
        <Section label="Text size" value={String(settings.fontSize)}>
          <Slider
            accessibilityLabel="Text size"
            style={styles.slider}
            minimumValue={FONT_SIZE_RANGE.min}
            maximumValue={FONT_SIZE_RANGE.max}
            step={FONT_SIZE_RANGE.step}
            value={settings.fontSize}
            onValueChange={(fontSize) => change({ fontSize })}
            minimumTrackTintColor={ACCENT}
            thumbTintColor={ACCENT}
            maximumTrackTintColor="rgba(255,255,255,0.25)"
          />
        </Section>

        <Section label="Text colour">
          <ColorSwatches
            label="Text colour"
            options={TEXT_COLORS}
            value={settings.textColor}
            onChange={(textColor) => change({ textColor })}
          />
        </Section>

        <Section label="Background">
          <ColorSwatches
            label="Background"
            options={BACKGROUND_COLORS}
            value={settings.backgroundColor}
            onChange={(backgroundColor) => change({ backgroundColor })}
          />
        </Section>

        <Section label="Alignment">
          <View style={styles.segments}>
            {ALIGNMENTS.map(({ value, label, icon: Icon }) => (
              <AlignButton
                key={value}
                label={label}
                selected={settings.align === value}
                onPress={() => change({ align: value satisfies TextAlign })}
              >
                <Icon color="#ffffff" size={22} />
              </AlignButton>
            ))}
          </View>
        </Section>

        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <Text style={styles.label}>Mirror text</Text>
            <Text style={styles.hint}>
              For prompter glass in front of a lens
            </Text>
          </View>

          <Switch
            accessibilityLabel="Mirror text"
            value={settings.mirror}
            onValueChange={(mirror) => change({ mirror })}
            trackColor={{ false: 'rgba(255,255,255,0.25)', true: ACCENT }}
            thumbColor="#ffffff"
          />
        </View>
      </View>
    </BottomSheet>
  );
}

function Section(props: {
  label: string;
  value?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.label}>{props.label}</Text>
        {props.value ? <Text style={styles.value}>{props.value}</Text> : null}
      </View>

      {props.children}
    </View>
  );
}

function AlignButton(props: {
  label: string;
  selected: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={props.label}
      accessibilityState={{ selected: props.selected }}
      onPress={props.onPress}
      style={[styles.segment, props.selected && styles.segmentSelected]}
    >
      {props.children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, gap: 22 },
  flex: { flex: 1 },
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  value: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  hint: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 2 },
  slider: { height: 40, marginHorizontal: -8 },
  segments: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  segment: {
    width: 64,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: { backgroundColor: ACCENT },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
