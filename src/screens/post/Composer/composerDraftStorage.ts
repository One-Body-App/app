import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ComposerDraft } from './types';

const STORAGE_KEY = 'composer.draft.v1';

type SerializedDraft = Omit<ComposerDraft, 'gif'> & {
  // We intentionally drop the Giphy media handle from persistence to keep the
  // payload small; the user can re-pick a GIF after restoring.
  serializedAt: string;
};

export const persistComposerDraft = async (draft: ComposerDraft): Promise<void> => {
  try {
    const payload: SerializedDraft = {
      ...draft,
      serializedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Persistence is best-effort - we never fail submission because a draft
    // could not be cached locally.
  }
};

export const loadComposerDraft = async (): Promise<ComposerDraft | null> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SerializedDraft;
    return {
      mode: parsed.mode,
      // Coerce any unknown/legacy audience (e.g. the removed 'steward') to the
      // default so a persisted draft can't reintroduce a dropped option.
      audience: parsed.audience === 'connections' ? 'connections' : 'everyone',
      caption: parsed.caption,
      mentionedUserIds: parsed.mentionedUserIds ?? [],
      mentions: parsed.mentions ?? [],
      media: parsed.media ?? [],
      location: parsed.location ?? null,
      linkAttachments: parsed.linkAttachments ?? [],
      scriptureShare: parsed.scriptureShare ?? null,
      quote: parsed.quote,
    };
  } catch {
    return null;
  }
};

export const clearComposerDraft = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const COMPOSER_DRAFT_STORAGE_KEY = STORAGE_KEY;
