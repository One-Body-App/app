import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, SafeAreaView, ScrollView, FlatList } from 'react-native';
import { Divider, Provider, TextInput, Text } from 'react-native-paper';
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
import { ChurchType, Location, Tag } from '@/utils/types';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getuserGet, getUserProfile } from '@/src/Redux/actions/UserAction';
import DatePicker from 'react-native-date-picker';
import { format, parse } from 'date-fns';
import MapBox, { MapSuggestion } from '@/src/Components/MapBox';

type Props = StackScreenProps<RootStackParamList, 'EditProfile'>;

const EditProfile = ({ navigation }: Props) => {
  const user = useSelector((state: RootState) => state.auth.userProfile);
  const { dark, colors } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [gender, setGender] = useState(user?.gender);
  const [pickerModalVisibile, setPickerModalVisibile] = useState(false);
  const [imageToUpload, setImageToUpload] = useState('');
  const [imageObject, setImageObject] = useState<{ uri: string; type: string; name: string }>();

  const [fullname, setFullName] = useState<string>(user?.name ?? '');
  const [username, setUsername] = useState<string>(user?.username ?? '');
  const [website, setWebsite] = useState<string>(user?.website ?? '');
  const [bio, setBio] = useState<string>(user?.bio ?? '');
  const [whatIDo, setWhatIDo] = useState<Tag | null>(user?.whatIDo ? user?.whatIDo : null);
  const [organizationType, setOrganizationType] = useState<Tag | null>(
    user?.typeOfOrganization ? user?.typeOfOrganization : null
  );

  const [whatIDoList, setWhatIDoList] = useState<Tag[]>([]);
  const [organizationTypes, setOrganizationTypes] = useState<Tag[]>([]);
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const [date, setDate] = useState<string>(user?.profile?.dateOfBirth ?? '');
  const [open, setOpen] = useState(false);

  const [oftenChurchVisible, setOftenChurchVisible] = useState(false);
  const [oftenChurch, setOftenChurch] = useState(user?.profile?.oftenChurch ?? '');

  const [churchTypeModalVisible, setChurchTypeModalVisible] = useState(false);
  const [churchSubTypeModalVisible, setChurchSubTypeModalVisible] = useState(false);
  const [churchSubType, setSubChurchType] = useState<string>(user?.profile?.churchSubType ?? '');
  const [churchTypes, setChurchTypes] = useState<ChurchType[]>([]);
  const [churchType, setChurchType] = useState<string>(user?.profile?.churchType ?? '');
  const [citySelector, setCitySelector] = useState<boolean>(false);
  const [location, setLocation] = useState<Location | null>(user?.profile.location ?? null);
  const [newLocation, setNewLocation] = useState<MapSuggestion | null>(null);
  const [longitude, setLongitude] = useState<number>();
  const [latitude, setLatitude] = useState<number>();

  const oftenChurchOptions = ['Weekly', 'Bi-Weekly', 'Once a month', 'I only watch at home'];

  useEffect(() => {
    if (newLocation) {
      setLocation({
        longitude,
        latitude,
        address: newLocation.place_name,
      });
    }
  }, [newLocation]);
  const getChurchTypes = async () => {
    try {
      const res = await ApiCall({
        route: 'global/church-type',
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        setChurchTypes(res?.response);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

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
        route: 'tags/professions',
        token: token,
        verb: 'get',
      });
      if (res?.status == 200) {
        setWhatIDoList(res?.response);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error on what i Do -- ', e.toString());
    }
  };

  const getOrganizationTypes = async () => {
    try {
      const res = await ApiCall({
        route: 'tags/organization-types',
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        setOrganizationTypes(res?.response);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
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
    if (user) {
      if (user?.accountType == 'individual') {
        getWhatIDo();
      } else {
        getOrganizationTypes();
      }
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      getChurchTypes();
    }
  }, [token]);

  const selectedChurchType = churchTypes.filter((type) => type.churchType == churchType);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flexDirection: 'row', paddingVertical: 10 }}>
        <View style={{ flex: 1 }}>
          <Button
            onPress={() => navigation.goBack()}
            mode="text"
            paper
            content={<Icon name="chevron-back" size={20} color={colors.text} />}
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
            {user?.accountType == 'individual' ? (
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
                      {item?.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <FlatList
                data={organizationTypes}
                keyExtractor={(item, index) => index.toString()}
                ListHeaderComponent={() => <View style={{ height: getHeight(2) }} />}
                ItemSeparatorComponent={() => <Divider />}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setOrganizationType(item);

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
                      {item?.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
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
              style={{ backgroundColor: colors.background }}
              onChangeText={(e) => setUsername(e)}
              value={username}
              label="Username"
              activeOutlineColor={'#12D2D9'}
              activeUnderlineColor={'#12D2D9'}
              placeholder="username"
              theme={{ roundness: 10 }}
            />

            <TextInput
              style={{ backgroundColor: colors.background }}
              onChangeText={(e) => setFullName(e)}
              value={fullname}
              label="Name"
              activeOutlineColor={'#12D2D9'}
              activeUnderlineColor={'#12D2D9'}
              placeholder="Name"
              theme={{ roundness: 10 }}
            />

            <TextInput
              style={{ backgroundColor: colors.background }}
              label="Account type"
              value={user?.accountType == 'individual' ? 'Individual' : 'Organization'}
              editable={false}
              theme={{ roundness: 10 }}
              // placeholderTextColor={'red'}
            />

            {user?.accountType == 'individual' ? (
              <>
                <TextInput
                  label="What type of church do you attend?"
                  activeOutlineColor={'#12D2D9'}
                  activeUnderlineColor={'#12D2D9'}
                  style={{ backgroundColor: colors.background }}
                  theme={{ roundness: 10 }}
                  showSoftInputOnFocus={false}
                  onPressIn={() => setChurchTypeModalVisible(true)}
                  value={churchType}
                />

                {selectedChurchType.length > 0 && selectedChurchType[0]?.children?.length > 0 ? (
                  <TextInput
                    label="What subtype of the church that you attend?"
                    activeOutlineColor={'#12D2D9'}
                    activeUnderlineColor={'#12D2D9'}
                    style={{ backgroundColor: colors.background }}
                    theme={{ roundness: 10 }}
                    showSoftInputOnFocus={false}
                    onPressIn={() => setChurchSubTypeModalVisible(true)}
                    value={churchSubType}
                  />
                ) : null}

                <TextInput
                  label="How often do you attend church?"
                  activeOutlineColor={'#12D2D9'}
                  activeUnderlineColor={'#12D2D9'}
                  style={{ backgroundColor: colors.background }}
                  theme={{ roundness: 10 }}
                  showSoftInputOnFocus={false}
                  onPressIn={() => setOftenChurchVisible(true)}
                  value={oftenChurch}
                />

                <TextInput
                  label="What City are you in?"
                  activeOutlineColor={'#12D2D9'}
                  activeUnderlineColor={'#12D2D9'}
                  style={{ backgroundColor: colors.background }}
                  theme={{ roundness: 10 }}
                  showSoftInputOnFocus={false}
                  onPressIn={() => setCitySelector(true)}
                  value={location?.address}
                />

                <MapBox
                  location={newLocation}
                  setLongitude={setLongitude}
                  setLatitude={setLatitude}
                  CheckIn={citySelector}
                  setCheckIn={setCitySelector}
                  setLocation={setNewLocation}
                />

                <TextInput
                  label="Date of Birth"
                  activeOutlineColor={'#12D2D9'}
                  activeUnderlineColor={'#12D2D9'}
                  style={{ backgroundColor: colors.background }}
                  theme={{ roundness: 10 }}
                  showSoftInputOnFocus={false}
                  onFocus={() => setOpen(true)}
                  onChangeText={(value) => setDate(value)}
                  onPressIn={() => setOpen(true)}
                  value={date}
                  right={
                    <TextInput.Icon
                      icon="calendar"
                      onPress={() => setOpen(true)}
                      style={{ paddingTop: 6 }}
                      color={'#032f3c'}
                    />
                  }
                />
              </>
            ) : null}

            <DatePicker
              modal
              minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 90))}
              maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 16))}
              mode="date"
              androidVariant="nativeAndroid"
              open={open}
              date={date ? parse(date, 'MM/dd/yyyy', new Date()) : new Date()}
              onConfirm={(date) => {
                setOpen(false);
                setDate(format(date, 'MM/dd/yyyy'));
              }}
              onCancel={() => {
                setOpen(false);
              }}
            />

            <View>
              {user?.accountType == 'individual' ? (
                <TextInput
                  style={{ backgroundColor: colors.background }}
                  value={whatIDo?.name ? whatIDo?.name : ''}
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
                    style={{ backgroundColor: colors.background }}
                    value={organizationType?.name ? organizationType?.name : ''}
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
                  {user?.isInfluencer == true ? (
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
                  ) : null}
                </>
              )}

              <TextInput
                style={{ backgroundColor: colors.background }}
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
          <View style={{ marginHorizontal: 25, width: '100%' }}>
            <Button
              text={'DONE'}
              onPress={() => {
                const data = new FormData();

                if (fullname) data.append('name', fullname);
                if (gender) data.append('gender', gender);
                if (whatIDo) data.append('whatIDo', whatIDo?._id);
                if (organizationType) data.append('typeOfOrganization', organizationType?._id);
                if (website) data.append('website', website);
                if (imageObject) data.append('photo', imageObject);
                if (bio) data.append('bio', bio);
                if (username) data.append('username', username);
                if (churchType) data.append('churchType', churchType);
                if (churchSubType) data.append('churchSubType', churchSubType);
                if (oftenChurch) data.append('oftenChurch', oftenChurch);

                dispatch(setLoader(true));

                if (user?.accountType == 'individual') {
                  dispatch(profileUpdate({ data, token, accountType: 'individual', go }));
                } else {
                  dispatch(profileUpdate({ data, token, accountType: 'organization', go }));
                }
              }}
              // btnStyle={{
              //   ...GeneralStyle.btn,
              //   height: getHeight(7),

              //   backgroundColor: '#0C5C75',
              // }}
              // btnTextStyle={GeneralStyle.btnText}
              mode="contained"
              paper
              btnStyle={{ marginHorizontal: 10 }}
            />

            <Button
              text={'Cancel'}
              mode="text"
              textColor="#70747D"
              paper
              btnStyle={{ marginHorizontal: 0 }}
              // btnStyle={{
              //   ...GeneralStyle.btn,
              //   backgroundColor: 'white',
              //   marginTop: getHeight(2),
              // }}
              onPress={() => navigation.goBack()}
              // btnTextStyle={{ ...GeneralStyle.btnText, color: '#707470' }}
            />
          </View>
        </View>
        <Modal
          backdropOpacity={0.3}
          isVisible={churchTypeModalVisible}
          onBackdropPress={() => setChurchTypeModalVisible(false)}
          onSwipeComplete={() => setChurchTypeModalVisible(false)}
          swipeDirection={['down']}
          style={styles.bottomView}
          propagateSwipe={true}
        >
          <View style={{ ...styles.content2, backgroundColor: colors.background }}>
            <View style={styles.headLine} />

            <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled={true}>
              {churchTypes?.map((item, index) => {
                return (
                  <TouchableOpacity
                    onPress={() => {
                      // setWhatIDo(item);
                      setChurchType(item.churchType);
                      setSubChurchType('');

                      setChurchTypeModalVisible(false);
                    }}
                    style={styles.listItem2}
                    key={index}
                  >
                    <Text
                      style={{
                        color: '#81979E',
                        fontSize: getFontSize(2.2),
                        fontFamily: 'Rubik-Regular',
                      }}
                      numberOfLines={1}
                    >
                      {item.churchType}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Modal>
        <Modal
          backdropOpacity={0.3}
          isVisible={churchSubTypeModalVisible}
          onBackdropPress={() => setChurchSubTypeModalVisible(false)}
          onSwipeComplete={() => setChurchSubTypeModalVisible(false)}
          swipeDirection={['down']}
          style={styles.bottomView}
          propagateSwipe={true}
        >
          <View style={styles.content2}>
            <View style={styles.headLine} />
            {selectedChurchType.length > 0 ? (
              <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled={true}>
                {selectedChurchType[0].children.map((item, index) => {
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        // setWhatIDo(item);
                        setSubChurchType(item.churchType);
                        setChurchSubTypeModalVisible(false);
                      }}
                      style={styles.listItem2}
                      key={index}
                    >
                      <Text
                        style={{
                          color: '#81979E',
                          fontSize: getFontSize(2.2),
                          fontFamily: 'Rubik-Regular',
                        }}
                        numberOfLines={1}
                      >
                        {item.churchType}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>
        </Modal>
        <Modal
          backdropOpacity={0.3}
          isVisible={oftenChurchVisible}
          onBackdropPress={() => setOftenChurchVisible(false)}
          onSwipeComplete={() => setOftenChurchVisible(false)}
          swipeDirection={['down']}
          style={styles.bottomView}
          propagateSwipe={true}
        >
          <View style={styles.content2}>
            <View style={styles.headLine} />
            {oftenChurchOptions.length > 0 ? (
              <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled={true}>
                {oftenChurchOptions.map((item, index) => {
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        // setWhatIDo(item);
                        setOftenChurch(item);
                        setOftenChurchVisible(false);
                      }}
                      style={styles.listItem2}
                      key={index}
                    >
                      <Text
                        style={{
                          color: '#81979E',
                          fontSize: getFontSize(2.2),
                          fontFamily: 'Rubik-Regular',
                        }}
                        numberOfLines={1}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};
export default EditProfile;
