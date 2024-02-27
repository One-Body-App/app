import { StackScreenProps } from '@react-navigation/stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { CloseCircle, Gallery, Location as LocationIcon, VideoPlay } from 'iconsax-react-native';
import { useTheme } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ImagePicker from 'react-native-image-crop-picker';
import {
  Asset,
  CameraOptions,
  ImageLibraryOptions,
  MediaType,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { serialize } from 'object-to-formdata';
import FastImage from 'react-native-fast-image';
import {
  GiphyDialog,
  type GiphyMedia,
  GiphyDialogMediaSelectEventHandler,
  GiphyDialogEvent,
  GiphyMediaView,
  GiphySDK,
  GiphyThemePreset,
} from '@giphy/react-native-sdk';
import { isArray, isEmpty } from 'lodash';
import { useToast } from 'react-native-toast-notifications';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import Button from '@/components/Button';
import MapBox, { MapSuggestion } from '@/components/MapBox';
import StyledText from '@/components/styled/Text';
import StyledTextInput from '@/components/styled/TextInput';
import { MainStackParamList } from '@/src/navigator/types';
import { Colors, Spacing } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { Location } from '@/utils/types';
import { fontSize } from '@/src/styles/typography';

import ImagePickerModal from '@/components/ImagePickerModal';
import { GIPHY_KEY_ANDROID, GIPHY_KEY_IOS } from '@/services/constants';
import { requestCameraPermission, requestExternalWritePermission } from '@/utils/ImageAndCamera';

GiphySDK.configure({
  apiKey: Platform.OS == 'ios' ? GIPHY_KEY_IOS : GIPHY_KEY_ANDROID,
});

type Props = StackScreenProps<MainStackParamList, 'Post'>;

function NewPost({ navigation, route }: Props) {
  const MAX_CONTENT_LENGHT = 300;
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = useSelector((state: RootState) => state.auth.userToken);

  const [location, setLocation] = useState<MapSuggestion | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationSelector, setLocationSelector] = useState<boolean>(false);
  const [pickerModalVisibile, setPickerModalVisibile] = useState(false);
  const [imagesToUpload, setImagesToUpload] = useState<Asset[]>([]);
  const { colors } = useTheme();
  const [imagesObject, setImagesObject] = useState<string[]>([]);
  const toast = useToast();
  const [uploadImagesObject, setUploadImagesObject] =
    useState<{ uri: string; type: string; name?: string }[]>();

  useEffect(() => {
    GiphyDialog.configure({ theme: GiphyThemePreset.Automatic });
  }, []);

  useEffect(() => {
    if (route.params?.postId) {
      getPostSocial();
    }
  }, [route.params?.postId]);

  const editSocial = async () => {
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: `social/post/${route.params?.postId}`,
        token,
        params: serialize(
          {
            content,
            images: imagesObject,
            gif: mediaGif,
            location: location
              ? {
                  coordinates: location?.geometry?.coordinates,
                  name: location?.place_name,
                }
              : undefined,
          },
          {
            noAttributesWithArrayNotation: true,
            noFilesWithArrayNotation: true,
          }
        ),
        verb: 'patch',
        isFormUrlEncode: true,
      });

      setIsLoading(false);

      if (result.status == 200) {
        setContent('');
        navigation.popToTop();
        navigation.navigate('MainRoot', {
          screen: 'Main',
          params: {
            screen: 'MyProfileTab',
          },
        });
      }
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
    }
  };

  const postSocial = async () => {
    setIsLoading(true);
    console.log(
      serialize(
        {
          content,
          images: uploadImagesObject,
          gif: mediaGif,
          location: location
            ? {
                coordinates: location?.geometry.coordinates,
                name: location?.place_name,
              }
            : undefined,
        },
        {
          noAttributesWithArrayNotation: true,
          noFilesWithArrayNotation: true,
        }
      ),
      'uploadImagesObject'
    );
    try {
      const result = await ApiCall({
        route: 'social/post',
        token,
        params: serialize(
          {
            content,
            images: uploadImagesObject,
            gif: mediaGif,
            location: location
              ? {
                  coordinates: location?.geometry.coordinates,
                  name: location?.place_name,
                }
              : undefined,
          },
          {
            noAttributesWithArrayNotation: true,
            noFilesWithArrayNotation: true,
          }
        ),
        verb: 'post',
        isFormUrlEncode: true,
      });

      setIsLoading(false);
      console.log(result);
      if (result.status === 200) {
        setContent('');
        navigation.popToTop();
        navigation.navigate('MainRoot', {
          screen: 'Main',
          params: {
            screen: 'MyProfileTab',
          },
        });
      } else {
        if (result?.response?.moderationPassed === false) {
          throw result.response;
        }

        throw new Error(result.response);
      }
    } catch (e: any) {
      setIsLoading(false);

      let message = 'There was a problem on our end. Please try again later.';
      if (e?.moderationPassed === false) {
        if (e.moderationTypeFailure == 'image') {
          message = 'Photo violates terms of use ';
        }

        if (e.moderationTypeFailure == 'text') {
          message =
            'This post was screened because it violates our Terms of Use. Please be courteous and thoughtful about what you post. Abuse or profane content is prohibited in the One Body community.';
        }
      } else if (e.message == 'Network Error') {
        message = 'Network Error. Please try again later.';
      }
      toast.show(message, {
        type: 'danger',
        placement: 'bottom',
      });
    }
  };

  const getPostSocial = async () => {
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: `social/post/${route.params?.postId}`,
        token,

        verb: 'get',
      });

      setIsLoading(false);

      if (result.status == 200) {
        setContent(result.response.content);
        if (result.response?.images?.length > 0) {
          setImagesObject(result.response?.images);
        }

        if (result.response?.gif) {
          setGif(result.response.gif);
        }

        if (!isEmpty(result.response?.location)) {
          setLocation(result.response?.location);
        }

        if (!isEmpty(result.response?.locationName)) {
          setLocationName(result.response?.locationName);
        }
      }
    } catch (e) {
      setIsLoading(false);
    }
  };

  const chooseImageGallery = async () => {
    const results = await ImagePicker.openPicker({
      multiple: true,
      compressImageQuality: 0.5,
    })
      .then(async (images) => {
        const result = [];

        // eslint-disable-next-line no-restricted-syntax
        for await (const image of images) {
          const img = await ImagePicker.openCropper({
            mediaType: 'photo',
            path: image.path,

            forceJpg: true,
            maxFiles: 1,
            compressImageQuality: 0.8,

            freeStyleCropEnabled: true,
            width: 1920,
            height: 1080,
            smartAlbums: ['UserLibrary', 'PhotoStream'],
          });
          result.push(img);
        }

        return result;
      })
      .catch(() => {
        return [];
      });

    if (results.length > 0) {
      const images = results.map((imagesObj, index) => {
        return {
          uri: `file://${imagesObj.path ?? ''}`,
          type: imagesObj.mime ?? '',
          name: imagesObj.filename ?? `image_${index}`,
        };
      });

      setImagesToUpload(images);
      setPickerModalVisibile(false);

      setUploadImagesObject(images);
    }
  };

  const captureImage = async (contentType: MediaType) => {
    const options: CameraOptions = {
      mediaType: contentType,
      quality: 0.8,
      // noData: true,
    };
    // let isCameraPermitted = await requestCameraPermission();
    const isStoragePermitted = await requestExternalWritePermission();
    if (isStoragePermitted) {
      const response = await launchCamera(options);

      if (response.didCancel) {
        console.log('User cancelled camera picker');

        return;
      }
      if (response.errorCode == 'camera_unavailable') {
        console.log('Camera not available on device');

        return;
      }
      if (response.errorCode == 'permission') {
        console.log('Permission not satisfied');

        return;
      }
      if (response.errorCode == 'others') {
        console.log(response.errorMessage);

        return;
      }
      // let uri = response?.assets?.at(0)?.uri ?? '';
      // let type = response?.assets?.at(0)?.type ?? '';
      // let name = response?.assets?.at(0)?.fileName ?? '';

      // setImageObject({ uri, type, name });
      // setImagesToUpload(uri);

      // cropimage(uri);

      if (response?.assets && response?.assets.length > 0) {
        setImagesToUpload(response?.assets);
        setUploadImagesObject(
          response?.assets.map((imagesObj) => {
            return {
              uri: imagesObj.uri ?? '',
              type: imagesObj.type ?? '',
              name: imagesObj?.fileName ?? '',
            };
          })
        );
      }
      setPickerModalVisibile(false);
    } else {
      // console.log('no ', isCameraPermitted);
    }
  };

  const [mediaGif, setGif] = useState<GiphyMedia | null>(null);

  // Handling GIFs selection in GiphyDialog
  useEffect(() => {
    const handler: GiphyDialogMediaSelectEventHandler = (e) => {
      setGif(e.media);
      GiphyDialog.hide();
    };
    const listener = GiphyDialog.addListener(GiphyDialogEvent.MediaSelected, handler);
    return () => {
      listener.remove();
    };
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        marginHorizontal: spacing.x24,
      }}
    >
      <KeyboardAvoidingView
        style={{
          paddingTop: spacing.x24,
          paddingBottom: spacing.x48,
          flex: 1,
          justifyContent: 'space-between',
        }}
        // style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={{ flex: 1 }}>
          <View>
            {location ? (
              <View
                style={{
                  marginVertical: spacing.x16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View>
                  <LocationIcon
                    color={Colors.primary.brand}
                    style={{ marginRight: spacing.x10 }}
                    size={24}
                  />
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flex: 1,
                  }}
                >
                  <Button
                    text={location?.place_name ?? locationName}
                    onPress={() => setLocationSelector(true)}
                    wrapperViewBtnStyle={{ flex: 1 }}
                  />
                  <Button
                    text=""
                    wrapperBtnStyle={{
                      marginLeft: spacing.x16,
                    }}
                    onPress={() => setLocation(null)}
                    rightIcon={
                      <MaterialCommunityIcons name="window-close" size={20} color={colors.text} />
                    }
                  />
                </View>
              </View>
            ) : null}

            <StyledTextInput
              inputStyle={{
                textAlignVertical: 'top',

                height: 200,
                flexGrow: 1,
                color: colors.text,
              }}
              inputWrapperStyle={{ paddingVertical: spacing.x10, borderRadius: borderRadius.base }}
              value={content}
              maxLength={MAX_CONTENT_LENGHT}
              maxLengthErrorMessage="This message exceeds the character limit."
              numberOfLines={4}
              showCharCounter
              multiline
              returnKeyType="default"
              label=""
              autoCorrect
              placeholder="What's on your heart?"
              placeholderTextColor={Colors.neutral[300]}
              // onSubmitEditing={() => inputRefs.password?.current.focus()}
              onChangeText={(value) => {
                setContent(value);
              }}
            />
            {imagesToUpload.length > 0 || imagesObject.length > 0 || mediaGif ? (
              <ScrollView
                style={{ flexDirection: 'row', gap: spacing.x10, marginTop: spacing.x16 }}
                horizontal
                alwaysBounceHorizontal
                bounces
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                pagingEnabled
              >
                {imagesToUpload &&
                  imagesToUpload.map((image, index) => {
                    return (
                      <View key={`${image.fileName}-${index}`} style={{ padding: 10 }}>
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
                            setImagesToUpload(
                              imagesToUpload.filter((item, filterIndex) => {
                                return filterIndex != index;
                              })
                            );
                          }}
                        >
                          <CloseCircle size="30" color="#fff" />
                        </TouchableOpacity>
                        <FastImage
                          style={{
                            height: 80,
                            width: 80,
                            borderRadius: borderRadius.base,
                          }}
                          source={{
                            uri: image.uri,
                          }}
                          resizeMode="cover"
                        />
                      </View>
                    );
                  })}

                {isArray(imagesObject) &&
                  imagesObject?.length > 0 &&
                  imagesObject?.map((image, index) => {
                    return (
                      <View key={`${image}-${index}`} style={{ padding: 10 }}>
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
                            setImagesObject(
                              imagesObject.filter((item, filterIndex) => {
                                return filterIndex != index;
                              })
                            );
                          }}
                        >
                          <CloseCircle size="30" color="#fff" />
                        </TouchableOpacity>
                        <FastImage
                          style={{
                            height: 80,
                            width: 80,
                            borderRadius: borderRadius.base,
                          }}
                          source={{
                            uri: image,
                          }}
                          resizeMode="cover"
                        />
                      </View>
                    );
                  })}

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
              </ScrollView>
            ) : null}

            <MapBox
              location={location}
              modalVisible={locationSelector}
              setModalVisible={setLocationSelector}
              setLocation={setLocation}
              modalTitle={
                <StyledText style={{ fontSize: 18, color: Colors.primary.brand }}>
                  In what{' '}
                  <StyledText
                    style={{ fontSize: 18, color: Colors.primary.brand, fontWeight: 'bold' }}
                  >
                    city
                  </StyledText>{' '}
                  are you located?
                </StyledText>
              }
            />

            <ImagePickerModal
              visible={pickerModalVisibile}
              hideVisible={() => setPickerModalVisibile(false)}
              galleryImage={() => chooseImageGallery()}
              cameraImage={() => captureImage('photo')}
            />

            <View
              style={{
                columnGap: spacing.x10,
                flexDirection: 'row',

                paddingVertical: spacing.x16,
              }}
            >
              <Button
                text="Photo"
                btnTextStyle={[fontSize.x3, { marginTop: spacing.x10 }]}
                btnStyle={{
                  backgroundColor: Colors.neutral[700],
                  padding: spacing.x16,
                  borderRadius: borderRadius.base,
                  flex: 1,
                }}
                wrapperViewBtnStyle={{ flex: 1 }}
                wrapperBtnStyle={{
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                leftIcon={<Gallery color={Colors.primary.brand} size={32} />}
                onPress={async () => {
                  setPickerModalVisibile(true);
                }}
              />
              {/* <Button
            text="Video"
            wrapperViewBtnStyle={{ flex: 1 }}
            btnTextStyle={[fontSize.x3, { marginTop: spacing.x10 }]}
            btnStyle={{
              backgroundColor: Colors.neutral[700],
              flex: 1,
              padding: spacing.x16,
              borderRadius: borderRadius.base,
            }}
            wrapperBtnStyle={{ flexDirection: 'column' }}
            leftIcon={<VideoPlay color={Colors.primary.brand} size={32} />}
            onPress={async () => {
              // LoginManager.logOut();
              // dispatch(logout());
              // await auth().signOut();
            }}
          /> */}
              <Button
                text="Location"
                wrapperViewBtnStyle={{ flex: 1 }}
                btnTextStyle={[fontSize.x3, { marginTop: spacing.x10 }]}
                btnStyle={{
                  backgroundColor: Colors.neutral[700],
                  flex: 1,
                  padding: spacing.x16,
                  borderRadius: borderRadius.base,
                }}
                wrapperBtnStyle={{ flexDirection: 'column' }}
                leftIcon={<LocationIcon color={Colors.primary.brand} size={32} />}
                onPress={() => {
                  // navigation.navigate('Settings');
                  setLocationSelector(true);
                }}
              />
              <Button
                text="GIF"
                wrapperViewBtnStyle={{ flex: 1 }}
                btnTextStyle={[fontSize.x3, { marginTop: spacing.x10 }]}
                btnStyle={{
                  backgroundColor: Colors.neutral[700],
                  flex: 1,
                  padding: spacing.x16,
                  borderRadius: borderRadius.base,
                }}
                wrapperBtnStyle={{ flexDirection: 'column' }}
                leftIcon={<VideoPlay color={Colors.primary.brand} size={32} />}
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
            </View>
          </View>
          {/* <View
            style={{
              columnGap: spacing.x10,
              flexDirection: 'row',
              paddingVertical: spacing.x16,
            }}
          >
            <Button
              text="Video"
              wrapperViewBtnStyle={{ flex: 1 / 3.2 }}
              btnTextStyle={[fontSize.x3, { marginTop: spacing.x10 }]}
              btnStyle={{
                backgroundColor: Colors.neutral[700],
                flex: 1,
                padding: spacing.x16,
                borderRadius: borderRadius.base,
              }}
              wrapperBtnStyle={{ flexDirection: 'column' }}
              leftIcon={<VideoPlay color={Colors.primary.brand} size={32} />}
              onPress={async () => {
                navigation.navigate('VideoPost');
              }}
            />
          </View> */}
        </ScrollView>

        <Button
          disabled={
            isLoading ||
            (!location &&
              !content &&
              !uploadImagesObject &&
              imagesObject.length == 0 &&
              !mediaGif) ||
            (!!content && content.length > MAX_CONTENT_LENGHT)
          }
          onPress={() => {
            if (route.params?.postId) {
              editSocial();
            } else {
              postSocial();
            }
          }}
          btnStyle={[
            button.primary,
            {
              flex: 1,
            },
          ]}
          disabledBtnStyle={[button.primary, { flex: 1, opacity: 0.5 }]}
          disabledBtnTextStyle={{}}
          content={
            // eslint-disable-next-line react/jsx-no-useless-fragment
            <>
              {isLoading ? (
                <ActivityIndicator />
              ) : (
                <StyledText style={{ color: 'white' }}>
                  {route.params?.postId ? 'Update Post' : 'Post'}
                </StyledText>
              )}
            </>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default NewPost;
