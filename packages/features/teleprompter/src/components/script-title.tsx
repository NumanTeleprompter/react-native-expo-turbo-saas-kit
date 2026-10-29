import { type RefObject, useEffect, useState } from 'react';

import { Check, ChevronDown, X } from 'lucide-react-native';
import {
  Alert,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type View,
} from 'react-native';

import type { GlassPalette } from '../lib/glass';
import { GlassView } from './glass-view';

type Props = {
  title: string;
  palette: GlassPalette;
  target: RefObject<View | null>;
  /** Opens the list of scripts. */
  onOpenList: () => void;
  onRename: (title: string) => Promise<void>;
};

/**
 * The script's title with a down arrow. Tapping opens the script list;
 * holding it (or the "Rename script" TalkBack action) edits the title in place.
 */
export function ScriptTitle({
  title,
  palette,
  target,
  onOpenList,
  onRename,
}: Props) {
  // null while not editing.
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;

  // Hardware back cancels the edit instead of leaving the prompter.
  useEffect(() => {
    if (!editing) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setDraft(null);

        return true;
      },
    );

    return () => subscription.remove();
  }, [editing]);

  if (draft !== null) {
    const save = () => {
      // Nothing changed, so there's nothing to write.
      if (draft.trim() === title) {
        setDraft(null);

        return;
      }

      // Stay in the editor if saving fails, so the text isn't lost.
      onRename(draft)
        .then(() => setDraft(null))
        .catch((error) => {
          console.error(error);
          Alert.alert('Could not rename the script');
        });
    };

    return (
      <GlassView target={target} palette={palette} style={styles.editor}>
        <TextInput
          autoFocus
          selectTextOnFocus
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={save}
          returnKeyType="done"
          maxLength={80}
          accessibilityLabel="Script title"
          placeholder="Untitled"
          placeholderTextColor={palette.muted}
          cursorColor={palette.track}
          style={[styles.input, { color: palette.fg }]}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save title"
          onPress={save}
          android_ripple={{ color: palette.control, borderless: true }}
          style={styles.action}
        >
          <Check color={palette.fg} size={22} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={() => setDraft(null)}
          android_ripple={{ color: palette.control, borderless: true }}
          style={styles.action}
        >
          <X color={palette.fg} size={22} />
        </Pressable>
      </GlassView>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. Switch script`}
      accessibilityHint="Hold to rename"
      accessibilityActions={[{ name: 'rename', label: 'Rename script' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'rename') {
          setDraft(title);
        }
      }}
      onPress={onOpenList}
      onLongPress={() => setDraft(title)}
      android_ripple={{ color: palette.control }}
      style={styles.title}
    >
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.5}
        style={[
          styles.text,
          {
            color: palette.fg,
            // Keeps the title readable over script text passing behind it.
            textShadowColor:
              palette.scheme === 'dark'
                ? 'rgba(0,0,0,0.7)'
                : 'rgba(255,255,255,0.8)',
          },
        ]}
      >
        {title}
      </Text>

      <ChevronDown color={palette.muted} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    borderRadius: 24,
  },
  text: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  editor: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingLeft: 16,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '600', padding: 0 },
  action: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
