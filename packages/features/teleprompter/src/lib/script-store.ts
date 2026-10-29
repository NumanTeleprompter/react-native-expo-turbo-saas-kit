import { randomUUID } from 'expo-crypto';

import { createPersistedStore } from './persisted-store';

export type Script = {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
};

const store = createPersistedStore<Script[]>('teleprompter.scripts', []);

/** All scripts, newest first. */
export function useScripts() {
  const { value, loaded } = store.use();

  return {
    scripts: [...value].sort((a, b) => b.updatedAt - a.updatedAt),
    loaded,
  };
}

export function useScript(id: string) {
  const { value, loaded } = store.use();

  return { script: value.find((script) => script.id === id), loaded };
}

/** Creates the script when `id` is omitted, otherwise updates it. Returns its id. */
export async function saveScript(input: {
  id?: string;
  title: string;
  body: string;
}) {
  const id = input.id ?? randomUUID();
  const script: Script = {
    id,
    title: input.title.trim() || 'Untitled',
    body: input.body,
    updatedAt: Date.now(),
  };

  await store.update((scripts) => [
    ...scripts.filter((existing) => existing.id !== id),
    script,
  ]);

  return id;
}

/**
 * Changes only a script's title. It leaves `updatedAt` alone, because a
 * rename isn't an edit and shouldn't reshuffle the list.
 */
export function renameScript(id: string, title: string) {
  return store.update((scripts) =>
    scripts.map((script) =>
      script.id === id
        ? { ...script, title: title.trim() || 'Untitled' }
        : script,
    ),
  );
}

export function deleteScript(id: string) {
  return store.update((scripts) =>
    scripts.filter((script) => script.id !== id),
  );
}
