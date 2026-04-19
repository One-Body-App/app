import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
import { CompositeScreenProps, useFocusEffect, useTheme } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import { format, parse } from 'date-fns';
import { ArrowDown2, Calendar, GalleryEdit } from 'iconsax-react-native';
import { serialize } from 'object-to-formdata';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import Button from '@/components/Button';

import { styles } from './styles';
import { profileUpdate } from '@/src/redux/actions/AuthActions';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { ApiCall } from '@/src/services/api';

import { RootState } from '@/src/redux/reducers/rootReducer';
import {
  AccountType,
  ChurchType,
  Interest,
  OrganizationSize,
  OrganizationType,
  Tag,
} from '@/utils/types';

import MapBox, { MapSuggestion } from '@/components/MapBox';
import { spacing } from '@/src/styles/spacing';

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
import { requestExternalWritePermission } from '@/utils/ImageAndCamera';
import {
  buildCroppedMediaState,
  shouldConsumeMediaPickerIntent,
  shouldOpenHeaderPicker,
  shouldOpenPhotoPicker,
} from './mediaHelpers';
import {
  buildOrganizationCategoryGroups,
  getOrganizationCategoryForType,
} from '@/src/utils/organizationCategories';

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
  organizationSize?: OrganizationSize;
  organizationCategory?: string;
  organizationSubType?: string;

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

function EditProfile({ navigation, route }: Props) {
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const token = useSelector((state: RootState) => state.auth.userToken);

  const devLog = useCallback((...args: any[]) => {
    if (__DEV__) {
      console.log(...args);
    }
  }, []);

  const [gender] = useState(user?.gender);
  const [imageToUpload, setImageToUpload] = useState('');
  const [imageObject, setImageObject] = useState<{ uri: string; type: string; name: string }>();

  const [headerImageToUpload, setHeaderImageToUpload] = useState(user?.profileHeader || '');
  const [headerImageObject, setHeaderImageObject] = useState<{
    uri: string;
    type: string;
    name: string;
  }>();
  const [fullname, setFullName] = useState<string>(
    user?.accountType === 'individual' ? (user?.name ?? '') : (user?.profile.companyName ?? '')
  );

  const [username, setUsername] = useState<string>(user?.username ?? '');
  const [website, setWebsite] = useState<string>(user?.website ?? '');
  const [isValidWebsite, setIsValidWebsite] = useState<boolean | null>(null);
  const [bio, setBio] = useState<string>(user?.bio ?? '');
  const [whatIDo, setWhatIDo] = useState<string>(user?.profile.whatIDo?._id || '');
  const [selectedOrganizationCategory, setSelectedOrganizationCategory] = useState<string>(
    user?.profile.organizationCategory ??
      getOrganizationCategoryForType(user?.profile.typeOfOrganization ?? null)
  );
  const [selectedOrganizationTypeId, setSelectedOrganizationTypeId] = useState<string>(
    user?.profile.typeOfOrganization?._id ?? ''
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
  const [organizationSize, setOrganizationSize] = useState<OrganizationSize | ''>(
    user?.profile.organizationSize ?? ''
  );

  const [whatIDoList, setWhatIDoList] = useState<Tag[]>([]);
  const [organizationTypes, setOrganizationTypes] = useState<OrganizationType[]>([]);
  const dispatch = useDispatch();
  const [date, setDate] = useState<string>(user?.profile?.dateOfBirth ?? '');
  const [open, setOpen] = useState(false);

  const [oftenChurch, setOftenChurch] = useState(user?.profile?.oftenChurch ?? '');

  const [churchSubType, setSubChurchType] = useState<string>(user?.profile?.churchSubType ?? '');
  const [churchTypes, setChurchTypes] = useState<ChurchType[]>([]);
  const [churchType, setChurchType] = useState<string>(user?.profile?.churchType ?? '');
  const [citySelector, setCitySelector] = useState<boolean>(false);
  const [location, setLocation] = useState<LocationDTO | null>(() => {
    const loc = user?.profile.location;
    if (loc?.address && loc.coordinates != null) {
      return {
        address: loc.address,
        longitude: loc.coordinates.lon,
        latitude: loc.coordinates.lat,
      };
    }
    return null;
  });
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
  const organizationSizeOptions: { text: string; value: OrganizationSize }[] = [
    { text: 'Small', value: 'small' },
    { text: 'Medium', value: 'medium' },
    { text: 'Large', value: 'large' },
    { text: 'Mega', value: 'mega' },
  ];

  const { colors } = useTheme();

  useEffect(() => {
    if (newLocation) {
      setLocation({
        longitude: longitude ?? 0,
        latitude: latitude ?? 0,
        address: newLocation.place_name,
      });
    }
  }, [newLocation, longitude, latitude]);

  // useEffect(() => {
  //   navigation.setOptions({
  //     headerRight: () => (
  //       <View style={{ flexDirection: 'row', paddingRight: spacing.x24 }}>
  //         <TouchableOpacity
  //           style={{ marginRight: spacing.x16 }}
  //           onPress={() => {
  //             Share.share({
  //               title:
  //                 // profileData?._id == currentUser._id ?
  //                 `Check my profile on One Body App`,
  //               // : 'Check this profile on One Body App`',
  //               // message: `Check my profile in One Body App`,
  //               url: `https://app.onebodyapp.com/profile/${user?.username}`,
  //             });
  //           }}
  //         >
  //           {Platform.OS == 'android' ? (
  //             <Ionicons name="share-social-outline" size={24} color={Colors.primary.brand} />
  //           ) : (
  //             <Ionicons name="share-outline" size={24} color={Colors.primary.brand} />
  //           )}
  //         </TouchableOpacity>
  //         <TouchableOpacity
  //           onPress={() => {
  //             setShowSettings(true);
  //           }}
  //         >
  //           <Setting2
  //             style={{ height: 24, width: 24 }}
  //             color={Colors.primary.brand}
  //             strokeWidth={0.2}
  //           />
  //         </TouchableOpacity>
  //       </View>
  //     ),
  //   });
  // }, [navigation, user]);

  const getChurchTypes = useCallback(async () => {
    try {
      const res = await ApiCall({
        route: 'global/church-type',
        verb: 'get',
        token,
      });

      if (res?.status === 200) {
        setChurchTypes(res?.response);
      } else {
        devLog('error', res?.response);
      }
    } catch (e: any) {
      devLog('saga error -- ', e.toString());
    }
  }, [devLog, token]);

  const getWhatIDo = useCallback(async () => {
    try {
      const res = await ApiCall({
        route: 'tags/professions',
        token,
        verb: 'get',
      });
      if (res?.status === 200) {
        setWhatIDoList(res?.response);
      } else {
        devLog('error', res?.response);
      }
    } catch (e: any) {
      devLog('saga error on what i Do -- ', e.toString());
    }
  }, [devLog, token]);

  const getOrganizationTypes = useCallback(async () => {
    try {
      const res = await ApiCall({
        route: 'global/OrganizationType',
        verb: 'get',
        token,
      });

      if (res?.status === 200) {
        setOrganizationTypes(res?.response);
      } else {
        devLog('error', res?.response);
      }
    } catch (e: any) {
      devLog('saga error -- ', e.toString());
    }
  }, [devLog, token]);

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
        devLog('error', res);
      }
    } catch (e: any) {
      devLog(e);
    }
  };

  const cropimage = useCallback(
    async (uri: string, imageType: 'header' | 'photo') => {
      try {
        setTimeout(async () => {
          const image = await ImagePicker.openCropper({
            height: imageType === 'header' ? (Dimensions.get('screen').width * 9) / 16 : undefined,
            width: imageType === 'header' ? Dimensions.get('screen').width : undefined,
            mediaType: 'photo',
            cropperCircleOverlay: imageType === 'photo',
            path: uri,
            forceJpg: true,
            maxFiles: 1,
            compressImageMaxWidth: imageType === 'photo' ? 512 : 1280,
            compressImageMaxHeight: imageType === 'photo' ? 512 : 720,
          });
          const croppedMedia = buildCroppedMediaState({
            image,
            imageType,
            userId: user?._id,
          });

          if (imageType === 'photo') {
            setImageToUpload(croppedMedia.previewUri);
            setImageObject(croppedMedia.upload);
          } else {
            setHeaderImageToUpload(croppedMedia.previewUri);
            setHeaderImageObject(croppedMedia.upload);
          }
        }, 500);
      } catch (e) {
        devLog(e);
      }
    },
    [devLog, user?._id]
  );

  const captureImage = useCallback(
    async (contentType: MediaType, imageType: 'header' | 'photo') => {
      const options: CameraOptions = {
        mediaType: contentType,
        quality: 0.8,
        // noData: true,
      };
      // let isCameraPermitted = await requestCameraPermission();
      const isStoragePermitted = await requestExternalWritePermission();
      if (isStoragePermitted) {
        const response = await launchCamera(options);

        devLog('Response = ', response);

        if (response.didCancel) {
          devLog('User cancelled camera picker');

          return;
        }
        if (response.errorCode === 'camera_unavailable') {
          devLog('Camera not available on device');

          return;
        }
        if (response.errorCode === 'permission') {
          devLog('Permission not satisfied');

          return;
        }
        if (response.errorCode === 'others') {
          devLog(response.errorMessage);

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
    },
    [cropimage, devLog]
  );

  const chooseImageGallery = useCallback(
    async (imageType: 'header' | 'photo') => {
      const options: ImageLibraryOptions = {
        mediaType: 'photo',

        // noData: true,
        selectionLimit: 0.8,
      };
      const response = await launchImageLibrary(options);

      if (response.didCancel) {
        devLog('User cancelled camera picker');

        return;
      }
      if (response.errorCode === 'camera_unavailable') {
        devLog('Camera not available on device');

        return;
      }
      if (response.errorCode === 'permission') {
        devLog('Permission not satisfied');

        return;
      }
      if (response.errorCode === 'others') {
        devLog(response.errorMessage);
        return;
      }
      const uri = response?.assets ? response?.assets[0]?.uri : '';
      // if (imageType == 'photo') {
      //   setImageObject({ uri: uri ?? '', type: type ?? '', name: name ?? '' });
      //   setImageToUpload(uri ?? '');
      // } else {
      //   setHeaderImageObject({ uri: uri ?? '', type: type ?? '', name: name ?? '' });
      //   setHeaderImageToUpload(uri ?? '');
      // }

      cropimage(uri ?? '', imageType);
    },
    [cropimage, devLog]
  );

  const showImageSourceOptions = useCallback(
    (imageType: 'header' | 'photo') => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Choose From Gallery', 'Open Camera'],
            cancelButtonIndex: 0,
          },
          (buttonIndex) => {
            if (buttonIndex === 1) {
              chooseImageGallery(imageType).catch(() => undefined);
            }
            if (buttonIndex === 2) {
              captureImage('photo', imageType).catch(() => undefined);
            }
          }
        );
        return;
      }

      Alert.alert('Select image source', undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose From Gallery',
          onPress: () => {
            chooseImageGallery(imageType).catch(() => undefined);
          },
        },
        {
          text: 'Open Camera',
          onPress: () => {
            captureImage('photo', imageType).catch(() => undefined);
          },
        },
      ]);
    },
    [captureImage, chooseImageGallery]
  );

  useFocusEffect(
    useCallback(() => {
      const intent = route.params?.openMediaPicker;

      if (shouldOpenPhotoPicker(intent)) {
        showImageSourceOptions('photo');
      } else if (shouldOpenHeaderPicker(intent)) {
        showImageSourceOptions('header');
      }

      if (shouldConsumeMediaPickerIntent(intent)) {
        navigation.setParams({ openMediaPicker: undefined });
      }
    }, [navigation, route.params?.openMediaPicker, showImageSourceOptions])
  );
  const go = () => {
    navigation.goBack();
  };

  useEffect(() => {
    if (user) {
      if (user?.accountType === 'individual') {
        getWhatIDo();
      } else {
        getOrganizationTypes();
      }
    }
  }, [getOrganizationTypes, getWhatIDo, user]);

  useEffect(() => {
    if (user && interest) {
      setSelectedInterest(user.interests.map((item) => item._id));
    }
  }, [user, interest]);

  const getInterest = useCallback(async () => {
    try {
      const res = await ApiCall({
        route: 'tags/interest',
        verb: 'get',
        token,
      });

      if (res?.status === 200) {
        setInterest(res?.response);
        setSearchInterest(res?.response);
      } else {
        devLog('error', res?.response);
      }
    } catch (e: any) {
      devLog('saga error -- ', e.toString());
    }
  }, [devLog, token]);

  useEffect(() => {
    if (token) {
      getChurchTypes();
      getInterest();
    }
  }, [getChurchTypes, getInterest, token]);

  const selectedWhatIDo = whatIDoList.filter((type) => type._id === whatIDo);
  const selectedWhatIDoName = selectedWhatIDo.length > 0 ? selectedWhatIDo[0].name : '';
  const organizationCategoryGroups = buildOrganizationCategoryGroups(organizationTypes);
  const selectedOrganizationCategoryGroup = organizationCategoryGroups.find(
    (group) => group.value === selectedOrganizationCategory
  );
  const selectedOrganizationType =
    organizationTypes.find((type) => type._id === selectedOrganizationTypeId) ?? null;
  const selectedOrganizationTypeName =
    selectedOrganizationType?.organizationType ?? selectedOrganizationType?.name ?? 'Select';

  const selectedChurchType = churchTypes.filter((type) => type.churchType === churchType);
  const selectedChurchTypeName =
    selectedChurchType.length > 0 ? selectedChurchType[0].churchType : '';

  const selectedChurchSubType =
    selectedChurchType.length > 0
      ? selectedChurchType[0].children.filter((item) => {
          return item.churchType === churchSubType;
        })
      : [];

  let selectedChurchSubTypeName = '';
  if (churchSubType === 'none') {
    selectedChurchSubTypeName = 'None';
  } else if (selectedChurchSubType.length > 0) {
    selectedChurchSubTypeName = selectedChurchSubType[0].churchType;
  }

  useEffect(() => {
    if (user?.accountType !== 'organization' || organizationCategoryGroups.length === 0) {
      return;
    }

    const fallbackCategory =
      user?.profile.organizationCategory ||
      getOrganizationCategoryForType(user?.profile.typeOfOrganization ?? null) ||
      organizationCategoryGroups[0]?.value ||
      '';

    if (!selectedOrganizationCategory) {
      setSelectedOrganizationCategory(fallbackCategory);
      return;
    }

    const categoryExists = organizationCategoryGroups.some(
      (group) => group.value === selectedOrganizationCategory
    );

    if (!categoryExists && fallbackCategory) {
      setSelectedOrganizationCategory(fallbackCategory);
    }
  }, [organizationCategoryGroups, selectedOrganizationCategory, user]);

  useEffect(() => {
    if (user?.accountType !== 'organization' || !selectedOrganizationCategory) {
      return;
    }

    const currentGroup = organizationCategoryGroups.find(
      (group) => group.value === selectedOrganizationCategory
    );

    if (!currentGroup || currentGroup.subtypes.length === 0) {
      if (selectedOrganizationTypeId) {
        setSelectedOrganizationTypeId('');
      }
      return;
    }

    const hasSelectedSubtype = currentGroup.subtypes.some(
      (item) => item.organizationTypeId === selectedOrganizationTypeId
    );

    if (hasSelectedSubtype) {
      return;
    }

    const savedTypeId = user?.profile.typeOfOrganization?._id;
    const savedSubtype = user?.profile.organizationSubType;
    const nextSubtype =
      currentGroup.subtypes.find(
        (item) => item.organizationTypeId === savedTypeId || item.label === savedSubtype
      ) ?? currentGroup.subtypes[0];

    if (nextSubtype?.organizationTypeId) {
      setSelectedOrganizationTypeId(nextSubtype.organizationTypeId);
    }
  }, [organizationCategoryGroups, selectedOrganizationCategory, selectedOrganizationTypeId, user]);

  const websiteRef = useRef<TextInput>(null);
  const urlRegex = /^[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/i;
  return (
    <>
      {Platform.OS === 'android' && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 57,
            paddingHorizontal: spacing.x16,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={30} color={Colors.primary.brand} />
          </TouchableOpacity>
          <StyledText style={[Typography.header.h3, { marginLeft: spacing.x8 }]}>
            Edit Profile
          </StyledText>
        </View>
      )}
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
                resizeMode={FastImage.resizeMode.cover}
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
                alignItems: 'center',
                backgroundColor: 'white',
                borderColor: Colors.neutral[900],
                borderRadius: 21,
                borderWidth: borderWidth.base,
                height: 42,
                justifyContent: 'center',
                position: 'absolute',
                bottom: spacing.x16,
                right: spacing.x16,
                width: 42,
              }}
            >
              <TouchableOpacity
                onPress={() => showImageSourceOptions('header')}
                testID="edit-profile-header-image-button"
              >
                <GalleryEdit size={22} color={Colors.neutral[200]} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                position: 'absolute',
                bottom: 13,
                marginLeft: spacing.x24,
              }}
            >
              <TouchableOpacity
                onPress={() => showImageSourceOptions('photo')}
                style={styles.imageContainer}
                testID="edit-profile-avatar-image-button"
              >
                <View
                  style={{
                    // flexDirection: 'row',
                    // justifyContent: 'center',
                    // alignContent: 'center',

                    width: 80,
                    height: 80,
                    borderRadius: borderRadius.max,
                  }}
                >
                  <FastImage
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: borderRadius.max,
                    }}
                    source={
                      imageToUpload
                        ? { uri: imageToUpload }
                        : {
                            uri:
                              user?.profileImage || 'https://cdn.onebodyapp.com/user/no-image.png',
                          }
                    }
                    resizeMode={FastImage.resizeMode.cover}
                  />

                  <View
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      width: 80,
                      height: 80,
                      position: 'absolute',
                      borderRadius: borderRadius.max,
                      borderWidth: borderWidth.base,
                      justifyContent: 'center',
                      alignItems: 'center',

                      borderColor: 'white',
                    }}
                  >
                    <GalleryEdit size={22} color="white" />
                    <StyledText
                      style={{
                        // color: '#757575',
                        // fontSize: 12,
                        // // marginTop: getHeight(1),
                        // fontFamily: 'OpenSans-Regular',
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
                  onConfirm={(selectedDate) => {
                    setOpen(false);
                    setDate(format(selectedDate, 'MM/dd/yyyy'));
                  }}
                  onCancel={() => {
                    setOpen(false);
                  }}
                />
              </View>

              {user?.accountType === 'individual' ? (
                <StyledSelect
                  items={whatIDoList.map((item) => {
                    return {
                      text: item.name,
                      value: item._id,
                    };
                  })}
                  label="What I Do"
                  selectedItem={whatIDo}
                  btnText={whatIDo === '' ? 'Select' : selectedWhatIDoName}
                  modalTitle="Select one"
                  onChange={(item) => {
                    setWhatIDo(item);
                  }}
                  wrapperStyle={{ marginTop: spacing.x16 }}
                  showAllWithoutSearch
                />
              ) : (
                <>
                  <StyledSelect
                    items={organizationCategoryGroups.map((item) => {
                      return {
                        text: item.label,
                        value: item.value,
                      };
                    })}
                    label="Category"
                    selectedItem={selectedOrganizationCategory}
                    btnText={selectedOrganizationCategory || 'Select'}
                    modalTitle="Select organization category"
                    onChange={(value) => {
                      setSelectedOrganizationCategory(value);
                      setSelectedOrganizationTypeId('');
                    }}
                    wrapperStyle={{ marginTop: spacing.x16 }}
                    showAllWithoutSearch
                  />

                  <StyledSelect
                    items={(selectedOrganizationCategoryGroup?.subtypes ?? []).map((item) => {
                      return {
                        text: item.label,
                        value: item.organizationTypeId,
                      };
                    })}
                    label="Subtype"
                    selectedItem={selectedOrganizationTypeId}
                    btnText={selectedOrganizationTypeName}
                    modalTitle="Select organization subtype"
                    onChange={(value) => {
                      setSelectedOrganizationTypeId(value);
                    }}
                    wrapperStyle={{ marginTop: spacing.x16 }}
                    showAllWithoutSearch
                  />
                </>
              )}
              {user?.isInfluencer === true || user?.accountType === 'organization' ? (
                <StyledTextInput
                  multiline
                  numberOfLines={3}
                  maxLength={150}
                  enforceMaxLength
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
                      : (newLocation?.place_name ?? 'Select your location')
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
                onChangeText={(value) => {
                  setWebsite(value);
                }}
                onBlur={() => {
                  if (urlRegex.test(website)) {
                    setIsValidWebsite(true);
                  } else {
                    setIsValidWebsite(false);
                  }
                }}
                wrapperStyle={{ marginTop: spacing.x16 }}
                ref={websiteRef}
              />

              {website && isValidWebsite === false ? (
                <StyledText style={{ color: Colors.errorFeedback[200], marginTop: spacing.x8 }}>
                  Please enter a valid URL
                </StyledText>
              ) : null}
            </View>

            {user?.accountType === 'organization' ? (
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

                <StyledSelect
                  wrapperStyle={{ marginTop: spacing.x24 }}
                  items={organizationSizeOptions.map((item) => ({
                    text: item.text,
                    value: item.value,
                  }))}
                  label="Organization Size"
                  btnText={
                    organizationSize
                      ? organizationSizeOptions.find((item) => item.value === organizationSize)
                          ?.text || 'Select'
                      : 'Select'
                  }
                  selectedItem={organizationSize}
                  onChange={(item) => setOrganizationSize(item)}
                  modalTitle="Select Organization Size"
                  hideSearch
                  showAllWithoutSearch
                />
              </View>
            ) : null}

            <View
              style={[styles.inputGroup, { backgroundColor: colors.card, marginTop: spacing.x32 }]}
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
                        style={[Typography.body.x2M, { padding: spacing.x16, textAlign: 'center' }]}
                      >
                        No Search Results
                      </StyledText>
                    ) : null}
                    {searchInterest.map((item) => {
                      return (
                        <TouchableOpacity
                          key={item?._id ?? item?.name}
                          onPress={() =>
                            selectedInterest.includes(item?._id)
                              ? setSelectedInterest(
                                  selectedInterest.filter((selectedId) => selectedId !== item?._id)
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
                </View>
              </View>
            ) : null} */}
          <View
            style={{ paddingHorizontal: spacing.x24, marginBottom: spacing.x16, width: '100%' }}
          >
            <Button
              text="SAVE"
              disabled={website !== '' && isValidWebsite === false}
              onPress={async () => {
                let validWebsite = null;

                if (urlRegex.test(website)) {
                  validWebsite = true;
                } else {
                  validWebsite = false;
                }

                if (!website || (website && validWebsite === true)) {
                  const data: EditProfileDTO = {
                    churchType,
                    churchSubType: churchSubType === 'none' ? '' : churchSubType,
                    isChurchTypePublic: isPublicChurchTypeEnabled,
                    isLocationPublic: isPublicLocationEnabled,
                  };

                  if (fullname && user?.accountType === 'individual') data.name = fullname;
                  if (fullname && user?.accountType === 'organization') data.companyName = fullname;

                  if (organizationContactEmail && user?.accountType === 'organization')
                    data.contactEmail = organizationContactEmail;
                  if (organizationContactName && user?.accountType === 'organization')
                    data.contactName = organizationContactName;
                  if (organizationContactPhone && user?.accountType === 'organization')
                    data.contactPhoneNumber = organizationContactPhone;
                  if (organizationSize && user?.accountType === 'organization')
                    data.organizationSize = organizationSize;
                  if (selectedOrganizationCategory && user?.accountType === 'organization')
                    data.organizationCategory = selectedOrganizationCategory;

                  if (gender) data.gender = gender;
                  if (whatIDo) data.whatIDo = whatIDo;
                  if (selectedOrganizationType && selectedOrganizationType._id) {
                    data.typeOfOrganization = selectedOrganizationType._id;
                    data.organizationSubType =
                      selectedOrganizationType.organizationType ||
                      selectedOrganizationType.name ||
                      '';
                  }
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

                  if (user?.accountType === AccountType.individual) {
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
                } else {
                  setIsValidWebsite(validWebsite);
                  websiteRef.current?.focus();
                }
              }}
              btnStyle={[button.primary, { flex: 1 }]}
              disabledBtnStyle={[button.primary, { flex: 1, opacity: 0.5 }]}
              btnTextStyle={{ color: 'white' }}
            />
            {website && isValidWebsite === false ? (
              <StyledText style={{ color: Colors.errorFeedback[200], marginTop: spacing.x8 }}>
                Please correct all the fields with errors
              </StyledText>
            ) : null}
          </View>
        </View>
      </ScrollView>
      {/* {/* //   </KeyboardAvoidingView> */}
      {user ? (
        <SettingsSheet userData={user} showModal={showSettings} setShowModal={setShowSettings} />
      ) : null}
      {/* </SafeAreaView> */}
    </>
  );
}
export default EditProfile;
