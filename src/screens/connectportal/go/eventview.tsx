import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';

const { width } = Dimensions.get('window');

// --- THEME CONFIGURATION ---
const SHARED_COLORS = {
  primary: '#126B87', // One Body Primary
  primaryTransparent: 'rgba(18, 107, 135, 0.1)',
  primaryTransparentDark: 'rgba(18, 107, 135, 0.2)',
  white: '#FFFFFF',
  black: '#000000',
  greenBg: '#DCFCE7',
  greenText: '#15803D',
  greenBgDark: 'rgba(21, 128, 61, 0.3)',
  greenTextDark: '#4ADE80',
};

const THEME = {
  light: {
    background: '#F6F7F8',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8FAFC', // slate-50
    text: '#0F172A', // slate-900
    textSecondary: '#475569', // slate-600
    textMuted: '#64748B', // slate-500
    border: '#F1F5F9', // slate-100
    mapPlaceholder: '#E2E8F0', // slate-200
  },
  dark: {
    background: '#111D21', // Dark background from your HTML
    surface: '#152328', // Dark surface from your HTML
    surfaceSecondary: 'rgba(30, 41, 59, 0.5)', // slate-800/50
    text: '#F8FAFC', // slate-100
    textSecondary: '#94A3B8', // slate-400
    textMuted: '#94A3B8',
    border: '#1E293B', // slate-800
    mapPlaceholder: '#334155', // slate-700
  },
};

function EventView(): React.JSX.Element {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;

  // Re-generate styles automatically when theme changes
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* --- FLOATING HEADER CONTROLS --- */}
      <SafeAreaView style={styles.floatingHeader}>
        <View style={styles.headerControls}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>⋯</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* --- HERO IMAGE --- */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: 'https://via.placeholder.com/600x400' }} style={styles.heroImage} />
          <View style={styles.heroGradient} />
        </View>

        {/* --- CONTENT BODY (Overlaps Hero Image) --- */}
        <View style={styles.contentBody}>
          {/* Title & Badge */}
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>Easter Sunday{'\n'}Thanksgiving</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>OPEN</Text>
            </View>
          </View>

          {/* Time & Location */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoText}>24 June, 2023 • 5:30 pm - 6:30 pm EST</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>Toronto, Canada</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>🧭 Get Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>🔖 Save Event</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>☁️</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Weather</Text>
                <Text style={styles.statValue}>24°C, Rain</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>🏷️</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Type</Text>
                <Text style={styles.statValue}>Conference</Text>
              </View>
            </View>
          </View>

          {/* Host Info */}
          <View style={styles.hostContainer}>
            <View style={styles.hostLeft}>
              <Image
                source={{ uri: 'https://via.placeholder.com/100' }}
                style={styles.hostAvatar}
              />
              <View>
                <Text style={styles.hostLabel}>Posted By</Text>
                <Text style={styles.hostName}>Nick Crawford</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>About the Event</Text>
            <Text style={styles.aboutText}>
              Join us for our annual Easter Sunday Thanksgiving service as we celebrate the season
              of renewal and hope. This community gathering features live worship music, inspiring
              guest speakers, and a post-service brunch. Everyone is welcome to participate in this
              joyous occasion as we reflect on our blessings and connect with the One Body
              community.
            </Text>
          </View>

          {/* Map Mini Preview */}
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapContainer}>
              <Image
                source={{ uri: 'https://via.placeholder.com/400x200' }}
                style={styles.mapImage}
              />
              {/* Fake Map Pin */}
              <View style={styles.mapPinOuter}>
                <View style={styles.mapPinInner} />
              </View>
            </View>
          </View>

          {/* External Link */}
          <View style={styles.linkSection}>
            <Text style={styles.linkLabel}>Registration Link</Text>
            <TouchableOpacity style={styles.linkRow}>
              <Text style={styles.linkText}>onebodyapp.org/events/easter-2023</Text>
              <Text style={styles.linkIcon}>↗</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// --- DYNAMIC STYLESHEET GENERATOR ---
const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    floatingHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
    },
    headerControls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'android' ? 40 : 16,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        ios: { backdropFilter: 'blur(10px)' }, // Requires external library to fully render on RN, simulated with opacity here
      }),
    },
    iconText: {
      color: SHARED_COLORS.white,
      fontSize: 20,
      fontWeight: 'bold',
    },
    heroContainer: {
      width,
      height: 320,
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    heroGradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 150,
      backgroundColor: 'rgba(0,0,0,0.4)', // Simplified gradient replacement
    },
    contentBody: {
      marginTop: -48, // Overlaps the hero image (similar to tailwind -mt-12)
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 48,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    titleText: {
      flex: 1,
      fontFamily: 'Lato',
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      lineHeight: 30,
    },
    badge: {
      backgroundColor: isDark ? SHARED_COLORS.greenBgDark : SHARED_COLORS.greenBg,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
      marginLeft: 12,
    },
    badgeText: {
      fontFamily: 'Lato',
      fontSize: 10,
      fontWeight: '800',
      color: isDark ? SHARED_COLORS.greenTextDark : SHARED_COLORS.greenText,
      letterSpacing: 0.5,
    },
    infoSection: {
      marginBottom: 24,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    infoIcon: {
      fontSize: 16,
      color: SHARED_COLORS.primary,
      marginRight: 12,
    },
    infoText: {
      fontFamily: 'Lato',
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    actionButtonsContainer: {
      marginBottom: 32,
      gap: 12, // Requires RN 0.71+
    },
    primaryButton: {
      backgroundColor: SHARED_COLORS.primary,
      borderRadius: 100,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      fontFamily: 'Lato',
      color: SHARED_COLORS.white,
      fontSize: 16,
      fontWeight: '700',
    },
    secondaryButton: {
      backgroundColor: isDark
        ? SHARED_COLORS.primaryTransparentDark
        : SHARED_COLORS.primaryTransparent,
      borderRadius: 100,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      fontFamily: 'Lato',
      color: SHARED_COLORS.primary,
      fontSize: 16,
      fontWeight: '700',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 32,
      gap: 16,
    },
    statCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark
        ? SHARED_COLORS.primaryTransparentDark
        : SHARED_COLORS.primaryTransparent,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: SHARED_COLORS.primaryTransparent,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(18, 107, 135, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    statIcon: {
      fontSize: 16,
    },
    statLabel: {
      fontFamily: 'Lato',
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 2,
    },
    statValue: {
      fontFamily: 'Lato',
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    hostContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceSecondary,
      padding: 16,
      borderRadius: 12,
      marginBottom: 32,
    },
    hostLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    hostAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 12,
    },
    hostLabel: {
      fontFamily: 'Lato',
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 2,
    },
    hostName: {
      fontFamily: 'Lato',
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
    },
    messageButtonText: {
      fontFamily: 'Lato',
      fontSize: 14,
      fontWeight: '800',
      color: SHARED_COLORS.primary,
    },
    aboutSection: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontFamily: 'Lato',
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 12,
    },
    aboutText: {
      fontFamily: 'Lato',
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    mapSection: {
      marginBottom: 32,
    },
    mapContainer: {
      height: 160,
      width: '100%',
      borderRadius: 12,
      backgroundColor: colors.mapPlaceholder,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    mapImage: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.8,
    },
    mapPinOuter: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: SHARED_COLORS.primary,
      borderWidth: 4,
      borderColor: SHARED_COLORS.white,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    mapPinInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: SHARED_COLORS.white,
    },
    linkSection: {
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    linkLabel: {
      fontFamily: 'Lato',
      fontSize: 14,
      fontWeight: '700',
      color: colors.textMuted,
      marginBottom: 8,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    linkText: {
      fontFamily: 'Lato',
      fontSize: 14,
      fontWeight: '800',
      color: SHARED_COLORS.primary,
      marginRight: 4,
    },
    linkIcon: {
      fontSize: 14,
      color: SHARED_COLORS.primary,
    },
  });

export default EventView;
