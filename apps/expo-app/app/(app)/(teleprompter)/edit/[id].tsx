import { useLocalSearchParams } from 'expo-router';

import { ScriptEditor } from '@kit/teleprompter';

export default function EditScriptPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <ScriptEditor id={id} />;
}
