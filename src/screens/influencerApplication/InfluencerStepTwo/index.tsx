/* eslint-disable react/jsx-no-useless-fragment */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  TextInput as TextInputNative,
  useColorScheme,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import Ionicons from '@react-native-vector-icons/ionicons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { useSelector } from 'react-redux';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import BrandPaletteBackground from '@/components/BrandPaletteBackground';

import Button from '@/components/Button';
import { styles } from './styles';
import { validateFields } from '@/utils/validation/validate-fields';
import Logo from '@/assets/svg/LogoBlue.svg';
import GeneralStyle from '../../../constants/GeneralStyle';

import {
  OpenURLButton,
  getInstagramAuthToken,
  INSTAGRAM_APP_ID,
  INSTAGRAM_LOGIN_REDIRECT,
} from '@/services/constants';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { SettingsStackParamsList } from '@/src/navigator/types';

type Props = StackScreenProps<SettingsStackParamsList, 'InfluencerStepTwo'>;

function InfluencerStepTwo({ navigation, route }: Props) {
  const userToken = useSelector((state: RootState) => state.auth.userToken);
  const inputRefs = {
    bio: useRef<TextInputNative>(null),
    comments: useRef<TextInputNative>(null),
    website: useRef<TextInputNative>(null),
    rssFeed1: useRef<TextInputNative>(null),
    rssFeed2: useRef<TextInputNative>(null),
  };
  const [state, setState] = useState({
    instagramUsername: '',
    instagramId: '',
    instagramToken: '',
    instagramTokenExpiresAtReal: '',
    instagramTokenExpiresAt: '',
    comments: '',
    commentsError: '',
    bio: '',
    bioError: '',
    website: '',
    websiteError: '',
    rssFeed1: '',
    rssFeed1Category: 'news',
    rssFeed1Error: '',
    rssFeed2: '',
    rssFeed2Category: 'news',
    rssFeed2Error: '',
  });

  const [modalVisible, setModalVisible] = useState(false);
  const { dark, colors } = useTheme();
  const scheme = useColorScheme();

  useEffect(() => {
    if (route.params?.action === 'instagram' && route.params?.code) {
      getInstagramAuthToken(route.params.code, userToken, INSTAGRAM_LOGIN_REDIRECT).then(
        (result) => {
          if (!result) {
            return;
          }
          setState((current) => ({
            ...current,
            ...result,
          }));
        }
      );
    }
  }, [route.params, userToken]);

  const onNext = async () => {
    const bioError = state.bio.trim() ? '' : 'Bio is required';

    if (!bioError) {
      setModalVisible(true);
      return;
    }

    setState((current) => ({
      ...current,
      bioError,
    }));
  };

  const changeHandler = (type: string, value: string) =>
    setState((current) => ({ ...current, [type]: value }));

  const getButtonTextStyle = () => {
    return { ...styles.btnTitle, color: scheme == 'dark' ? '#838383' : '#032F3C' };
  };

  const getButtonContainer = () => {
    return { ...styles.buttonContainer, borderColor: colors.border };
  };

  const getDisabledButtonTextStyle = () => {
    return {
      ...styles.disabledBtnTextStyle,
      color: scheme == 'dark' ? '#3a3a3a' : '#B3C1C5',
      borderColor: colors.border,
    };
  };

  const getDisabledButtonStyle = () => {
    return { ...styles.disabledButtonContainer, borderColor: colors.border };
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <BrandPaletteBackground />
          <View style={styles.modalView}>
            <Ionicons
              name="close"
              color="#B3C1C5"
              style={{ alignSelf: 'flex-end' }}
              onPress={() => setModalVisible(false)}
              size={getFontSize(3)}
            />
            <Text
              style={{
                ...styles.heading,
                color: '#032F3C',
                marginTop: 6,
                fontWeight: '500',
              }}
            >
              Confirm details
            </Text>
            <View style={{ marginTop: 0, marginLeft: 15, height: getHeight(65) }}>
              {state.instagramUsername ? (
                <>
                  <Text
                    style={{
                      color: '#4f6d77',
                      fontWeight: '700',
                      fontSize: getFontSize(2.3),
                      marginTop: getHeight(5),
                      marginBottom: 10,
                      fontFamily: 'OpenSans-Regular',
                    }}
                  >
                    <Ionicons name="logo-instagram" color="#032F3C" size={20} /> Instagram handle
                  </Text>
                  <Text
                    style={{
                      marginTop: 20,
                      color: '#032F3C',
                      fontWeight: '400',
                      fontFamily: 'OpenSans-Regular',
                    }}
                  >
                    {state.instagramUsername}
                  </Text>
                </>
              ) : null}

              {state.rssFeed1 ? (
                <>
                  <Text
                    style={{
                      color: '#4f6d77',
                      fontWeight: '700',
                      fontSize: getFontSize(2.3),
                      marginTop: getHeight(5),
                      marginBottom: 10,
                      fontFamily: 'OpenSans-Regular',
                    }}
                  >
                    RSS
                  </Text>
                  <Text
                    style={{
                      marginTop: 20,
                      color: '#032F3C',
                      fontWeight: '400',
                      fontFamily: 'OpenSans-Regular',
                    }}
                  >
                    {state.rssFeed1Category} - {state.rssFeed1}
                  </Text>

                  {state.rssFeed2 ? (
                    <Text
                      style={{
                        marginTop: 20,
                        color: '#032F3C',
                        fontWeight: '400',
                        fontFamily: 'OpenSans-Regular',
                      }}
                    >
                      {state.rssFeed2Category} - {state.rssFeed2}
                    </Text>
                  ) : null}
                </>
              ) : null}

              <Text
                style={{
                  color: '#4f6d77',
                  fontWeight: '700',
                  fontSize: getFontSize(2.3),
                  marginTop: getHeight(5),
                  marginBottom: 10,
                  fontFamily: 'OpenSans-Regular',
                }}
              >
                Bio
              </Text>
              <Text
                style={{
                  marginTop: 20,
                  color: '#032F3C',
                  fontWeight: '400',
                  fontFamily: 'OpenSans-Regular',
                }}
              >
                {state.bio}
              </Text>

              {state.comments ? (
                <>
                  <Text
                    style={{
                      color: '#4f6d77',
                      fontWeight: '700',
                      fontSize: getFontSize(2.3),
                      marginTop: getHeight(5),
                      marginBottom: 10,
                      fontFamily: 'OpenSans-Regular',
                    }}
                  >
                    Comments
                  </Text>
                  <Text
                    style={{
                      marginTop: 20,
                      color: '#032F3C',
                      fontWeight: '400',
                      fontFamily: 'OpenSans-Regular',
                    }}
                  >
                    {state.comments}
                  </Text>
                </>
              ) : null}
            </View>
            <Button
              text="DONE"
              btnStyle={{ backgroundColor: '#032F3C' }}
              onPress={() => {
                setModalVisible(false);
                const {
                  instagramUsername,
                  instagramId,
                  instagramToken,
                  instagramTokenExpiresAt,
                  instagramTokenExpiresAtReal,
                  bio,
                  comments,
                  website,
                  rssFeed1,
                  rssFeed1Category,
                  rssFeed2,
                  rssFeed2Category,
                } = state;

                navigation.navigate('InfluencerStepThree', {
                  data: {
                    instagramUsername,
                    instagramToken,
                    instagramId,
                    instagramTokenExpiresAt,
                    instagramTokenExpiresAtReal,
                    bio,
                    comments,
                    website,
                    rssFeed1,
                    rssFeed1Category,
                    rssFeed2,
                    rssFeed2Category,
                  },
                });
              }}
            />
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text
                style={{
                  color: '#70747D',
                  justifyContent: 'center',
                  alignSelf: 'center',
                  alignItems: 'center',
                  marginTop: getHeight(2),
                }}
              >
                Edit details
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.innerContainer}>
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.formstepview}>
            <Logo
              height={getHeight(14)}
              width={getWidth(40)}
              style={{ margin: getHeight(4), alignSelf: 'center' }}
            />

            <Text style={{ ...styles.text, color: '#4F6D77' }}>Step 2 of 3</Text>
            <Text
              style={{
                ...styles.heading,
                color: dark ? colors.text : '#032F3C',
                marginVertical: 12,
                fontFamily: 'OpenSans-Medium',
              }}
            >
              Application
            </Text>
          </View>

          <TextInput
            keyboardType="url"
            style={{ ...GeneralStyle.input, backgroundColor: colors.background }}
            ref={inputRefs.website}
            value={state.website}
            returnKeyType="next"
            mode="outlined"
            activeOutlineColor={colors.primary}
            outlineColor="#9EA1A2"
            theme={{
              roundness: 10,
              dark,
              colors: { text: colors.text, placeholder: colors.primary },
            }}
            label="Website"
            onFocus={() => setState((current) => ({ ...current, websiteError: '' }))}
            onBlur={() =>
              validateFields(state.website, 'website', (error) =>
                setState((current) => ({ ...current, websiteError: error }))
              )
            }
            onSubmitEditing={() => inputRefs.bio.current?.focus()}
            onChangeText={(website) => changeHandler('website', website.trim())}
            blurOnSubmit={false}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={GeneralStyle.InputError}>{state.websiteError}</Text>
          <Text style={{ color: '#4F6D77', fontSize: 17, fontWeight: '500', marginTop: 10 }}>
            Bio
          </Text>

          <TextInput
            style={{
              ...GeneralStyle.input,
              backgroundColor: colors.background,
              height: getHeight(12),
            }}
            ref={inputRefs.bio}
            multiline
            numberOfLines={5}
            value={state.bio}
            returnKeyType="next"
            mode="outlined"
            activeOutlineColor={colors.primary}
            outlineColor="#9EA1A2"
            theme={{
              roundness: 10,
              dark,
              colors: { text: colors.text, placeholder: colors.primary },
            }}
            onFocus={() => setState((current) => ({ ...current, bioError: '' }))}
            onBlur={() =>
              validateFields(state.bio, 'bio', (error) =>
                setState((current) => ({ ...current, bioError: error }))
              )
            }
            onSubmitEditing={() => onNext()}
            onChangeText={(bio) => changeHandler('bio', bio)}
            blurOnSubmit={false}
          />
          <Text style={GeneralStyle.InputError}>{state.bioError}</Text>
          <Text style={{ color: '#4F6D77', fontSize: 17, fontWeight: '500' }}>Comments</Text>

          <TextInput
            style={{
              ...GeneralStyle.input,
              backgroundColor: colors.background,
              height: getHeight(12),
            }}
            ref={inputRefs.comments}
            multiline
            numberOfLines={5}
            value={state.comments}
            returnKeyType="done"
            mode="outlined"
            activeOutlineColor={colors.primary}
            outlineColor="#9EA1A2"
            theme={{
              roundness: 10,
              dark,
              colors: { text: colors.text, placeholder: colors.primary },
            }}
            onFocus={() => setState((current) => ({ ...current, commentsError: '' }))}
            onBlur={() =>
              validateFields(state.comments, 'comments', (error) =>
                setState((current) => ({ ...current, commentsError: error }))
              )
            }
            onSubmitEditing={() => onNext()}
            onChangeText={(comments) => changeHandler('comments', comments)}
            blurOnSubmit={false}
          />
          <Text style={GeneralStyle.InputError}>{state.commentsError}</Text>
          <View style={{ justifyContent: 'flex-start', marginTop: getHeight(3) }}>
            <Text
              style={{
                color: '#4f6d77',
                fontWeight: '700',
                fontSize: getFontSize(2.3),
                marginBottom: 10,
                fontFamily: 'OpenSans-Regular',
              }}
            >
              <Ionicons name="logo-instagram" size={15} color="#032F3C" /> Instagram
            </Text>
            {state.instagramUsername ? (
              <Text>Connected as @{state.instagramUsername}</Text>
            ) : (
              <Button
                text="Connect Instagram Account"
                btnStyle={getButtonContainer()}
                btnTextStyle={getButtonTextStyle()}
                onPress={() => {
                  OpenURLButton(
                    `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${INSTAGRAM_LOGIN_REDIRECT}&scope=user_profile,user_media&response_type=code`,
                    false,
                    true,
                    INSTAGRAM_LOGIN_REDIRECT
                  );
                }}
                disabledBtnStyle={getDisabledButtonStyle()}
                disabledBtnTextStyle={getDisabledButtonTextStyle()}
                wrapperBtnStyle={{
                  width: '100%',
                  paddingVertical: 10,
                }}
              />
            )}

            <Text
              style={{
                color: '#4f6d77',
                fontWeight: '700',
                fontSize: getFontSize(2.3),
                marginTop: getHeight(3),
                marginBottom: 10,
                fontFamily: 'OpenSans-Regular',
              }}
            >
              RSS
            </Text>

            <TextInput
              style={{
                ...GeneralStyle.input,
                backgroundColor: colors.background,
              }}
              ref={inputRefs.rssFeed1}
              value={state.rssFeed1}
              returnKeyType="next"
              mode="outlined"
              activeOutlineColor={colors.primary}
              outlineColor="#9EA1A2"
              theme={{
                roundness: 10,
                dark,
                colors: { text: colors.text, placeholder: colors.primary },
              }}
              label="URL"
              onFocus={() => setState((current) => ({ ...current, rssFeed1Error: '' }))}
              onSubmitEditing={() => inputRefs.rssFeed1.current?.focus()}
              onChangeText={(rssFeed1) => changeHandler('rssFeed1', rssFeed1.trim())}
              blurOnSubmit={false}
            />
            <Text style={GeneralStyle.InputError}>{state.rssFeed1Error}</Text>

            <Picker
              selectedValue={state.rssFeed1Category}
              onValueChange={(itemValue) => {
                setState((current) => ({ ...current, rssFeed1Category: itemValue }));
              }}
            >
              <Picker.Item label="News" value="news" />
              <Picker.Item label="Blog" value="blog" />
            </Picker>

            {state.rssFeed1 ? (
              <>
                <TextInput
                  style={{
                    ...GeneralStyle.input,
                    backgroundColor: colors.background,
                  }}
                  ref={inputRefs.rssFeed2}
                  value={state.rssFeed2}
                  returnKeyType="next"
                  mode="outlined"
                  activeOutlineColor={colors.primary}
                  outlineColor="#9EA1A2"
                  theme={{
                    roundness: 10,
                    dark,
                    colors: { text: colors.text, placeholder: colors.primary },
                  }}
                  label="Secondary RSS URL"
                  onFocus={() => setState((current) => ({ ...current, rssFeed2Error: '' }))}
                  onChangeText={(rssFeed2) => changeHandler('rssFeed2', rssFeed2.trim())}
                  blurOnSubmit={false}
                />
                <Text style={GeneralStyle.InputError}>{state.rssFeed2Error}</Text>

                <Picker
                  selectedValue={state.rssFeed2Category}
                  onValueChange={(itemValue) => {
                    setState((current) => ({ ...current, rssFeed2Category: itemValue }));
                  }}
                >
                  <Picker.Item label="News" value="news" />
                  <Picker.Item label="Blog" value="blog" />
                </Picker>
              </>
            ) : null}
          </View>

          <Button text="NEXT" btnStyle={{ backgroundColor: '#032F3C' }} onPress={onNext} />
        </KeyboardAwareScrollView>
      </View>
    </View>
  );
}

export default InfluencerStepTwo;
