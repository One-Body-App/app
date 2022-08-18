import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, ScrollView, FlatList } from 'react-native';
import { Divider, Provider, TextInput } from 'react-native-paper';
import Modal from 'react-native-modal';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '@/components/Button';

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
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

const EditProfile = ({ navigation }) => {
  const user = useSelector((state) => state.auth.userData);
  const token = useSelector((state) => state.auth.userToken);
  const [gender, setGender] = useState(user?.gender);
  const [pickerModalVisibile, setPickerModalVisibile] = useState(false);
  const [imageToUpload, setImageToUpload] = useState('');
  const [imageObject, setImageObject] = useState();
  const [multipleImages, setMultipleImages] = useState();
  const [fullname, setFullName] = useState(user?.name);
  const [website, setWebsite] = useState(user?.website);
  const [whatIDo, setWhatIDo] = useState(user?.whatIDo[0]);

  const [whatIDoList, setWhatIDoList] = useState([]);
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();

  const captureImage = async (contentType) => {
    let options = {
      mediaType: contentType,
      quality: 1,
      noData: true,
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
      let uri = response?.assets[0]?.uri;
      let type = response?.assets[0]?.type;
      let name = response?.assets[0]?.fileName;
      const MyObject = { uri, type, name };
      setImageObject(MyObject);
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
      if (res?.status == '200') {
        setWhatIDoList(res?.data);
      } else {
        console.log('error', res?.data);
      }
    } catch (e) {
      console.log('saga error on what i Do -- ', e.toString());
    }
  };

  const chooseImageGallery = () => {
    let options = {
      mediaType: 'mixed',
      quality: 1,
      noData: true,
      selectionLimit: 1,
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
      let uri = response?.assets[0]?.uri;
      let type = response?.assets[0]?.type;
      let name = response?.assets[0]?.fileName;
      const MyObject = { uri, type, name };
      setImageObject(MyObject);
      setImageToUpload(uri);
      setTimeout(function () {
        cropimage(uri);
        dispatch(setLoader(false));
      }, 3000);
    });
  };

  const cropimage = (uri) => {
    ImagePicker.openCropper({
      path: { uri },
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
    <Provider>
      <SafeAreaView style={styles.container}>
        <View style={styles.headview}>
          <Text style={styles.titletext}>Edit Profile</Text>
        </View>
        <ImagePickerModal
          visible={pickerModalVisibile}
          hideVisible={() => setPickerModalVisibile(false)}
          galleryImage={() => chooseImageGallery()}
          cameraImage={() => captureImage('image')}
        />
        <Modal
          backdropOpacity={0.3}
          isVisible={visible}
          onBackdropPress={() => setVisible(false)}
          onSwipeComplete={() => setVisible(false)}
          swipeDirection={['down']}
          style={styles.bottomView}
          onRequestClose={() => hideVisible(false)}
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
              <FastImage
                style={{ width: 90, height: 90, borderRadius: 45 }}
                source={imageToUpload ? { uri: imageToUpload } : { uri: user?.profileImage }}
                resizeMode={FastImage.resizeMode.stretch}
              />
              <Text
                style={{
                  color: '#757575',
                  fontSize: 12,
                  marginTop: getHeight(1),
                  fontFamily: 'Rubik-Regular',
                  textAlign: 'center',
                  width: '50%',
                }}
              >
                Change Photo
              </Text>
            </TouchableOpacity>
            <View style={styles.InputsContainer}>
              <TextInput
                style={styles.TextInput}
                onChangeText={(e) => setFullName(e)}
                value={fullname}
                label="Full Name"
                activeOutlineColor={'#12D2D9'}
                activeUnderlineColor={'#12D2D9'}
                placeholder="Full Name"
                theme={{ roundness: 10 }}
              />

              <TextInput
                style={styles.TextInput}
                label="Account type"
                value={user?.role}
                editable={false}
                // placeholderTextColor={'red'}
              />
              {/* {user?.role != 'individual' ? ( */}
              <View>
                <TextInput
                  style={styles.TextInput}
                  value={whatIDo?.whatIDo ? whatIDo?.whatIDo : whatIDo}
                  editable={false}
                  label="What i do"
                  onPressIn={() => {
                    getWhatIDo();
                    setVisible(true);
                  }}
                  activeOutlineColor={'#12D2D9'}
                  activeUnderlineColor={'#12D2D9'}
                  // onChangeText={e => setWhatIDo(e)}
                />

                <TextInput
                  style={styles.TextInput}
                  value={website}
                  label="Website"
                  keyboardType="url"
                  placeholder="https://www.demo.com"
                  activeOutlineColor={'#12D2D9'}
                  activeUnderlineColor={'#12D2D9'}
                  onChangeText={(e) => setWebsite(e)}
                />
              </View>
              {/* // ) : null} */}
            </View>
          </View>
          <View style={styles.bottomContainer}>
            {user?.isInfluencer == true ? (
              <View style={{ ...styles.center, marginTop: getHeight(2) }}>
                <Text style={styles.SocialText}>Link Social Media Account</Text>
                <View style={styles.socialIcon}>
                  <Instagram />
                  <Blog />
                  <Twitter />
                </View>
              </View>
            ) : null}
            <View>
              {user?.role == 'individual' ? (
                <GradientButton
                  text={'DONE'}
                  onPress={() => {
                    const data = new FormData();
                    data.append('name', fullname);
                    data.append('gender', gender);
                    data.append('whatIDo', whatIDo?._id);
                    data.append('website', website);
                    data.append('photo', imageObject);
                    dispatch(setLoader(true));
                    dispatch(profileUpdate({ data, token, role: 'individual', go }));
                  }}
                  btnStyle={{
                    ...GeneralStyle.btn,
                    height: getHeight(7),
                    width: getWidth(80),
                    backgroundColor: '#0C5C75',
                  }}
                  btnTextStyle={GeneralStyle.btnText}
                />
              ) : (
                <GradientButton
                  text={'DONE'}
                  onPress={() => {
                    const data = new FormData();
                    data.append('name', fullname);
                    data.append('gender', gender);
                    data.append('whatIDo', whatIDo?._id);
                    data.append('website', website);
                    data.append('photo', imageObject);
                    dispatch(setLoader(true));
                    dispatch(profileUpdate({ data, token, role: 'organization', go }));
                  }}
                  btnStyle={{
                    ...GeneralStyle.btn,
                    height: getHeight(7),
                    width: getWidth(80),
                    backgroundColor: '#0C5C75',
                  }}
                  btnTextStyle={GeneralStyle.btnText}
                />
              )}
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
    </Provider>
  );
};
export default EditProfile;
