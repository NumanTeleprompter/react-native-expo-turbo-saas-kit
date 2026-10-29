import { router } from 'expo-router';
import { Pencil, Plus } from 'lucide-react-native';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, Text } from '@kit/ui';

import { type Script, useScripts } from '../lib/script-store';

const countWords = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

export function ScriptList() {
  const { scripts, loaded } = useScripts();
  const insets = useSafeAreaInsets();

  if (!loaded) {
    return null;
  }

  return (
    <View className="flex-1">
      <FlatList
        data={scripts}
        keyExtractor={(script) => script.id}
        contentContainerClassName="gap-3 p-4"
        renderItem={({ item }) => <ScriptItem script={item} />}
        ListEmptyComponent={
          <Text className="text-muted-foreground mt-16 text-center">
            No scripts yet. Create one to get started.
          </Text>
        }
      />

      <View className="p-4" style={{ paddingBottom: insets.bottom + 16 }}>
        <Button onPress={() => router.push('/edit/new')}>
          <Icon as={Plus} className="text-primary-foreground" size={18} />
          <Text>New script</Text>
        </Button>
      </View>
    </View>
  );
}

function ScriptItem({ script }: { script: Script }) {
  return (
    <Pressable
      onPress={() => router.push(`/prompter/${script.id}`)}
      className="border-border bg-card flex-row items-center gap-3 rounded-xl border p-4 active:opacity-70"
    >
      <View className="flex-1 gap-1">
        <Text className="text-lg font-semibold" numberOfLines={1}>
          {script.title}
        </Text>

        <Text className="text-muted-foreground" numberOfLines={2}>
          {script.body || 'Empty script'}
        </Text>

        <Text className="text-muted-foreground text-xs">
          {countWords(script.body)} words
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${script.title}`}
        onPress={() => router.push(`/edit/${script.id}`)}
        hitSlop={8}
        className="p-2"
      >
        <Icon as={Pencil} className="text-muted-foreground" size={20} />
      </Pressable>
    </Pressable>
  );
}
