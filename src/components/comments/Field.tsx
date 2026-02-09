import { TextInput, TouchableOpacity, View, ScrollView, Platform } from 'react-native';
import { CloseCircle, TickCircle } from 'iconsax-react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import FastImage from 'react-native-fast-image';
import { GiphyDialog, GiphyMedia, GiphyMediaView } from '@giphy/react-native-sdk';
import { useState } from 'react';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { NO_PROFILE_IMAGE } from '@/services/constants';
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
  const { dark } = useTheme();
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const [content, setContent] = useState(text ?? '');
  const InputComponent = isFromBottomField ? BottomSheetTextInput : TextInput;
  const gifAspectRatioRaw = mediaGif?.aspectRatio;
  const gifAspectRatio = Number(gifAspectRatioRaw);
  const safeGifAspectRatio =
    Number.isFinite(gifAspectRatio) && gifAspectRatio > 0 ? gifAspectRatio : 1;
  const hasGif = Boolean(mediaGif?.id || mediaGif?.url);
  const canUseGiphy = Platform.OS !== 'android';
  const composerBackground = dark ? '#1a2c32' : '#ffffff';
  const inputBackground = dark ? '#111d21' : '#f1f3f4';
  const dividerColor = dark ? '#22343a' : '#e7eaed';
  const textSecondary = '#4f8596';
  const primary = '#116a88';
  const profileImageUri =
    user?.profileImage && user.profileImage !== '' ? user.profileImage : NO_PROFILE_IMAGE;
  const safeProfileImageUri = profileImageUri || 'https://via.placeholder.com/72';

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

  const submitComment = async (value?: string) => {
    if (value || mediaGif) {
      const publishResult = await publishComment(value ?? '');
      if (publishResult) {
        setContent('');
        setGif(null);
      }
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
          backgroundColor: composerBackground,
          borderTopWidth: 1,
          borderTopColor: dividerColor,
          paddingHorizontal: spacing.x16,
          paddingTop: spacing.x16,
          paddingBottom: spacing.x20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.x10 }}>
          <FastImage
            source={{ uri: safeProfileImageUri }}
            style={{ width: 36, height: 36, borderRadius: borderRadius.max }}
          />
          <View style={{ flex: 1, position: 'relative' }}>
            <InputComponent
              placeholder={isEditingComment ? 'Edit comment...' : 'Add a comment...'}
              multiline
              value={content}
              onChangeText={(value: string) => {
                setContent(value);
              }}
              placeholderTextColor={textSecondary}
              selectionColor={primary}
              cursorColor={primary}
              onSubmitEditing={() => {
                submitComment(content).catch(() => undefined);
              }}
              style={{
                width: '100%',
                minHeight: 50,
                maxHeight: 120,
                color: dark ? '#ffffff' : '#0e181b',
                backgroundColor: inputBackground,
                borderRadius: borderRadius.max,
                paddingVertical: spacing.x16,
                paddingHorizontal: spacing.x16,
                paddingRight: spacing.x32,
                textAlignVertical: 'center',
                fontSize: 13,
              }}
            />
            <TouchableOpacity
              onPress={() => {
                if (!canUseGiphy) return;
                try {
                  GiphyDialog.show();
                } catch (e) {
                  console.log(e);
                }
              }}
              style={{
                position: 'absolute',
                right: spacing.x10,
                top: 16,
              }}
            >
              <MaterialIcons name="sentiment-satisfied" size={20} color={textSecondary} />
            </TouchableOpacity>
          </View>
          {isEditingComment ? (
            <View style={{ flexDirection: 'row', gap: spacing.x8 }}>
              <TouchableOpacity
                onPress={() => {
                  submitComment(content).catch(() => undefined);
                }}
              >
                <TickCircle color={primary} size={22} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (setEditingComment) setEditingComment(false);
                }}
              >
                <CloseCircle color={primary} size={22} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                submitComment(content).catch(() => undefined);
              }}
            >
              <StyledText style={{ color: primary, fontWeight: '700', fontSize: 14 }}>
                Post
              </StyledText>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {mediaGif && hasGif && canUseGiphy ? (
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
