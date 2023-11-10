import { RootState } from '@/src/Redux/reducers/rootReducer';
import { ApiCall } from '@/src/Services/api';
import Button from '@/src/components/Button';
import MapBox, { MapSuggestion } from '@/src/components/MapBox';
import { StyledText } from '@/src/components/styled/Text';
import { StyledTextInput } from '@/src/components/styled/TextInput';
import { MainStackParamList } from '@/src/navigator/types';
import { Colors, Spacing } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { Location } from '@/utils/types';
import { StackScreenProps } from '@react-navigation/stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import {
  ArrowDown2,
  CloseCircle,
  Gallery,
  Location as LocationIcon,
  Setting2,
  VideoPlay,
} from 'iconsax-react-native';
import { useTheme } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fontSize } from '@/src/styles/typography';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import ImagePickerModal from '@/src/components/ImagePickerModal';
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

type Props = StackScreenProps<MainStackParamList, 'Post'>;

const NewPost = ({ navigation }: Props) => {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [camera, setCamera] = useState(false);
  const token = useSelector((state: RootState) => state.auth.userToken);
  // console.log(token);
  const [location, setLocation] = useState<MapSuggestion | null>(null);
  const [locationSelector, setLocationSelector] = useState<boolean>(false);
  const [headerImagePickerModalVisibile, setHeaderImagePickerModalVisibile] = useState(false);
  const [pickerModalVisibile, setPickerModalVisibile] = useState(false);
  const [imagesToUpload, setImagesToUpload] = useState<Asset[]>([]);

  const [imagesObject, setImagesObject] =
    useState<{ uri: string; type: string; name?: string }[]>();

  const [headerImageObject, setHeaderImageObject] = useState<{
    uri: string;
    type: string;
    name: string;
  }>();

  const postSocial = async () => {
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: 'social/post',
        token: token,
        params: serialize(
          {
            content,
            images: imagesObject,
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
    } catch (e) {
      console.log(e);
      setIsLoading(false);
    }
  };

  const chooseImageGallery = async () => {
    let options: ImageLibraryOptions = {
      mediaType: 'photo',

      // noData: true,
      selectionLimit: 0.8,
    };
    const response = await launchImageLibrary(options);

    if (response.didCancel) {
      console.log('User cancelled camera picker');

      return;
    } else if (response.errorCode == 'camera_unavailable') {
      console.log('Camera not available on device');

      return;
    } else if (response.errorCode == 'permission') {
      console.log('Permission not satisfied');

      return;
    } else if (response.errorCode == 'others') {
      console.log(response.errorMessage);
      return;
    }

    if (response?.assets && response?.assets.length > 0) {
      setImagesToUpload(response?.assets);
      //   for (let i = 0; i < response?.assets?.length; i++) {

      //   }
    }
    setHeaderImagePickerModalVisibile(false);

    if (response?.assets && response?.assets.length > 0) {
      setImagesToUpload(response?.assets);
      setImagesObject(
        response?.assets.map((imagesObj) => {
          return {
            uri: imagesObj.uri ?? '',
            type: imagesObj.type ?? '',
            name: imagesObj?.fileName ?? '',
          };
        })
      );
    }

    // cropimage(uri ?? '', imageType);
  };

  const cropimage = async (uri: string, imageType: 'header' | 'photo') => {
    try {
      setTimeout(async () => {
        const image = await ImagePicker.openCropper({
          height: imageType == 'header' ? (Dimensions.get('screen').width * 9) / 16 : undefined,
          width: imageType == 'header' ? Dimensions.get('screen').width : undefined,
          mediaType: 'photo',
          cropperCircleOverlay: imageType == 'photo',
          path: uri,
          forceJpg: true,
          maxFiles: 1,
          compressImageMaxHeight: 150,
        });

        const MyObject = {
          uri: image?.path,
          type: image?.mime,
        };

        // setImagesToUpload(image?.path);
        // setImageObject({
        //   ...MyObject,
        //   name: 'profileImage' + user?._id,
        // });

        setPickerModalVisibile(false);
      }, 500);
    } catch (e) {
      console.log(e);
    }
  };

  const captureImage = async (contentType: MediaType) => {
    let options: CameraOptions = {
      mediaType: contentType,
      quality: 0.8,
      // noData: true,
    };
    // let isCameraPermitted = await requestCameraPermission();
    // let isStoragePermitted = await requestExternalWritePermission();
    // if (isCameraPermitted && isStoragePermitted) {
    const response = await launchCamera(options);

    console.log('Response = ', response);

    if (response.didCancel) {
      console.log('User cancelled camera picker');

      return;
    } else if (response.errorCode == 'camera_unavailable') {
      console.log('Camera not available on device');

      return;
    } else if (response.errorCode == 'permission') {
      console.log('Permission not satisfied');

      return;
    } else if (response.errorCode == 'others') {
      console.log(response.errorMessage);

      return;
    }
    // let uri = response?.assets?.at(0)?.uri ?? '';
    // let type = response?.assets?.at(0)?.type ?? '';
    // let name = response?.assets?.at(0)?.fileName ?? '';

    // setImageObject({ uri, type, name });
    // setImagesToUpload(uri);

    // cropimage(uri);

    // } else {
    //   console.log('no ', isCameraPermitted);
    // }

    if (response?.assets && response?.assets.length > 0) {
      setImagesToUpload(response?.assets);
      setImagesObject(
        response?.assets.map((imagesObj) => {
          return {
            uri: imagesObj.uri ?? '',
            type: imagesObj.type ?? '',
            name: imagesObj?.fileName ?? '',
          };
        })
      );
    }
    setHeaderImagePickerModalVisibile(false);
  };

  const { dark, colors } = useTheme();
  const device = useCameraDevice('back');

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
                    text={location?.place_name}
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
              style={{ height: 200, flexGrow: 1 }}
              inputStyle={{ color: 'red' }}
              inputWrapperStyle={{ paddingVertical: spacing.x10 }}
              value={content}
              multiline
              returnKeyType="done"
              label={''}
              autoCorrect
              placeholder="What's on your heart?"
              placeholderTextColor={Colors.neutral[300]}
              // onSubmitEditing={() => inputRefs.password?.current.focus()}
              onChangeText={(value) => {
                setContent(value);
              }}
            />
            {imagesToUpload.length > 0 ? (
              <ScrollView
                style={{ flexDirection: 'row', gap: spacing.x10, marginTop: spacing.x16 }}
                horizontal={true}
                alwaysBounceHorizontal={true}
                bounces={true}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                pagingEnabled={true}
              >
                {imagesToUpload.map((image, index) => {
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
                        resizeMode={'cover'}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            ) : null}

            <MapBox
              location={location}
              modalVisible={locationSelector}
              setModalVisible={setLocationSelector}
              setLocation={setLocation}
              modalTitle="Find Location"
            />

            <ImagePickerModal
              visible={headerImagePickerModalVisibile}
              hideVisible={() => setHeaderImagePickerModalVisibile(false)}
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
                  // setCamera(true);
                  setHeaderImagePickerModalVisibile(true);
                  // LoginManager.logOut();
                  // dispatch(logout());
                  // await auth().signOut();
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
            </View>
          </View>
        </ScrollView>
        <Button
          disabled={isLoading}
          onPress={() => {
            postSocial();
          }}
          btnStyle={[
            button.primary,
            {
              flex: 1,
            },
          ]}
          content={
            <>
              {isLoading ? (
                <ActivityIndicator />
              ) : (
                <StyledText style={{ color: 'white' }}>Post</StyledText>
              )}
            </>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default NewPost;
