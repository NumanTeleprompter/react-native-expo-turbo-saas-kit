import { Redirect, useLocalSearchParams } from 'expo-router';

import { Prompter, useScript } from '@kit/teleprompter';

export default function PrompterPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { script, loaded } = useScript(id);

  if (!loaded) {
    return null;
  }

  // Keyed by id, so switching scripts remounts the prompter with fresh state.
  return script ? (
    <Prompter key={script.id} script={script} />
  ) : (
    <Redirect href="/" />
  );
}
