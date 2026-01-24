import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  Alert,
  View,
  TouchableOpacity,
  Animated,
  Keyboard,
  ActivityIndicator,
  TextInput,
  Easing,
  InteractionManager,
  Platform,
  StyleSheet,
  RefreshControl,
  StatusBar,
  useColorScheme,
  Image,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import Recaptcha, { RecaptchaRef } from 'react-native-recaptcha-that-works';

// Styles & Constraints
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import { button } from '@/src/styles/buttons';

// Logic & Types
import {
  sendVerificationEmail as sendVerificationEmailAction,
  signUp,
} from '@/src/redux/actions/AuthActions';
import { setAccountType } from '@/src/redux/actions/GeneralActions';
import { ApiCall } from '@/src/services/api';
import validator from '@/utils/validation/validator';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import StyledText from '@/components/styled/Text';
import Button from '@/components/Button';
import StyledTextInput from '@/components/styled/TextInput';
import { OpenURLButton, PRIVACY_POLICY_URL, TERMS_CONDITIONS_URL } from '@/services/constants';
import { appColor } from '@/src/constants';
import GeneralStyle from '@/src/constants/GeneralStyle';

const brandWhite = '#f6f6f7';
const googleIcon = require('@/assets/icons/google.png');

const initialFormState = {
  username: '',
  usernameError: '',
  name: '',
  nameError: '',
  email: '',
  emailError: '',
  password: '',
  passwordError: '',
  cPassword: '',
  cPasswordError: '',
};

type SignupPalette = {
  background: string;
  card: string;
  cardBorder: string;
  textMain: string;
  textSecondary: string;
  primary: string;
  divider: string;
  inputBg: string;
  inputBorder: string;
  placeholder: string;
  errorBorder: string;
};

const InputField = React.forwardRef(
  (
    {
      label,
      error,
      rightIcon,
      wrapperStyle,
      inputWrapperStyle,
      palette,
      ...props
    }: {
      label: string;
      error?: string;
      rightIcon?: React.ReactNode;
      wrapperStyle?: object;
      inputWrapperStyle?: object;
      palette: SignupPalette;
    } & React.ComponentProps<typeof TextInput>,
    ref: any
  ) => {
    const [focused, setFocused] = useState(false);
    const {
      value,
      placeholder,
      onFocus,
      onBlur,
      autoCapitalize,
      autoCorrect,
      keyboardType,
      secureTextEntry,
      onChangeText,
      onSubmitEditing,
      editable,
      maxLength,
      multiline,
      returnKeyType,
      textContentType,
      autoComplete,
      accessibilityLabel,
      testID,
      selectionColor,
    } = props;
    const hidePlaceholder = focused || !!(value && value.length > 0);
    let borderColor = palette.inputBorder;
    if (focused) {
      borderColor = palette.primary;
    }
    if (error) {
      borderColor = palette.errorBorder;
    }

    return (
      <View style={[styles.inputContainer, wrapperStyle]}>
        {error ? <StyledText style={styles.errorText}>{error}</StyledText> : null}
        <StyledText style={[styles.inputLabel, { color: palette.textMain }]}>{label}</StyledText>
        <StyledTextInput
          ref={ref}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholder={hidePlaceholder ? '' : placeholder}
          placeholderTextColor={palette.placeholder}
          inputWrapperStyle={{
            borderColor,
            backgroundColor: palette.inputBg,
            borderRadius: 12,
            minHeight: 54,
            ...inputWrapperStyle,
          }}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          editable={editable}
          maxLength={maxLength}
          multiline={multiline}
          returnKeyType={returnKeyType}
          textContentType={textContentType}
          autoComplete={autoComplete}
          accessibilityLabel={accessibilityLabel}
          testID={testID}
          selectionColor={selectionColor}
          rightIcon={rightIcon as any}
        />
      </View>
    );
  }
);

type Props = StackScreenProps<MainStackParamList, 'SignUp'>;

function SignupForm({ navigation, route }: Props) {
  const recaptcha = useRef<RecaptchaRef | null>(null);
  const { accountType } = route.params;
  const authState = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const inputRefs = {
    username: useRef<TextInput>(null),
    name: useRef<TextInput>(null),
    email: useRef<TextInput>(null),
    password: useRef<TextInput>(null),
    cPassword: useRef<TextInput>(null),
  };

  const dropShadow = {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  };

  const [state, setState] = useState(initialFormState);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [hidePass, setHidePass] = useState(true);
  const [loading, setIsloading] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPasswordInteracted, setHasPasswordInteracted] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const hasSentVerificationEmailRef = useRef(false);
  const { dark, colors } = useTheme();
  const colorScheme = useColorScheme();
  const statusBarStyle = colorScheme === 'dark' ? 'light-content' : 'dark-content';

  const palette: SignupPalette = {
    background: Colors.neutral[700],
    card: dark ? '#0D0D0D' : '#FFFFFF',
    cardBorder: dark ? 'rgba(255, 255, 255, 0.08)' : '#F2F3F3',
    textMain: dark ? '#FFFFF7' : '#032F3C',
    textSecondary: dark ? '#999DA1' : '#5A5C5B',
    primary: '#126B87',
    divider: dark ? 'rgba(255, 255, 255, 0.08)' : '#F2F3F3',
    inputBg: dark ? '#202328' : '#F2F3F3',
    inputBorder: dark ? 'rgba(255, 255, 255, 0.08)' : '#F2F3F3',
    placeholder: dark ? '#999DA1' : '#838584',
    errorBorder: Colors.errorFeedback[200],
  };

  const showSocialUnavailable = useCallback(() => {
    Alert.alert(
      'Coming soon',
      'Social sign-in is temporarily unavailable while we migrate authentication. Please use email/password.'
    );
  }, []);

  const normalizeUsername = useCallback((value: string) => {
    return value?.toLowerCase().trim().replace(/\s+/g, '') ?? '';
  }, []);

  const generateUsernameSuggestions = useCallback(
    (rawUsername: string, rawName?: string) => {
      const base = normalizeUsername(rawUsername);
      const normalizedName = normalizeUsername(rawName ?? '');
      const nameBase = normalizedName.length >= 3 ? normalizedName.slice(0, 12) : '';

      const candidates = [
        `${base}1`,
        `${base}2`,
        `${base}3`,
        nameBase ? `${nameBase}1` : '',
        nameBase ? `${nameBase}${base.slice(0, 4)}` : '',
      ].filter(Boolean);

      const unique = Array.from(new Set(candidates)).filter((v) => v.length >= 3);
      return unique.slice(0, 5);
    },
    [normalizeUsername]
  );

  // Set accountType in Redux when screen loads so social login can access it
  useEffect(() => {
    if (accountType) {
      dispatch(setAccountType(accountType));
    }
  }, [accountType, dispatch]);

  // Social signup is temporarily disabled during JWT migration.

  const orbitAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const fieldsAnim = useRef(new Animated.Value(0)).current;
  const hasStartedAnimation = useRef(false);

  const passwordRules = {
    sixCharsOrMore: state.password.length >= 6,
    number: /[0-9]/.test(state.password),
    specialChar: /[#?!@$%^&*-]/.test(state.password),
    uppercase: /[A-Z]/.test(state.password),
  };

  const confirmPasswordError =
    hasPasswordInteracted &&
    (!passwordRules.sixCharsOrMore ||
      !passwordRules.number ||
      !passwordRules.specialChar ||
      !passwordRules.uppercase ||
      state.password !== state.cPassword)
      ? 'Passwords must match and meet security standards.'
      : state.cPasswordError;

  const isSubmitDisabled =
    loading ||
    !state.email ||
    !state.password ||
    !state.cPassword ||
    !state.username ||
    !state.name ||
    !accountType ||
    state.emailError !== '' ||
    state.passwordError !== '' ||
    state.cPasswordError !== '' ||
    state.usernameError !== '' ||
    state.nameError !== '' ||
    state.password !== state.cPassword ||
    !passwordRules.sixCharsOrMore ||
    !passwordRules.number ||
    !passwordRules.specialChar ||
    !passwordRules.uppercase;

  const onRefresh = () => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[Signup] onRefresh triggered - clearing all fields');
    }
    setRefreshing(true);
    setIsloading(false);
    setHidePass(true);
    setShowPasswordHint(false);
    setHasPasswordInteracted(false);
    setState(initialFormState);
    setTimeout(() => {
      setRefreshing(false);
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[Signup] onRefresh complete');
      }
    }, 400);
  };

  const signUpUser = async () => {
    setIsloading(true);
    setFormError('');
    setFormSuccess('');
    const { email, password, cPassword, username, name } = state;
    const emailError = await validator('email', email);
    const passwordError = await validator('password', password);
    const cPasswordError = await validator('cPassword', cPassword, { password });
    const usernameError = username ? '' : 'Username is required';
    const nameError = name ? '' : 'Name is required';

    if (!emailError && !passwordError && !cPasswordError && !usernameError && !nameError) {
      if (password === cPassword) {
        const data = { email };
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[SignUp] Validating user email with data:', JSON.stringify(data, null, 2));
        }
        const userValidation = await ApiCall({
          route: 'user/validateUserInfo',
          params: data,
          verb: 'post',
        });
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log(
            '[SignUp] Validation response:',
            userValidation.status,
            JSON.stringify(userValidation.response, null, 2)
          );
        }

        if (userValidation.status === 200) {
          recaptcha.current?.open();
        } else {
          setIsloading(false);
          if (userValidation.status === 409) {
            setState((prev) => ({
              ...prev,
              emailError:
                'Email already in use. If you already have an account, use "Forgot password" to set or reset your password and sign in.',
            }));
            return;
          }
          setFormError(
            userValidation.response?.message ??
              'Unable to validate account. Please check your connection.'
          );
        }
      } else {
        setIsloading(false);
        setState((prev) => ({
          ...prev,
          cPasswordError: 'Both passwords must match.',
        }));
      }
    } else {
      setIsloading(false);
      setState({
        ...state,
        emailError,
        passwordError,
        cPasswordError,
        usernameError,
        nameError,
      });
      setFormError('Please complete all required fields.');
      Keyboard.dismiss();
    }
  };

  const changeHandler = (type: string, value: string) => {
    const errorField = `${type}Error`;
    setFormError('');
    setFormSuccess('');
    if (type === 'username') {
      setUsernameSuggestions([]);
    }
    setState((prev) => ({
      ...prev,
      [type]: value,
      [errorField]: '',
    }));
  };

  const checkUsernameAvailability = async (username: string) => {
    const normalized = normalizeUsername(username);
    if (normalized && normalized !== state.username) {
      setState((prev) => ({ ...prev, username: normalized }));
    }

    if (!normalized || normalized.length < 3) {
      setState((prev) => ({
        ...prev,
        usernameError:
          normalized.length > 0 && normalized.length < 3
            ? 'Usernames must be at least 3 characters'
            : '',
      }));
      setUsernameSuggestions([]);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const userValidation = await ApiCall({
        route: 'user/validateUsername',
        params: { username: normalized },
        verb: 'post',
      });

      if (userValidation.status === 200) {
        setState((prev) => ({ ...prev, usernameError: '' }));
        setUsernameSuggestions([]);
      } else if (userValidation.status === 409) {
        setState((prev) => ({
          ...prev,
          usernameError: 'This username is already in use. If it belongs to you, please sign in.',
        }));
        setUsernameSuggestions(generateUsernameSuggestions(normalized, state.name));
      }
    } catch (error) {
      // Silently fail - validation will happen on submit anyway
    } finally {
      setIsCheckingUsername(false);
    }
  };
  const isIos = Platform.OS === 'ios';
  const createAccountRadius =
    typeof button.primary.borderRadius === 'number' ? button.primary.borderRadius : 60;
  const createAccountGlassFill = 'rgba(18, 107, 135, 0.75)';

  const onVerify = () => {
    const { email, password, name, username } = state;
    dispatch(
      signUp.Request({
        data: {
          email,
          name,
          username,
          password,
          accountType,
        },
      })
    );
  };

  useEffect(() => {
    if (authState.signUpSuccess) {
      const handleSignUpSuccess = async () => {
        if (!hasSentVerificationEmailRef.current) {
          hasSentVerificationEmailRef.current = true;
          dispatch(
            sendVerificationEmailAction.Request({
              token: true,
              data: {},
              allowFalseSuccess: true,
            })
          );
        }

        setFormError('');
        setFormSuccess('Welcome to the family! Check your inbox to verify your account.');
        setIsloading(false);

        navigation.replace('ConfirmLogin', { showConfirmationEmailMessage: true } as any);
      };

      handleSignUpSuccess();
    }
    return () => {
      dispatch(signUp.Reset());
    };
  }, [authState.signUpSuccess, dispatch, navigation]);

  useEffect(() => {
    if (authState.signUpSuccess === false && authState.error) {
      const displayError = Array.isArray(authState.error)
        ? authState.error.join(', ')
        : (authState.error ?? 'Something went wrong. Please try again.');
      setFormSuccess('');
      setFormError(displayError);
      const lower = displayError.toLowerCase();
      const isUsernameTaken =
        lower.includes('username already') ||
        lower.includes('username is already') ||
        (lower.includes('username') && lower.includes('exists'));
      if (isUsernameTaken) {
        setState((prev) => ({
          ...prev,
          usernameError: 'Username is unavailable. Choose a unique name for your profile.',
        }));
        setUsernameSuggestions(generateUsernameSuggestions(state.username, state.name));
      }
      setIsloading(false);
    }
  }, [
    authState.signUpSuccess,
    authState.error,
    generateUsernameSuggestions,
    state.name,
    state.username,
  ]);

  useEffect(() => {
    if (hasStartedAnimation.current) {
      return undefined;
    }
    const task = InteractionManager.runAfterInteractions(() => {
      hasStartedAnimation.current = true;
      Animated.sequence([
        Animated.delay(120),
        Animated.parallel([
          Animated.timing(textAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(orbitAnim, {
            toValue: 1,
            duration: 1400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(fieldsAnim, {
            toValue: 1,
            duration: 1400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
    return () => {
      task.cancel();
    };
  }, [fieldsAnim, orbitAnim, textAnim]);

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setBarStyle(statusBarStyle);
      }
      setState(initialFormState);
      setHidePass(true);
      setShowPasswordHint(false);
      setHasPasswordInteracted(false);
      setIsloading(false);
    }, [statusBarStyle])
  );

  const orbitStyle = {
    transform: [
      {
        translateY: orbitAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-40, 0],
        }),
      },
    ],
    opacity: orbitAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
  };

  const textPopStyle = {
    opacity: textAnim,
    transform: [
      {
        scale: textAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
      {
        translateY: textAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 0],
        }),
      },
    ],
  };

  const fieldsPopStyle = {
    opacity: fieldsAnim,
    transform: [
      {
        translateY: fieldsAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-45, 0],
        }),
      },
    ],
  };

  return (
    <>
      {Platform.OS === 'android' && (
        <StatusBar backgroundColor={colors.background} barStyle={statusBarStyle} />
      )}
      <UserStepsLayout
        backgroundColor={Colors.neutral[700]}
        showCustomHeaderOnAndroid
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.brand}
          />
        }
      >
        <Animated.View
          style={[
            { marginTop: spacing.x20, marginBottom: spacing.x10, marginHorizontal: spacing.x20 },
            textPopStyle,
          ]}
        >
          <StyledText style={[styles.headerTitle, { color: palette.textMain }]}>
            Create your account
          </StyledText>
          {accountType ? (
            <StyledText
              style={[styles.headerAccountType, { color: palette.textMain, marginTop: spacing.x5 }]}
            >
              {accountType === 'individual'
                ? 'Personal Account (Individual)'
                : 'Ministry Account (Organization)'}
            </StyledText>
          ) : null}
          <StyledText
            style={[styles.headerSubtitle, { color: palette.textSecondary, marginTop: spacing.x8 }]}
          >
            Create your profile to start connecting with the Body.
          </StyledText>
        </Animated.View>

        <Animated.View
          style={[
            styles.cardContainer,
            {
              backgroundColor: palette.card,
              borderColor: palette.cardBorder,
            },
            fieldsPopStyle,
          ]}
        >
          <TouchableOpacity style={styles.signInRow} onPress={() => navigation.replace('Login')}>
            <StyledText style={{ color: palette.textSecondary }}>Already a member? </StyledText>
            <StyledText style={{ color: palette.primary }}>Sign in here</StyledText>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: palette.divider }]} />
            <StyledText style={[styles.orText, { color: palette.textSecondary }]}>or</StyledText>
            <View style={[styles.dividerLine, { backgroundColor: palette.divider }]} />
          </View>

          <Animated.View style={[{ marginTop: spacing.x5, alignItems: 'center' }, orbitStyle]}>
            <View style={styles.socialIconsRow}>
              <TouchableOpacity
                style={[
                  styles.socialBtn,
                  { borderColor: palette.inputBorder, backgroundColor: palette.card },
                ]}
                onPress={showSocialUnavailable}
              >
                <Image source={googleIcon} style={styles.socialIcon} />
              </TouchableOpacity>

              {Platform.OS === 'ios' ? (
                <TouchableOpacity
                  style={[
                    styles.socialBtn,
                    { borderColor: palette.inputBorder, backgroundColor: palette.card },
                  ]}
                  onPress={showSocialUnavailable}
                >
                  <Ionicons name="logo-apple" size={30} color={dark ? '#FFFFF7' : '#212121'} />
                </TouchableOpacity>
              ) : null}
            </View>
          </Animated.View>
          {formSuccess ? (
            <View
              style={[
                GeneralStyle.MessageView,
                { backgroundColor: Colors.successFeedback.background, marginBottom: spacing.x16 },
              ]}
            >
              <StyledText style={GeneralStyle.successtext}>{formSuccess}</StyledText>
            </View>
          ) : null}
          {formError ? (
            <View style={{ marginBottom: spacing.x16 }}>
              <StyledText style={[styles.errorText, { marginBottom: spacing.x8 }]}>
                {formError}
              </StyledText>
              {typeof formError === 'string' &&
              formError.toLowerCase().includes('already in use') ? (
                <Button
                  text="Sign in to your existing account"
                  onPress={() => navigation.navigate('Login')}
                  btnTextStyle={[Typography.subheader.R, { color: Colors.primary.brand }]}
                  btnStyle={{ backgroundColor: 'transparent' }}
                />
              ) : null}
            </View>
          ) : null}

          <InputField
            ref={inputRefs.username}
            label="Create a Username"
            palette={palette}
            placeholder={state.username ? '' : 'e.g. brother_john'}
            value={state.username}
            error={state.usernameError}
            autoCapitalize="none"
            autoCorrect={false}
            rightIcon={
              isCheckingUsername ? (
                <View style={{ justifyContent: 'center', paddingRight: spacing.x8 }}>
                  <ActivityIndicator size="small" color={Colors.primary.brand} />
                </View>
              ) : undefined
            }
            onChangeText={(username: string) =>
              changeHandler('username', normalizeUsername(username))
            }
            onBlur={() => checkUsernameAvailability(state.username)}
            onSubmitEditing={() => inputRefs.name.current?.focus()}
          />
          {usernameSuggestions.length > 0 ? (
            <View style={{ marginTop: spacing.x8, marginBottom: spacing.x8 }}>
              <StyledText style={[Typography.subheader.R, { color: Colors.neutral[300] }]}>
                Suggested usernames:
              </StyledText>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  marginTop: spacing.x8,
                }}
              >
                {usernameSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    onPress={() => {
                      changeHandler('username', suggestion);
                      checkUsernameAvailability(suggestion);
                    }}
                    style={{
                      paddingHorizontal: spacing.x13,
                      paddingVertical: spacing.x8,
                      borderRadius: borderRadius.small,
                      backgroundColor: Colors.neutral[700],
                      borderWidth: 1,
                      borderColor: Colors.neutral[800],
                      marginRight: spacing.x8,
                      marginBottom: spacing.x8,
                    }}
                  >
                    <StyledText style={[Typography.subheader.R, { color: Colors.neutral[200] }]}>
                      {suggestion}
                    </StyledText>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => {
                  navigation.replace('Login');
                }}
                style={{ marginTop: spacing.x13 }}
              >
                <StyledText style={[Typography.subheader.R, { color: Colors.primary.brand }]}>
                  Belong to you? Sign in to access your profile.
                </StyledText>
              </TouchableOpacity>
            </View>
          ) : null}

          <InputField
            ref={inputRefs.name}
            label={accountType === 'individual' ? 'Display Name' : 'Organization / Ministry Name'}
            palette={palette}
            placeholder={state.name ? '' : 'How should we address you?'}
            value={state.name}
            error={state.nameError}
            autoCapitalize="words"
            onChangeText={(name: string) => changeHandler('name', name)}
            onSubmitEditing={() => inputRefs.email.current?.focus()}
          />

          <InputField
            ref={inputRefs.email}
            label="Email Address"
            palette={palette}
            placeholder={state.email ? '' : 'email@example.com'}
            value={state.email}
            error={state.emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(email: string) => changeHandler('email', email.trim())}
            onSubmitEditing={() => inputRefs.password.current?.focus()}
          />

          <InputField
            ref={inputRefs.password}
            label="Create a Password"
            palette={palette}
            placeholder={state.password ? '' : 'Enter a secure password'}
            secureTextEntry={hidePass}
            value={state.password}
            error={state.passwordError}
            autoCapitalize="none"
            onFocus={() => {
              setShowPasswordHint(true);
              setHasPasswordInteracted(true);
            }}
            onChangeText={(password: string) => changeHandler('password', password)}
            onSubmitEditing={() => inputRefs.cPassword.current?.focus()}
            rightIcon={
              <MaterialCommunityIcons
                name={hidePass ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color="#41dbe1"
                onPress={() => setHidePass(!hidePass)}
                style={{ alignSelf: 'center' }}
              />
            }
          />
          {showPasswordHint ? (
            <View style={{ marginBottom: spacing.x16 }}>
              <StyledText style={{ color: dark ? brandWhite : Colors.primary.brand, fontSize: 12 }}>
                Security Requirements:
              </StyledText>
              {[
                { key: 'sixCharsOrMore', label: 'Minimum 6 characters' },
                { key: 'number', label: 'Includes a number' },
                { key: 'specialChar', label: 'Includes a special character' },
                { key: 'uppercase', label: 'Includes an uppercase letter' },
              ].map((rule) => {
                const satisfied = passwordRules[rule.key as keyof typeof passwordRules];
                const color = satisfied ? '#1DB954' : '#E35640';
                const iconName = satisfied ? 'check-circle' : 'close-circle';
                return (
                  <View
                    key={rule.key}
                    style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.x5 }}
                  >
                    <MaterialCommunityIcons name={iconName} size={16} color={color} />
                    <StyledText style={{ color, fontSize: 12, marginLeft: spacing.x8 }}>
                      {rule.label}
                    </StyledText>
                  </View>
                );
              })}
            </View>
          ) : null}

          <InputField
            ref={inputRefs.cPassword}
            label="Confirm Password"
            palette={palette}
            placeholder={state.cPassword ? '' : 'Re-enter password for security'}
            secureTextEntry={hidePass}
            value={state.cPassword}
            error={confirmPasswordError}
            autoCapitalize="none"
            onChangeText={(cPassword: string) => changeHandler('cPassword', cPassword)}
            onSubmitEditing={signUpUser}
            rightIcon={
              <MaterialCommunityIcons
                name={hidePass ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color="#41dbe1"
                onPress={() => setHidePass(!hidePass)}
                style={{ alignSelf: 'center' }}
              />
            }
          />

          <Recaptcha
            ref={recaptcha}
            siteKey="6Ld3BoolAAAAAIZJUxipD6Xdv1mOXZfXnW71A0o_"
            baseUrl="http://www.onebodyapp.com"
            onVerify={onVerify}
            size="invisible"
          />

          {isIos ? (
            <View
              style={[
                dropShadow,
                {
                  marginTop: spacing.x20,
                  width: '100%',
                  alignSelf: 'stretch',
                  borderRadius: createAccountRadius,
                  overflow: 'hidden',
                  opacity: isSubmitDisabled ? 0.4 : 1,
                },
              ]}
            >
              <BlurView
                pointerEvents="none"
                blurType={dark ? 'dark' : 'light'}
                blurAmount={18}
                reducedTransparencyFallbackColor={Colors.primarySapphire.brand}
                style={StyleSheet.absoluteFillObject}
              />
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFillObject, { backgroundColor: createAccountGlassFill }]}
              />
              <Button
                text="Join the Body"
                btnStyle={[
                  button.primary,
                  {
                    width: '100%',
                    alignSelf: 'stretch',
                    backgroundColor: 'transparent',
                  },
                ]}
                btnTextStyle={{ color: '#FFF' }}
                wrapperViewBtnStyle={{ width: '100%' }}
                onPress={signUpUser}
                disabled={isSubmitDisabled || !!confirmPasswordError}
              />
            </View>
          ) : (
            <Button
              text="Join the Body"
              btnStyle={[
                button.primary,
                dropShadow,
                {
                  marginTop: spacing.x20,
                  width: '100%',
                  alignSelf: 'stretch',
                  opacity: isSubmitDisabled ? 0.4 : 1,
                },
              ]}
              btnTextStyle={{ color: '#FFF' }}
              wrapperViewBtnStyle={{ width: '100%' }}
              onPress={signUpUser}
              disabled={isSubmitDisabled || !!confirmPasswordError}
            />
          )}

          <View style={{ marginTop: spacing.x16 }}>
            <StyledText style={{ color: Colors.neutral[300], fontSize: 12 }}>
              By joining, you agree to our{' '}
              <StyledText
                style={{
                  color: dark ? appColor.SecoundryColor : Colors.primary.brand,
                  textDecorationLine: 'underline',
                }}
                onPress={() => OpenURLButton(TERMS_CONDITIONS_URL)}
              >
                Community Standards
              </StyledText>{' '}
              &{' '}
              <StyledText
                style={{
                  color: dark ? appColor.SecoundryColor : Colors.primary.brand,
                  textDecorationLine: 'underline',
                }}
                onPress={() => OpenURLButton(PRIVACY_POLICY_URL)}
              >
                Privacy Policy
              </StyledText>
            </StyledText>
          </View>
        </Animated.View>
      </UserStepsLayout>
    </>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: spacing.x8,
    paddingVertical: spacing.x8,
    width: '100%',
  },
  inputLabel: {
    marginBottom: spacing.x10,
    fontSize: 14,
  },
  errorText: {
    color: Colors.errorFeedback[200],
    fontSize: 12,
    marginBottom: spacing.x5,
  },
  cardContainer: {
    marginHorizontal: spacing.x16,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.x60,
    width: '97%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  headerTitle: {
    fontFamily: 'Rubik',
    fontWeight: '600',
    fontSize: 34,
    lineHeight: 40,
  },
  headerAccountType: {
    fontFamily: 'Lato',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontFamily: 'Lato',
    fontSize: 16,
    lineHeight: 24,
  },
  signInRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.x10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.x16,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 10,
    fontFamily: 'Lato',
    fontSize: 16,
  },
  socialIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginTop: spacing.x8,
    marginBottom: spacing.x13,
  },
  socialBtn: {
    width: 64,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
});

export default SignupForm;
