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

export function deleteScript(id: string) {
  return store.update((scripts) =>
    scripts.filter((script) => script.id !== id),
  );
}
