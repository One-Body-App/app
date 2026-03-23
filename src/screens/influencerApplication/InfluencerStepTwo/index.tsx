import React, { useCallback, useRef, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TextInput as TextInputNative,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { CommonActions, useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomModal from '@/src/components/CustomModal';
import { FeedTypes } from '@/src/screens/home';
import { Colors } from '@/src/styles';
import { SettingsStackParamsList } from '@/src/navigator/types';
import { validateFields } from '@/utils/validation/validate-fields';

type Props = StackScreenProps<SettingsStackParamsList, 'InfluencerStepTwo'>;

const MAX_BIO_LENGTH = 500;
const DOMAIN_PATTERN = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:[/?#].*)?$/;

type ScreenPalette = {
  screen: string;
  surface: string;
  border: string;
  subtleBorder: string;
  subtleSurface: string;
  input: string;
  accent: string;
  primary: string;
  text: string;
  body: string;
  placeholder: string;
  icon: string;
  error: string;
  buttonText: string;
  secondaryButtonBorder: string;
  secondaryButtonText: string;
  modalSurface: string;
};

const normalizeWebsiteUrl = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  if (DOMAIN_PATTERN.test(trimmedValue)) {
    return `https://${trimmedValue}`;
  }

  return trimmedValue;
};

const getWebsiteError = (value: string) => {
  if (!value) {
    return '';
  }

  const normalizedValue = normalizeWebsiteUrl(value);

  try {
    const parsedUrl = new URL(normalizedValue);
    const { hostname, protocol } = parsedUrl;
    const tld = hostname.split('.').pop();

    if (!['http:', 'https:'].includes(protocol)) {
      return 'Please enter a valid website link';
    }

    if (!hostname.includes('.') || !tld || !/^[a-z]{2,63}$/i.test(tld)) {
      return 'Please enter a valid website link';
    }

    return '';
  } catch {
    return 'Please enter a valid website link';
  }
};

function InfluencerStepTwo({ navigation }: Props) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const bioRef = useRef<TextInputNative>(null);
  const intentRef = useRef<TextInputNative>(null);

  const [showQuitModal, setShowQuitModal] = useState(false);
  const [state, setState] = useState({
    website: '',
    websiteError: '',
    bio: '',
    bioError: '',
    intent: '',
    intentError: '',
  });

  const palette: ScreenPalette = dark
    ? {
        screen: colors.background,
        surface: colors.card,
        border: 'rgba(255, 255, 255, 0.08)',
        subtleBorder: 'rgba(255, 255, 255, 0.06)',
        subtleSurface: '#121A1D',
        input: '#121A1D',
        accent: Colors.primarySapphire.brand,
        primary: Colors.primarySapphire.brand,
        text: colors.text,
        body: Colors.primary[600],
        placeholder: Colors.primary[400],
        icon: Colors.primary[500],
        error: '#FFB4AB',
        buttonText: '#FFFFFF',
        secondaryButtonBorder: 'rgba(255, 255, 255, 0.12)',
        secondaryButtonText: colors.text,
        modalSurface: colors.card,
      }
    : {
        screen: colors.background,
        surface: '#FFFFFF',
        border: Colors.primary[800],
        subtleBorder: 'rgba(3, 47, 60, 0.06)',
        subtleSurface: Colors.primarySapphire[900],
        input: '#FFFFFF',
        accent: Colors.primarySapphire.brand,
        primary: Colors.primarySapphire.brand,
        text: Colors.primary.brand,
        body: Colors.primary[500],
        placeholder: Colors.primary[500],
        icon: Colors.primary[500],
        error: '#B3261E',
        buttonText: '#FFFFFF',
        secondaryButtonBorder: Colors.primary[800],
        secondaryButtonText: Colors.primary.brand,
        modalSurface: '#FFFFFF',
      };

  const styles = createStyles(palette, dark, insets.bottom);

  const changeHandler = (field: string, value: string) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const handleWebsiteBlur = () => {
    const normalizedWebsite = normalizeWebsiteUrl(state.website);
    const websiteError = getWebsiteError(normalizedWebsite);

    setState((prev) => ({
      ...prev,
      website: websiteError ? prev.website.trim() : normalizedWebsite,
      websiteError,
    }));
  };

  const handleQuit = useCallback(() => {
    setShowQuitModal(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Main' as never,
            params: {
              screen: 'HomeTab',
              params: {
                screen: 'Home',
                params: {
                  selectedTab: FeedTypes.ForYou,
                  refreshToken: Date.now(),
                },
              },
            },
          } as never,
        ],
      })
    );
  }, [navigation]);

  const onNext = () => {
    const normalizedWebsite = normalizeWebsiteUrl(state.website);
    const websiteError = getWebsiteError(normalizedWebsite);
    const bioError = state.bio.trim() ? '' : 'Bio is required';

    if (websiteError || bioError) {
      setState((prev) => ({
        ...prev,
        website: websiteError ? prev.website.trim() : normalizedWebsite,
        websiteError,
        bioError,
      }));
      return;
    }

    navigation.navigate('InfluencerStepThree', {
      data: {
        website: normalizedWebsite,
        bio: state.bio,
        comments: state.intent,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerWrap}>
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="chevron-left" size={32} color={palette.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Creator Application</Text>
          <View style={[styles.headerSide, styles.headerActionContainer]}>
            <TouchableOpacity
              onPress={() => setShowQuitModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.headerActionText}>Quit</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleSection}>
          <Text style={styles.mainHeading}>Tell us about your ministry</Text>
          <Text style={styles.subHeading}>
            Share a bit about yourself or your organization so we can better connect you with the
            One Body community.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Website URL (optional)</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="web"
                size={20}
                color={palette.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithIcon,
                  state.websiteError ? styles.inputErrorBorder : null,
                ]}
                placeholder="https://yourministry.com"
                placeholderTextColor={palette.placeholder}
                value={state.website}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onFocus={() => changeHandler('websiteError', '')}
                onBlur={handleWebsiteBlur}
                onSubmitEditing={() => bioRef.current?.focus()}
                onChangeText={(val) => changeHandler('website', val)}
              />
            </View>
            {!!state.websiteError && <Text style={styles.errorText}>{state.websiteError}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Creator Bio *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={bioRef}
                style={[
                  styles.input,
                  styles.textArea,
                  state.bioError ? styles.inputErrorBorder : null,
                ]}
                placeholder="Tell the community about your mission..."
                placeholderTextColor={palette.placeholder}
                value={state.bio}
                multiline
                maxLength={MAX_BIO_LENGTH}
                textAlignVertical="top"
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={() => changeHandler('bioError', '')}
                onBlur={() =>
                  validateFields(state.bio, 'bio', (err) => changeHandler('bioError', err))
                }
                onSubmitEditing={() => intentRef.current?.focus()}
                onChangeText={(val) => changeHandler('bio', val)}
              />
              <Text style={styles.charCount}>
                {state.bio.length} / {MAX_BIO_LENGTH}
              </Text>
            </View>
            {!!state.bioError && <Text style={styles.errorText}>{state.bioError}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Why do you want to be a Creator on One Body?</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={intentRef}
                style={[
                  styles.input,
                  styles.textArea,
                  state.intentError ? styles.inputErrorBorder : null,
                ]}
                placeholder="What impact do you hope to make?"
                placeholderTextColor={palette.placeholder}
                value={state.intent}
                multiline
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit
                onFocus={() => changeHandler('intentError', '')}
                onBlur={() =>
                  validateFields(state.intent, 'comments', (err) =>
                    changeHandler('intentError', err)
                  )
                }
                onSubmitEditing={onNext}
                onChangeText={(val) => changeHandler('intent', val)}
              />
            </View>
            {!!state.intentError && <Text style={styles.errorText}>{state.intentError}</Text>}
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardContent}>
            <View style={styles.infoIconWrapper}>
              <MaterialCommunityIcons name="star-four-points" size={18} color={palette.accent} />
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoCardTitle}>Community Connection</Text>
              <Text style={styles.infoCardText}>
                Your bio helps us match your content with creators who share similar values and
                audiences.
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name="account-group"
            size={96}
            color={dark ? '#FFFFFF' : palette.primary}
            style={styles.watermarkIcon}
          />
        </View>
      </KeyboardAwareScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={18}
            color={palette.secondaryButtonText}
          />
          <Text style={styles.backButtonText}>BACK</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueButton} onPress={onNext}>
          <Text style={styles.continueButtonText}>CONTINUE</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={palette.buttonText} />
        </TouchableOpacity>
      </View>

      <CustomModal
        modalVisible={showQuitModal}
        onclose={() => setShowQuitModal(false)}
        style={styles.quitModalContainer}
      >
        <View style={styles.quitModalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.quitModalTitle}>Quit Creator Application?</Text>
          <Text style={styles.quitModalBody}>
            If you leave now, the information you entered on this step will not be saved.
          </Text>

          <View style={styles.quitModalActions}>
            <TouchableOpacity
              style={styles.quitModalSecondaryButton}
              onPress={() => setShowQuitModal(false)}
            >
              <Text style={styles.quitModalSecondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quitModalPrimaryButton} onPress={handleQuit}>
              <Text style={styles.quitModalPrimaryButtonText}>Quit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomModal>
    </SafeAreaView>
  );
}

const createStyles = (palette: ScreenPalette, dark: boolean, bottomInset: number) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.screen,
    },
    headerWrap: {
      paddingHorizontal: 20,
      paddingBottom: 6,
      backgroundColor: palette.screen,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 56,
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 0,
      backgroundColor: palette.screen,
    },
    headerSide: {
      width: 44,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    headerIconButton: {
      height: 40,
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      color: palette.text,
      fontSize: 24,
      lineHeight: 30,
      fontFamily: 'Rubik-Bold',
      fontWeight: '600',
      letterSpacing: 0.3,
      textAlign: Platform.OS === 'android' ? 'left' : 'center',
    },
    headerActionContainer: {
      alignItems: 'flex-end',
    },
    headerActionText: {
      color: palette.accent,
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'OpenSans-SemiBold',
      fontWeight: '600',
    },
    progressBarTrack: {
      height: 4,
      borderRadius: 999,
      backgroundColor: palette.subtleBorder,
      overflow: 'hidden',
      marginTop: 2,
    },
    progressBarFill: {
      width: '50%',
      height: '100%',
      borderRadius: 999,
      backgroundColor: palette.primary,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 164 + Math.max(bottomInset, 16),
    },
    titleSection: {
      marginBottom: 18,
    },
    mainHeading: {
      color: palette.text,
      fontSize: 28,
      lineHeight: 36,
      fontFamily: 'Rubik-Bold',
      marginBottom: 10,
    },
    subHeading: {
      color: palette.body,
      fontSize: 16,
      lineHeight: 28,
      fontFamily: 'OpenSans-Regular',
    },
    formGroup: {
      gap: 0,
    },
    inputContainer: {
      marginBottom: 10,
    },
    inputLabel: {
      color: palette.accent,
      fontSize: 14,
      lineHeight: 18,
      fontFamily: 'Rubik-Bold',
      fontWeight: '700',
      letterSpacing: 0,
      marginBottom: 8,
      marginLeft: 2,
    },
    inputWrapper: {
      position: 'relative',
      justifyContent: 'center',
    },
    inputIcon: {
      position: 'absolute',
      left: 16,
      zIndex: 1,
    },
    input: {
      backgroundColor: palette.input,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 22,
      color: palette.text,
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'OpenSans-Regular',
      paddingHorizontal: 18,
      paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    },
    inputErrorBorder: {
      borderColor: palette.error,
    },
    errorText: {
      color: palette.error,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'OpenSans-Regular',
      marginTop: 6,
      marginLeft: 4,
    },
    inputWithIcon: {
      paddingLeft: 52,
    },
    textArea: {
      minHeight: 156,
      paddingTop: 18,
      paddingBottom: 34,
    },
    charCount: {
      position: 'absolute',
      bottom: 14,
      right: 18,
      color: palette.placeholder,
      fontSize: 11,
      lineHeight: 16,
      fontFamily: 'OpenSans-SemiBold',
    },
    infoCard: {
      marginTop: 4,
      backgroundColor: palette.subtleSurface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: palette.subtleBorder,
      padding: 22,
      overflow: 'hidden',
      position: 'relative',
    },
    infoCardContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      zIndex: 2,
    },
    infoIconWrapper: {
      backgroundColor: dark ? 'rgba(18, 107, 135, 0.18)' : 'rgba(18, 107, 135, 0.10)',
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    infoTextWrapper: {
      flex: 1,
      paddingRight: 36,
    },
    infoCardTitle: {
      color: palette.text,
      fontSize: 16,
      lineHeight: 22,
      fontFamily: 'Rubik-Medium',
      marginBottom: 6,
    },
    infoCardText: {
      color: palette.body,
      fontSize: 14,
      lineHeight: 22,
      fontFamily: 'OpenSans-Regular',
    },
    watermarkIcon: {
      position: 'absolute',
      right: -10,
      bottom: -12,
      opacity: dark ? 0.05 : 0.08,
      zIndex: 1,
    },
    bottomNav: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: Math.max(bottomInset, 16),
      backgroundColor: palette.screen,
      borderTopWidth: 1,
      borderTopColor: palette.subtleBorder,
    },
    backButton: {
      minWidth: 116,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      paddingHorizontal: 22,
      borderWidth: 1,
      borderColor: palette.secondaryButtonBorder,
      borderRadius: 24,
      backgroundColor: palette.surface,
    },
    backButtonText: {
      color: palette.secondaryButtonText,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: 'OpenSans-SemiBold',
      letterSpacing: 2.2,
      marginLeft: 4,
    },
    continueButton: {
      minWidth: 176,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.primary,
      paddingVertical: 15,
      paddingHorizontal: 28,
      borderRadius: 28,
    },
    continueButtonText: {
      color: palette.buttonText,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: 'OpenSans-SemiBold',
      letterSpacing: 2.2,
      marginRight: 4,
    },
    quitModalContainer: {
      minHeight: 280,
      backgroundColor: palette.modalSurface,
    },
    quitModalContent: {
      backgroundColor: palette.modalSurface,
      paddingHorizontal: 24,
      paddingTop: 14,
      paddingBottom: Math.max(bottomInset, 20) + 8,
    },
    modalHandle: {
      alignSelf: 'center',
      width: 44,
      height: 4,
      borderRadius: 999,
      backgroundColor: palette.border,
      marginBottom: 24,
    },
    quitModalTitle: {
      color: palette.text,
      fontSize: 22,
      lineHeight: 32,
      fontFamily: 'Rubik-Medium',
      marginBottom: 12,
    },
    quitModalBody: {
      color: palette.body,
      fontSize: 15,
      lineHeight: 24,
      fontFamily: 'OpenSans-Regular',
      marginBottom: 28,
    },
    quitModalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    quitModalSecondaryButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.secondaryButtonBorder,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: palette.surface,
    },
    quitModalSecondaryButtonText: {
      color: palette.secondaryButtonText,
      fontSize: 15,
      lineHeight: 20,
      fontFamily: 'OpenSans-SemiBold',
    },
    quitModalPrimaryButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: 18,
      backgroundColor: palette.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quitModalPrimaryButtonText: {
      color: palette.buttonText,
      fontSize: 15,
      lineHeight: 20,
      fontFamily: 'OpenSans-SemiBold',
    },
  });

export default InfluencerStepTwo;
