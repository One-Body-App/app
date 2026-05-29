import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, Alert } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { SettingsStackParamsList } from '@/src/navigator/types';
import { ApiCall } from '@/src/services/api';
import { getProfile } from '@/src/redux/actions/AuthActions';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { Colors } from '@/src/styles';
import {
  APP_HEADER_ROW_HEIGHT,
  APP_HEADER_ROW_OFFSET,
  APP_HEADER_SIDE_WIDTH,
  APP_HEADER_TITLE_LINE_HEIGHT,
} from '@/src/styles/headerLayout';

type Props = StackScreenProps<SettingsStackParamsList, 'CreatorReview'>;

const DEFAULT_APPLICATION_DATA = {
  bio: 'No bio provided.',
  website: '',
  comments: '',
  instagramUsername: '',
  instagramId: '',
  rssFeed1: '',
  rssFeed2: '',
  rssFeed1Category: 'news',
  rssFeed2Category: 'news',
  reviewSocialLinks: undefined as undefined,
  contentTypes: [] as string[],
  topics: [] as string[],
};

type ScreenPalette = {
  screen: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  subtleBorder: string;
  accent: string;
  primary: string;
  primaryActive: string;
  text: string;
  body: string;
  muted: string;
  buttonText: string;
  secondaryButtonBorder: string;
  secondaryButtonText: string;
  pillBg: string;
  pillText: string;
};

function CreatorReview({ navigation, route }: Props) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const userToken = useSelector((state: RootState) => state.auth.userToken);

  const palette = useMemo(
    (): ScreenPalette =>
      dark
        ? {
            screen: colors.background,
            surface: colors.card,
            surfaceAlt: '#121A1D',
            border: 'rgba(255, 255, 255, 0.08)',
            subtleBorder: 'rgba(255, 255, 255, 0.06)',
            accent: Colors.primarySapphire.brand,
            primary: Colors.primarySapphire.brand,
            primaryActive: 'rgba(18, 107, 135, 0.22)',
            text: colors.text,
            body: Colors.primary[600],
            muted: Colors.primary[500],
            buttonText: '#FFFFFF',
            secondaryButtonBorder: 'rgba(255, 255, 255, 0.12)',
            secondaryButtonText: colors.text,
            pillBg: 'rgba(18, 107, 135, 0.15)',
            pillText: Colors.primarySapphire.brand,
          }
        : {
            screen: colors.background,
            surface: '#FFFFFF',
            surfaceAlt: Colors.primarySapphire[900],
            border: Colors.primary[800],
            subtleBorder: 'rgba(3, 47, 60, 0.06)',
            accent: Colors.primarySapphire.brand,
            primary: Colors.primarySapphire.brand,
            primaryActive: Colors.primarySapphire[900],
            text: Colors.primary.brand,
            body: Colors.primary[500],
            muted: Colors.primary[500],
            buttonText: '#FFFFFF',
            secondaryButtonBorder: Colors.primary[800],
            secondaryButtonText: Colors.primary.brand,
            pillBg: Colors.primarySapphire[900],
            pillText: Colors.primarySapphire.brand,
          },
    [dark, colors]
  );

  const styles = useMemo(() => createStyles(palette, insets.bottom), [palette, insets.bottom]);

  const data = route.params?.data ?? DEFAULT_APPLICATION_DATA;

  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!agreed) {
      Alert.alert(
        'Agreement Required',
        "Please agree to uphold One Body's values before submitting."
      );
      return;
    }

    if (!userToken) {
      Alert.alert('Unable to submit', 'Please log in again and retry your creator application.');
      return;
    }

    setSubmitting(true);
    dispatch(setLoader(true));

    try {
      const response = await ApiCall<{ message?: string }>({
        route: 'influencer/apply-for-influencer',
        verb: 'post',
        token: userToken,
        params: {
          bio: data.bio,
          website: data.website,
          comments: data.comments,
          instagramUsername: data.instagramUsername,
          instagramId: data.instagramId,
          rssFeed1: data.rssFeed1,
          rssFeed1Category: data.rssFeed1Category,
          rssFeed2: data.rssFeed2,
          rssFeed2Category: data.rssFeed2Category,
          reviewSocialLinks: data.reviewSocialLinks,
          contentTypes: data.contentTypes,
          topics: data.topics,
          topicNames: data.topicNames,
        },
      });

      if (response.status === 200) {
        dispatch(getProfile.Request({ token: userToken }));
        navigation.navigate('CreatorSuccess');
        return;
      }

      Alert.alert(
        'Unable to submit',
        response.response?.message || 'Please try again in a moment.'
      );
    } catch (error) {
      Alert.alert('Unable to submit', 'Please try again in a moment.');
    } finally {
      dispatch(setLoader(false));
      setSubmitting(false);
    }
  }, [agreed, userToken, data, dispatch, navigation]);

  return (
    <View style={styles.safeArea}>
      <SafeAreaView edges={['top']}>
        <View style={styles.headerWrap}>
          <View style={styles.header}>
            <View style={styles.headerSide}>
              <Pressable
                style={styles.headerIconButton}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="chevron-left" size={32} color={palette.text} />
              </Pressable>
            </View>
            <Text style={styles.headerTitle}>Creator Application</Text>
            <View style={styles.headerSide} />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.mainHeading}>Does everything look right?</Text>
          <Text style={styles.subHeading}>
            Please confirm your application details before submitting to the One Body community.
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* Bio */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Bio</Text>
              <Pressable onPress={() => navigation.navigate('InfluencerStepTwo')}>
                <Text style={styles.editButton}>Edit</Text>
              </Pressable>
            </View>
            <Text style={styles.cardBody}>{data.bio}</Text>
          </View>

          {/* Instagram */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Instagram</Text>
              <Pressable onPress={() => navigation.navigate('InfluencerStepThree', { data })}>
                <Text style={styles.editButton}>Edit</Text>
              </Pressable>
            </View>
            {data.instagramUsername ? (
              <View style={styles.igRow}>
                <View style={styles.igIconWrapper}>
                  <MaterialCommunityIcons name="account-circle" size={24} color={palette.accent} />
                </View>
                <View>
                  <Text style={styles.igHandle}>@{data.instagramUsername}</Text>
                  <Text style={styles.igSub}>Connected Account</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.cardMuted}>Not connected</Text>
            )}
          </View>

          {/* RSS Feeds */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>RSS Feeds</Text>
              <Pressable onPress={() => navigation.navigate('InfluencerStepThree', { data })}>
                <Text style={styles.editButton}>Edit</Text>
              </Pressable>
            </View>
            <View style={styles.rssList}>
              {data.rssFeed1 ? (
                <View style={styles.rssRow}>
                  <MaterialCommunityIcons name="rss" size={16} color={palette.primary} />
                  <Text style={styles.rssText} numberOfLines={1}>
                    {data.rssFeed1}
                  </Text>
                </View>
              ) : null}
              {data.rssFeed2 ? (
                <View style={styles.rssRow}>
                  <MaterialCommunityIcons name="rss" size={16} color={palette.primary} />
                  <Text style={styles.rssText} numberOfLines={1}>
                    {data.rssFeed2}
                  </Text>
                </View>
              ) : null}
              {!data.rssFeed1 && !data.rssFeed2 && (
                <Text style={styles.cardMuted}>No feeds provided</Text>
              )}
            </View>
          </View>

          {/* Focus Areas */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Focus Areas</Text>
              <Pressable onPress={() => navigation.navigate('InfluencerStepFour', { data })}>
                <Text style={styles.editButton}>Edit</Text>
              </Pressable>
            </View>
            <View style={styles.pillContainer}>
              {data.topicNames?.length > 0 || data.topics?.length > 0 ? (
                (data.topicNames ?? data.topics).map((label: string) => (
                  <View key={label} style={styles.pill}>
                    <Text style={styles.pillText}>{label.toLowerCase()}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.cardMuted}>No focus areas selected</Text>
              )}
            </View>
          </View>
        </View>

        {/* Agreement */}
        <Pressable style={styles.agreementContainer} onPress={() => setAgreed(!agreed)}>
          <MaterialCommunityIcons
            name={agreed ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={palette.accent}
            style={styles.checkboxIcon}
          />
          <Text style={styles.agreementText}>
            I agree to uphold One Body&#39;s{' '}
            <Text style={styles.agreementLink}>Christian values</Text> and community guidelines.
          </Text>
        </Pressable>
      </ScrollView>

      <View style={styles.bottomNav}>
        <View style={styles.progressWrap}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Step 4 of 4</Text>
            <Text style={styles.progressPercent}>100%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
        <View style={styles.footerActions}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Pressable
            style={[styles.submitButton, { opacity: agreed && !submitting ? 1 : 0.5 }]}
            onPress={handleSubmit}
            disabled={!agreed || submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const createStyles = (palette: ScreenPalette, bottomInset: number) =>
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
      minHeight: APP_HEADER_ROW_HEIGHT,
      backgroundColor: palette.screen,
      transform: [{ translateY: APP_HEADER_ROW_OFFSET }],
    },
    headerSide: {
      width: APP_HEADER_SIDE_WIDTH,
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
      lineHeight: APP_HEADER_TITLE_LINE_HEIGHT,
      fontFamily: 'Rubik-Bold',
      fontWeight: '600',
      letterSpacing: 0.3,
      textAlign: Platform.OS === 'android' ? 'left' : 'center',
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 164 + Math.max(bottomInset, 16),
    },
    titleSection: {
      marginBottom: 24,
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
    cardsContainer: {
      gap: 16,
    },
    card: {
      borderRadius: 20,
      borderWidth: 1,
      padding: 20,
      backgroundColor: palette.surface,
      borderColor: palette.subtleBorder,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardTitle: {
      color: palette.accent,
      fontSize: 16,
      lineHeight: 22,
      fontFamily: 'Rubik-Bold',
      fontWeight: '700',
    },
    editButton: {
      color: palette.accent,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'OpenSans-SemiBold',
      fontWeight: '600',
    },
    cardBody: {
      color: palette.text,
      fontSize: 15,
      lineHeight: 24,
      fontFamily: 'OpenSans-Regular',
    },
    cardMuted: {
      color: palette.muted,
      fontSize: 15,
      lineHeight: 24,
      fontFamily: 'OpenSans-Regular',
    },
    igRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    igIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.primaryActive,
    },
    igHandle: {
      color: palette.text,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: 'OpenSans-SemiBold',
    },
    igSub: {
      color: palette.muted,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'OpenSans-Regular',
    },
    rssList: {
      gap: 10,
    },
    rssRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rssText: {
      color: palette.body,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'OpenSans-Regular',
      flex: 1,
    },
    pillContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: palette.pillBg,
    },
    pillText: {
      color: palette.pillText,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: 'OpenSans-SemiBold',
    },
    agreementContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 24,
      marginBottom: 28,
      padding: 20,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: palette.surface,
      borderColor: palette.subtleBorder,
    },
    checkboxIcon: {
      marginRight: 12,
      marginTop: 1,
    },
    agreementText: {
      flex: 1,
      color: palette.text,
      fontSize: 14,
      lineHeight: 22,
      fontFamily: 'OpenSans-Regular',
    },
    agreementLink: {
      color: palette.accent,
      fontFamily: 'OpenSans-SemiBold',
    },
    bottomNav: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: Math.max(bottomInset, 24),
      backgroundColor: palette.screen,
      borderTopWidth: 1,
      borderTopColor: palette.subtleBorder,
    },
    progressWrap: {
      paddingBottom: 12,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    progressLabel: {
      color: palette.text,
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'OpenSans-SemiBold',
    },
    progressPercent: {
      color: palette.accent,
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'OpenSans-SemiBold',
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: palette.subtleBorder,
    },
    progressFill: {
      width: '100%',
      height: '100%',
      borderRadius: 4,
      backgroundColor: palette.primary,
    },
    footerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    backButton: {
      minWidth: 110,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: palette.secondaryButtonBorder,
      borderRadius: 60,
      backgroundColor: palette.surface,
    },
    backButtonText: {
      color: palette.secondaryButtonText,
      fontSize: 15,
      fontWeight: '700',
      fontFamily: 'OpenSans-SemiBold',
    },
    submitButton: {
      flex: 1,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.primary,
      borderRadius: 60,
    },
    submitButtonText: {
      color: palette.buttonText,
      fontSize: 16,
      fontWeight: '800',
      fontFamily: 'OpenSans-SemiBold',
    },
  });

export default CreatorReview;
