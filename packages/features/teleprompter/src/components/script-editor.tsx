import { useState } from 'react';

import { router } from 'expo-router';
import { Alert, ScrollView, View } from 'react-native';

import { Button, Input, Text, Textarea } from '@kit/ui';

import {
  type Script,
  deleteScript,
  saveScript,
  useScript,
} from '../lib/script-store';

/** Edits the script with the given id, or creates one when `id` is "new". */
export function ScriptEditor({ id }: { id: string }) {
  const { script, loaded } = useScript(id);

  if (id === 'new') {
    return <ScriptForm />;
  }

  if (!loaded) {
    return null;
  }

  if (!script) {
    return (
      <Text className="text-muted-foreground mt-16 text-center">
        Script not found.
      </Text>
    );
  }

  return <ScriptForm script={script} />;
}

function ScriptForm({ script }: { script?: Script }) {
  const [title, setTitle] = useState(script?.title ?? '');
  const [body, setBody] = useState(script?.body ?? '');
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);

    try {
      await saveScript({ id: script?.id, title, body });
      // Stay disabled on success so a second tap can't save a duplicate while
      // the screen is dismissed.
      router.back();
    } catch (error) {
      console.error(error);
      setSaving(false);
      Alert.alert('Could not save the script');
    }
  };

  const onDelete = () => {
    if (!script) {
      return;
    }

    Alert.alert('Delete script?', `"${script.title}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void deleteScript(script.id)
            .then(() => router.back())
            .catch(() => Alert.alert('Could not delete the script')),
      },
    ]);
  };

  return (
    <ScrollView
      contentContainerClassName="gap-4 p-4"
      keyboardShouldPersistTaps="handled"
    >
      <Input placeholder="Title" value={title} onChangeText={setTitle} />

      <Textarea
        className="min-h-64"
        placeholder={
          'Paste or type your script.\n\nMarkdown works: # headings, **bold**, *italic*, - lists, > quotes'
        }
        value={body}
        onChangeText={setBody}
      />

      <View className="gap-3">
        <Button disabled={saving || !body.trim()} onPress={onSave}>
          <Text>Save</Text>
        </Button>

        {script ? (
          <Button variant="destructive" onPress={onDelete}>
            <Text>Delete</Text>
          </Button>
        ) : null}
      </View>
    </ScrollView>
  );
}
