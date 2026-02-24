import { load } from '@tauri-apps/plugin-store';

const STORE_NAME = 'settings.json';
const API_KEY_KEY = 'gemini_api_key';

let storeInstance: Awaited<ReturnType<typeof load>> | null = null;

async function getStore() {
  if (!storeInstance) {
    storeInstance = await load(STORE_NAME, { autoSave: true } as any);
  }
  return storeInstance;
}

export async function getApiKey(): Promise<string | null> {
  try {
    const store = await getStore();
    const key = await store.get<string>(API_KEY_KEY);
    return key || null;
  } catch {
    return null;
  }
}

export async function setApiKey(key: string): Promise<void> {
  const store = await getStore();
  await store.set(API_KEY_KEY, key);
  await store.save();
}

export async function hasApiKey(): Promise<boolean> {
  const key = await getApiKey();
  return !!key;
}
