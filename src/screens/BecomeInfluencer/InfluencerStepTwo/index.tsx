import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Animated,
  Image,
  ImageBackground,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Avatar, Checkbox, Provider, TextInput } from 'react-native-paper';
import SelectDropdown from 'react-native-select-dropdown';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { styles } from './styles';
import { validateFields } from '@/utils/validation/validate-fields';
import validator from '@/utils/validation/validator';
import Logo from '@/assets/svg/LogoBlue.svg';
import { GernalStyle } from '../../../constants/GernalStyle';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const InfluencerStepTwo = ({ navigation }) => {
  const inputRefs = {
    twitterUsername: useRef(null),
    instagramUsername: useRef(null),
    twitterHandler: useRef(null),
    instagramHandler: useRef(null),
    twitterTitle: useRef(null),
    instagramTitle: useRef(null),
    comments: useRef(null),
  };
  const [state, setState] = useState({
    twitterUsername: '',
    twitterUsernameError: '',
    instagramUsername: '',
    instagramUsernameError: '',
    twitterHandler: '',
    twitterHandlerError: '',
    instagramHandler: '',
    instagramHandlerError: '',
    twitterTitle: '',
    twitterTitleError: '',
    instagramTitle: '',
    instagramTitleError: '',
    comments: '',
    commentsError: '',
  });

  const onNext = async () => {
    const {
      twitterUsername,
      instagramUsername,
      twitterHandler,
      instagramHandler,
      twitterTitle,
      instagramTitle,
      comments,
    } = state;
    const twitterUsernameError = await validator('twitterUsername', twitterUsername);
    const instagramUsernameError = await validator('instagramUsername', instagramUsername);
    const twitterHandlerError = await validator('twitterHandler', twitterHandler);
    const instagramHandlerError = await validator('instagramHandler', instagramHandler);
    const twitterTitleError = await validator('twitterTitle', twitterTitle);
    const instagramTitleError = await validator('instagramTitle', instagramTitle);
    const commentsError = await validator('comments', comments);

    if (
      !twitterUsernameError &&
      !instagramUsernameError &&
      !twitterHandlerError &&
      !instagramHandlerError &&
      !twitterTitleError &&
      !instagramTitleError &&
      !commentsError
    ) {
      setModalVisible(true);
      //navigation.navigate('InfluencerStepThree',{data:{twitterUsername, instagramUsername,twitterHandler,instagramHandler,twitterTitle,instagramTitle,comments}})
    } else {
      console.log('error');
      setState({
        ...state,
        twitterUsernameError,
        instagramUsernameError,
        twitterHandlerError,
        instagramHandlerError,
        twitterTitleError,
        instagramTitleError,
        commentsError,
      });
    }
  };
  const changeHandler = (type, value) => setState({ ...state, [type]: value });
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <LinearGradient colors={['#fff', '#fff', '#E0EEF3']} style={styles.container}>
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
          Alert.alert('Modal has been closed.');
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
            <View style={{ marginTop: 30, marginLeft: 15, height: getHeight(65) }}>
              <Text
                style={{
                  color: '#4f6d77',
                  fontWeight: '700',
                  fontSize: getFontSize(2.3),

                  marginBottom: 10,
                  fontFamily: 'Rubik-Regular',
                }}
              >
                <Ionicons name="logo-twitter" color={'#032F3C'} size={20} /> Twitter handle
              </Text>
              <Text
                style={{
                  marginTop: 20,
                  color: '#032F3C',
                  fontWeight: '400',
                  fontFamily: 'Rubik-Regular',
                }}
              >
                {state.twitterUsername}
              </Text>
              <Text
                style={{
                  marginTop: 15,
                  color: '#032F3C',
                  fontWeight: '400',
                  fontFamily: 'Rubik-Regular',
                }}
              >
                {state.twitterHandler}
              </Text>
              <Text
                style={{
                  marginTop: 15,
                  color: '#032F3C',
                  fontWeight: '400',
                  fontFamily: 'Rubik-Regular',
                }}
              >
                {state.twitterTitle}
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
                <Ionicons name="logo-twitter" color={'#032F3C'} size={20} /> Instagram handle
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
              <Text
                style={{
                  marginTop: 15,
                  color: '#032F3C',
                  fontWeight: '400',
                  fontFamily: 'Rubik-Regular',
                }}
              >
                {state.instagramHandler}
              </Text>
              <Text
                style={{
                  marginTop: 15,
                  color: '#032F3C',
                  fontWeight: '400',
                  fontFamily: 'Rubik-Regular',
                }}
              >
                {state.instagramTitle}
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
              btnStyle={{ ...GernalStyle.btn, width: getWidth(80) }}
              btnTextStyle={GernalStyle.btnText}
              onPress={() => {
                setModalVisible(false);
                const {
                  twitterUsername,
                  instagramUsername,
                  twitterHandler,
                  instagramHandler,
                  twitterTitle,
                  instagramTitle,
                  comments,
                } = state;
                navigation.navigate('InfluencerStepThree', {
                  data: {
                    twitterUsername,
                    instagramUsername,
                    twitterHandler,
                    instagramHandler,
                    twitterTitle,
                    instagramTitle,
                    comments,
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

            <Text style={{ ...styles.text, color: '#4F6D77' }}>Step 1 of 3</Text>
            <Text
              style={{
                ...styles.heading,
                color: '#032F3C',
                marginTop: 12,
                fontFamily: 'Rubik-Medium',
              }}
            >
              Application
            </Text>
          </View>
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
              <Ionicons name="logo-twitter" size={20} /> Twitter handle
            </Text>

            <TextInput
              style={GernalStyle.input}
              ref={inputRefs.twitterUsername}
              value={state.twitterUsername}
              returnKeyType={'next'}
              mode="outlined"
              activeOutlineColor={'#5B7279'}
              outlineColor={'#9EA1A2'}
              theme={{ roundness: 10 }}
              label={'@Username'}
              onFocus={() => setState({ ...state, twitterUsernameError: '' })}
              onBlur={() =>
                validateFields(state.twitterUsername, 'twitterUsername', (error) =>
                  setState({ ...state, twitterUsernameError: error })
                )
              }
              onSubmitEditing={() => inputRefs.twitterHandler.current.focus()}
              onChangeText={(twitterUsername) =>
                changeHandler('twitterUsername', twitterUsername.trim())
              }
              blurOnSubmit={false}
            />
            <Text style={GernalStyle.InputError}>{state.twitterUsernameError}</Text>
            <TextInput
              style={GernalStyle.input}
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
              onSubmitEditing={() => inputRefs.twitterTitle.current.focus()}
              onChangeText={(twitterHandler) =>
                changeHandler('twitterHandler', twitterHandler.trim())
              }
              blurOnSubmit={false}
            />
            <Text style={GernalStyle.InputError}>{state.twitterHandlerError}</Text>

            <TextInput
              style={GernalStyle.input}
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
              onSubmitEditing={() => inputRefs.instagramUsername.current.focus()}
              onChangeText={(twitterTitle) => changeHandler('twitterTitle', twitterTitle.trim())}
              blurOnSubmit={false}
            />
            <Text style={GernalStyle.InputError}>{state.twitterTitleError}</Text>
            <Text style={styles.twetertext}>Add twitter handle</Text>

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
              <Ionicons name="logo-instagram" size={15} color={'#032F3C'} /> Instagram handle
            </Text>
            <TextInput
              style={GernalStyle.input}
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
              onSubmitEditing={() => inputRefs.instagramHandler.current.focus()}
              onChangeText={(instagramUsername) =>
                changeHandler('instagramUsername', instagramUsername.trim())
              }
              blurOnSubmit={false}
            />
            <Text style={GernalStyle.InputError}>{state.instagramUsernameError}</Text>
            <TextInput
              style={GernalStyle.input}
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
              onSubmitEditing={() => inputRefs.instagramTitle.current.focus()}
              onChangeText={(instagramHandler) =>
                changeHandler('instagramHandler', instagramHandler.trim())
              }
              blurOnSubmit={false}
            />
            <Text style={GernalStyle.InputError}>{state.instagramHandlerError}</Text>

            <TextInput
              style={GernalStyle.input}
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
              onSubmitEditing={() => inputRefs.comments.current.focus()}
              onChangeText={(instagramTitle) =>
                changeHandler('instagramTitle', instagramTitle.trim())
              }
              blurOnSubmit={false}
            />
            <Text style={GernalStyle.InputError}>{state.instagramTitleError}</Text>
            <Text style={styles.twetertext}>Add instagram handle</Text>
            <Text style={{ color: '#4F6D77', fontSize: 17, fontWeight: '500' }}>Comments</Text>

            <TextInput
              style={{ ...GernalStyle.input, height: getHeight(12) }}
              ref={inputRefs.comments}
              multiline={true}
              numberOfLines={5}
              value={state.comments}
              returnKeyType={'done'}
              mode="outlined"
              activeOutlineColor={'#5B7279'}
              theme={{ roundness: 10 }}
              // label={'Write comment or any other information related to app...'}
              outlineColor={'#9EA1A2'}
              onFocus={() => setState({ ...state, commentsError: '' })}
              onBlur={() =>
                validateFields(state.comments, 'comments', (error) =>
                  setState({ ...state, commentsError: error })
                )
              }
              onSubmitEditing={() => onNext()}
              onChangeText={(comments) => changeHandler('comments', comments.trim())}
              blurOnSubmit={false}
            />
            <Text style={GernalStyle.InputError}>{state.commentsError}</Text>
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
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.header}>
        <Icon name="chevron-back" style={{ margin: getFontSize(3) }} size={20} color={'#4F6D77'} />
      </TouchableOpacity>
    </LinearGradient>
  );
};
export default InfluencerStepTwo;
