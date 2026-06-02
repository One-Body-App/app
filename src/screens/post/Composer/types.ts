import type { GiphyMedia } from '@giphy/react-native-sdk';
import type { ScriptureShare, TaggedMention } from '@/utils/types';
import type { MapSuggestion } from '@/components/MapBoxTypes';

// The composer treats every selected piece of media as the same shape so the
// canvas can swipe between photos and videos without branching on layout.
export type MediaKind = 'photo' | 'video' | 'gif';

export type ModerationStatus = 'pending' | 'safe' | 'unsure' | 'blocked';

export type ModerationCategory = 'sexual' | 'violence' | 'hate' | 'self-harm' | 'graphic' | 'other';

export type MediaModeration = {
  status: ModerationStatus;
  // Numeric severity 0..1. UI uses this for chip intensity.
  severity?: number;
  reason?: string;
  category?: ModerationCategory;
  source?: 'client-nsfwjs' | 'client-toxicity' | 'client-heuristic' | 'backend';
  // Echoed verbatim into the backend moderation review payload at submit time.
  scores?: Record<string, number>;
};

export type MediaItem = {
  id: string;
  kind: MediaKind;
  uri: string;
  fileName?: string;
  fileSize?: number;
  type?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  exifOrientation?: number;
  // GIF picks carry the raw Giphy media so the submit payload can attach it.
  gifMedia?: GiphyMedia;
  // Optional thumbnail to render while a heavy asset (e.g. 4K video) loads.
  thumbnailUri?: string;
  // Populated as the client classifier finishes; defaults to pending.
  moderation: MediaModeration;
};

export type ComposerAudience = 'everyone' | 'connections';

export type ComposerMode = 'feed' | 'watch';

export type ComposerLinkAttachment = {
  id: string;
  url: string;
  kind: 'link' | 'document';
};

export type ComposerDraft = {
  mode: ComposerMode;
  audience: ComposerAudience;
  caption: string;
  mentionedUserIds: string[];
  mentions: TaggedMention[];
  media: MediaItem[];
  location: MapSuggestion | null;
  linkAttachments: ComposerLinkAttachment[];
  scriptureShare: ScriptureShare | null;
  // Quote-repost context, if the composer was opened from a post's "Quote" CTA.
  quote?: {
    sourceId: string;
    sourceType: 'social' | 'rss' | 'watch' | 'prayer';
    preview?: { title?: string; content?: string; link?: string };
  };
};

export type ComposerLecternState = 'collapsed' | 'expanded';

export const newMediaId = (): string =>
  `mi_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const emptyDraft = (mode: ComposerMode = 'feed'): ComposerDraft => ({
  mode,
  audience: 'everyone',
  caption: '',
  mentionedUserIds: [],
  mentions: [],
  media: [],
  location: null,
  linkAttachments: [],
  scriptureShare: null,
});
