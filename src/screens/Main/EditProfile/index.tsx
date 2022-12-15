import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, ScrollView, FlatList } from 'react-native';
import { Divider, Provider, TextInput } from 'react-native-paper';
import Modal from 'react-native-modal';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '@/components/Button';

import {
  CameraOptions,
  launchCamera,
  launchImageLibrary,
  MediaType,
} from 'react-native-image-picker';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import { profileUpdate } from '@/redux/actions/AuthActions';
import ImagePickerModal from '@/components/ImagePickerModal';
import { setLoader } from '@/redux/actions/GeneralActions';
import FastImage from 'react-native-fast-image';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import Twitter from '@/assets/svg/Twitter.svg';
import Blog from '@/assets/svg/Blog.svg';
import Instagram from '@/assets/svg/Instagram.svg';
import { ApiCall } from '@/services/api';
import ImagePicker from 'react-native-image-crop-picker';
import GradientButton from '@/components/GradientButton';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { RootStackParamList } from '@/src/Navigation/types';
import { StackScreenProps } from '@react-navigation/stack';
import { WhatIDo } from '@/utils/types';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getuserGet, getUserProfile } from '@/src/Redux/actions/UserAction';

type Props = StackScreenProps<RootStackParamList, 'EditProfile'>;

const EditProfile = ({ navigation }: Props) => {
  const user = useSelector((state: RootState) => state.auth.userProfile);
  const { dark, colors } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [gender, setGender] = useState(user?.gender);
  const [pickerModalVisibile, setPickerModalVisibile] = useState(false);
  const [imageToUpload, setImageToUpload] = useState('');
  const [imageObject, setImageObject] = useState<{ uri: string; type: string; name: string }>();
  const [multipleImages, setMultipleImages] = useState();
  const [fullname, setFullName] = useState<string>(user?.name ?? '');
  const [username, setUsername] = useState<string>(user?.username ?? '');
  const [website, setWebsite] = useState<string>(user?.website ?? '');
  const [bio, setBio] = useState<string>(user?.bio ?? '');
  const [whatIDo, setWhatIDo] = useState<WhatIDo | null>(user?.whatIDo ? user?.whatIDo : null);

  const [whatIDoList, setWhatIDoList] = useState<WhatIDo[]>([]);
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();

  const captureImage = async (contentType: MediaType) => {
    let options: CameraOptions = {
      mediaType: contentType,
      quality: 1,
      // noData: true,
      videoQuality: 'low',
      durationLimit: 30,
    };
    // let isCameraPermitted = await requestCameraPermission();
    // let isStoragePermitted = await requestExternalWritePermission();
    // if (isCameraPermitted && isStoragePermitted) {
    launchCamera(options, (response) => {
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
      let uri = response?.assets?.at(0)?.uri ?? '';
      let type = response?.assets?.at(0)?.type ?? '';
      let name = response?.assets?.at(0)?.fileName ?? '';

      setImageObject({ uri, type, name });
      setImageToUpload(uri);
      setTimeout(function () {
        cropimage(uri);
        dispatch(setLoader(false));
      }, 3000);
    });
    // } else {
    //   console.log('no ', isCameraPermitted);
    // }
  };
  const getWhatIDo = async () => {
    try {
      const res = await ApiCall({
        route: 'user/what-I-do',
        token: token,
        verb: 'get',
      });
      if (res?.status == 200) {
        setWhatIDoList(res?.response.data);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error on what i Do -- ', e.toString());
    }
  };

  const chooseImageGallery = () => {
    let options: CameraOptions = {
      mediaType: 'mixed',
      quality: 1,
      // noData: true,
      // selectionLimit: 1,
    };
    launchImageLibrary(options, (response) => {
      dispatch(setLoader(true));

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
      let uri = response?.assets ? response?.assets[0]?.uri : '';
      let type = response?.assets ? response?.assets[0]?.type : '';
      let name = response?.assets ? response?.assets[0]?.fileName : '';
      setImageObject({ uri: uri ?? '', type: type ?? '', name: name ?? '' });
      setImageToUpload(uri ?? '');
      setTimeout(function () {
        cropimage(uri ?? '');
        dispatch(setLoader(false));
      }, 3000);
    });
  };

  const cropimage = (uri: string) => {
    ImagePicker.openCropper({
      mediaType: 'photo',
      path: uri,
    }).then((image) => {
      setImageToUpload(image?.path);
      const MyObject = {
        uri: image?.path,
        type: image?.mime,
        name: 'profileImage' + user?._id,
      };
      setImageObject(MyObject);
      setPickerModalVisibile(false);
    });
  };
  const go = () => {
    navigation.goBack();
  };

  useEffect(() => {
    getWhatIDo();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flexDirection: 'row', paddingVertical: 10 }}>
        <View style={{ flex: 1 }}>
          <Button
            onPress={() => navigation.goBack()}
            text=""
            leftIcon={<Icon name="chevron-back" size={20} color={'#032f3c'} />}
            btnStyle={{ flex: 1 }}
            wrapperBtnStyle={{ justifyContent: 'flex-start', paddingLeft: 10, paddingVertical: 10 }}
          />
        </View>
        <View style={{ flex: 4, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.titletext}>Edit Profile</Text>
        </View>
        <View style={{ flex: 1 }} />
      </View>

      <ImagePickerModal
        visible={pickerModalVisibile}
        hideVisible={() => setPickerModalVisibile(false)}
        galleryImage={() => chooseImageGallery()}
        cameraImage={() => captureImage('photo')}
      />
      <Modal
        backdropOpacity={0.3}
        isVisible={visible}
        onBackdropPress={() => setVisible(false)}
        onSwipeComplete={() => setVisible(false)}
        swipeDirection={['down']}
        style={styles.bottomView}
        avoidKeyboard={true}
        propagateSwipe
      >
        <View style={styles.content2}>
          <View style={styles.headLine} />
          <View style={styles.container}>
            <FlatList
              data={whatIDoList}
              keyExtractor={(item, index) => index.toString()}
              ListHeaderComponent={() => <View style={{ height: getHeight(2) }} />}
              ItemSeparatorComponent={() => <Divider />}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => {
                    setWhatIDo(item);

                    setVisible(false);
                  }}
                  style={styles.listItem}
                >
                  <Text
                    style={{
                      color: '#81979E',
                      fontSize: getFontSize(2.2),
                      fontFamily: 'Rubik-Regular',
                    }}
                    numberOfLines={1}
                  >
                    {item?.whatIDo}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      <ScrollView>
        <View style={styles.topContainer}>
          <TouchableOpacity
            onPress={() => setPickerModalVisibile(true)}
            style={styles.imageContainer}
          >
            {/* <Avatar.Image
                size={getFontSize(14)}
                resizeMode={'stretch'}
                source={
                  imageToUpload
                    ? {uri: imageToUpload}
                    : {uri: user?.profileImage}
                }
              /> */}
            <View
              style={{
                flexDirection: 'row',
                width: '50%',
                justifyContent: 'center',
                alignContent: 'center',
              }}
            >
              <FastImage
                style={{ width: 90, height: 90, borderRadius: 45 }}
                source={
                  imageToUpload
                    ? { uri: imageToUpload }
                    : {
                        uri: user?.profileImage || 'https://cdn.onebodyapp.com/user/no-image.png',
                      }
                }
                resizeMode={FastImage.resizeMode.stretch}
              />
              <Text
                style={{
                  color: '#757575',
                  fontSize: 12,
                  // marginTop: getHeight(1),
                  fontFamily: 'Rubik-Regular',
                  textAlign: 'center',
                  width: '40%',
                  alignSelf: 'center',
                }}
              >
                Change Photo
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.InputsContainer}>
            <TextInput
              style={styles.TextInput}
              onChangeText={(e) => setUsername(e)}
              value={username}
              label="Username"
              activeOutlineColor={'#12D2D9'}
              activeUnderlineColor={'#12D2D9'}
              placeholder="username"
              theme={{ roundness: 10 }}
            />

            <TextInput
              style={styles.TextInput}
              onChangeText={(e) => setFullName(e)}
              value={fullname}
              label="Name"
              activeOutlineColor={'#12D2D9'}
              activeUnderlineColor={'#12D2D9'}
              placeholder="Name"
              theme={{ roundness: 10 }}
            />

            <TextInput
              style={styles.TextInput}
              label="Account type"
              value={user?.role == 'individual' ? 'Individual' : 'Organization'}
              editable={false}
              // placeholderTextColor={'red'}
            />
            <View>
              {user?.role == 'individual' ? (
                <TextInput
                  style={styles.TextInput}
                  value={whatIDo?.whatIDo ? whatIDo?.whatIDo : ''}
                  editable={false}
                  label="What I do"
                  onPressIn={() => {
                    getWhatIDo();
                    setVisible(true);
                  }}
                  activeOutlineColor={'#12D2D9'}
                  activeUnderlineColor={'#12D2D9'}
                  // onChangeText={e => setWhatIDo(e)}
                />
              ) : (
                <>
                  <TextInput
                    style={styles.TextInput}
                    value={whatIDo?.whatIDo ? whatIDo?.whatIDo : ''}
                    editable={false}
                    label="Who We Are?"
                    onPressIn={() => {
                      getWhatIDo();
                      setVisible(true);
                    }}
                    activeOutlineColor={'#12D2D9'}
                    activeUnderlineColor={'#12D2D9'}
                    // onChangeText={e => setWhatIDo(e)}
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingVertical: 10,
                    }}
                  >
                    <TextInput
                      multiline={true}
                      numberOfLines={5}
                      label="Bio"
                      value={user?.bio}
                      returnKeyType={'next'}
                      mode="outlined"
                      activeOutlineColor={'#12D2D9'}
                      activeUnderlineColor={'#12D2D9'}
                      outlineColor={colors.border}
                      maxLength={150}
                      style={{
                        flex: 4,
                      }}
                      theme={{
                        dark: dark,
                        colors: {
                          text: colors.text,
                          placeholder: colors.primary,
                          background: colors.background,
                        },
                      }}
                      onChangeText={(e) => setBio(e)}
                      blurOnSubmit={false}
                    />
                    <Text style={{ flex: 1, textAlign: 'center' }}>{bio.length}/150</Text>
                  </View>
                </>
              )}
              <TextInput
                style={styles.TextInput}
                value={website}
                label="Website"
                keyboardType="url"
                autoCorrect={false}
                autoCapitalize="none"
                placeholder="https://www.website.com"
                activeOutlineColor={'#12D2D9'}
                activeUnderlineColor={'#12D2D9'}
                onChangeText={(e) => setWebsite(e)}
              />
            </View>
          </View>
        </View>
        <View style={styles.bottomContainer}>
          {/* {user?.isInfluencer == true ? (
              <View style={{ ...styles.center, marginTop: getHeight(2) }}>
                <Text style={styles.SocialText}>Link Social Media Account</Text>
                <View style={styles.socialIcon}>
                  <Instagram />
                  <Blog />
                  <Twitter />
                </View>
              </View>
            ) : null} */}
          <View style={{ marginHorizontal: 25 }}>
            <GradientButton
              text={'DONE'}
              onPress={() => {
                const data = new FormData();
                console.log(
                  fullname,
                  gender,
                  whatIDo,
                  website,
                  imageObject,
                  'fullname, gender, whatIDo, website, imageObject'
                );
                if (fullname) data.append('name', fullname);
                if (gender) data.append('gender', gender);
                if (whatIDo) data.append('whatIDo', whatIDo?._id);
                if (website) data.append('website', website);
                if (imageObject) data.append('photo', imageObject);
                if (bio) data.append('bio', bio);

                dispatch(setLoader(true));

                if (user?.role == 'individual') {
                  dispatch(profileUpdate({ data, token, role: 'individual', go }));
                } else {
                  dispatch(profileUpdate({ data, token, role: 'organization', go }));
                }
              }}
              btnStyle={{
                ...GeneralStyle.btn,
                height: getHeight(7),

                backgroundColor: '#0C5C75',
              }}
              btnTextStyle={GeneralStyle.btnText}
            />

            <Button
              text={'Cancel'}
              btnStyle={{
                ...GeneralStyle.btn,
                backgroundColor: 'white',
                marginTop: getHeight(2),
              }}
              onPress={() => navigation.goBack()}
              btnTextStyle={{ ...GeneralStyle.btnText, color: '#707470' }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default EditProfile;
