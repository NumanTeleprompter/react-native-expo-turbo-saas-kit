import { Redirect, useLocalSearchParams } from 'expo-router';

import { Prompter, useScript } from '@kit/teleprompter';

export default function PrompterPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { script, loaded } = useScript(id);

  if (!loaded) {
    return null;
  }

  return script ? <Prompter script={script} /> : <Redirect href="/" />;
}
