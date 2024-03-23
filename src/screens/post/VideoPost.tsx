import React, { useState } from 'react';
import Video from 'react-native-video';
import { useTheme } from '@react-navigation/native';
import {
  View,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
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

type Props = StackScreenProps<MainStackParamList, 'VideoPost'>;

function VideoPost({ navigation }: Props) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const { colors } = useTheme();
  const [VideoPath, setVideoPath] = useState<string | undefined>(undefined);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
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
        toast.show(
          'Watch created successfully. Video processing; will be public upon completion.',
          {
            id: 'successMessage',
            type: 'success',
            placement: 'bottom',
          }
        );
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
      console.error(error);
      setLoading(false);
    }
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { marginVertical: Platform.OS == 'ios' ? 50 : 0 }]}>
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
              <View style={{ flex: 1, alignItems: 'center', paddingTop: 50 }}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 30,
                    overflow: 'hidden',
                    aspectRatio: '9/16',
                    margin: 'auto',
                    marginTop: spacing.x30,
                  }}
                >
                  <Video
                    source={{ uri: VideoPath || '' }}
                    resizeMode="contain"
                    repeat
                    // controls
                    style={{ flex: 1 }}
                  />
                </View>
              </View>

              <KeyboardAvoidingView style={styles.bottomContainer}>
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
              </KeyboardAvoidingView>
            </SafeAreaView>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default VideoPost;
