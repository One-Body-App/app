import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { ArrowDown2 } from 'iconsax-react-native';
import { CommonActions, useTheme } from '@react-navigation/native';
import { serialize } from 'object-to-formdata';
import isEmpty from 'lodash/isEmpty';
import { useToast } from 'react-native-toast-notifications';
import FastImage from '@/components/primitives/FastImage';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import Button from '@/components/Button';
import type { MapSuggestion } from '@/components/MapBoxTypes';
import { sanitizeComposerText } from '@/components/composer/composerText';
import StyledText from '@/components/styled/Text';
import StyledTextInput from '@/components/styled/TextInput';
import { HomeStackParamsList, PrayerWallStackParamsList } from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { PrayerWallCategory } from '@/utils/types';
import Anonymous from '@/assets/svg/anonymous.svg';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import StyledSelect from '@/components/styled/Select';
import Header from '@/components/Header';
import GoBackIcon from '@/components/GoBackIcon';

type Props = NativeStackScreenProps<PrayerWallStackParamsList, 'Prayer'>;

function NewPrayer({ navigation, route }: Props) {
  const MAX_CONTENT_LENGHT = 300;
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [postType, setPostType] = useState<PrayerWallCategory>();

  const token = useSelector((state: RootState) => state.auth.userToken);

  const [location, setLocation] = useState<MapSuggestion | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const { colors, dark } = useTheme();
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const toast = useToast();

  const resetToPrayerWallIndex = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          {
            name: 'MainRoot',
          },
          {
            name: 'PrayerWall',
            params: {
              screen: 'index',
            },
          },
        ],
      })
    );
  }, [navigation]);

  const resetToHomePrayerFeed = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'MainRoot',
            params: {
              screen: 'Main',
              params: {
                screen: 'HomeTab',
                params: {
                  screen: 'Home',
                  params: {
                    selectedTab: 'pray' as HomeStackParamsList['Home']['selectedTab'],
                    refreshToken: Date.now(),
                  },
                },
              },
            },
          },
        ],
      })
    );
  }, [navigation]);

  const navigateAfterSubmit = useCallback(
    (reason: 'create' | 'edit') => {
      const currentRoute = navigation.getState().routes[navigation.getState().index]?.name;
      const returnTo = route.params?.returnTo;
      if (__DEV__) {
        console.log('[NewPrayer] submit success navigation', {
          reason,
          canGoBack: navigation.canGoBack(),
          currentRoute,
          returnTo,
        });
      }
      if (returnTo === 'home_pray') {
        resetToHomePrayerFeed();
        return;
      }

      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }

      resetToPrayerWallIndex();
    },
    [navigation, resetToHomePrayerFeed, resetToPrayerWallIndex, route.params?.returnTo]
  );

  const editPrayer = async () => {
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: `prayer/${route.params?.postId}`,
        token,
        params: serialize(
          {
            content,
            category: postType,
            // location: location
            //   ? {
            //       coordinates: location?.geometry.coordinates,
            //       name: location?.place_name,
            //     }
            //   : undefined,
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

      if (result.status === 200) {
        setContent('');
        navigateAfterSubmit('edit');
      }
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
    }
  };

  const postPrayer = async () => {
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: 'prayer',
        token,
        params: serialize(
          {
            content,
            private: isPrivate,
            category: postType?.toLowerCase(),
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

      if (result.status === 200) {
        setContent('');
        navigateAfterSubmit('create');
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
        if (e.moderationTypeFailure === 'text') {
          message =
            'This post was screened because it violates our Terms of Use. Please be courteous and thoughtful about what you post. Abuse or profane content is prohibited in the One Body community.';
        }
      } else if (e.message === 'Network Error') {
        message = 'Network Error. Please try again later.';
      }
      toast.show(message, {
        type: 'danger',
        placement: 'bottom',
      });
    }
  };

  const getPostPrayer = useCallback(async () => {
    if (!route.params?.postId) return;
    setIsLoading(true);
    try {
      const result = await ApiCall({
        route: `prayer/${route.params?.postId}`,
        token,

        verb: 'get',
      });

      setIsLoading(false);

      if (result.status === 200) {
        setContent(result.response.content);

        if (!isEmpty(result.response?.location)) {
          setLocation(result.response?.location);
        }

        setPostType(result.response?.category);
      }
    } catch (e) {
      setIsLoading(false);
    }
  }, [route.params?.postId, token]);

  useEffect(() => {
    getPostPrayer();
  }, [getPostPrayer]);

  const screenTitle = route.params?.postId ? 'Edit a Prayer' : 'How can we pray with you?';
  const androidHeaderWrapperStyle =
    Platform.OS === 'android'
      ? {
          marginHorizontal: -spacing.x24,
          paddingVertical: spacing.x20,
          backgroundColor: dark ? '#0D0D0D' : '#f6f6f7',
        }
      : undefined;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        marginHorizontal: spacing.x24,
      }}
    >
      {Platform.OS === 'android' ? (
        <View style={androidHeaderWrapperStyle}>
          <Header
            title={screenTitle}
            hideBorder
            leftView={<GoBackIcon color={dark ? colors.text : Colors.primary.brand} />}
            RightView={<View style={{ width: 20 }} />}
          />
        </View>
      ) : null}
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
            <View style={{ marginBottom: spacing.x20 }}>
              <View style={{ flexDirection: 'row', columnGap: spacing.x16 }}>
                <Pressable
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: spacing.x10,
                    borderRadius: borderRadius.button,
                    backgroundColor: Colors.neutral[700],
                    paddingVertical: 15,
                  }}
                  onPress={() => setIsPrivate(!isPrivate)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ marginRight: spacing.x10 }}>
                      {isPrivate ? (
                        <Anonymous color={Colors.main.black} />
                      ) : (
                        <FastImage
                          source={{
                            uri: user?.profileImage || NO_PROFILE_IMAGE,
                          }}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: borderRadius.max,
                            borderColor: !user?.profileImage ? '#032F3C' : '#09aadb',
                            borderWidth: borderWidth.thin,
                          }}
                          resizeMode="contain"
                        />
                      )}
                    </View>

                    <StyledText>{isPrivate ? 'Private' : 'Public'}</StyledText>

                    <ArrowDown2
                      size={20}
                      color={Colors.primarySapphire.brand}
                      style={{ marginLeft: spacing.x10 }}
                    />
                  </View>
                </Pressable>

                <StyledSelect
                  wrapperStyle={{ flex: 1 }}
                  wrapperViewBtnStyle={{ flex: 1 }}
                  btnStyle={{
                    flex: 1,
                    backgroundColor: Colors.neutral[700],
                    borderColor: Colors.neutral[800],
                    borderRadius: borderRadius.button,
                  }}
                  wrapperBtnStyle={{
                    justifyContent: 'space-between',
                    paddingHorizontal: spacing.x10,
                    paddingVertical: 15,
                  }}
                  rightIcon={<ArrowDown2 size={20} color={Colors.primarySapphire.brand} />}
                  selectedItem={postType}
                  items={[
                    {
                      text: PrayerWallCategory.Request,
                      value: PrayerWallCategory.Request,
                      iconName: 'hands-pray',
                      description: 'Ask the community to pray with you',
                    },
                    {
                      text: PrayerWallCategory.Exhortation,
                      value: PrayerWallCategory.Exhortation,
                      iconName: 'hand-heart-outline',
                      description: 'Encourage and uplift others',
                    },
                    {
                      text: PrayerWallCategory.Testimony,
                      value: PrayerWallCategory.Testimony,
                      iconName: 'star-four-points-outline',
                      description: 'Share what God has done',
                    },
                  ]}
                  btnText={postType || 'Prayer Type'}
                  modalTitle="Select prayer type"
                  modalSubtitle="Choose how you'd like to share"
                  onChange={(item: PrayerWallCategory) => {
                    setPostType(item);
                  }}
                  hideSearch
                />
              </View>
            </View>

            <View style={{ marginBottom: spacing.x32 }}>
              <StyledText style={{ marginBottom: 10 }}>Write Prayer</StyledText>
              <StyledTextInput
                inputStyle={{
                  height: 200,
                  flexGrow: 1,
                  color: colors.text,
                  textAlignVertical: 'top',
                }}
                inputWrapperStyle={{
                  paddingVertical: spacing.x10,
                  borderRadius: borderRadius.base,
                }}
                value={content}
                multiline
                returnKeyType="next"
                maxLength={MAX_CONTENT_LENGHT}
                showCharCounter
                maxLengthErrorMessage="This message exceeds the character limit."
                label=""
                autoCorrect
                placeholder="What's on your heart?"
                placeholderTextColor={Colors.neutral[300]}
                // onSubmitEditing={() => inputRefs.password?.current.focus()}
                onChangeText={(value) => {
                  setContent(sanitizeComposerText(value, MAX_CONTENT_LENGHT));
                }}
              />
            </View>
            <Button
              disabled={
                isLoading ||
                (!location && !content) ||
                !postType ||
                (!!content && content.length > MAX_CONTENT_LENGHT)
              }
              onPress={() => {
                if (route.params?.postId) {
                  editPrayer();
                } else {
                  postPrayer();
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
                      {route.params?.postId ? 'Edit Prayer' : 'Post Prayer'}
                    </StyledText>
                  )}
                </>
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default NewPrayer;
