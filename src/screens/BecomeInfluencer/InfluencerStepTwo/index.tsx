import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  Modal,
  TextInput as TextInputNative,
  Linking,
  ScrollView,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Button from '@/components/Button';
import { styles } from './styles';
import { validateFields } from '@/utils/validation/validate-fields';
import validator from '@/utils/validation/validator';
import Logo from '@/assets/svg/LogoBlue.svg';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';
import { BASE_URL } from '@/src/Services/constants';
import axios from 'axios';
import { useTheme } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

type Props = StackScreenProps<RootStackParamList, 'InfluencerStepTwo'>;

const InfluencerStepTwo = ({ navigation, route }: Props) => {
  const [token, setToken] = useState();

  const inputRefs = {
    twitterUsername: useRef<TextInputNative>(null),
    instagramUsername: useRef<TextInputNative>(null),
    instagramHandler: useRef<TextInputNative>(null),
    twitterTitle: useRef<TextInputNative>(null),
    instagramTitle: useRef<TextInputNative>(null),
    comments: useRef<TextInputNative>(null),
    bio: useRef<TextInputNative>(null),
    title: useRef<TextInputNative>(null),
    website: useRef<TextInputNative>(null),
    rssFeed1: useRef<TextInputNative>(null),
    rssFeed2: useRef<TextInputNative>(null),
  };
  const [state, setState] = useState({
    twitterUsername: '',
    twitterUsernameError: '',
    instagramUsername: '',
    instagramUsernameError: '',
    instagramId: '',
    instagramToken: '',
    instagramTokenExpiresAtReal: '',
    instagramTokenExpiresAt: '',
    instagramIdError: '',
    twitterTitle: '',
    twitterTitleError: '',
    instagramTitle: '',
    instagramTitleError: '',
    comments: '',
    commentsError: '',
    bio: '',
    bioError: '',
    title: '',
    titleError: '',
    website: '',
    websiteError: '',
    rssFeed1: '',
    rssFeed1Category: 'news',
    rssFeed1Error: '',
    rssFeed2: '',
    rssFeed2Category: 'news',
    rssFeed2Error: '',
  });

  const getInstagramData = async (
    accessToken: string,
    accessTokenExpiresAt: string,
    accessTokenExpiresAtReal: string
  ) => {
    try {
      const options = {
        method: 'GET',
        url: `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const result = await axios.request(options);
      setState({
        ...state,
        instagramUsername: result.data.username,
        instagramId: result.data.id,
        instagramToken: accessToken,
        instagramTokenExpiresAt: accessTokenExpiresAt,
        instagramTokenExpiresAtReal: accessTokenExpiresAtReal,
      });
      console.log(result);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (route.params?.code) {
      const getInstagramAuthToken = async () => {
        try {
          const options = {
            method: 'POST',
            url: `${BASE_URL}/auth/instagram-token`,
            data: {
              code: route.params?.code,
            },
            headers: {
              'Content-Type': 'application/json',
            },
          };

          const result = await axios.request(options);

          if (result && result.data?.access_token) {
            setToken(result.data?.access_token);
            getInstagramData(
              result.data?.access_token,
              result.data?.expiresAt,
              result.data?.expiresAtReal
            );
          }
        } catch (error: any) {
          console.log(error);
        }
      };
      getInstagramAuthToken();
    }
  }, [route.params]);

  const onNext = async () => {
    const { twitterUsername, instagramId, instagramTitle, comments, instagramToken } = state;
    const twitterUsernameError = await validator('twitterUsername', twitterUsername);

    const instagramIdError = await validator('instagramId', instagramId);

    const instagramTitleError = await validator('instagramTitle', instagramTitle);
    const commentsError = await validator('comments', comments);

    const dataSourcesError = instagramIdError && twitterUsernameError;

    if (!dataSourcesError && !commentsError) {
      setModalVisible(true);
      //navigation.navigate('InfluencerStepThree',{data:{twitterUsername, instagramUsername,twitterHandler,instagramHandler,twitterTitle,instagramTitle,comments}})
    } else {
      setState({
        ...state,
        twitterUsernameError,
        instagramIdError,
        instagramTitleError,
        commentsError,
      });
    }
  };
  const changeHandler = (type: string, value: string) => setState({ ...state, [type]: value });
  const [modalVisible, setModalVisible] = useState(false);

  const redirectUri = 'https://app.onebodyapp.com/influencer/login/instagram';
  const appId = '746127593378692';

  const { dark, colors } = useTheme();

  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Icon
              name="close"
              color={'#B3C1C5'}
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
              {state.twitterUsername ? (
                <>
                  <Text
                    style={{
                      color: '#4f6d77',
                      fontWeight: '700',
                      fontSize: getFontSize(2.3),

                      marginVertical: 10,
                      fontFamily: 'Rubik-Regular',
                    }}
                  >
                    <Ionicons name="logo-twitter" color={'#032F3C'} size={20} /> Twitter handle
                  </Text>

                  <Text
                    style={{
                      marginTop: 15,
                      color: '#032F3C',
                      fontWeight: '400',
                      fontFamily: 'Rubik-Regular',
                    }}
                  >
                    {state.twitterUsername}
                  </Text>
                </>
              ) : null}

              <Text
                style={{
                  color: '#4f6d77',
                  fontWeight: '700',
                  fontSize: getFontSize(2.3),
                  marginTop: getHeight(5),
                  marginBottom: 10,
                  fontFamily: 'Rubik-Regular',
                }}
              >
                <Ionicons name="logo-instagram" color={'#032F3C'} size={20} /> Instagram handle
              </Text>
              <Text
                style={{
                  marginTop: 20,
                  color: '#032F3C',
                  fontWeight: '400',
                  fontFamily: 'Rubik-Regular',
                }}
              >
                {state.instagramUsername}
              </Text>
              {state.rssFeed1 ? (
                <>
                  <Text
                    style={{
                      color: '#4f6d77',
                      fontWeight: '700',
                      fontSize: getFontSize(2.3),
                      marginTop: getHeight(5),
                      marginBottom: 10,
                      fontFamily: 'Rubik-Regular',
                    }}
                  >
                    RSS
                  </Text>
                  {state.rssFeed1 ? (
                    <Text
                      style={{
                        marginTop: 20,
                        color: '#032F3C',
                        fontWeight: '400',
                        fontFamily: 'Rubik-Regular',
                      }}
                    >
                      {state.rssFeed1Category} - {state.rssFeed1}
                    </Text>
                  ) : null}

                  {state.rssFeed2 ? (
                    <Text
                      style={{
                        marginTop: 20,
                        color: '#032F3C',
                        fontWeight: '400',
                        fontFamily: 'Rubik-Regular',
                      }}
                    >
                      {state.rssFeed2Category} - {state.rssFeed2}
                    </Text>
                  ) : null}
                </>
              ) : null}

              {/* <Text
                style={{
                  marginTop: 15,
                  color: '#032F3C',
                  fontWeight: '400',
                  fontFamily: 'Rubik-Regular',
                }}
              >
                {state.instagramTitle}
              </Text> */}

              <Text
                style={{
                  color: '#4f6d77',
                  fontWeight: '700',
                  fontSize: getFontSize(2.3),
                  marginTop: getHeight(5),
                  marginBottom: 10,
                  fontFamily: 'Rubik-Regular',
                }}
              >
                Bio
              </Text>
              <Text
                style={{
                  marginTop: 20,
                  color: '#032F3C',
                  fontWeight: '400',
                  fontFamily: 'Rubik-Regular',
                }}
              >
                {state.bio}
              </Text>

              <Text
                style={{
                  color: '#4f6d77',
                  fontWeight: '700',
                  fontSize: getFontSize(2.3),
                  marginTop: getHeight(5),
                  marginBottom: 10,
                  fontFamily: 'Rubik-Regular',
                }}
              >
                Comments
              </Text>
              <Text
                style={{
                  marginTop: 20,
                  color: '#032F3C',
                  fontWeight: '400',
                  fontFamily: 'Rubik-Regular',
                }}
              >
                {state.comments}
              </Text>
            </View>
            <Button
              text={'DONE'}
              btnStyle={{ ...GeneralStyle.btn, backgroundColor: '#032F3C' }}
              btnTextStyle={GeneralStyle.btnText}
              onPress={() => {
                setModalVisible(false);
                const {
                  twitterUsername,
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
                    twitterUsername,
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
                fontFamily: 'Rubik-Medium',
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
            returnKeyType={'next'}
            mode="outlined"
            activeOutlineColor={colors.primary}
            outlineColor={'#9EA1A2'}
            theme={{
              roundness: 10,
              dark: dark,
              colors: { text: colors.text, placeholder: colors.primary },
            }}
            label={'Website'}
            onFocus={() => setState({ ...state, websiteError: '' })}
            onBlur={() =>
              validateFields(state.website, 'website', (error) =>
                setState({ ...state, websiteError: error })
              )
            }
            onSubmitEditing={() => inputRefs.twitterUsername.current?.focus()}
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
            multiline={true}
            numberOfLines={5}
            value={state.bio}
            returnKeyType={'next'}
            mode="outlined"
            activeOutlineColor={colors.primary}
            outlineColor={'#9EA1A2'}
            theme={{
              roundness: 10,
              dark: dark,
              colors: { text: colors.text, placeholder: colors.primary },
            }}
            onFocus={() => setState({ ...state, bioError: '' })}
            onBlur={() =>
              validateFields(state.bio, 'bio', (error) => setState({ ...state, bioError: error }))
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
            multiline={true}
            numberOfLines={5}
            value={state.comments}
            returnKeyType={'done'}
            mode="outlined"
            activeOutlineColor={colors.primary}
            outlineColor={'#9EA1A2'}
            theme={{
              roundness: 10,
              dark: dark,
              colors: { text: colors.text, placeholder: colors.primary },
            }}
            onFocus={() => setState({ ...state, commentsError: '' })}
            onBlur={() =>
              validateFields(state.comments, 'comments', (error) =>
                setState({ ...state, commentsError: error })
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
                fontFamily: 'Rubik-Regular',
              }}
            >
              <Ionicons name="logo-twitter" size={20} /> Twitter
            </Text>

            <TextInput
              style={{
                ...GeneralStyle.input,
                backgroundColor: colors.background,
              }}
              ref={inputRefs.twitterUsername}
              value={state.twitterUsername}
              returnKeyType={'next'}
              mode="outlined"
              activeOutlineColor={colors.primary}
              outlineColor={'#9EA1A2'}
              theme={{
                roundness: 10,
                dark: dark,
                colors: { text: colors.text, placeholder: colors.primary },
              }}
              label={'@Username'}
              onFocus={() => setState({ ...state, twitterUsernameError: '' })}
              onSubmitEditing={() => inputRefs.twitterUsername.current?.focus()}
              onChangeText={(twitterUsername) => {
                if (twitterUsername)
                  changeHandler(
                    'twitterUsername',
                    twitterUsername[0] != '@'
                      ? `@${twitterUsername.toLowerCase().trim()}`
                      : twitterUsername.toLowerCase().trim()
                  );
              }}
              blurOnSubmit={false}
            />
            <Text style={GeneralStyle.InputError}>{state.twitterUsernameError}</Text>
            {/* <TextInput
              style={GeneralStyle.input}
              ref={inputRefs.twitterHandler}
              value={state.twitterHandler}
              returnKeyType={'next'}
              mode="outlined"
              activeOutlineColor={'#5B7279'}
              theme={{ roundness: 10 }}
              outlineColor={'#9EA1A2'}
              label={'Twitter link'}
              onFocus={() => setState({ ...state, twitterHandlerError: '' })}
              onBlur={() =>
                validateFields(state.twitterHandler, 'twitterHandler', (error) =>
                  setState({ ...state, twitterHandlerError: error })
                )
              }
              onSubmitEditing={() => inputRefs.twitterTitle.current?.focus()}
              onChangeText={(twitterHandler) =>
                changeHandler('twitterHandler', twitterHandler.trim())
              }
              blurOnSubmit={false}
            />
            <Text style={GeneralStyle.InputError}>{state.twitterHandlerError}</Text>

            <TextInput
              style={GeneralStyle.input}
              ref={inputRefs.twitterTitle}
              value={state.twitterTitle}
              returnKeyType={'next'}
              mode="outlined"
              activeOutlineColor={'#5B7279'}
              theme={{ roundness: 10 }}
              outlineColor={'#9EA1A2'}
              label={'Title/Description'}
              onFocus={() => setState({ ...state, twitterTitleError: '' })}
              onBlur={() =>
                validateFields(state.twitterTitle, 'twitterTitle', (error) =>
                  setState({ ...state, twitterTitleError: error })
                )
              }
              onSubmitEditing={() => inputRefs.instagramUsername.current?.focus()}
              onChangeText={(twitterTitle) => changeHandler('twitterTitle', twitterTitle.trim())}
              blurOnSubmit={false}
            />
            <Text style={GeneralStyle.InputError}>{state.twitterTitleError}</Text>
            <Text style={styles.twetertext}>Add twitter handle</Text> */}

            <Text
              style={{
                color: '#4f6d77',
                fontWeight: '700',
                fontSize: getFontSize(2.3),
                marginTop: getHeight(3),
                marginBottom: 10,
                fontFamily: 'Rubik-Regular',
              }}
            >
              <Ionicons name="logo-instagram" size={15} color={'#032F3C'} /> Instagram
            </Text>
            {state.instagramUsername ? (
              <Text>Logged in as @{state.instagramUsername}</Text>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  Linking.openURL(
                    `https://api.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code`
                  );
                }}
                style={{ ...styles.btn2, backgroundColor: colors.background }}
              >
                <Text style={{ color: colors.text }}>Authenticate with Instagram</Text>
              </TouchableOpacity>
            )}

            {/* <TextInput
              style={GeneralStyle.input}
              ref={inputRefs.instagramUsername}
              value={state.instagramUsername}
              returnKeyType={'next'}
              theme={{ roundness: 10 }}
              mode="outlined"
              activeOutlineColor={'#5B7279'}
              outlineColor={'#9EA1A2'}
              label={'@Username'}
              onFocus={() => setState({ ...state, instagramUsernameError: '' })}
              onBlur={() =>
                validateFields(state.instagramUsername, 'instagramUsername', (error) =>
                  setState({ ...state, instagramUsernameError: error })
                )
              }
              onSubmitEditing={() => inputRefs.instagramHandler.current?.focus()}
              onChangeText={(instagramUsername) =>
                changeHandler('instagramUsername', instagramUsername.trim())
              }
              blurOnSubmit={false}
            />
            <Text style={GeneralStyle.InputError}>{state.instagramUsernameError}</Text>
            <TextInput
              style={GeneralStyle.input}
              ref={inputRefs.instagramHandler}
              value={state.instagramHandler}
              returnKeyType={'next'}
              mode="outlined"
              activeOutlineColor={'#5B7279'}
              theme={{ roundness: 10 }}
              outlineColor={'#9EA1A2'}
              label={'Twitter link'}
              onFocus={() => setState({ ...state, instagramHandlerError: '' })}
              onBlur={() =>
                validateFields(state.instagramHandler, 'instagramHandler', (error) =>
                  setState({ ...state, instagramHandlerError: error })
                )
              }
              onSubmitEditing={() => inputRefs.instagramTitle.current?.focus()}
              onChangeText={(instagramHandler) =>
                changeHandler('instagramHandler', instagramHandler.trim())
              }
              blurOnSubmit={false}
            />
            <Text style={GeneralStyle.InputError}>{state.instagramHandlerError}</Text>

            <TextInput
              style={GeneralStyle.input}
              ref={inputRefs.instagramTitle}
              value={state.instagramTitle}
              returnKeyType={'next'}
              mode="outlined"
              activeOutlineColor={'#5B7279'}
              theme={{ roundness: 10 }}
              outlineColor={'#9EA1A2'}
              label={'Title/Description'}
              onFocus={() => setState({ ...state, instagramTitleError: '' })}
              onBlur={() =>
                validateFields(state.instagramTitle, 'instagramTitle', (error) =>
                  setState({ ...state, instagramTitleError: error })
                )
              }
              onSubmitEditing={() => inputRefs.comments.current?.focus()}
              onChangeText={(instagramTitle) =>
                changeHandler('instagramTitle', instagramTitle.trim())
              }
              blurOnSubmit={false}
            />
            <Text style={GeneralStyle.InputError}>{state.instagramTitleError}</Text>
            <Text style={styles.twetertext}>Add instagram handle</Text> */}
            <Text
              style={{
                color: '#4f6d77',
                fontWeight: '700',
                fontSize: getFontSize(2.3),
                marginTop: getHeight(3),
                marginBottom: 10,
                fontFamily: 'Rubik-Regular',
              }}
            >
              RSS
            </Text>

            <>
              <TextInput
                style={{
                  ...GeneralStyle.input,
                  backgroundColor: colors.background,
                }}
                ref={inputRefs.rssFeed1}
                value={state.rssFeed1}
                returnKeyType={'next'}
                mode="outlined"
                activeOutlineColor={colors.primary}
                outlineColor={'#9EA1A2'}
                theme={{
                  roundness: 10,
                  dark: dark,
                  colors: { text: colors.text, placeholder: colors.primary },
                }}
                label={'URL'}
                onFocus={() => setState({ ...state, rssFeed1Error: '' })}
                onSubmitEditing={() => inputRefs.rssFeed1.current?.focus()}
                onChangeText={(rssFeed1) => changeHandler('rssFeed1', rssFeed1.trim())}
                blurOnSubmit={false}
              />
              <Text style={GeneralStyle.InputError}>{state.rssFeed1Error}</Text>

              <Picker
                selectedValue={state.rssFeed1Category}
                onValueChange={(itemValue, itemIndex) => {
                  setState({ ...state, rssFeed1Category: itemValue });
                }}
              >
                <Picker.Item label="News" value="news" />
                <Picker.Item label="Blog" value="blog" />
              </Picker>
            </>

            {state.rssFeed1 ? (
              <>
                <TextInput
                  style={{
                    ...GeneralStyle.input,
                    backgroundColor: colors.background,
                  }}
                  ref={inputRefs.rssFeed2}
                  value={state.rssFeed2}
                  returnKeyType={'next'}
                  mode="outlined"
                  activeOutlineColor={colors.primary}
                  outlineColor={'#9EA1A2'}
                  theme={{
                    roundness: 10,
                    dark: dark,
                    colors: { text: colors.text, placeholder: colors.primary },
                  }}
                  label={'URL'}
                  onFocus={() => setState({ ...state, rssFeed2Error: '' })}
                  onSubmitEditing={() => inputRefs.rssFeed2.current?.focus()}
                  onChangeText={(rssFeed2) => changeHandler('rssFeed2', rssFeed2.trim())}
                  blurOnSubmit={false}
                />
                <Text style={GeneralStyle.InputError}>{state.rssFeed2Error}</Text>
                <Picker
                  selectedValue={state.rssFeed2Category}
                  onValueChange={(itemValue, itemIndex) =>
                    setState({ ...state, rssFeed2Category: itemValue })
                  }
                >
                  <Picker.Item label="News" value="blog" />
                  <Picker.Item label="Blog" value="news" />
                </Picker>
              </>
            ) : null}
          </View>
          <View style={{ height: getHeight(10) }} />
        </KeyboardAwareScrollView>
      </View>
      <View style={styles.foter}>
        <ImageBackground
          resizeMode="stretch"
          style={styles.wavebgimage}
          source={require('@/assets/images/waveBG.png')}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={getFontSize(3)} />
            <Text style={styles.footerText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={styles.progressBarStatus} />
          </View>

          <TouchableOpacity
            onPress={() => onNext()}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={styles.footerText}>Next</Text>
            <Ionicons name="chevron-forward" size={getFontSize(3)} />
          </TouchableOpacity>
        </ImageBackground>
      </View>
    </View>
  );
};
export default InfluencerStepTwo;
