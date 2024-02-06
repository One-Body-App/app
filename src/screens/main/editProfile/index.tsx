import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Share,
  Switch,
} from 'react-native';
import Modal from 'react-native-modal';
import {
  CameraOptions,
  ImageLibraryOptions,
  launchCamera,
  launchImageLibrary,
  MediaType,
} from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import ImagePicker from 'react-native-image-crop-picker';
import { StackScreenProps } from '@react-navigation/stack';
import { CompositeScreenProps, useTheme } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import { format, parse } from 'date-fns';
import { ArrowDown2, Calendar, GalleryEdit, Setting2 } from 'iconsax-react-native';
import { serialize } from 'object-to-formdata';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import Button from '@/components/Button';

import { styles } from './styles';
import { profileUpdate } from '@/src/redux/actions/AuthActions';
import ImagePickerModal from '@/components/ImagePickerModal';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import Twitter from '@/assets/svg/Twitter.svg';
import Blog from '@/assets/svg/Blog.svg';
import Instagram from '@/assets/svg/Instagram.svg';
import { ApiCall } from '@/src/services/api';

import { RootState } from '@/src/redux/reducers/rootReducer';
import { AccountType, ChurchType, Interest, Tag } from '@/utils/types';

import MapBox, { MapSuggestion } from '@/components/MapBox';
import { spacing } from '@/src/styles/spacing';
import { profileImagesize } from '@/components/profile/Profile';
import { Colors, Typography } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import StyledText from '@/components/styled/Text';
import StyledTextInput from '@/components/styled/TextInput';
import { button } from '@/src/styles/buttons';
import StyledSelect from '@/components/styled/Select';
import SearchIcon from '@/assets/icons/search.svg';
import { iterestListItem } from '@/src/styles/items';
import SettingsSheet from '../myProfile/SettingsSheet';
import {
  MainBottomStackParamsList,
  MainDrawerParamsList,
  MyProfileStackParamsList,
} from '@/src/navigator/types';
import { requestCameraPermission, requestExternalWritePermission } from '@/utils/ImageAndCamera';

type Props = CompositeScreenProps<
  StackScreenProps<MyProfileStackParamsList, 'EditProfile'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    BottomTabScreenProps<MainBottomStackParamsList, 'HomeTab'>
  >
>;

export type LocationDTO = {
  address: string;
  longitude: number;
  latitude: number;
};

type EditProfileDTO = {
  name?: string;
  companyName?: string;
  contactEmail?: string;
  contactName?: string;
  contactPhoneNumber?: string;

  gender?: string;
  whatIDo?: string;
  typeOfOrganization?: string;
  website?: string;
  photo?: { uri: string; type: string; name: string };
  headerImage?: { uri: string; type: string; name: string };
  bio?: string;
  username?: string;
  churchType: string;
  churchSubType: string;
  oftenChurch?: string;
  isChurchTypePublic: boolean;
  isLocationPublic: boolean;
  location?: {
    longitude: number;
    latitude: number;
    address: string;
  };
};

function EditProfile({ navigation }: Props) {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [gender, setGender] = useState(user?.gender);
  const [pickerModalVisibile, setPickerModalVisibile] = useState(false);
  const [headerImagePickerModalVisibile, setHeaderImagePickerModalVisibile] = useState(false);
  const [imageToUpload, setImageToUpload] = useState('');
  const [imageObject, setImageObject] = useState<{ uri: string; type: string; name: string }>();

  const [headerImageToUpload, setHeaderImageToUpload] = useState(user?.profileHeader || '');
  const [headerImageObject, setHeaderImageObject] = useState<{
    uri: string;
    type: string;
    name: string;
  }>();
  const [fullname, setFullName] = useState<string>(
    user?.accountType == 'individual' ? user?.name ?? '' : user?.profile.companyName ?? ''
  );

  const [username, setUsername] = useState<string>(user?.username ?? '');
  const [website, setWebsite] = useState<string>(user?.website ?? '');
  const [bio, setBio] = useState<string>(user?.bio ?? '');
  const [whatIDo, setWhatIDo] = useState<string>(user?.profile.whatIDo?._id || '');
  const [organizationType, setOrganizationType] = useState<Tag | null>(
    user?.profile.typeOfOrganization ? user?.profile.typeOfOrganization : null
  );

  const [organizationContactName, setOrganizationContactName] = useState<string>(
    user?.profile.contactName ?? ''
  );

  const [organizationContactEmail, setOrganizationContactEmail] = useState<string>(
    user?.profile.contactEmail ?? ''
  );

  const [organizationContactPhone, setOrganizationContactPhone] = useState<string>(
    user?.profile.contactPhoneNumber ?? ''
  );

  const [whatIDoList, setWhatIDoList] = useState<Tag[]>([]);
  const [organizationTypes, setOrganizationTypes] = useState<Tag[]>([]);
  const dispatch = useDispatch();
  const [date, setDate] = useState<string>(user?.profile?.dateOfBirth ?? '');
  const [open, setOpen] = useState(false);

  const [oftenChurch, setOftenChurch] = useState(user?.profile?.oftenChurch ?? '');

  const [churchSubType, setSubChurchType] = useState<string>(user?.profile?.churchSubType ?? '');
  const [churchTypes, setChurchTypes] = useState<ChurchType[]>([]);
  const [churchType, setChurchType] = useState<string>(user?.profile?.churchType ?? '');
  const [citySelector, setCitySelector] = useState<boolean>(false);
  const [location, setLocation] = useState<LocationDTO | null>(
    user?.profile.location &&
      user?.profile.location.coordinates?.lon &&
      user?.profile.location.coordinates?.lat &&
      user?.profile.location.address
      ? {
          address: user?.profile.location.address,
          longitude: user?.profile.location.coordinates?.lon,
          latitude: user?.profile.location.coordinates?.lat,
        }
      : null
  );
  const [newLocation, setNewLocation] = useState<MapSuggestion | null>(null);
  const [longitude, setLongitude] = useState<number>();
  const [latitude, setLatitude] = useState<number>();
  const [interest, setInterest] = useState<Interest[]>([]);
  const [searchInterest, setSearchInterest] = useState<Interest[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<string[]>([]);
  const [isPublicLocationEnabled, setIsPublicLocationEnabled] = React.useState(
    user?.profile.isLocationPublic ?? false
  );
  const [isPublicChurchTypeEnabled, setIsPublicChurchTypeEnabled] = React.useState(
    user?.profile?.isChurchTypePublic ?? false
  );

  const oftenChurchOptions = ['Weekly', 'Bi-Weekly', 'Once a month', 'I only watch at home'];

  // React.useEffect(() => {
  //   navigation.setOptions({
  //     headerRight: () => (
  //       <View style={{ flexDirection: 'row', padding: spacing.x5 }}>
  //         <Button
  //           onPress={() => {}}
  //           text="Save"
  //           btnTextStyle={{ color: Colors.primarySapphire.brand }}
  //           btnStyle={[
  //             button.outline,
  //             {
  //               paddingHorizontal: spacing.x24,
  //               paddingVertical: spacing.x5,
  //               borderColor: Colors.primarySapphire.brand,
  //             },
  //           ]}
  //         />
  //       </View>
  //     ),
  //   });
  // }, [navigation]);

  const { colors } = useTheme();

  useEffect(() => {
    if (newLocation && latitude && longitude) {
      setLocation({
        longitude,
        latitude,
        address: newLocation.place_name,
      });
    }
  }, [newLocation, longitude, latitude]);

  useEffect(() => {
    navigation
      .getParent()
      ?.getParent()
      ?.setOptions({
        headerRight: () => (
          <View style={{ flexDirection: 'row', paddingRight: spacing.x24 }}>
            <TouchableOpacity
              style={{ marginRight: spacing.x16 }}
              onPress={() => {
                Share.share({
                  title:
                    // profileData?._id == currentUser._id ?
                    `Check my profile on One Body App`,
                  // : 'Check this profile on One Body App`',
                  // message: `Check my profile in One Body App`,
                  url: `https://app.onebodyapp.com/profile/${user?.username}`,
                });
              }}
            >
              {Platform.OS == 'android' ? (
                <Ionicons name="share-social-outline" size={24} color={Colors.primary.brand} />
              ) : (
                <Ionicons name="share-outline" size={24} color={Colors.primary.brand} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowSettings(true);
              }}
            >
              <Setting2
                style={{ height: 24, width: 24 }}
                color={Colors.primary.brand}
                strokeWidth={0.2}
              />
            </TouchableOpacity>
          </View>
        ),
      });
  }, [navigation, user]);

  const getChurchTypes = async () => {
    try {
      const res = await ApiCall({
        route: 'global/church-type',
        verb: 'get',
        token,
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

  const captureImage = async (contentType: MediaType, imageType: 'header' | 'photo') => {
    const options: CameraOptions = {
      mediaType: contentType,
      quality: 0.8,
      // noData: true,
    };
    // let isCameraPermitted = await requestCameraPermission();
    const isStoragePermitted = await requestExternalWritePermission();
    if (isStoragePermitted) {
      const response = await launchCamera(options);

      console.log('Response = ', response);

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
      const uri = response?.assets?.at(0)?.uri ?? '';
      const type = response?.assets?.at(0)?.type ?? '';
      const name = response?.assets?.at(0)?.fileName ?? '';

      setImageObject({ uri, type, name });
      setImageToUpload(uri);

      cropimage(uri, imageType);
    } else {
      // console.log('no ', isCameraPermitted);
    }
  };
  const getWhatIDo = async () => {
    try {
      const res = await ApiCall({
        route: 'tags/professions',
        token,
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
        token,
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

  const addInterests = async () => {
    try {
      const res = await ApiCall({
        route: 'user/add-interests',
        token,
        params: { interests: selectedInterest },
        verb: 'patch',
      });

      if (res?.status !== 200) {
        dispatch(setLoader(false));
        console.log('error', res);
      }
    } catch (e: any) {
      console.log(e);
    }
  };

  const chooseImageGallery = async (imageType: 'header' | 'photo') => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',

      // noData: true,
      selectionLimit: 0.8,
    };
    const response = await launchImageLibrary(options);

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
    const uri = response?.assets ? response?.assets[0]?.uri : '';
    const type = response?.assets ? response?.assets[0]?.type : '';
    const name = response?.assets ? response?.assets[0]?.fileName : '';
    // if (imageType == 'photo') {
    //   setImageObject({ uri: uri ?? '', type: type ?? '', name: name ?? '' });
    //   setImageToUpload(uri ?? '');
    // } else {
    //   setHeaderImageObject({ uri: uri ?? '', type: type ?? '', name: name ?? '' });
    //   setHeaderImageToUpload(uri ?? '');
    // }

    cropimage(uri ?? '', imageType);
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

        if (imageType == 'photo') {
          setImageToUpload(image?.path);
          setImageObject({
            ...MyObject,
            name: `profileImage${user?._id}`,
          });
          setPickerModalVisibile(false);
        } else {
          setHeaderImageToUpload(uri ?? '');
          setHeaderImageObject({
            ...MyObject,
            name: `headerImage${user?._id}`,
          });
          setHeaderImagePickerModalVisibile(false);
        }
      }, 500);
    } catch (e) {
      console.log(e);
    }
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
    if (user && interest) {
      setSelectedInterest(user.interests.map((item) => item._id));
    }
  }, [user, interest]);

  useEffect(() => {
    if (token) {
      getChurchTypes();
      getInterest();
    }
  }, [token]);

  const getInterest = async () => {
    try {
      const res = await ApiCall({
        route: 'tags/interest',
        verb: 'get',
        token,
      });

      if (res?.status == 200) {
        setInterest(res?.response);
        setSearchInterest(res?.response);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  const selectedWhatIDo = whatIDoList.filter((type) => type._id == whatIDo);
  const selectedWhatIDoName = selectedWhatIDo.length > 0 ? selectedWhatIDo[0].name : '';

  const selectedChurchType = churchTypes.filter((type) => type.churchType == churchType);
  const selectedChurchTypeName =
    selectedChurchType.length > 0 ? selectedChurchType[0].churchType : '';

  const selectedChurchSubType =
    selectedChurchType.length > 0
      ? selectedChurchType[0].children.filter((item) => {
          return item.churchType == churchSubType;
        })
      : [];

  const selectedChurchSubTypeName =
    churchSubType == 'none'
      ? 'None'
      : selectedChurchSubType.length > 0
      ? selectedChurchSubType[0].churchType
      : '';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // keyboardVerticalOffset={120}
      >
        <ScrollView>
          <View>
            <View style={{ width: '100%', height: 200 }}>
              {headerImageToUpload ? (
                <FastImage
                  style={{
                    height: 150,
                    width: '100%',
                  }}
                  source={{
                    uri: headerImageToUpload,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    backgroundColor: Colors.primarySapphire.brand,
                    height: 150,
                    width: '100%',
                  }}
                />
              )}

              <View
                style={{
                  alignSelf: 'flex-end',
                  backgroundColor: 'white',
                  borderRadius: borderRadius.button,
                  padding: spacing.x10,
                  marginRight: spacing.x24,
                  position: 'absolute',
                  bottom: spacing.x64, // size of the profile image + margin space
                  right: 0,
                }}
              >
                <ImagePickerModal
                  visible={headerImagePickerModalVisibile}
                  hideVisible={() => setHeaderImagePickerModalVisibile(false)}
                  galleryImage={() => chooseImageGallery('header')}
                  cameraImage={() => captureImage('photo', 'header')}
                />

                <TouchableOpacity
                  onPress={() => {
                    setHeaderImagePickerModalVisibile(true);
                  }}
                >
                  <GalleryEdit color={Colors.neutral[200]} />
                </TouchableOpacity>
              </View>

              <View
                style={{
                  position: 'absolute',
                  bottom: profileImagesize / 6,
                  marginLeft: spacing.x24,
                }}
              >
                <ImagePickerModal
                  visible={pickerModalVisibile}
                  hideVisible={() => setPickerModalVisibile(false)}
                  galleryImage={() => chooseImageGallery('photo')}
                  cameraImage={() => captureImage('photo', 'photo')}
                />
                <TouchableOpacity
                  onPress={() => setPickerModalVisibile(true)}
                  style={styles.imageContainer}
                >
                  <View
                    style={{
                      // flexDirection: 'row',
                      // justifyContent: 'center',
                      // alignContent: 'center',

                      width: profileImagesize,
                      height: profileImagesize,
                      borderRadius: borderRadius.max,
                    }}
                  >
                    <FastImage
                      style={{
                        width: profileImagesize,
                        height: profileImagesize,
                        borderRadius: borderRadius.max,
                      }}
                      source={
                        imageToUpload
                          ? { uri: imageToUpload }
                          : {
                              uri:
                                user?.profileImage ||
                                'https://cdn.onebodyapp.com/user/no-image.png',
                            }
                      }
                      resizeMode={FastImage.resizeMode.stretch}
                    />

                    <View
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        width: profileImagesize,
                        height: profileImagesize,
                        position: 'absolute',
                        borderRadius: borderRadius.max,
                        borderWidth: borderWidth.base,
                        justifyContent: 'center',
                        alignItems: 'center',

                        borderColor: 'white',
                      }}
                    >
                      <GalleryEdit color="white" />
                      <StyledText
                        style={{
                          // color: '#757575',
                          // fontSize: 12,
                          // // marginTop: getHeight(1),
                          // fontFamily: 'Rubik-Regular',
                          // textAlign: 'center',
                          // width: '40%',
                          // alignSelf: 'center',
                          color: 'white',
                          textAlign: 'center',
                        }}
                      >
                        Change
                      </StyledText>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.topContainer}>
            <View style={{ marginHorizontal: spacing.x24 }}>
              <View style={[styles.inputGroup, { backgroundColor: colors.card }]}>
                <StyledText style={[Typography.header.h3, { textTransform: 'uppercase' }]}>
                  {user?.accountType} Details
                </StyledText>
                <StyledTextInput
                  onChangeText={(e) => setUsername(e.toLowerCase().trim().replace(/\s+/g, ''))}
                  wrapperStyle={{ marginTop: spacing.x24 }}
                  value={username}
                  label="Username"
                  placeholder="username"
                />

                <StyledTextInput
                  onChangeText={(e) => setFullName(e)}
                  wrapperStyle={{ marginTop: spacing.x16 }}
                  value={fullname}
                  label="Name"
                  placeholder="Name"
                />

                <View style={{ flex: 4, marginTop: spacing.x16 }}>
                  <StyledText style={{ marginBottom: 10 }}>Date of birth</StyledText>
                  <Button
                    text={date || 'Select'}
                    btnStyle={{
                      flex: 1,
                      backgroundColor: Colors.neutral[700],
                      borderColor: Colors.neutral[800],
                      borderRadius: borderRadius.xs,
                    }}
                    wrapperBtnStyle={{
                      justifyContent: 'space-between',
                      paddingHorizontal: 14,
                      paddingVertical: 16,
                    }}
                    btnTextStyle={{
                      color: date ? Colors.neutral[300] : Colors.neutral[400],
                    }}
                    onPress={() => setOpen(true)}
                    rightIcon={
                      <Calendar
                        onPress={() => setOpen(true)}
                        style={{ paddingTop: 6 }}
                        size={20}
                        color={Colors.neutral[300]}
                      />
                    }
                  />
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
                </View>

                {user?.accountType == 'individual' ? (
                  <StyledSelect
                    items={whatIDoList.map((item) => {
                      return {
                        text: item.name,
                        value: item._id,
                      };
                    })}
                    label="What I Do"
                    selectedItem={whatIDo}
                    btnText={whatIDo == '' ? 'Select' : selectedWhatIDoName}
                    modalTitle="Select one"
                    onChange={(item) => {
                      setWhatIDo(item);
                    }}
                    wrapperStyle={{ marginTop: spacing.x16 }}
                  />
                ) : (
                  <StyledSelect
                    items={organizationTypes.map((item) => {
                      return {
                        text: item.name,
                        value: item._id,
                      };
                    })}
                    label="Type"
                    selectedItem={organizationType?._id}
                    btnText={!organizationType ? 'Select' : organizationType.name}
                    modalTitle="Select one"
                    onChange={(_id) => {
                      const newOrganizationType = organizationTypes.filter(
                        (item) => item._id == _id
                      );

                      if (newOrganizationType && newOrganizationType.length > 0) {
                        setOrganizationType(newOrganizationType[0]);
                      }
                    }}
                    wrapperStyle={{ marginTop: spacing.x16 }}
                  />
                )}
                {user?.isInfluencer == true || user?.accountType == 'organization' ? (
                  <StyledTextInput
                    multiline
                    numberOfLines={3}
                    maxLength={150}
                    label="Bio"
                    inputStyle={{ minHeight: 80 }}
                    showCharCounter
                    value={bio}
                    onChangeText={(e) => setBio(e)}
                    counterContainerStyle={{
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                    }}
                    counterTextStyleStyle={{
                      marginTop: spacing.x32 * -1,
                      marginRight: spacing.x10,
                      color: Colors.neutral[300],
                    }}
                    wrapperStyle={{ marginTop: spacing.x16 }}
                  />
                ) : null}

                <View style={{ flex: 4, marginTop: spacing.x16 }}>
                  <StyledText style={{ marginBottom: 10 }}>Location</StyledText>
                  <Button
                    text={
                      location
                        ? location.address
                        : newLocation?.place_name ?? 'Select your location'
                    }
                    btnStyle={{
                      flex: 1,
                      backgroundColor: Colors.neutral[700],
                      borderColor: Colors.neutral[800],
                      borderRadius: borderRadius.xs,
                    }}
                    wrapperBtnStyle={{
                      justifyContent: 'space-between',
                      paddingHorizontal: 14,
                      paddingVertical: 16,
                    }}
                    btnTextStyle={{
                      color: location ? Colors.neutral[300] : Colors.neutral[400],
                    }}
                    onPress={() => setCitySelector(true)}
                    rightIcon={
                      <ArrowDown2
                        onPress={() => setCitySelector(true)}
                        style={{ paddingTop: 6 }}
                        size={15}
                        color={Colors.neutral[300]}
                      />
                    }
                  />

                  <MapBox
                    location={newLocation}
                    setLongitude={setLongitude}
                    setLatitude={setLatitude}
                    modalVisible={citySelector}
                    setModalVisible={setCitySelector}
                    setLocation={setNewLocation}
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

                  <View
                    style={{
                      justifyContent: 'center',
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingTop: spacing.x10,
                    }}
                  >
                    <StyledText style={[{ color: Colors.neutral.brand }]}>
                      Make your location public
                    </StyledText>

                    <View
                      style={{
                        paddingLeft: spacing.x10,
                        flex: 1,
                        alignItems: 'flex-end',
                      }}
                    >
                      <Switch
                        value={isPublicLocationEnabled}
                        onValueChange={(value) => {
                          setIsPublicLocationEnabled(value);
                        }}
                      />
                    </View>
                  </View>
                </View>

                <StyledTextInput
                  value={website}
                  label="Website"
                  keyboardType="url"
                  autoCorrect={false}
                  autoCapitalize="none"
                  placeholder="www.website.com"
                  onChangeText={(e) => setWebsite(e)}
                  wrapperStyle={{ marginTop: spacing.x16 }}
                />
              </View>

              {user?.accountType == 'individual' ? (
                <View
                  style={[
                    styles.inputGroup,
                    { backgroundColor: colors.card, marginTop: spacing.x32 },
                  ]}
                >
                  <StyledText style={[Typography.header.h3, { textTransform: 'uppercase' }]}>
                    Church Details
                  </StyledText>
                  <StyledSelect
                    items={churchTypes.map((item) => {
                      return {
                        text: item.churchType,
                        value: item.churchType,
                      };
                    })}
                    label="Denomination"
                    selectedItem={churchType}
                    btnText={selectedChurchTypeName == '' ? 'Select' : selectedChurchTypeName}
                    modalTitle="Select your Denomination"
                    onChange={(item) => {
                      setChurchType(item);
                      setSubChurchType('');
                    }}
                    wrapperStyle={{ marginTop: spacing.x24 }}
                  />

                  {selectedChurchType.length > 0 && selectedChurchType[0]?.children?.length > 0 ? (
                    <StyledSelect
                      wrapperStyle={{ marginTop: spacing.x24 }}
                      items={[
                        {
                          text: 'None',
                          value: 'none',
                        },
                        ...selectedChurchType[0].children.map((item) => {
                          return {
                            text: item.churchType,
                            value: item.churchType,
                          };
                        }),
                      ]}
                      label="Sub Denomination or Association"
                      btnText={
                        selectedChurchSubTypeName == '' ? 'Select' : selectedChurchSubTypeName
                      }
                      onChange={(item) => {
                        setSubChurchType(item);
                      }}
                      modalTitle="Select church sub Denomination"
                    />
                  ) : null}

                  <View
                    style={{
                      justifyContent: 'center',
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingTop: spacing.x10,
                    }}
                  >
                    <StyledText style={[{ color: Colors.neutral.brand }]}>
                      Make your denomination public
                    </StyledText>

                    <View
                      style={{
                        paddingLeft: spacing.x10,
                        flex: 1,
                        alignItems: 'flex-end',
                      }}
                    >
                      <Switch
                        value={isPublicChurchTypeEnabled}
                        onValueChange={(value) => {
                          setIsPublicChurchTypeEnabled(value);
                        }}
                      />
                    </View>
                  </View>

                  <StyledSelect
                    wrapperStyle={{ marginTop: spacing.x24 }}
                    items={oftenChurchOptions.map((item) => {
                      return {
                        text: item,
                        value: item,
                      };
                    })}
                    label="Church attendence"
                    btnText={oftenChurch == '' ? 'Select' : oftenChurch}
                    onChange={(item) => {
                      setOftenChurch(item);
                    }}
                    modalTitle="Select Church Attendence"
                  />
                </View>
              ) : null}

              {user?.accountType == 'organization' ? (
                <View
                  style={[
                    styles.inputGroup,
                    { backgroundColor: colors.card, marginTop: spacing.x32 },
                  ]}
                >
                  <StyledText style={[Typography.header.h3, { textTransform: 'uppercase' }]}>
                    Organization Contact
                  </StyledText>
                  <StyledTextInput
                    onChangeText={(e) => setOrganizationContactName(e)}
                    wrapperStyle={{ marginTop: spacing.x24 }}
                    value={organizationContactName}
                    label="Name"
                    placeholder="Contact name"
                  />

                  <StyledTextInput
                    onChangeText={(e) => setOrganizationContactEmail(e)}
                    wrapperStyle={{ marginTop: spacing.x24 }}
                    value={organizationContactEmail}
                    label="Email"
                    placeholder="Contact email"
                  />

                  <StyledTextInput
                    onChangeText={(e) => setOrganizationContactPhone(e)}
                    wrapperStyle={{ marginTop: spacing.x24 }}
                    value={organizationContactPhone}
                    label="Phone Number"
                    placeholder="Contact phone number"
                  />
                </View>
              ) : null}

              <View
                style={[
                  styles.inputGroup,
                  { backgroundColor: colors.card, marginTop: spacing.x32 },
                ]}
              >
                <StyledText style={[Typography.header.h3, { textTransform: 'uppercase' }]}>
                  Interests
                </StyledText>

                <View style={{ flex: 6, marginTop: spacing.x24 }}>
                  <View>
                    <StyledTextInput
                      // style={{ ...GeneralStyle.input, width: getWidth(80) }}
                      // mode="outlined"

                      clearButtonMode="always"
                      onChangeText={(text) => {
                        const newSearchInterest = [];
                        for (let i = 0; i < interest.length; i++) {
                          if (interest[i].name.toLowerCase().indexOf(text.toLowerCase()) > -1) {
                            newSearchInterest.push(interest[i]);
                          }
                          setSearchInterest(newSearchInterest);
                        }
                      }}
                      leftIcon={
                        <View style={{ justifyContent: 'center' }}>
                          <SearchIcon
                            style={{ height: 20, width: 20, marginRight: spacing.x10 }}
                            stroke={Colors.neutral[300]}
                          />
                        </View>
                        // <MaterialCommunityIcons
                        //   name="magnify"
                        //   size={20}
                        //   style={{ marginRight: 10 }}
                        //   color={Colors.neutral[200]}
                        // />
                      }
                      placeholder="Search for interest"
                    />
                  </View>
                  <View style={{ flex: 10 }}>
                    <ScrollView
                      contentContainerStyle={{
                        marginTop: spacing.x24,
                        paddingBottom: spacing.x48,
                        flexDirection: searchInterest.length < 1 ? 'column' : 'row',
                        flexWrap: searchInterest.length < 1 ? 'nowrap' : 'wrap',
                      }}
                    >
                      {searchInterest.length < 1 ? (
                        <StyledText
                          style={[
                            Typography.body.x2M,
                            { padding: spacing.x16, textAlign: 'center' },
                          ]}
                        >
                          No Search Results
                        </StyledText>
                      ) : null}
                      {searchInterest.map((item, index) => {
                        return (
                          <TouchableOpacity
                            key={index}
                            onPress={() =>
                              selectedInterest.includes(item?._id)
                                ? setSelectedInterest(
                                    selectedInterest.filter(function (item2) {
                                      return item2 !== item?._id;
                                    })
                                  )
                                : setSelectedInterest([...selectedInterest, item?._id])
                            }
                            style={
                              selectedInterest.includes(item?._id)
                                ? [
                                    iterestListItem,
                                    {
                                      backgroundColor: Colors.primary.brand,
                                      borderColor: Colors.primary.brand,
                                    },
                                  ]
                                : iterestListItem
                            }
                          >
                            <StyledText
                              numberOfLines={1}
                              style={
                                selectedInterest.includes(item?._id)
                                  ? { color: 'white' }
                                  : { color: Colors.neutral[200] }
                              }
                            >
                              {item?.name}
                            </StyledText>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
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
            <View
              style={{ paddingHorizontal: spacing.x24, marginBottom: spacing.x16, width: '100%' }}
            >
              <Button
                text="SAVE"
                onPress={async () => {
                  const data: EditProfileDTO = {
                    churchType,
                    churchSubType: churchSubType == 'none' ? '' : churchSubType,
                    isChurchTypePublic: isPublicChurchTypeEnabled,
                    isLocationPublic: isPublicLocationEnabled,
                  };

                  if (fullname && user?.accountType == 'individual') data.name = fullname;
                  if (fullname && user?.accountType == 'organization') data.companyName = fullname;

                  if (organizationContactEmail && user?.accountType == 'organization')
                    data.contactEmail = organizationContactEmail;
                  if (organizationContactName && user?.accountType == 'organization')
                    data.contactName = organizationContactName;
                  if (organizationContactPhone && user?.accountType == 'organization')
                    data.contactPhoneNumber = organizationContactPhone;

                  if (gender) data.gender = gender;
                  if (whatIDo) data.whatIDo = whatIDo;
                  if (organizationType && organizationType._id)
                    data.typeOfOrganization = organizationType?._id;
                  if (website) data.website = website;
                  if (imageObject) data.photo = imageObject;
                  if (headerImageObject) data.headerImage = headerImageObject;
                  if (bio) data.bio = bio;
                  if (username) data.username = username;

                  if (oftenChurch) data.oftenChurch = oftenChurch;

                  if (location && location.longitude && location.latitude && location.address)
                    data.location = {
                      longitude: location.longitude,
                      latitude: location.latitude,
                      address: location.address,
                    };

                  dispatch(setLoader(true));

                  if (selectedInterest.length > 0) await addInterests();

                  if (user?.accountType == AccountType.individual) {
                    dispatch(
                      profileUpdate({
                        data: serialize(data),
                        token,
                        accountType: AccountType.individual,
                        go,
                      })
                    );
                  } else {
                    dispatch(
                      profileUpdate({
                        data: serialize(data),
                        token,
                        accountType: AccountType.organization,
                        go,
                      })
                    );
                  }
                }}
                btnStyle={[button.primary, { flex: 1 }]}
                disabledBtnStyle={[button.primary, { flex: 1, opacity: 0.5 }]}
                btnTextStyle={{ color: 'white' }}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {user ? (
        <SettingsSheet userData={user} showModal={showSettings} setShowModal={setShowSettings} />
      ) : null}
    </SafeAreaView>
  );
}
export default EditProfile;
