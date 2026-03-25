import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Platform,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { SettingsStackParamsList } from '@/src/navigator/types';
import { ApiCall } from '@/src/services/api';
import { getProfile } from '@/src/redux/actions/AuthActions';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { RootState } from '@/src/redux/reducers/rootReducer';
import {
  APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  APP_HEADER_ROW_HEIGHT,
  APP_HEADER_ROW_OFFSET,
  APP_HEADER_SIDE_WIDTH,
} from '@/src/styles/headerLayout';

type Props = StackScreenProps<SettingsStackParamsList, 'CreatorReview'>;

// --- Dynamic Brand Palette ---
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#032F3C' : '#FFFFFF',
  surface: isDark ? '#0B3C4A' : '#F2F3F3', // Muted blue/gray for cards
  surfaceBorder: isDark ? 'rgba(255,255,255,0.1)' : '#E6EAEC',
  pillBg: isDark ? 'rgba(0,0,0,0.2)' : '#E6EAEC',
  primary: '#126B87',
  accent: '#12D2D9',
  textMain: isDark ? '#FFFFFF' : '#032F3C',
  textMuted: isDark ? 'rgba(255,255,255,0.7)' : '#68828A',
  headerBg: isDark ? 'rgba(3, 47, 60, 0.9)' : 'rgba(255, 255, 255, 0.9)',
});

function CreatorReview({ navigation, route }: Props) {
  const isDark = useColorScheme() === 'dark';
  const colors = getThemeColors(isDark);
  const dispatch = useDispatch();
  const userToken = useSelector((state: RootState) => state.auth.userToken);

  // In a real app, fallback to empty strings/arrays if data is missing
  const data = route.params?.data || {
    bio: 'No bio provided.',
    website: '',
    comments: '',
    instagramUsername: '',
    instagramId: '',
    rssFeed1: '',
    rssFeed2: '',
    rssFeed1Category: 'news',
    rssFeed2Category: 'news',
    reviewSocialLinks: undefined,
    contentTypes: [],
    topics: [],
  };

  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
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
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.headerBg, borderBottomColor: colors.surfaceBorder },
        ]}
      >
        <View style={styles.headerSideSlot}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {Platform.OS === 'ios' ? (
          <View style={styles.headerCenterWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>Review Details</Text>
          </View>
        ) : (
          <View style={styles.headerTitleAndroidWrap}>
            <Text style={styles.headerTitle}>Review Details</Text>
          </View>
        )}
        <View style={styles.headerSideSlot}>
          <Text style={[styles.headerStepText, { color: colors.accent }]}>STEP 4 OF 4</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={[styles.mainHeading, { color: colors.textMain }]}>
            Does everything look right?
          </Text>
          <Text style={[styles.subHeading, { color: colors.textMuted }]}>
            Please confirm your application details before submitting to the One Body community.
          </Text>
        </View>

        {/* Bento-style Review Cards */}
        <View style={styles.cardsContainer}>
          {/* Bio Section */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.accent }]}>BIO</Text>
              <TouchableOpacity onPress={() => navigation.navigate('InfluencerStepTwo')}>
                <Text style={[styles.editButton, { color: colors.accent }]}>Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.bioText, { color: colors.textMain }]}>{data.bio}</Text>
          </View>

          {/* Instagram Section */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.accent }]}>INSTAGRAM</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('InfluencerStepThree', { data })}
              >
                <Text style={[styles.editButton, { color: colors.accent }]}>Edit</Text>
              </TouchableOpacity>
            </View>
            {data.instagramUsername ? (
              <View style={styles.igRow}>
                <View style={[styles.igIconWrapper, { backgroundColor: colors.pillBg }]}>
                  <MaterialCommunityIcons name="account-circle" size={24} color={colors.accent} />
                </View>
                <View>
                  <Text style={[styles.igHandle, { color: colors.textMain }]}>
                    @{data.instagramUsername}
                  </Text>
                  <Text style={[styles.igSub, { color: colors.textMuted }]}>Connected Account</Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.bioText, { color: colors.textMuted }]}>Not connected</Text>
            )}
          </View>

          {/* RSS Feeds Section */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.accent }]}>RSS FEEDS</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('InfluencerStepThree', { data })}
              >
                <Text style={[styles.editButton, { color: colors.accent }]}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.rssList}>
              {data.rssFeed1 ? (
                <View style={styles.rssRow}>
                  <MaterialCommunityIcons name="rss" size={16} color={colors.primary} />
                  <Text style={[styles.rssText, { color: colors.textMuted }]} numberOfLines={1}>
                    {data.rssFeed1}
                  </Text>
                </View>
              ) : null}
              {data.rssFeed2 ? (
                <View style={styles.rssRow}>
                  <MaterialCommunityIcons name="rss" size={16} color={colors.primary} />
                  <Text style={[styles.rssText, { color: colors.textMuted }]} numberOfLines={1}>
                    {data.rssFeed2}
                  </Text>
                </View>
              ) : null}
              {!data.rssFeed1 && !data.rssFeed2 && (
                <Text style={[styles.bioText, { color: colors.textMuted }]}>No feeds provided</Text>
              )}
            </View>
          </View>

          {/* Topics/Focus Areas Section */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.accent }]}>FOCUS AREAS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('InfluencerStepFour', { data })}>
                <Text style={[styles.editButton, { color: colors.accent }]}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pillContainer}>
              {data.topics && data.topics.length > 0 ? (
                data.topics.map((topic: string, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.pill,
                      { backgroundColor: colors.pillBg, borderColor: colors.surfaceBorder },
                    ]}
                  >
                    <Text style={[styles.pillText, { color: colors.textMain }]}>{topic}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.bioText, { color: colors.textMuted }]}>
                  No focus areas selected
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Agreement Checkbox */}
        <TouchableOpacity
          style={[
            styles.agreementContainer,
            {
              backgroundColor: isDark ? 'rgba(11, 60, 74, 0.5)' : '#F2F3F3',
              borderColor: 'rgba(18, 107, 135, 0.2)',
            },
          ]}
          activeOpacity={0.8}
          onPress={() => setAgreed(!agreed)}
        >
          <MaterialCommunityIcons
            name={agreed ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={colors.accent}
            style={styles.checkboxIcon}
          />
          <Text style={[styles.agreementText, { color: colors.textMain }]}>
            I agree to uphold One Body&#39;s{' '}
            <Text style={{ color: colors.accent, fontWeight: '600' }}>
              Protestant Christian values
            </Text>{' '}
            and community guidelines.
          </Text>
        </TouchableOpacity>

        {/* Visual Shield Watermark */}
        <View style={styles.watermarkContainer}>
          <MaterialCommunityIcons
            name="shield-check"
            size={120}
            color={colors.textMain}
            style={styles.watermarkIcon}
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          { backgroundColor: colors.background, borderTopColor: colors.surfaceBorder },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, { borderColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.primary} />
          <Text style={[styles.backButtonText, { color: colors.primary }]}>BACK</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: colors.accent,
              opacity: agreed && !submitting ? 1 : 0.6,
            },
          ]}
          onPress={handleSubmit}
          disabled={!agreed || submitting}
        >
          <Text style={[styles.submitButtonText, { color: '#032F3C' }]}>
            {submitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#032F3C" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    minHeight: APP_HEADER_ROW_HEIGHT,
    borderBottomWidth: 1,
    transform: [{ translateY: APP_HEADER_ROW_OFFSET }],
  },
  headerSideSlot: {
    minWidth: APP_HEADER_SIDE_WIDTH + 40,
    minHeight: APP_HEADER_ROW_HEIGHT,
    justifyContent: 'center',
  },
  headerCenterWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 24 + APP_HEADER_SIDE_WIDTH,
    right: 24 + APP_HEADER_SIDE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleAndroidWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: APP_HEADER_ANDROID_TITLE_PADDING_LEFT,
  },
  headerTitle: {
    color: '#12D2D9',
    fontSize: 18,
    fontWeight: '600',
    textAlign: Platform.OS === 'android' ? 'left' : 'center',
  },
  headerStepText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'right',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 120, // Space for bottom nav
  },
  titleSection: {
    marginBottom: 32,
  },
  mainHeading: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 36,
  },
  subHeading: {
    fontSize: 14,
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  editButton: {
    fontSize: 12,
    fontWeight: '700',
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
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
  },
  igHandle: {
    fontSize: 14,
    fontWeight: '600',
  },
  igSub: {
    fontSize: 12,
  },
  rssList: {
    gap: 8,
  },
  rssRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rssText: {
    fontSize: 12,
    flex: 1,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: {
    fontSize: 12,
  },
  agreementContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 32,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  checkboxIcon: {
    marginRight: 12,
    marginTop: -2,
  },
  agreementText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  watermarkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
    opacity: 0.05,
    pointerEvents: 'none',
  },
  watermarkIcon: {
    alignSelf: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  submitButtonText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginRight: 6,
  },
});

export default CreatorReview;
