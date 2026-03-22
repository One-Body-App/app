import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  useColorScheme,
  Platform,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { StackScreenProps } from '@react-navigation/stack';
import { SettingsStackParamsList } from '@/src/navigator/types';

type Props = StackScreenProps<SettingsStackParamsList, 'CreatorSuccess'>;

const { width } = Dimensions.get('window');

// --- Dynamic Brand Palette ---
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#032F3C' : '#FFFFFF',
  surface: isDark ? 'rgba(11, 60, 74, 0.6)' : '#F2F3F3',
  surfaceBorder: isDark ? 'rgba(255,255,255,0.1)' : '#E6EAEC',
  primary: '#126B87',
  accent: '#12D2D9',
  textMain: isDark ? '#FFFFFF' : '#032F3C',
  textMuted: isDark ? '#81979E' : '#68828A',
  circleBorder: isDark ? 'rgba(18, 210, 217, 0.15)' : 'rgba(18, 107, 135, 0.15)',
  headerBg: isDark ? 'rgba(3, 47, 60, 0.9)' : 'rgba(255, 255, 255, 0.9)',
});

function CreatorSubmitSuccess({ navigation }: Props) {
  const isDark = useColorScheme() === 'dark';
  const colors = getThemeColors(isDark);

  const onReturnHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as any }],
    });
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
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Creator Application</Text>
        </View>
        <Text style={[styles.headerStepText, { color: colors.textMuted }]}>STEP 4 OF 4</Text>
      </View>

      <View style={styles.mainContent}>
        {/* Background concentric circles */}
        <View style={styles.circlesWrapper} pointerEvents="none">
          <View style={[styles.circleLarge, { borderColor: colors.circleBorder }]}>
            <View style={[styles.circleMedium, { borderColor: colors.circleBorder }]}>
              <View style={[styles.circleSmall, { borderColor: colors.circleBorder }]} />
            </View>
          </View>
        </View>

        {/* Abstract background watermark */}
        <View style={styles.watermarkWrapper} pointerEvents="none">
          <MaterialCommunityIcons name="account-group" size={400} color={colors.accent} />
        </View>

        {/* Success visual */}
        <View style={styles.successVisualContainer}>
          <View style={[styles.iconGlow, { backgroundColor: colors.accent }]}>
            <MaterialCommunityIcons name="check-bold" size={60} color={colors.background} />
          </View>

          <View style={styles.textContainer}>
            <View
              style={[
                styles.missionPill,
                {
                  backgroundColor: isDark ? 'rgba(18, 210, 217, 0.1)' : 'rgba(18, 210, 217, 0.2)',
                  borderColor: colors.circleBorder,
                },
              ]}
            >
              <Text style={[styles.missionPillText, { color: colors.accent }]}>
                MISSION ACCOMPLISHED
              </Text>
            </View>
            <Text style={[styles.mainHeading, { color: colors.textMain }]}>
              Application Received!
            </Text>
            <Text style={[styles.subHeading, { color: colors.textMuted }]}>
              Thank you for stepping up to serve the One Body community. Our team will review your
              Creator application and be in touch soon.
            </Text>
          </View>
        </View>

        {/* Secondary Info Card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <View
            style={[
              styles.infoIconWrapper,
              { backgroundColor: isDark ? 'rgba(18, 107, 135, 0.3)' : 'rgba(18, 210, 217, 0.2)' },
            ]}
          >
            <MaterialCommunityIcons name="auto-fix" size={24} color={colors.accent} />
          </View>
          <View style={styles.infoTextWrapper}>
            <Text style={[styles.infoTitle, { color: colors.textMain }]}>
              May God bless your ministry!
            </Text>
            <Text style={[styles.infoSub, { color: colors.textMuted }]}>
              Expect a response in your inbox within 2-3 business days.
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Action Shell */}
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.surfaceBorder },
        ]}
      >
        <TouchableOpacity
          style={[styles.returnButton, { backgroundColor: colors.accent }]}
          activeOpacity={0.8}
          onPress={onReturnHome}
        >
          <Text style={[styles.returnButtonText, { color: '#032F3C' }]}>RETURN TO FEED</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#032F3C" />
        </TouchableOpacity>
        <Text style={[styles.footerStatusText, { color: colors.textMuted }]}>
          REVIEW STATUS IN PROFILE
        </Text>
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
    height: 64,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#12D2D9',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  headerStepText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  circlesWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: '10%',
  },
  circleLarge: {
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleMedium: {
    width,
    height: width,
    borderRadius: width * 0.5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSmall: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    borderWidth: 1,
  },
  watermarkWrapper: {
    position: 'absolute',
    right: -100,
    top: '15%',
    opacity: 0.03,
  },
  successVisualContainer: {
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 2,
  },
  iconGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#12D2D9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  missionPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  missionPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  mainHeading: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
    zIndex: 2,
  },
  infoIconWrapper: {
    padding: 10,
    borderRadius: 12,
    marginRight: 16,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: Platform.OS === 'ios' ? 32 : 24,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
    borderRadius: 28,
    marginBottom: 16,
  },
  returnButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginRight: 8,
  },
  footerStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});

export default CreatorSubmitSuccess;
