import React, { useCallback, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { CommonActions, useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomModal from '@/src/components/CustomModal';
import { SettingsStackParamsList } from '@/src/navigator/types';
import { FeedTypes } from '@/src/screens/home';
import { Colors } from '@/src/styles';

type Props = StackScreenProps<SettingsStackParamsList, 'InfluencerStepThree'>;

const SOCIAL_DOMAIN_PATTERN = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:[/?#].*)?$/;

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

type ReviewSocialLinks = {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  additional?: {
    label: string;
    url: string;
  };
};

type SocialLinkDetection = {
  label: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

const DEFAULT_SOCIAL_LINK_DETECTION: SocialLinkDetection = {
  label: 'Social profile',
  iconName: 'web',
};

const detectSocialLink = (value: string): SocialLinkDetection => {
  const normalizedValue = normalizeSocialUrl(value);

  if (!normalizedValue) {
    return DEFAULT_SOCIAL_LINK_DETECTION;
  }

  try {
    const parsedUrl = new URL(normalizedValue);
    const normalizedHost = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');

    if (normalizedHost.includes('instagram.com')) {
      return { label: 'Instagram', iconName: 'instagram' };
    }

    if (normalizedHost.includes('facebook.com') || normalizedHost.includes('fb.com')) {
      return { label: 'Facebook', iconName: 'facebook' };
    }

    if (normalizedHost.includes('youtube.com') || normalizedHost.includes('youtu.be')) {
      return { label: 'YouTube', iconName: 'youtube' };
    }

    if (normalizedHost.includes('tiktok.com')) {
      return { label: 'TikTok', iconName: 'music-note' };
    }

    if (normalizedHost.includes('linkedin.com')) {
      return { label: 'LinkedIn', iconName: 'briefcase-account' };
    }

    if (
      normalizedHost.includes('x.com') ||
      normalizedHost.includes('twitter.com') ||
      normalizedHost.includes('threads.net')
    ) {
      return { label: 'Social profile', iconName: 'account-voice' };
    }

    return { label: 'Website', iconName: 'web' };
  } catch {
    return DEFAULT_SOCIAL_LINK_DETECTION;
  }
};

const normalizeSocialUrl = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  if (SOCIAL_DOMAIN_PATTERN.test(trimmedValue)) {
    return `https://${trimmedValue}`;
  }

  return trimmedValue;
};

const getSocialLinkError = (value: string) => {
  if (!value) {
    return '';
  }

  const normalizedValue = normalizeSocialUrl(value);

  try {
    const parsedUrl = new URL(normalizedValue);
    const { hostname, protocol } = parsedUrl;
    const tld = hostname.split('.').pop();

    if (!['http:', 'https:'].includes(protocol)) {
      return 'Please enter a valid social link';
    }

    if (!hostname.includes('.') || !tld || !/^[a-z]{2,63}$/i.test(tld)) {
      return 'Please enter a valid social link';
    }

    return '';
  } catch {
    return 'Please enter a valid social link';
  }
};

const buildReviewNotes = (existingComments: string, reviewSocialLinks: ReviewSocialLinks) => {
  const links = [
    ['Instagram', reviewSocialLinks.instagram],
    ['Facebook', reviewSocialLinks.facebook],
    ['YouTube', reviewSocialLinks.youtube],
    ['TikTok', reviewSocialLinks.tiktok],
    [
      reviewSocialLinks.additional?.label ?? 'Additional social profile',
      reviewSocialLinks.additional?.url,
    ],
  ].filter(([, value]) => typeof value === 'string' && value.trim().length > 0);

  if (links.length === 0) {
    return existingComments;
  }

  const reviewSection = [
    'Social accounts for review:',
    ...links.map(([label, value]) => `${label}: ${value}`),
  ].join('\n');

  return existingComments?.trim()
    ? `${existingComments.trim()}\n\n${reviewSection}`
    : reviewSection;
};

function CreatorStepThree({ navigation, route }: Props) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const previousData = route.params?.data ?? {};
  const previousReviewLinks: ReviewSocialLinks = previousData.reviewSocialLinks ?? {};
  const previousAdditionalLink = previousReviewLinks.additional?.url ?? '';

  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showAdditionalLink, setShowAdditionalLink] = useState(Boolean(previousAdditionalLink));
  const [state, setState] = useState({
    instagramUrl: previousReviewLinks.instagram ?? '',
    instagramUrlError: '',
    facebookUrl: previousReviewLinks.facebook ?? '',
    facebookUrlError: '',
    youtubeUrl: previousReviewLinks.youtube ?? '',
    youtubeUrlError: '',
    tiktokUrl: previousReviewLinks.tiktok ?? '',
    tiktokUrlError: '',
    additionalSocialLink: previousAdditionalLink,
    additionalSocialLinkError: '',
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

  const validateSocialField = (
    field: 'instagramUrl' | 'facebookUrl' | 'youtubeUrl' | 'tiktokUrl' | 'additionalSocialLink',
    errorField:
      | 'instagramUrlError'
      | 'facebookUrlError'
      | 'youtubeUrlError'
      | 'tiktokUrlError'
      | 'additionalSocialLinkError'
  ) => {
    const normalizedValue = normalizeSocialUrl(state[field]);
    const error = getSocialLinkError(normalizedValue);

    setState((prev) => ({
      ...prev,
      [field]: error ? prev[field].trim() : normalizedValue,
      [errorField]: error,
    }));

    return { normalizedValue, error };
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
    const instagram = validateSocialField('instagramUrl', 'instagramUrlError');
    const facebook = validateSocialField('facebookUrl', 'facebookUrlError');
    const youtube = validateSocialField('youtubeUrl', 'youtubeUrlError');
    const tiktok = validateSocialField('tiktokUrl', 'tiktokUrlError');
    const additional = showAdditionalLink
      ? validateSocialField('additionalSocialLink', 'additionalSocialLinkError')
      : { normalizedValue: '', error: '' };

    if (instagram.error || facebook.error || youtube.error || tiktok.error || additional.error) {
      return;
    }

    const additionalLinkDetection = detectSocialLink(additional.normalizedValue);

    const reviewSocialLinks: ReviewSocialLinks = {
      instagram: instagram.normalizedValue,
      facebook: facebook.normalizedValue,
      youtube: youtube.normalizedValue,
      tiktok: tiktok.normalizedValue,
      additional: additional.normalizedValue
        ? {
            label: additionalLinkDetection.label,
            url: additional.normalizedValue,
          }
        : undefined,
    };

    navigation.navigate('InfluencerStepFour', {
      data: {
        ...previousData,
        instagramUsername: instagram.normalizedValue,
        instagramId: '',
        rssFeed1: '',
        rssFeed1Category: 'news',
        rssFeed2: '',
        rssFeed2Category: 'news',
        reviewSocialLinks,
        comments: buildReviewNotes(previousData.comments ?? '', reviewSocialLinks),
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
          <Text style={styles.mainHeading}>Share your social accounts</Text>
          <Text style={styles.subHeading}>
            Add any public social profiles you want our team to review as part of your Creator
            application. We are no longer connecting or aggregating content from these accounts.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Instagram profile link</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="instagram"
                size={20}
                color={palette.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithIcon,
                  state.instagramUrlError ? styles.inputErrorBorder : null,
                ]}
                placeholder="instagram.com/youraccount"
                placeholderTextColor={palette.placeholder}
                value={state.instagramUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onFocus={() => changeHandler('instagramUrlError', '')}
                onBlur={() => validateSocialField('instagramUrl', 'instagramUrlError')}
                onChangeText={(value) => changeHandler('instagramUrl', value)}
              />
            </View>
            {!!state.instagramUrlError && (
              <Text style={styles.errorText}>{state.instagramUrlError}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Facebook page link</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="facebook"
                size={20}
                color={palette.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithIcon,
                  state.facebookUrlError ? styles.inputErrorBorder : null,
                ]}
                placeholder="facebook.com/yourpage"
                placeholderTextColor={palette.placeholder}
                value={state.facebookUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onFocus={() => changeHandler('facebookUrlError', '')}
                onBlur={() => validateSocialField('facebookUrl', 'facebookUrlError')}
                onChangeText={(value) => changeHandler('facebookUrl', value)}
              />
            </View>
            {!!state.facebookUrlError && (
              <Text style={styles.errorText}>{state.facebookUrlError}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>YouTube channel link</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="youtube"
                size={20}
                color={palette.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithIcon,
                  state.youtubeUrlError ? styles.inputErrorBorder : null,
                ]}
                placeholder="youtube.com/@yourchannel"
                placeholderTextColor={palette.placeholder}
                value={state.youtubeUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onFocus={() => changeHandler('youtubeUrlError', '')}
                onBlur={() => validateSocialField('youtubeUrl', 'youtubeUrlError')}
                onChangeText={(value) => changeHandler('youtubeUrl', value)}
              />
            </View>
            {!!state.youtubeUrlError && (
              <Text style={styles.errorText}>{state.youtubeUrlError}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>TikTok profile link</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="music-note"
                size={20}
                color={palette.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithIcon,
                  state.tiktokUrlError ? styles.inputErrorBorder : null,
                ]}
                placeholder="tiktok.com/@youraccount"
                placeholderTextColor={palette.placeholder}
                value={state.tiktokUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onFocus={() => changeHandler('tiktokUrlError', '')}
                onBlur={() => validateSocialField('tiktokUrl', 'tiktokUrlError')}
                onSubmitEditing={onNext}
                onChangeText={(value) => changeHandler('tiktokUrl', value)}
              />
            </View>
            {!!state.tiktokUrlError && <Text style={styles.errorText}>{state.tiktokUrlError}</Text>}
          </View>

          {showAdditionalLink ? (
            <View style={styles.inputContainer}>
              <View style={styles.additionalLinkHeader}>
                <Text style={styles.inputLabel}>Additional social link</Text>
                <View style={styles.detectedTypePill}>
                  <MaterialCommunityIcons
                    name={detectSocialLink(state.additionalSocialLink).iconName}
                    size={14}
                    color={palette.accent}
                  />
                  <Text style={styles.detectedTypeText}>
                    {detectSocialLink(state.additionalSocialLink).label}
                  </Text>
                </View>
              </View>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name={detectSocialLink(state.additionalSocialLink).iconName}
                  size={20}
                  color={palette.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    styles.inputWithIcon,
                    state.additionalSocialLinkError ? styles.inputErrorBorder : null,
                  ]}
                  placeholder="Paste any public social profile link"
                  placeholderTextColor={palette.placeholder}
                  value={state.additionalSocialLink}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onFocus={() => changeHandler('additionalSocialLinkError', '')}
                  onBlur={() =>
                    validateSocialField('additionalSocialLink', 'additionalSocialLinkError')
                  }
                  onSubmitEditing={onNext}
                  onChangeText={(value) => changeHandler('additionalSocialLink', value)}
                />
              </View>
              <Text style={styles.additionalLinkHint}>
                We&apos;ll automatically recognize the platform from the link you paste.
              </Text>
              {!!state.additionalSocialLinkError && (
                <Text style={styles.errorText}>{state.additionalSocialLinkError}</Text>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAdditionalLinkButton}
              onPress={() => setShowAdditionalLink(true)}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={18} color={palette.accent} />
              <Text style={styles.addAdditionalLinkText}>Add another social link</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardContent}>
            <View style={styles.infoIconWrapper}>
              <MaterialCommunityIcons name="account-search" size={18} color={palette.accent} />
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoCardTitle}>General Review</Text>
              <Text style={styles.infoCardText}>
                These links are for application review only. If you are approved, your team can
                share any future content strategy separately inside One Body.
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
      width: '75%',
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
      marginBottom: 22,
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
    additionalLinkHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    inputLabel: {
      color: palette.accent,
      fontSize: 14,
      lineHeight: 18,
      fontFamily: 'Rubik-Bold',
      fontWeight: '700',
      marginBottom: 8,
      marginLeft: 2,
    },
    detectedTypePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: dark ? 'rgba(18, 107, 135, 0.18)' : 'rgba(18, 107, 135, 0.10)',
      marginBottom: 8,
    },
    detectedTypeText: {
      color: palette.accent,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: 'OpenSans-SemiBold',
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
    inputWithIcon: {
      paddingLeft: 52,
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
    addAdditionalLinkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 6,
      marginBottom: 10,
      marginLeft: 2,
    },
    addAdditionalLinkText: {
      color: palette.accent,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'OpenSans-SemiBold',
    },
    additionalLinkHint: {
      color: palette.body,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'OpenSans-Regular',
      marginTop: 6,
      marginLeft: 4,
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

export default CreatorStepThree;
