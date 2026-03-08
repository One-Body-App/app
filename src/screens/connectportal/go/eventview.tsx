import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  ImageBackground,
  Image,
  Platform,
  SafeAreaView,
} from 'react-native';

export default function EventViewScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Header Section */}
        <ImageBackground
          source={{ uri: 'https://via.placeholder.com/600x400/a0c4cf/ffffff?text=Wellness+Event' }}
          style={styles.heroImage}
          resizeMode="cover"
        >
          {/* Gradient Overlay Placeholder */}
          <View style={styles.heroOverlay} />

          {/* Header Actions (Absolute positioned over image) */}
          <SafeAreaView>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerIconButton}>
                <Text style={styles.iconTextDark}>←</Text>
              </TouchableOpacity>
              <View style={styles.headerRightActions}>
                <TouchableOpacity style={styles.headerIconButton}>
                  <Text style={styles.iconTextPrimary}>🔗</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIconButton}>
                  <Text style={styles.iconTextPrimary}>🔖</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>

        {/* Overlapping Event Logistics Card */}
        <View style={styles.eventCardContainer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>WELLNESS</Text>
          </View>

          <Text style={styles.eventTitle}>Community Wellness Workshop</Text>

          <View style={styles.infoSection}>
            {/* Date/Time */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconCircle}>
                <Text style={styles.infoIcon}>📅</Text>
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Saturday, Oct 12, 2024</Text>
                <Text style={styles.infoSubtitle}>10:00 AM - 1:00 PM (3 hours)</Text>
              </View>
            </View>

            {/* Location */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconCircle}>
                <Text style={styles.infoIcon}>📍</Text>
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Central Park North Entrance</Text>
                <Text style={styles.infoSubtitle}>123 Park Avenue, New York, NY</Text>
                <TouchableOpacity style={styles.directionsButton}>
                  <Text style={styles.directionsIcon}>↱</Text>
                  <Text style={styles.directionsText}>GET DIRECTIONS</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Organizer Section */}
        <View style={styles.organizerSection}>
          <Text style={styles.sectionOverline}>POSTED BY</Text>
          <View style={styles.organizerCard}>
            <View style={styles.organizerIdentity}>
              <View style={styles.avatarPlaceholder}>
                <Text style={{ fontSize: 20 }}>👤</Text>
              </View>
              <View style={styles.organizerTextContainer}>
                <Text style={styles.organizerName}>Sarah Jenkins</Text>
                <Text style={styles.organizerRole}>Community Health Lead</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>FOLLOW</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>About the Event</Text>
          <Text style={styles.bodyText}>
            Join us for an empowering morning dedicated to holistic health and community connection.
            This workshop is designed for all skill levels and focuses on practical wellness
            strategies for busy urban lives.
          </Text>
          <Text style={[styles.bodyText, { marginTop: 12 }]}>
            We will cover mindfulness techniques, outdoor mobility exercises, and basic nutrition
            tips led by local experts. Participants are encouraged to bring comfortable clothing and
            a water bottle.
          </Text>

          {/* Bullet Points */}
          <View style={styles.bulletList}>
            <View style={styles.bulletRow}>
              <Text style={styles.bulletIcon}>✔️</Text>
              <Text style={styles.bulletText}>Complimentary healthy snacks provided</Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bulletIcon}>✔️</Text>
              <Text style={styles.bulletText}>Free yoga mats for the first 20 arrivals</Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bulletIcon}>✔️</Text>
              <Text style={styles.bulletText}>Q&A session with certified nutritionists</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Registration Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.registerButton} activeOpacity={0.9}>
          <Text style={styles.registerButtonText}>REGISTER NOW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Generate styles based on color scheme
const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111d21' : '#f6f7f8',
    },
    scrollContent: {
      paddingBottom: 120, // Make room for the fixed bottom bar
    },
    heroImage: {
      width: '100%',
      height: 320,
      justifyContent: 'flex-start',
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.2)', // Light darkening for icon contrast
    },
    headerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? 40 : 16, // Adjust for status bar
    },
    headerRightActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerIconButton: {
      width: 44,
      height: 44,
      backgroundColor: isDarkMode ? 'rgba(17, 29, 33, 0.8)' : 'rgba(255, 255, 255, 0.95)',
      borderRadius: 12, // Rounded corners per request
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    iconTextDark: {
      fontSize: 22,
      color: isDarkMode ? '#ffffff' : '#032f3c',
      fontWeight: 'bold',
    },
    iconTextPrimary: {
      fontSize: 20,
      color: '#126b87',
    },
    eventCardContainer: {
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      marginHorizontal: 16,
      marginTop: -48, // Pulls the card up over the image
      borderRadius: 16, // Rounded corners per request
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDarkMode ? 0.3 : 0.08,
      shadowRadius: 12,
      elevation: 5,
      zIndex: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : 'transparent',
    },
    categoryBadge: {
      backgroundColor: isDarkMode ? 'rgba(18, 107, 135, 0.2)' : '#eef6f8',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8, // Rounded
      marginBottom: 16,
    },
    categoryBadgeText: {
      color: '#126b87',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
    },
    eventTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      lineHeight: 34,
      marginBottom: 24,
    },
    infoSection: {
      gap: 20,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    infoIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 12, // Rounded corners
      backgroundColor: isDarkMode ? 'rgba(18, 107, 135, 0.2)' : '#eef6f8',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    infoIcon: {
      fontSize: 20,
      color: '#126b87',
    },
    infoTextContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingTop: 2,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 4,
    },
    infoSubtitle: {
      fontSize: 14,
      color: isDarkMode ? '#9aacb1' : '#68828a',
      lineHeight: 20,
    },
    directionsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    directionsIcon: {
      fontSize: 16,
      color: '#126b87',
      marginRight: 4,
      fontWeight: 'bold',
    },
    directionsText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#126b87',
      letterSpacing: 0.5,
    },
    organizerSection: {
      paddingHorizontal: 16,
      paddingTop: 32,
      paddingBottom: 24,
    },
    sectionOverline: {
      fontSize: 11,
      fontWeight: '800',
      color: isDarkMode ? '#9aacb1' : '#9aacb1',
      letterSpacing: 1.5,
      marginBottom: 12,
    },
    organizerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      padding: 16,
      borderRadius: 16, // Rounded
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
    },
    organizerIdentity: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarPlaceholder: {
      width: 52,
      height: 52,
      borderRadius: 26, // Fully rounded
      backgroundColor: '#cdd5d8',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    organizerTextContainer: {
      flex: 1,
    },
    organizerName: {
      fontSize: 16,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 2,
    },
    organizerRole: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#9aacb1' : '#68828a',
    },
    followButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8, // Rounded
      borderWidth: 1.5,
      borderColor: '#126b87',
    },
    followButtonText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#126b87',
      letterSpacing: 0.5,
    },
    aboutSection: {
      paddingHorizontal: 16,
    },
    aboutTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 12,
    },
    bodyText: {
      fontSize: 15,
      lineHeight: 24,
      color: isDarkMode ? '#b3c1c5' : '#4f6d77',
    },
    bulletList: {
      marginTop: 20,
      gap: 12,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    bulletIcon: {
      fontSize: 16,
      color: '#126b87',
      marginRight: 12,
      marginTop: 2,
    },
    bulletText: {
      flex: 1,
      fontSize: 15,
      color: isDarkMode ? '#b3c1c5' : '#4f6d77',
      lineHeight: 22,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDarkMode ? '#111d21' : '#ffffff',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#1e333a' : '#e6eaec',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: isDarkMode ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 10,
    },
    registerButton: {
      backgroundColor: '#126b87',
      height: 56,
      borderRadius: 14, // Noticeably rounded per request
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#126b87',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    registerButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 1,
    },
  });
