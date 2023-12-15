import { Platform, TouchableOpacity, View, KeyboardEvent, Keyboard } from 'react-native';
import { StyledTextInput } from '../styled/TextInput';
import { Colors } from '@/src/styles';
import { CloseCircle, Send } from 'iconsax-react-native';
import { borderRadius } from '@/src/styles/outlines';
import { GiphyDialog, GiphyMedia, GiphyMediaView } from '@giphy/react-native-sdk';
import { spacing } from '@/src/styles/spacing';
import Button from '../Button';
import { useEffect, useState } from 'react';
import { useTheme } from '@react-navigation/native';

interface Props {
  mediaGif: GiphyMedia | null;
  setGif: React.Dispatch<React.SetStateAction<GiphyMedia | null>>;
  publishComment: Function;
}

const CommentField = ({ mediaGif, setGif, publishComment }: Props) => {
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [content, setContent] = useState('');

  const onKeyboardWillShow = (e: KeyboardEvent) => {
    setKeyboardHeight(e.endCoordinates.height);
  };

  const onKeyboardWillHide = () => {
    setKeyboardHeight(0);
  };

  useEffect(() => {
    // These listeners on ios are a little more snappy but not available on Android
    // If you want to use this on Android use keyboardDidShow/Hide
    if (Platform.OS === 'ios') {
      Keyboard.addListener('keyboardWillShow', onKeyboardWillShow);
      Keyboard.addListener('keyboardWillHide', onKeyboardWillHide);
    }

    return () => {
      if (Platform.OS === 'ios') {
        Keyboard.removeAllListeners('keyboardWillShow');
        Keyboard.removeAllListeners('keyboardWillHide');
      }
    };
  }, []);

  const submitComment = (content?: string) => {
    if (content || mediaGif) {
      publishComment(content ?? '');
      setContent('');
      setGif(null);
    }
  };

  const { dark } = useTheme();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? keyboardHeight : 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.x24,
        paddingVertical: spacing.x16,
        justifyContent: 'flex-end',
        backgroundColor: Colors.neutral[700],
      }}
    >
      <StyledTextInput
        placeholder="Drop your comment here"
        multiline
        maxLength={600}
        value={content}
        placeholderTextColor={Colors.neutral[300]}
        onChangeText={(content) => {
          setContent(content);
        }}
        onSubmitEditing={() => {
          submitComment(content);
        }}
        backgroundColor={'transparent'}
        inputWrapperStyle={{
          borderWidth: 0,

          paddingHorizontal: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        inputStyle={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 0,
          maxHeight: 80,
        }}
        leftIcon={
          <Button
            text="GIF"
            btnStyle={{
              backgroundColor: Colors.neutral[600],
              justifyContent: 'center',
              alignItems: 'center',

              paddingHorizontal: spacing.x16,
              margin: spacing.x5,
              borderRadius: borderRadius.base,
            }}
            onPress={() => {
              // LoginManager.logOut();
              // dispatch(logout());
              // await auth().signOut();
              try {
                GiphyDialog.show();
              } catch (e) {
                console.log(e);
              }
            }}
          />
        }
        rightIcon={
          <View style={{ justifyContent: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                submitComment(content);
              }}
            >
              <Send variant="Bold" color={Colors.primarySapphire.brand} />
            </TouchableOpacity>
          </View>
        }
      />
      {mediaGif && (
        <View
          style={{
            padding: 10,
            height: 100,
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
            <CloseCircle size="30" color="#fff" />
          </TouchableOpacity>
          <GiphyMediaView
            media={mediaGif}
            resizeMode="cover"
            style={{
              aspectRatio: mediaGif.aspectRatio,
              borderRadius: borderRadius.base,

              overflow: 'hidden',
            }}
          />
        </View>
      )}
    </View>
  );
};

export default CommentField;
