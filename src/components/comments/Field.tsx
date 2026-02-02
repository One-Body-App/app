import { TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { CloseCircle, Send, TickCircle } from 'iconsax-react-native';
import { GiphyDialog, GiphyMedia, GiphyMediaView } from '@giphy/react-native-sdk';
import { useState } from 'react';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import StyledText from '../styled/Text';

interface Props {
  mediaGif: GiphyMedia | null;
  setGif: React.Dispatch<React.SetStateAction<GiphyMedia | null>>;
  publishComment: Function;
  text?: string;
  isEditingComment?: boolean;
  setEditingComment?: (status: boolean) => void;
  isFromBottomField?: boolean;
}

function CommentField({
  mediaGif,
  setGif,
  publishComment,
  text,
  isEditingComment,
  setEditingComment,
  isFromBottomField,
}: Props) {
  const [content, setContent] = useState(text ?? '');
  const InputComponent = isFromBottomField ? BottomSheetTextInput : TextInput;
  const gifAspectRatioRaw = mediaGif?.aspectRatio;
  const gifAspectRatio = Number(gifAspectRatioRaw);
  const safeGifAspectRatio =
    Number.isFinite(gifAspectRatio) && gifAspectRatio > 0 ? gifAspectRatio : 1;
  const hasGif = Boolean(mediaGif?.id || mediaGif?.url);

  // const onKeyboardWillShow = (e: KeyboardEvent) => {
  //   setKeyboardHeight(e.endCoordinates.height);
  // };

  // const onKeyboardWillHide = () => {
  //   setKeyboardHeight(0);
  // };

  // useEffect(() => {
  //   if (!isEditingComment) {
  //     if (Platform.OS === 'ios') {
  //       // These listeners on ios are a little more snappy but not available on Android
  //       // If you want to use this on Android use keyboardDidShow/Hide
  //       keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', onKeyboardWillShow);
  //       onKeyboardWillHideListener = Keyboard.addListener('keyboardWillHide', onKeyboardWillHide);
  //     }

  //     return () => {
  //       if (Platform.OS === 'ios') {
  //         onKeyboardWillHideListener.remove();
  //         onKeyboardWillHideListener.remove();
  //         // Keyboard.removeAllListeners('keyboardWillShow');

  //         // Keyboard.removeAllListeners('keyboardWillHide');
  //       }
  //     };
  //   }
  // }, []);

  const submitComment = (value?: string) => {
    if (value || mediaGif) {
      publishComment(value ?? '');
      setContent('');
      setGif(null);
    }
  };

  // const { shouldHandleKeyboardEvents } = useBottomSheetInternal();

  // useEffect(() => {
  //   return () => {
  //     // Reset the flag on unmount
  //     shouldHandleKeyboardEvents.value = false;
  //   };
  // }, [shouldHandleKeyboardEvents]);

  // // #region callbacks
  // const handleOnFocus = useCallback(() => {
  //   shouldHandleKeyboardEvents.value = true;
  // }, [shouldHandleKeyboardEvents]);
  // const handleOnBlur = useCallback(() => {
  //   console.log(shouldHandleKeyboardEvents);
  //   shouldHandleKeyboardEvents.value = false;
  // }, [shouldHandleKeyboardEvents]);
  // // #endregion

  return (
    <>
      <View
        style={{
          backgroundColor: Colors.neutral[800],
          paddingHorizontal: spacing.x16,
          paddingVertical: spacing.x13,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            backgroundColor: Colors.neutral[700],
            borderRadius: borderRadius.large,
            paddingHorizontal: spacing.x13,
            paddingVertical: spacing.x10,
            borderWidth: 1,
            borderColor: Colors.neutral[600],
          }}
        >
          <TouchableOpacity
            onPress={() => {
              try {
                GiphyDialog.show();
              } catch (e) {
                console.log(e);
              }
            }}
            style={{
              paddingHorizontal: spacing.x10,
              paddingVertical: spacing.x5,
              borderRadius: borderRadius.base,
              backgroundColor: Colors.neutral[600],
              marginRight: spacing.x10,
            }}
          >
            <StyledText style={{ color: Colors.neutral.brand, fontWeight: '600' }}>GIF</StyledText>
          </TouchableOpacity>
          <InputComponent
            placeholder={isEditingComment ? 'Edit comment...' : 'Write a comment...'}
            multiline
            value={content}
            onChangeText={(value: string) => {
              setContent(value);
            }}
            placeholderTextColor={Colors.neutral[400]}
            onSubmitEditing={() => {
              submitComment(content);
            }}
            style={{
              flex: 1,
              minHeight: 36,
              maxHeight: 120,
              color: Colors.neutral.brand,
              paddingVertical: spacing.x8,
              paddingHorizontal: spacing.x5,
              textAlignVertical: 'top',
            }}
          />
          <View style={{ justifyContent: 'flex-end' }}>
            {isEditingComment ? (
              <View style={{ flexDirection: 'row', gap: spacing.x8 }}>
                <TouchableOpacity
                  onPress={() => {
                    submitComment(content);
                  }}
                >
                  <TickCircle color={Colors.primarySapphire.brand} size={22} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (setEditingComment) setEditingComment(false);
                  }}
                >
                  <CloseCircle color={Colors.primarySapphire.brand} size={22} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  submitComment(content);
                }}
              >
                <Send variant="Bold" size={24} color={Colors.primarySapphire.brand} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      {mediaGif && hasGif ? (
        <ScrollView
          style={{
            height: 100,
            backgroundColor: isEditingComment ? undefined : Colors.neutral[800],
          }}
        >
          <View
            style={{
              padding: 10,
              width: 100,
              borderRadius: borderRadius.base,
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: Colors.primarySapphire.brand,
                borderRadius: borderRadius.max,
                position: 'absolute',
                width: 30,
                height: 30,
                top: 0,
                right: 0,
                zIndex: 10,
              }}
              onPress={() => {
                setGif(null);
              }}
            >
              <CloseCircle size={30} color="#fff" />
            </TouchableOpacity>
            <GiphyMediaView
              media={mediaGif}
              resizeMode="cover"
              style={{
                aspectRatio: safeGifAspectRatio,
                borderRadius: borderRadius.base,

                overflow: 'hidden',
              }}
            />
          </View>
        </ScrollView>
      ) : null}
    </>
  );
}

export default CommentField;
