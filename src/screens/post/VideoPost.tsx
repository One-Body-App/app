import React, { useState } from 'react';
// . import Video from 'react-native-video';
import { useTheme } from '@react-navigation/native';
import {
  View,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import RNFetchBlob from 'rn-fetch-blob';
import { useToast } from 'react-native-toast-notifications';
import { RootState } from '@/src/redux/reducers/rootReducer';
import StyledText from '@/src/components/styled/Text';
import { borderRadius } from '@/src/styles/outlines';
import StyledTextInput from '@/src/components/styled/TextInput';
import { Colors } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import Button from '@/src/components/Button';
import styles from './styles';
import { ApiCall } from '@/src/services/api';
import { MainStackParamList } from '@/src/navigator/types';
import CameraComponent from '@/src/components/VideoPost/Camera';
import { spacing } from '@/src/styles/spacing';
import CustomVideo from '@/src/components/CustomVideo';

type Props = StackScreenProps<MainStackParamList, 'VideoPost'>;

function VideoPost({ navigation }: Props) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const { colors } = useTheme();
  const [VideoPath, setVideoPath] = useState<string | undefined>(undefined);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [playedTimes, setPlayedTimes] = useState<number>(1);

  const toast = useToast();

  const uploadToMux = async () => {
    setLoading(true);
    try {
      // 1. Fetch the authenticated link from the server
      const muxLink = await ApiCall({
        route: `watch/authenticated-link/mux`,
        verb: 'get',
        token,
      });
      // 2. Get Video to Blob

      if (Platform.OS == 'ios') {
        const iosResponse = await fetch(VideoPath!, {
          method: 'GET',
        });
        const blob = await iosResponse.blob();

        await fetch(muxLink.response?.url, {
          method: 'PUT',
          body: blob,
          headers: { 'content-type': blob.type },
        });
      } else {
        const data = RNFetchBlob.wrap(VideoPath!);
        await RNFetchBlob.fetch('PUT', muxLink.response?.url, undefined, data);
      }

      const res = await ApiCall({
        route: `watch/post`,
        verb: 'post',
        params: {
          content,
          uploadId: muxLink.response.id,
        },
        token,
      });
      if (res.status == 200) {
        toast.show('Your post is being processed. It will be public shortly!', {
          id: 'successMessage',
          type: 'success',
          placement: 'bottom',
        });
        navigation.navigate('MainRoot', {
          screen: 'Main',
          params: {
            screen: 'HomeTab',
            params: {
              screen: 'WatchPortal',
            },
          },
        });
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  console.log('VideoPath', VideoPath, !VideoPath);
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAwareScrollView contentContainerStyle={[styles.container]}>
        <View style={styles.subContainer}>
          {!VideoPath ? (
            <CameraComponent setVideoPath={setVideoPath} />
          ) : (
            <SafeAreaView
              style={{
                flex: 1,

                paddingTop: spacing.x10,
              }}
            >
              <View style={{ flex: 3, alignItems: 'center' }}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 30,
                    overflow: 'hidden',
                    aspectRatio: '9/16',
                    margin: 'auto',
                  }}
                >
                  <CustomVideo
                    source={{
                      uri:
                        'file:///data/user/0/com.onebody/cache/mrousavy6691347555245248709.mov' ||
                        '',
                    }}
                    resizeMode="contain"
                    paused={playedTimes >= 3}
                    controls
                    style={{ flex: 1 }}
                    onEnd={() => {
                      setPlayedTimes(playedTimes + 1);
                    }}
                  />
                </View>
              </View>

              <View style={styles.bottomContainer}>
                <StyledTextInput
                  style={{ height: 100, flexGrow: 1, color: colors.text }}
                  inputStyle={{}}
                  inputWrapperStyle={{
                    paddingVertical: spacing.x10,
                    borderRadius: borderRadius.base,
                  }}
                  value={content}
                  multiline
                  returnKeyType="done"
                  label=""
                  autoCorrect
                  placeholder="What's on your heart?"
                  placeholderTextColor={Colors.neutral[300]}
                  onChangeText={(value) => {
                    setContent(value);
                  }}
                />
                <Button
                  disabled={false}
                  onPress={uploadToMux}
                  btnStyle={[button.primary, { flex: 1, marginTop: 20 }]}
                  disabledBtnStyle={[button.primary, { flex: 1, opacity: 0.5 }]}
                  disabledBtnTextStyle={{}}
                  content={
                    // eslint-disable-next-line react/jsx-no-useless-fragment
                    <>
                      {loading ? (
                        <ActivityIndicator />
                      ) : (
                        <StyledText style={{ color: 'white' }}>Post</StyledText>
                      )}
                    </>
                  }
                />
              </View>
            </SafeAreaView>
          )}
        </View>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
}

export default VideoPost;
