import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  type TextInput as RNTextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView as KeyboardControllerAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { useToast } from 'react-native-toast-notifications';
import { useSelector } from 'react-redux';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useMentionComposer } from '@/components/mentions';
import { sanitizeComposerText } from '@/components/composer/composerText';
import { hasLikelyScripture } from '@/services/scripture';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MainStackParamList } from '@/src/navigator/types';
import isCreatorBlogEligible from '@/src/utils/creatorBlogAccess';
import { selectMedia, type MediaSourceKind, type SelectedMedia } from '@/src/services/mediaCapture';
import { moderateClientImage } from '@/src/services/moderation/imageModeration';
import ComposerCanvas from './ComposerCanvas';
import ComposerLectern, { type LecternToolId } from './ComposerLectern';
import ComposerModerationChip from './ComposerModerationChip';
import ComposerHeader from './ComposerHeader';
import ComposerScripturePicker from './ComposerScripturePicker';
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
  type MediaItem,
  type MediaModeration,
  type ModerationStatus,
} from './types';

type Props = NativeStackScreenProps<MainStackParamList, 'Post'>;

const MAX_CAPTION_LENGTH = 300;

type ToastOptions = { type?: 'success' | 'danger' | 'warning'; placement?: 'bottom' | 'top' };

const resolveMediaSourceFromActionSheet = (buttonIndex: number): MediaSourceKind | null => {
  if (buttonIndex === 1) {
    return 'library';
  }
  if (buttonIndex === 2) {
    return 'camera';
  }
  return null;
};

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
  const insets = useSafeAreaInsets();
  const scheme: 'dark' | 'light' = dark ? 'dark' : 'light';
  const palette = useMemo(() => resolveComposerPalette(scheme), [scheme]);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData) as
    | ProfileSummary
    | undefined;

  const [draft, setDraftState] = useState<ComposerDraft>(() => emptyDraft('feed'));
  const [activeIndex, setActiveIndex] = useState(0);
  const [lecternExpanded, setLecternExpanded] = useState(false);
  const [lecternHeight, setLecternHeight] = useState(composerSpace.lecternCompactHeight);
  const [scripturePickerOpen, setScripturePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const captionInputRef = useRef<RNTextInput | null>(null);

  const mentionComposer = useMentionComposer({
    initialText: '',
    sanitizeText: (value: string) => sanitizeComposerText(value, MAX_CAPTION_LENGTH),
  });

  const persistDraft = useCallback((nextDraft: ComposerDraft) => {
    persistComposerDraft(nextDraft).catch(() => undefined);
  }, []);

  const updateDraft = useCallback(
    (updater: (current: ComposerDraft) => ComposerDraft) => {
      setDraftState((current) => {
        const nextDraft = updater(current);
        persistDraft(nextDraft);
        return nextDraft;
      });
    },
    [persistDraft]
  );

  const syncMentionDraft = useCallback(
    (current: ComposerDraft): ComposerDraft => ({
      ...current,
      caption: mentionComposer.text,
      mentionedUserIds: mentionComposer.mentionedUserIds,
      mentions: mentionComposer.mentions,
    }),
    [mentionComposer.mentionedUserIds, mentionComposer.mentions, mentionComposer.text]
  );

  // Hydrate a previously stashed draft when the screen first focuses so users
  // do not lose work when the screen unmounts unexpectedly.
  const hasHydratedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasHydratedRef.current) return undefined;
      hasHydratedRef.current = true;
      let active = true;
      loadComposerDraft()
        .then((restored) => {
          if (!active || !restored) return;
          if (restored.caption || restored.media.length > 0 || restored.scriptureShare) {
            setDraftState(restored);
            if (restored.caption) {
              mentionComposer.setText(restored.caption);
            }
          }
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, [mentionComposer])
  );

  const showToast = useCallback(
    (message: string, options?: ToastOptions) => {
      toast.show(message, {
        type: options?.type ?? 'success',
        placement: options?.placement ?? 'bottom',
      });
    },
    [toast]
  );

  const setMediaModeration = useCallback(
    (mediaId: string, moderation: MediaModeration) => {
      updateDraft((current) => ({
        ...current,
        media: current.media.map((item) => (item.id === mediaId ? { ...item, moderation } : item)),
      }));
    },
    [updateDraft]
  );

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
      updateDraft((current) => ({
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
    [moderatePhoto, setMediaModeration, updateDraft]
  );

  const removeMediaAt = useCallback(
    (index: number) => {
      updateDraft((current) => ({
        ...current,
        media: current.media.filter((_, idx) => idx !== index),
      }));
    },
    [updateDraft]
  );

  const handleAddPhoto = useCallback(async () => {
    const action = await new Promise<'library' | 'camera' | null>((resolve) => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { options: ['Cancel', 'Choose From Library', 'Open Camera'], cancelButtonIndex: 0 },
          (buttonIndex: number) => {
            resolve(resolveMediaSourceFromActionSheet(buttonIndex));
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
    navigation.navigate('VideoPost', { openCameraOnMount: true });
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
          setLecternExpanded(true);
          setScripturePickerOpen((current) => !current);
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

  const handleAudienceChange = useCallback(
    (audience: ComposerAudience) => {
      updateDraft((current) => ({ ...current, audience }));
    },
    [updateDraft]
  );

  const handleCaptionChange = useCallback(
    (next: string) => {
      const sanitized = sanitizeComposerText(next, MAX_CAPTION_LENGTH);
      mentionComposer.setText(sanitized);
      updateDraft((current) => ({
        ...current,
        caption: sanitized,
        mentionedUserIds: mentionComposer.mentionedUserIds,
        mentions: mentionComposer.mentions,
      }));
      if (!hasLikelyScripture(sanitized)) {
        setScriptureChipDismissed(false);
      }
    },
    [mentionComposer, updateDraft]
  );

  const handleSelectScripture = useCallback(
    (scriptureShare: NonNullable<ComposerDraft['scriptureShare']>) => {
      updateDraft((current) => ({ ...current, scriptureShare }));
    },
    [updateDraft]
  );

  const handleClearScripture = useCallback(() => {
    updateDraft((current) => ({ ...current, scriptureShare: null }));
  }, [updateDraft]);

  const handleClose = useCallback(() => {
    const hasDraftContent =
      mentionComposer.text.trim().length > 0 ||
      draft.media.length > 0 ||
      Boolean(draft.scriptureShare);
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
  }, [draft.media.length, draft.scriptureShare, mentionComposer.text, navigation]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const draftForSubmit = syncMentionDraft(draft);
      const outcome = await submitComposerDraft({ draft: draftForSubmit, token });
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
      setDraftState(emptyDraft('feed'));
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
  }, [draft, isSubmitting, mentionComposer, navigation, showToast, syncMentionDraft, token]);

  // Scripture detection chip: derived from the caption (cheap regex, no
  // network). Dismissable; the server does the authoritative parse on submit.
  const scriptureDetected = useMemo(
    () => hasLikelyScripture(mentionComposer.text),
    [mentionComposer.text]
  );
  const [scriptureChipDismissed, setScriptureChipDismissed] = useState(false);
  const showScriptureChip = scriptureDetected && !scriptureChipDismissed;

  const currentCaption = mentionComposer.text;
  const characterCount = currentCaption.length;
  const canSubmit =
    !isSubmitting &&
    characterCount <= MAX_CAPTION_LENGTH &&
    (draft.media.length > 0 || currentCaption.trim().length > 0 || Boolean(draft.scriptureShare));
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
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
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
            reservedBottom={lecternHeight}
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

        <KeyboardControllerAvoidingView
          pointerEvents="box-none"
          style={styles.lecternAvoider}
          behavior="translate-with-padding"
          keyboardVerticalOffset={0}
        >
          <ComposerLectern
            scheme={scheme}
            caption={currentCaption}
            onChangeCaption={handleCaptionChange}
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
            toolPanel={
              scripturePickerOpen ? (
                <ComposerScripturePicker
                  palette={palette}
                  token={token}
                  selected={draft.scriptureShare}
                  onSelect={handleSelectScripture}
                  onClear={handleClearScripture}
                />
              ) : undefined
            }
            expanded={lecternExpanded}
            onExpandedChange={setLecternExpanded}
            onHeightChange={setLecternHeight}
            captionInputRef={captionInputRef}
            bottomInset={insets.bottom}
          />
        </KeyboardControllerAvoidingView>

        {/* Scripture detection chip — spell-check / "rewrite with AI" style. */}
        {showScriptureChip ? (
          <View style={styles.scriptureChipRow}>
            <Pressable
              style={styles.scriptureChip}
              onPress={() => captionInputRef.current?.focus()}
            >
              <View style={styles.scriptureChipDot} />
              <Text style={styles.scriptureChipText}>Scripture detected</Text>
            </Pressable>
            <Pressable hitSlop={8} onPress={() => setScriptureChipDismissed(true)}>
              <Text style={styles.scriptureChipDismiss}>×</Text>
            </Pressable>
          </View>
        ) : null}
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
  lecternAvoider: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  chipDock: {
    position: 'absolute',
    left: composerSpace.lg,
    right: composerSpace.lg,
    bottom: composerSpace.lg,
  },
  // Scripture detection chip (brand colors: #41899f / #41dbe1).
  scriptureChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: composerSpace.lg,
    paddingTop: 8,
  },
  scriptureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(65,137,159,0.35)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scriptureChipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#41dbe1',
  },
  scriptureChipText: {
    color: '#41899f',
    fontSize: 12,
    fontWeight: '600',
  },
  scriptureChipDismiss: {
    color: '#41899f',
    fontSize: 16,
    opacity: 0.6,
    paddingHorizontal: 2,
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
