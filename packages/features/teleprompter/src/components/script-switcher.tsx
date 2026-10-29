import type { RefObject } from 'react';

import { Check } from 'lucide-react-native';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  type View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GlassPalette } from '../lib/glass';
import { type Script, useScripts } from '../lib/script-store';
import { countWords } from '../lib/text';
import { GlassView } from './glass-view';

type Props = {
  open: boolean;
  onClose: () => void;
  currentId: string;
  palette: GlassPalette;
  target: RefObject<View | null> | null;
  /** Distance from the top of the screen, just below the top bar. */
  top: number;
  onSelect: (id: string) => void;
};

/** A frosted list of every script, to jump to another one. */
export function ScriptSwitcher({
  open,
  onClose,
  currentId,
  palette,
  target,
  top,
  onSelect,
}: Props) {
  const { scripts } = useScripts();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (!open) {
    return null;
  }

  return (
    <>
      {/* A tap-away scrim for touch. It isn't announced, so TalkBack goes
          straight to the list; hardware back and the rows close it. */}
      <Pressable
        accessible={false}
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        accessibilityViewIsModal
        entering={FadeIn.duration(150)}
        style={[
          styles.wrap,
          { top, left: 12 + insets.left, right: 12 + insets.right },
        ]}
        pointerEvents="box-none"
      >
        <GlassView
          target={target}
          palette={palette}
          style={[styles.list, { maxHeight: height * 0.55 }]}
        >
          <FlatList
            data={scripts}
            keyExtractor={(script) => script.id}
            renderItem={({ item }) => (
              <Row
                script={item}
                current={item.id === currentId}
                palette={palette}
                onPress={() => onSelect(item.id)}
              />
            )}
          />
        </GlassView>
      </Animated.View>
    </>
  );
}

function Row(props: {
  script: Script;
  current: boolean;
  palette: GlassPalette;
  onPress: () => void;
}) {
  const { script, current, palette } = props;
  const words = countWords(script.body);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${script.title}, ${words} words${current ? ', current script' : ''}`}
      onPress={props.onPress}
      android_ripple={{ color: palette.control }}
      style={[styles.row, current && { backgroundColor: palette.control }]}
    >
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.5}
        style={[styles.rowTitle, { color: palette.fg }]}
      >
        {script.title}
      </Text>

      <Text
        maxFontSizeMultiplier={1.5}
        style={[styles.rowMeta, { color: palette.muted }]}
      >
        {words} words
      </Text>

      {current ? <Check color={palette.fg} size={20} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Centred and capped to the top bar's width, so it lines up on a tablet.
  wrap: { position: 'absolute', alignItems: 'center' },
  list: { width: '100%', maxWidth: 720, borderRadius: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  rowTitle: { flex: 1, fontSize: 16, fontWeight: '600' },
  rowMeta: { fontSize: 13 },
});
