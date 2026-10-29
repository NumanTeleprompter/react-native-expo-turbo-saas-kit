import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { isLight } from '../lib/color';

type Props = {
  label: string;
  options: readonly { name: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
};

export function ColorSwatches({ label, options, value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        // Not `option.value` inside the style: Reanimated's Babel plugin warns
        // about any `.value` in an inline style, even a plain one.
        const { name, value: color } = option;
        const selected = color === value;

        return (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityLabel={`${label} ${name}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(color)}
            hitSlop={4}
            style={[
              styles.swatch,
              { backgroundColor: color },
              selected && styles.selected,
            ]}
          >
            {selected ? (
              <Check
                size={20}
                strokeWidth={3}
                color={isLight(color) ? '#000000' : '#ffffff'}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  swatch: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  selected: { borderWidth: 3, borderColor: '#60a5fa' },
});
