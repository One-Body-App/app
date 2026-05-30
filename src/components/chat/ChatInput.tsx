import { Image } from 'expo-image';
import React, { memo, useCallback, useEffect } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useToast } from 'react-native-toast-notifications';
import ImagePicker from 'react-native-image-crop-picker';
import { GiphyDialog, GiphyDialogEvent } from '@giphy/react-native-sdk';
import GifIcon from '@/components/GifIcon';
import { MainStackParamList } from '@/src/navigator/types';
import {
  createUploadImageRequestId,
  waitForUploadImageResult,
} from '@/src/screens/post/uploadImageBridge';
import {
  CLIENT_IMAGE_MAX_HEIGHT,
  CLIENT_IMAGE_MAX_WIDTH,
  CLIENT_IMAGE_PICKER_QUALITY,
} from '@/src/screens/post/uploadImageConfig';
import {
  extractExifOrientation,
  resolveEditorExifOrientation,
} from '@/src/screens/post/uploadImageOrientation';
import {
  CHAT_COUNTER_DANGER_THRESHOLD,
  CHAT_COUNTER_VISIBLE_THRESHOLD,
  CHAT_MAX_IMAGE_ATTACHMENTS,
  sanitizeChatInputText,
  validateChatImageCandidate,
} from './chatInputUtils';

export type ChatInputAttachment = {
  id: string;
  type: 'image' | 'gif';
  previewUrl: string;
  uploadUri?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  giphyId?: string;
};

export type ChatInputSendPayload = {
  text: string;
  attachments: ChatInputAttachment[];
};

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: (payload: ChatInputSendPayload) => void | Promise<void>;
  onPickImages?: (attachments: ChatInputAttachment[]) => void;
  onPickGif?: (attachment: ChatInputAttachment | null) => void;
  attachments: ChatInputAttachment[];
  onAttachmentsChange: (attachments: ChatInputAttachment[]) => void;
  isSending?: boolean;
  isUploading?: boolean;
  isRateLimited?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

const extractGifPreviewUrl = (media?: Record<string, unknown> | null) => {
  if (!media) {
    return '';
  }

  const directUrl = media.url;
  if (typeof directUrl === 'string' && directUrl.startsWith('http')) {
    return directUrl;
  }

  const images = media.images as Record<string, unknown> | undefined;
  if (!images || typeof images !== 'object') {
    return '';
  }

  const renditionKeys = [
    'original',
    'fixed_width',
    'fixed_height',
    'downsized',
    'preview_gif',
    'fixed_width_small',
  ];
  const matchingRenditionKey = renditionKeys.find((renditionKey) => {
    const rendition = images[renditionKey] as Record<string, unknown> | undefined;
    const url = rendition?.url;
    return typeof url === 'string' && url.startsWith('http');
  });
  if (!matchingRenditionKey) {
    return '';
  }

  const rendition = images[matchingRenditionKey] as Record<string, unknown> | undefined;
  return typeof rendition?.url === 'string' ? rendition.url : '';
};

function ChatInput({
  value,
  onChangeText,
  onSend,
  onPickImages,
  onPickGif,
  attachments,
  onAttachmentsChange,
  isSending = false,
  isUploading = false,
  isRateLimited = false,
  disabled = false,
  placeholder = 'Write your message',
}: Props) {
  const { colors, dark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const toast = useToast();
  const primary = '#116a88';
  const textSecondary = dark ? '#7d96a0' : '#4f8596';

  const normalizedValue = sanitizeChatInputText(value);
  const imageAttachments = attachments.filter((attachment) => attachment.type === 'image');
  const hasGifAttachment = attachments.some((attachment) => attachment.type === 'gif');
  const canSend = normalizedValue.trim().length > 0 || attachments.length > 0;
  const isBusy = disabled || isSending || isUploading || isRateLimited;
  const shouldShowCounter = normalizedValue.length > CHAT_COUNTER_VISIBLE_THRESHOLD;
  const isCounterDanger = normalizedValue.length >= CHAT_COUNTER_DANGER_THRESHOLD;
  const composerBackground = dark ? colors.card : '#ffffff';
  const dividerColor = dark ? colors.border : '#e7eaed';
  const inputBackground = dark ? '#111d21' : '#f1f3f4';
  const sendTextColor = !canSend || isBusy ? '#8ca0a8' : primary;
  const inputPaddingRight = 88;

  useEffect(() => {
    if (!isRateLimited) {
      return;
    }

    toast.show("You're messaging a bit too fast! Please wait a moment.", {
      placement: 'top',
      type: 'normal',
    });
  }, [isRateLimited, toast]);

  const handleTextChange = useCallback(
    (nextValue: string) => {
      onChangeText(sanitizeChatInputText(nextValue));
    },
    [onChangeText]
  );

  const handleRemoveAttachment = useCallback(
    (attachmentId: string) => {
      onAttachmentsChange(attachments.filter((attachment) => attachment.id !== attachmentId));
    },
    [attachments, onAttachmentsChange]
  );

  const handlePickImages = useCallback(async () => {
    if (isBusy) {
      return;
    }

    if (hasGifAttachment) {
      toast.show('Remove the GIF before adding images.', {
        placement: 'top',
        type: 'normal',
      });
      return;
    }

    const remainingSlots = CHAT_MAX_IMAGE_ATTACHMENTS - imageAttachments.length;
    if (remainingSlots <= 0) {
      toast.show(`You can attach up to ${CHAT_MAX_IMAGE_ATTACHMENTS} images.`, {
        placement: 'top',
        type: 'normal',
      });
      return;
    }

    try {
      const result = await ImagePicker.openPicker({
        multiple: true,
        mediaType: 'photo',
        maxFiles: remainingSlots,
        compressImageQuality: CLIENT_IMAGE_PICKER_QUALITY,
        compressImageMaxWidth: CLIENT_IMAGE_MAX_WIDTH,
        compressImageMaxHeight: CLIENT_IMAGE_MAX_HEIGHT,
        forceJpg: true,
        includeExif: true,
      });
      const selectedAssets = Array.isArray(result) ? result : [result];
      const nextImages = await selectedAssets.reduce<Promise<ChatInputAttachment[]>>(
        async (imagesPromise, asset, index) => {
          const images = await imagesPromise;
          const validation = validateChatImageCandidate({
            mimeType: asset.mime,
            size: asset.size,
          });
          if (!validation.valid) {
            toast.show(validation.error, {
              placement: 'top',
              type: 'normal',
            });
            return images;
          }

          const filePathRaw = asset.path ?? '';
          const fileUri =
            filePathRaw.startsWith('file://') ||
            filePathRaw.startsWith('content://') ||
            filePathRaw.startsWith('ph://')
              ? filePathRaw
              : `file://${filePathRaw}`;
          const fileNameRaw = asset.filename || `chat_${Date.now()}_${index}.jpg`;
          const fileName = fileNameRaw.toLowerCase().endsWith('.jpg')
            ? fileNameRaw
            : `${fileNameRaw.split('.').slice(0, -1).join('.') || fileNameRaw}.jpg`;
          const requestId = createUploadImageRequestId();
          const resultPromise = waitForUploadImageResult(requestId);

          navigation.navigate('UploadImage', {
            requestId,
            imageUri: fileUri,
            fileName,
            fileSize: typeof asset.size === 'number' ? asset.size : undefined,
            type: 'image/jpeg',
            usageContext: 'chat',
            orientation: resolveEditorExifOrientation({
              orientation: extractExifOrientation(asset),
              source: 'react-native-image-crop-picker',
              platform: Platform.OS,
            }),
          });

          const uploadResult = await resultPromise;
          if (uploadResult.status !== 'saved' || !uploadResult.uri) {
            return images;
          }

          return [
            ...images,
            {
              id: `${Date.now()}-${index}-${uploadResult.fileName || fileName}`,
              type: 'image',
              previewUrl: uploadResult.uri,
              uploadUri: uploadResult.uri,
              fileName: uploadResult.fileName || fileName,
              mimeType: uploadResult.type || 'image/jpeg',
              size: uploadResult.fileSize ?? asset.size,
            },
          ];
        },
        Promise.resolve([])
      );

      if (nextImages.length < 1) {
        return;
      }

      const nextAttachments = [...imageAttachments, ...nextImages].slice(
        0,
        CHAT_MAX_IMAGE_ATTACHMENTS
      );
      onAttachmentsChange(nextAttachments);
      onPickImages?.(nextAttachments);
    } catch (error) {
      if (error instanceof Error && error.message?.toLowerCase().includes('cancel')) {
        return;
      }

      if (__DEV__) {
        console.warn('Chat image picker failed', error);
      }

      toast.show('Unable to add images right now.', {
        placement: 'top',
        type: 'normal',
      });
    }
  }, [
    hasGifAttachment,
    imageAttachments,
    isBusy,
    navigation,
    onAttachmentsChange,
    onPickImages,
    toast,
  ]);

  const handlePickGif = useCallback(() => {
    if (isBusy) {
      return;
    }

    if (imageAttachments.length > 0) {
      toast.show('Remove images before adding a GIF.', {
        placement: 'top',
        type: 'normal',
      });
      return;
    }

    const onSelect = ({ media }: { media: Record<string, unknown> }) => {
      GiphyDialog.removeAllListeners(GiphyDialogEvent.MediaSelected);
      GiphyDialog.hide();

      const previewUrl = extractGifPreviewUrl(media);
      const giphyId = String(media?.id || '').trim();
      if (!previewUrl || !giphyId) {
        toast.show('GIF feature is temporarily unavailable.', {
          placement: 'top',
          type: 'normal',
        });
        return;
      }

      const attachment: ChatInputAttachment = {
        id: `gif-${giphyId}`,
        type: 'gif',
        previewUrl,
        giphyId,
      };
      onAttachmentsChange([attachment]);
      onPickGif?.(attachment);
    };

    GiphyDialog.removeAllListeners(GiphyDialogEvent.MediaSelected);
    GiphyDialog.addListener(GiphyDialogEvent.MediaSelected, onSelect);
    try {
      GiphyDialog.show();
    } catch (error) {
      if (__DEV__) {
        console.warn('Giphy dialog failed', error);
      }
      toast.show('GIF feature is temporarily unavailable.', {
        placement: 'top',
        type: 'normal',
      });
    }
  }, [imageAttachments.length, isBusy, onAttachmentsChange, onPickGif, toast]);

  const handleSend = useCallback(() => {
    if (!canSend || isBusy) {
      return;
    }

    onSend({
      text: normalizedValue,
      attachments,
    });
  }, [attachments, canSend, isBusy, normalizedValue, onSend]);

  return (
    <View
      style={[
        styles.container,
        { borderTopColor: dividerColor, backgroundColor: composerBackground },
      ]}
    >
      {attachments.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.attachmentsRow}
        >
          {attachments.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentCard}>
              <Image source={{ uri: attachment.previewUrl }} style={styles.attachmentPreview} />
              <Pressable
                onPress={() => handleRemoveAttachment(attachment.id)}
                style={styles.attachmentRemoveButton}
              >
                <MaterialIcons name="close" size={14} color="#ffffff" />
              </Pressable>
              {attachment.type === 'gif' ? (
                <View style={styles.attachmentBadge}>
                  <Text style={styles.attachmentBadgeText}>GIF</Text>
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.row}>
        <View style={styles.inputWrap}>
          <TextInput
            value={normalizedValue}
            onChangeText={handleTextChange}
            editable={!disabled && !isSending && !isUploading}
            placeholder={placeholder}
            placeholderTextColor={textSecondary}
            selectionColor={primary}
            cursorColor={primary}
            multiline
            maxLength={2000}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: inputBackground,
                paddingRight: inputPaddingRight,
              },
            ]}
          />
          <View style={styles.inlineActions}>
            <Pressable
              onPress={handlePickImages}
              disabled={isBusy}
              style={isBusy ? styles.inlineActionDisabled : null}
              hitSlop={8}
            >
              <MaterialIcons name="image" size={20} color={textSecondary} />
            </Pressable>
            <Pressable
              onPress={handlePickGif}
              disabled={isBusy}
              style={isBusy ? styles.inlineActionDisabled : null}
              hitSlop={8}
            >
              <GifIcon size={20} color={textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.sendWrap}>
          {shouldShowCounter ? (
            <Text style={[styles.counterText, { color: isCounterDanger ? '#d14343' : '#68828a' }]}>
              {normalizedValue.length}/2000
            </Text>
          ) : (
            <View style={styles.counterSpacer} />
          )}
          <Pressable onPress={handleSend} disabled={!canSend || isBusy} style={styles.sendTextWrap}>
            <Text style={[styles.sendText, { color: sendTextColor }]}>Send</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
  },
  attachmentsRow: {
    gap: 10,
    paddingBottom: 2,
  },
  attachmentCard: {
    width: 76,
    height: 76,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#d9ecf1',
  },
  attachmentPreview: {
    width: '100%',
    height: '100%',
  },
  attachmentRemoveButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(3, 47, 60, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(3, 47, 60, 0.72)',
  },
  attachmentBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    position: 'relative',
  },
  input: {
    width: '100%',
    minHeight: 52,
    maxHeight: 120,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 15,
    lineHeight: 20,
    textAlignVertical: 'center',
  },
  inlineActions: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  inlineActionDisabled: {
    opacity: 0.5,
  },
  sendWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    minHeight: 52,
  },
  counterText: {
    position: 'absolute',
    top: -14,
    fontSize: 11,
    fontWeight: '600',
  },
  counterSpacer: {
    height: 0,
  },
  sendTextWrap: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default memo(ChatInput);
