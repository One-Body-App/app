import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Keyboard,
  TextInput,
  Easing,
  InteractionManager,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useDispatch, useSelector } from 'react-redux';
import { createUserWithEmailAndPassword, getAuth, getIdToken } from '@react-native-firebase/auth';
import { StackScreenProps } from '@react-navigation/stack';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import Recaptcha, { RecaptchaRef } from 'react-native-recaptcha-that-works';
import Toast from 'react-native-simple-toast';

// Styles & Constraints
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import { button } from '@/src/styles/buttons';

// Logic & Types
import { signUp } from '@/src/redux/actions/AuthActions';
import { ApiCall } from '@/src/services/api';
import validator from '@/utils/validation/validator';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { MainStackParamList } from '@/src/navigator/types';
import UserStepsLayout from '../layout/UserStepsLayout';
import StyledText from '@/components/styled/Text';
import SignupButtons from '@/components/SignupButtons';
import Button from '@/components/Button';
import StyledTextInput from '@/components/styled/TextInput';
import { OpenURLButton, PRIVACY_POLICY_URL, TERMS_CONDITIONS_URL } from '@/services/constants';
import { appColor } from '@/src/constants';

const brandWhite = '#f6f6f7';

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

const InputField = React.forwardRef(
  (
    {
      label,
      error,
      rightIcon,
      wrapperStyle,
      inputWrapperStyle,
      isDark,
      ...props
    }: {
      label: string;
      error?: string;
      rightIcon?: React.ReactNode;
      wrapperStyle?: object;
      inputWrapperStyle?: object;
      isDark: boolean;
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
      defaultValue,
    } = props;
    const { 200: errorBorderColor } = Colors.errorFeedback;
    const { 900: neutral900, 600: neutral600 } = Colors.neutral;
    const hidePlaceholder = focused || !!(value && value.length > 0);
    let borderColor = isDark ? neutral900 : neutral600;
    if (focused) {
      borderColor = appColor.SecoundryColor;
    }
    if (error) {
      borderColor = errorBorderColor;
    }

    return (
      <View style={[styles.inputContainer, wrapperStyle]}>
        <StyledText style={[styles.inputLabel, isDark ? { color: brandWhite } : undefined]}>
          {label}
        </StyledText>
        <StyledTextInput
          ref={ref}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholder={hidePlaceholder ? '' : placeholder}
          placeholderTextColor={Colors.neutral[400]}
          inputWrapperStyle={{
            borderColor,
            backgroundColor: isDark ? Colors.neutral[800] : Colors.neutral[700],
            borderRadius: borderRadius.small,
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
          defaultValue={defaultValue}
          rightIcon={rightIcon as any}
        />
        {error ? (
          <StyledText style={{ color: Colors.errorFeedback[200], fontSize: 12, marginTop: 4 }}>
            {error}
          </StyledText>
        ) : null}
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
  const firebaseAuth = getAuth();

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

  const [hidePass, setHidePass] = useState(true);
  const [loading, setIsloading] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPasswordInteracted, setHasPasswordInteracted] = useState(false);
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
      ? 'Both passwords must match and meet requirements.'
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
    setRefreshing(true);
    setIsloading(false);
    setHidePass(true);
    setShowPasswordHint(false);
    setState({
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
    });
    setTimeout(() => setRefreshing(false), 400);
  };

  const signUpUser = async () => {
    setIsloading(true);
    const { email, password, cPassword, username, name } = state;
    const emailError = await validator('email', email);
    const passwordError = await validator('password', password);
    const cPasswordError = await validator('cPassword', cPassword, { password });
    const usernameError = username ? '' : 'Username is required';
    const nameError = name ? '' : 'Name is required';

    if (!emailError && !passwordError && !cPasswordError && !usernameError && !nameError) {
      if (password === cPassword) {
        const data = { email, name, accountType, userId: '', username };
        const userValidation = await ApiCall({
          route: 'user/validateUserInfo',
          params: data,
          verb: 'post',
        });

        if (userValidation.status === 200) {
          recaptcha.current?.open();
        } else {
          setIsloading(false);
          if (userValidation.status === 409) {
            setState((prev) => ({
              ...prev,
              emailError: 'User already exists. Try again with a different email account!',
            }));
          }
          Toast.show(
            userValidation.response?.message ??
              'Unable to validate this account. Please try again.',
            Toast.SHORT
          );
        }
      } else {
        setIsloading(false);
        setState((prev) => ({
          ...prev,
          cPasswordError: 'Both passwords must match.',
        }));
        Toast.show('Both passwords must match.', Toast.SHORT);
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
      Keyboard.dismiss();
      Toast.show('Please fix the highlighted fields.', Toast.SHORT);
    }
  };

  const changeHandler = (type: string, value: string) =>
    setState((prev) => ({
      ...prev,
      [type]: value,
      ...(type === 'email' ? { emailError: '' } : {}),
    }));
  const { dark } = useTheme();

  const onVerify = () => {
    const { email, password, name, username } = state;
    const data = { email, name, accountType, userId: '', username };

    return createUserWithEmailAndPassword(firebaseAuth, email, password)
      .then(async (user) => {
        const idToken = await getIdToken(user.user);
        data.userId = user.user.uid;
        dispatch(signUp.Request({ data, token: idToken }));
      })
      .catch((err) => {
        Toast.show(err?.message ?? 'Unable to create account. Please try again.', Toast.SHORT);
        setIsloading(false);
      });
  };

  useEffect(() => {
    if (authState.signUpSuccess) {
      Toast.show('Your account was created successfully. Welcome to the Family!', Toast.SHORT);
      setIsloading(false);
      navigation.replace('ConfirmLogin', { toScreen: 'MainRoot' });
    }
    return () => {
      dispatch(signUp.Reset());
    };
  }, [authState.signUpSuccess, navigation, dispatch]);

  useEffect(() => {
    if (authState.signUpSuccess === false && authState.error) {
      const displayError = Array.isArray(authState.error)
        ? authState.error.join(', ')
        : (authState.error ?? 'Unable to create account. Please try again.');
      Toast.show(displayError, Toast.SHORT);
      setIsloading(false);
    }
  }, [authState.signUpSuccess, authState.error]);

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
      setState(initialFormState);
      setHidePass(true);
      setShowPasswordHint(false);
    }, [])
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
    <UserStepsLayout
      backgroundColor={Colors.main.white}
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
        <StyledText
          style={[Typography.header.h1, { color: dark ? brandWhite : Colors.primary.brand }]}
        >
          Create your account details
        </StyledText>
        {accountType ? (
          <StyledText
            style={[
              Typography.subheader.M,
              { color: dark ? brandWhite : Colors.primary.brand, marginTop: spacing.x5 },
            ]}
          >
            {accountType.charAt(0).toUpperCase() + accountType.slice(1)}
          </StyledText>
        ) : null}
        <StyledText
          style={[
            Typography.subheader.R,
            { color: dark ? brandWhite : Colors.primary.brand, marginTop: spacing.x8 },
          ]}
        >
          Enter your details so that we can get you setup:
        </StyledText>
      </Animated.View>

      <Animated.View
        style={[
          styles.cardContainer,
          {
            backgroundColor: Colors.neutral[700],
            borderColor: dark ? Colors.neutral[900] : Colors.neutral[800],
          },
          fieldsPopStyle,
        ]}
      >
        <TouchableOpacity
          style={{ flexDirection: 'row', marginBottom: spacing.x20 }}
          onPress={() => navigation.replace('Login')}
        >
          <StyledText>Already have an account? </StyledText>
          <StyledText style={{ color: '#41dbe1' }}>Sign in</StyledText>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing.x13 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: Colors.neutral[800] }} />
          <StyledText
            style={{ marginHorizontal: 10, color: dark ? brandWhite : Colors.primary.brand }}
          >
            Or
          </StyledText>
          <View style={{ flex: 1, height: 1, backgroundColor: Colors.neutral[800] }} />
        </View>

        <Animated.View style={[{ marginTop: spacing.x7, alignItems: 'center' }, orbitStyle]}>
          <SignupButtons
            socialLogin={() => {}}
            navigation={navigation}
            route={route}
            disabled={!accountType}
          />
        </Animated.View>

        <InputField
          ref={inputRefs.username}
          label="Username"
          isDark={dark}
          placeholder={state.username ? '' : 'e.g. onebodyusername'}
          value={state.username}
          error={state.usernameError}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(username: string) => changeHandler('username', username.trim())}
          onSubmitEditing={() => inputRefs.name.current?.focus()}
        />

        <InputField
          ref={inputRefs.name}
          label="Full Name (Org Name)"
          isDark={dark}
          placeholder={state.name ? '' : 'e.g. John Baptist / Johns Seminary Institute'}
          value={state.name}
          error={state.nameError}
          autoCapitalize="words"
          onChangeText={(name: string) => changeHandler('name', name)}
          onSubmitEditing={() => inputRefs.email.current?.focus()}
        />

        <InputField
          ref={inputRefs.email}
          label="Email"
          isDark={dark}
          placeholder={state.email ? '' : 'e.g. mypersonalemail@example.com'}
          value={state.email}
          error={state.emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(email: string) => changeHandler('email', email.trim())}
          onSubmitEditing={() => inputRefs.password.current?.focus()}
        />

        <InputField
          ref={inputRefs.password}
          label="Password"
          isDark={dark}
          placeholder={state.password ? '' : 'e.g. Create a secure password'}
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
              Password must include:
            </StyledText>
            {[
              { key: 'sixCharsOrMore', label: 'At least 6 characters' },
              { key: 'number', label: 'A number' },
              { key: 'specialChar', label: 'A special character' },
              { key: 'uppercase', label: 'An uppercase letter' },
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
          isDark={dark}
          placeholder={state.cPassword ? '' : 'Repeat your password'}
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

        <Button
          text="Create account"
          btnStyle={[
            button.primary,
            dropShadow,
            {
              marginTop: spacing.x24,
              width: '100%',
              alignSelf: 'stretch',
              paddingVertical: spacing.x24,
              paddingHorizontal: spacing.x20,
              minHeight: 52,
              borderRadius: 60,
              opacity: isSubmitDisabled ? 0.4 : 1,
            },
          ]}
          btnTextStyle={{ color: '#FFF', fontSize: 14, fontWeight: '500', lineHeight: 24 }}
          wrapperViewBtnStyle={{ width: '100%' }}
          onPress={signUpUser}
          disabled={isSubmitDisabled || !!confirmPasswordError}
        />

        <View style={{ marginTop: spacing.x16 }}>
          <StyledText style={{ color: Colors.neutral[300], fontSize: 12 }}>
            By creating an account, you agree to our{' '}
            <StyledText
              style={{
                color: dark ? appColor.SecoundryColor : Colors.primary.brand,
                textDecorationLine: 'underline',
              }}
              onPress={() => OpenURLButton(TERMS_CONDITIONS_URL)}
            >
              User Agreements
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
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: spacing.x14,
    paddingVertical: spacing.x16,
    width: '100%',
  },
  inputLabel: {
    marginBottom: spacing.x10,
    color: Colors.primary.brand,
    fontSize: 14,
  },
  errorText: {
    color: Colors.errorFeedback[200],
    fontSize: 12,
    marginTop: 4,
  },
  cardContainer: {
    marginHorizontal: spacing.x16,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x30,
    backgroundColor: Colors.main.white,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
    marginBottom: spacing.x60,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
});

export default SignupForm;
