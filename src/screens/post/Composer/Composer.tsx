import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  type TextInput as RNTextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { useToast } from 'react-native-toast-notifications';
import { useSelector } from 'react-redux';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useMentionComposer } from '@/components/mentions';
import { sanitizeComposerText } from '@/components/composer/composerText';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MainStackParamList } from '@/src/navigator/types';
import isCreatorBlogEligible from '@/src/utils/creatorBlogAccess';
import { selectMedia, type SelectedMedia } from '@/src/services/mediaCapture';
import { moderateClientImage } from '@/src/services/moderation/imageModeration';
import ComposerCanvas from './ComposerCanvas';
import ComposerLectern, { type LecternToolId } from './ComposerLectern';
import ComposerModerationChip from './ComposerModerationChip';
import ComposerFeedPreview from './ComposerFeedPreview';
import ComposerHeader from './ComposerHeader';
import { submitComposerDraft } from './composerSubmit';
import {
  clearComposerDraft,
  loadComposerDraft,
  persistComposerDraft,
} from './composerDraftStorage';
import { composerSpace, resolveComposerPalette } from './composerTheme';
import {
  emptyDraft,
  newMediaId,
  type ComposerAudience,
  type ComposerDraft,
  type ComposerMode,
  type ComposerPreviewMode,
  type MediaItem,
  type MediaModeration,
  type ModerationStatus,
} from './types';

type Props = NativeStackScreenProps<MainStackParamList, 'Post'>;

const MAX_CAPTION_LENGTH = 300;

type ToastOptions = { type?: 'success' | 'danger' | 'warning'; placement?: 'bottom' | 'top' };

const decisionToStatus: Record<string, ModerationStatus> = {
  safe: 'safe',
  unsure: 'unsure',
  blocked: 'blocked',
  unavailable: 'pending',
};

const buildMediaFromSelected = (selected: SelectedMedia): MediaItem => ({
  id: newMediaId(),
  kind: selected.kind === 'video' ? 'video' : 'photo',
  uri: selected.uri,
  fileName: selected.fileName,
  fileSize: selected.fileSize,
  type: selected.type,
  width: selected.width,
  height: selected.height,
  durationMs: selected.durationMs,
  exifOrientation: selected.exifOrientation,
  moderation: { status: 'pending' as ModerationStatus },
});

type ProfileSummary = {
  _id?: string;
  id?: string;
  userId?: string;
  profileImage?: string;
  profile_image?: string;
  name?: string;
  firstName?: string;
};

function buildAuthorName(profile: ProfileSummary | undefined): string {
  if (!profile) return 'You';
  return profile.firstName?.trim() || profile.name?.trim() || 'You';
}

function resolveAuthorAvatar(profile: ProfileSummary | undefined): string | undefined {
  return profile?.profileImage || profile?.profile_image || undefined;
}

type RemoveButtonProps = {
  onPress: () => void;
  paletteAccent: string;
  paletteBg: string;
  paletteBorder: string;
};

function ComposerCanvasRemoveButton({
  onPress,
  paletteAccent,
  paletteBg,
  paletteBorder,
}: RemoveButtonProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Remove this media"
      style={({ pressed }) => [
        styles.removeButton,
        { backgroundColor: paletteBg, borderColor: paletteBorder, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.removeButtonIcon, { backgroundColor: paletteAccent }]}>
        <MaterialIcons name="close" size={14} color="#ffffff" />
      </View>
    </Pressable>
  );
}

export default function Composer({ navigation }: Props): React.ReactElement {
  const toast = useToast();
  const { dark } = useTheme();
  const scheme: 'dark' | 'light' = dark ? 'dark' : 'light';
  const palette = useMemo(() => resolveComposerPalette(scheme), [scheme]);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData) as
    | ProfileSummary
    | undefined;

  const [draft, setDraft] = useState<ComposerDraft>(() => emptyDraft('feed'));
  const [activeIndex, setActiveIndex] = useState(0);
  const [lecternExpanded, setLecternExpanded] = useState(true);
  const [previewMode, setPreviewMode] = useState<ComposerPreviewMode>('closed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const captionInputRef = useRef<RNTextInput | null>(null);

  const mentionComposer = useMentionComposer({
    initialText: '',
    sanitizeText: (value: string) => sanitizeComposerText(value, MAX_CAPTION_LENGTH),
  });

  // Keep the draft's caption + mention metadata in sync with the mention hook.
  React.useEffect(() => {
    setDraft((current) => ({
      ...current,
      caption: mentionComposer.text,
      mentionedUserIds: mentionComposer.mentionedUserIds,
      mentions: mentionComposer.mentions,
    }));
  }, [mentionComposer.mentionedUserIds, mentionComposer.mentions, mentionComposer.text]);

  // Hydrate a previously stashed draft on mount so users do not lose work
  // when the screen unmounts unexpectedly (e.g. push notification deeplink).
  const hasHydratedRef = useRef(false);
  React.useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    loadComposerDraft()
      .then((restored) => {
        if (!restored) return;
        if (restored.caption || restored.media.length > 0) {
          setDraft(restored);
          if (restored.caption) {
            mentionComposer.setText(restored.caption);
          }
        }
      })
      .catch(() => undefined);
    // mentionComposer.setText is stable enough; we intentionally only run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the draft on every change so a crash mid-edit does not lose work.
  React.useEffect(() => {
    persistComposerDraft(draft).catch(() => undefined);
  }, [draft]);

  const showToast = useCallback(
    (message: string, options?: ToastOptions) => {
      toast.show(message, {
        type: options?.type ?? 'success',
        placement: options?.placement ?? 'bottom',
      });
    },
    [toast]
  );

  const setMediaModeration = useCallback((mediaId: string, moderation: MediaModeration) => {
    setDraft((current) => ({
      ...current,
      media: current.media.map((item) => (item.id === mediaId ? { ...item, moderation } : item)),
    }));
  }, []);

  const moderatePhoto = useCallback(
    async (mediaItem: MediaItem) => {
      const result = await moderateClientImage({
        uri: mediaItem.uri,
        fileName: mediaItem.fileName,
      });
      const status = decisionToStatus[result.decision] ?? 'pending';
      setMediaModeration(mediaItem.id, {
        status,
        severity: result.severity,
        reason: result.reason,
        category:
          result.category === 'sexual' ||
          result.category === 'violence' ||
          result.category === 'hate' ||
          result.category === 'self-harm' ||
          result.category === 'graphic'
            ? result.category
            : 'other',
        source: 'backend',
        scores: result.scores,
      });
    },
    [setMediaModeration]
  );

  const appendMedia = useCallback(
    (items: SelectedMedia[]) => {
      if (items.length === 0) return;
      const newItems = items.map(buildMediaFromSelected);
      setDraft((current) => ({
        ...current,
        media: [...current.media, ...newItems],
      }));
      // Kick off moderation for each photo. Videos are checked via the
      // existing videoModerationBridge at queue time.
      newItems
        .filter((item) => item.kind === 'photo')
        .forEach((item) => {
          moderatePhoto(item).catch(() => {
            setMediaModeration(item.id, {
              status: 'unsure',
              source: 'backend',
              reason: 'Pre-screen unavailable; we will check during posting.',
            });
          });
        });
    },
    [moderatePhoto, setMediaModeration]
  );

  const removeMediaAt = useCallback((index: number) => {
    setDraft((current) => ({
      ...current,
      media: current.media.filter((_, idx) => idx !== index),
    }));
  }, []);

  const handleAddPhoto = useCallback(async () => {
    const action = await new Promise<'library' | 'camera' | null>((resolve) => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { options: ['Cancel', 'Choose From Library', 'Open Camera'], cancelButtonIndex: 0 },
          (buttonIndex) => {
            resolve(buttonIndex === 1 ? 'library' : buttonIndex === 2 ? 'camera' : null);
          }
        );
        return;
      }
      Alert.alert('Add media', 'Select a source', [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
        { text: 'Choose From Library', onPress: () => resolve('library') },
        { text: 'Open Camera', onPress: () => resolve('camera') },
      ]);
    });
    if (!action) return;
    const result = await selectMedia({
      mode: 'mixed',
      source: action,
      maxCount: 10,
    });
    if (result.status === 'ok') {
      appendMedia(result.items);
    } else if (result.status === 'rejected') {
      showToast(result.message ?? 'Could not add media.', { type: 'danger' });
    }
  }, [appendMedia, showToast]);

  const handleAddVideo = useCallback(() => {
    navigation.navigate('VideoPost', { openCameraOnMount: false });
  }, [navigation]);

  const handleToolPress = useCallback(
    (tool: LecternToolId) => {
      switch (tool) {
        case 'photo':
          handleAddPhoto();
          break;
        case 'video':
          handleAddVideo();
          break;
        case 'gif':
          showToast('GIF picker coming soon.', { type: 'warning' });
          break;
        case 'verse':
          showToast('Verse picker coming soon.', { type: 'warning' });
          break;
        case 'place':
          showToast('Tap the map pin on the existing composer for now.', { type: 'warning' });
          break;
        case 'writer':
          navigation.navigate('BlogComposer');
          break;
        default:
          break;
      }
    },
    [handleAddPhoto, handleAddVideo, navigation, showToast]
  );

  const handleAudienceChange = useCallback((audience: ComposerAudience) => {
    setDraft((current) => ({ ...current, audience }));
  }, []);

  const handleClose = useCallback(() => {
    const hasDraftContent = draft.caption.trim().length > 0 || draft.media.length > 0;
    if (hasDraftContent) {
      Alert.alert('Keep your draft?', 'We can hold this for you and you can pick it up later.', [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Save as draft',
          onPress: () => {
            // Draft was already persisted on every keystroke; closing keeps it.
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          },
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            clearComposerDraft().catch(() => undefined);
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          },
        },
      ]);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [draft.caption, draft.media.length, navigation]);

  const handleTogglePreview = useCallback(() => {
    setPreviewMode((current) => (current === 'closed' ? draft.mode : 'closed'));
  }, [draft.mode]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const outcome = await submitComposerDraft({ draft, token });
      if (outcome.status === 'ok') {
        showToast(outcome.message ?? 'Posted to your feed.', { type: 'success' });
      } else if (outcome.status === 'pending_review') {
        showToast(
          outcome.message ??
            'Your post is being reviewed by a steward. We will let you know when it is live.',
          { type: 'warning' }
        );
      } else {
        showToast(outcome.message ?? 'Could not post.', { type: 'danger' });
        return;
      }
      mentionComposer.reset();
      // Successful submission clears the locally stashed draft.
      clearComposerDraft().catch(() => undefined);
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not post.';
      showToast(message, { type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, isSubmitting, mentionComposer, navigation, showToast, token]);

  const characterCount = draft.caption.length;
  const canSubmit =
    !isSubmitting &&
    characterCount <= MAX_CAPTION_LENGTH &&
    (draft.media.length > 0 || draft.caption.trim().length > 0);
  const activeMedia = draft.media[activeIndex];
  const moderationChipVisible = Boolean(activeMedia && activeMedia.kind === 'photo');
  const allowWriter = isCreatorBlogEligible(
    currentUser as Parameters<typeof isCreatorBlogEligible>[0]
  );

  const tools = useMemo(
    () => [
      { id: 'photo' as LecternToolId, label: 'Photo', icon: 'photo-library' as const },
      { id: 'video' as LecternToolId, label: 'Video', icon: 'videocam' as const },
      { id: 'gif' as LecternToolId, label: 'GIF', icon: 'gif-box' as const },
      { id: 'verse' as LecternToolId, label: 'Verse', icon: 'menu-book' as const },
      { id: 'place' as LecternToolId, label: 'Place', icon: 'place' as const },
      {
        id: 'writer' as LecternToolId,
        label: 'Writer',
        icon: 'edit' as const,
        visible: allowWriter,
      },
    ],
    [allowWriter]
  );

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: palette.stage }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {Platform.OS === 'android' ? (
          <StatusBar
            barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
            backgroundColor={palette.stage}
            translucent={false}
          />
        ) : null}

        <ComposerHeader
          scheme={scheme}
          audience={draft.audience}
          onAudienceChange={handleAudienceChange}
          characterCount={characterCount}
          characterMax={MAX_CAPTION_LENGTH}
          onClose={handleClose}
          onSubmit={handleSubmit}
          onTogglePreview={handleTogglePreview}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          eyebrow={draft.media.length > 0 ? 'Composing' : 'On your heart'}
          title={
            draft.media.length > 0
              ? `${draft.media.length} item${draft.media.length === 1 ? '' : 's'}`
              : 'New post'
          }
        />

        <View style={styles.canvasWrap}>
          <ComposerCanvas
            items={draft.media}
            scheme={scheme}
            onRequestMedia={handleAddPhoto}
            onActiveIndexChange={(index) => setActiveIndex(index)}
          />

          {moderationChipVisible && activeMedia ? (
            <View pointerEvents="box-none" style={styles.chipDock}>
              <ComposerModerationChip
                scheme={scheme}
                status={activeMedia.moderation.status}
                message={activeMedia.moderation.reason}
                autoDismissMs={activeMedia.moderation.status === 'safe' ? 2400 : undefined}
              />
            </View>
          ) : null}

          {draft.media.length > 0 ? (
            <View pointerEvents="box-none" style={styles.removeDock}>
              <ComposerCanvasRemoveButton
                onPress={() => removeMediaAt(activeIndex)}
                paletteAccent={palette.moderationBlocked}
                paletteBg={palette.glass}
                paletteBorder={palette.glassBorder}
              />
            </View>
          ) : null}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ComposerLectern
            scheme={scheme}
            caption={mentionComposer.text}
            onChangeCaption={mentionComposer.setText}
            mentions={mentionComposer.mentions}
            selection={mentionComposer.selection}
            onSelectionChange={mentionComposer.setSelection}
            onSelectSuggestion={mentionComposer.selectMention}
            onHandleBackspace={mentionComposer.deleteMentionBeforeCursor}
            activeMention={mentionComposer.activeMention}
            token={token}
            excludedUserIds={mentionComposer.mentionedUserIds}
            tools={tools}
            onToolPress={handleToolPress}
            expanded={lecternExpanded}
            onExpandedChange={setLecternExpanded}
            captionInputRef={captionInputRef}
          />
        </KeyboardAvoidingView>

        <ComposerFeedPreview
          scheme={scheme}
          visible={previewMode !== 'closed'}
          mode={(previewMode === 'closed' ? draft.mode : previewMode) as ComposerMode}
          onModeChange={(next) => setPreviewMode(next)}
          draft={draft}
          authorName={buildAuthorName(currentUser)}
          authorAvatarUri={resolveAuthorAvatar(currentUser)}
          onClose={() => setPreviewMode('closed')}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  canvasWrap: {
    flex: 1,
    position: 'relative',
  },
  chipDock: {
    position: 'absolute',
    left: composerSpace.lg,
    right: composerSpace.lg,
    bottom: composerSpace.lg,
  },
  removeDock: {
    position: 'absolute',
    top: composerSpace.lg,
    right: composerSpace.lg,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
