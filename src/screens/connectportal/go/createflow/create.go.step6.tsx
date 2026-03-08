import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useColorScheme,
  Image,
} from 'react-native';

export default function ReviewAndConfirmScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review & Confirm</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Section */}
          <View style={styles.progressHeader}>
            <Text style={styles.stepText}>Step 6 of 7</Text>
            <Text style={styles.percentageText}>85%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          {/* Section: Title & Description */}
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Review your event details</Text>
            <Text style={styles.sectionSubtitle}>
              Almost there! Double check everything before we make it official.
            </Text>
          </View>

          {/* Event Summary Card */}
          <View style={styles.summaryCard}>
            {/* Image Placeholder */}
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>Image</Text>
            </View>

            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>EVENT SUMMARY</Text>
              <Text style={styles.summaryTitle}>Summer Community Mixer</Text>

              <View style={styles.summaryTagsRow}>
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>Free Event</Text>
                </View>

                <TouchableOpacity style={styles.editButton}>
                  <Text style={styles.editIcon}>✏️</Text>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* General Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeaderRow}>
              <View style={styles.infoIconCircleDark}>
                <Text style={styles.infoIconWhite}>ℹ️</Text>
              </View>
              <Text style={styles.infoHeaderTitle}>General Info</Text>
            </View>

            {/* Date & Time */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconCircleLight}>
                <Text style={styles.infoIconBlue}>📅</Text>
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>DATE & TIME</Text>
                <Text style={styles.infoValue}>Saturday, August 24 • 2:00 PM - 6:00 PM</Text>
              </View>
            </View>

            {/* Location */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconCircleLight}>
                <Text style={styles.infoIconBlue}>📍</Text>
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>LOCATION</Text>
                <Text style={styles.infoValue}>Central Park North Pavilion</Text>
                <Text style={styles.infoSubValue}>123 Park Lane, New York, NY</Text>
              </View>
            </View>

            {/* Capacity */}
            <View style={styles.infoRow}>
              <View style={styles.infoIconCircleLight}>
                <Text style={styles.infoIconBlue}>👥</Text>
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>CAPACITY</Text>
                <Text style={styles.infoValue}>150 People Max</Text>
              </View>
            </View>
          </View>

          {/* Free Registration Banner */}
          <View style={styles.registrationBanner}>
            <View style={styles.registrationIconCircle}>
              <Text style={styles.registrationIcon}>✔️</Text>
            </View>
            <View style={styles.registrationTextContainer}>
              <Text style={styles.registrationTitle}>Free Registration</Text>
              <Text style={styles.registrationSubtitle}>
                No payment processing needed for this event.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Navigation */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Publish Event</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111d21' : '#f8f9fa',
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: isDarkMode ? '#111d21' : '#f8f9fa',
    },
    iconButton: {
      padding: 8,
      marginLeft: -8,
    },
    iconText: {
      fontSize: 24,
      color: '#126b87',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    headerSpacer: {
      width: 40,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 120, // Space for the absolute footer
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 8,
      marginTop: 8,
    },
    stepText: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#b3c1c5' : '#032f3c',
    },
    percentageText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#126b87',
    },
    progressTrack: {
      height: 8,
      backgroundColor: isDarkMode ? '#1e333a' : '#cdd5d8',
      borderRadius: 4,
      marginBottom: 32,
      overflow: 'hidden',
    },
    progressFill: {
      width: '85%',
      height: '100%',
      backgroundColor: '#126b87',
      borderRadius: 4,
    },
    sectionHeaderContainer: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 15,
      color: isDarkMode ? '#9aacb1' : '#68828a',
    },
    summaryCard: {
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
    },
    imagePlaceholder: {
      height: 160,
      backgroundColor: '#a0c4cf',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imagePlaceholderText: {
      color: '#ffffff',
      fontWeight: 'bold',
    },
    summaryContent: {
      padding: 16,
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: '#126b87',
      letterSpacing: 1,
      marginBottom: 8,
    },
    summaryTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 16,
    },
    summaryTagsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    freeBadge: {
      backgroundColor: isDarkMode ? 'rgba(18, 210, 217, 0.2)' : '#e6f8ea',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    freeBadgeText: {
      color: isDarkMode ? '#12d2d9' : '#0e8a3a',
      fontSize: 13,
      fontWeight: '700',
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#355963' : '#f2f8fa',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    editIcon: {
      fontSize: 14,
      marginRight: 6,
    },
    editButtonText: {
      color: isDarkMode ? '#ffffff' : '#126b87',
      fontSize: 14,
      fontWeight: '700',
    },
    infoCard: {
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    infoHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    infoIconCircleDark: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#126b87',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    infoIconWhite: {
      fontSize: 12,
      color: '#ffffff',
    },
    infoHeaderTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    infoRow: {
      flexDirection: 'row',
      marginBottom: 24,
    },
    infoIconCircleLight: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#111d21' : '#f8f9fa',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    infoIconBlue: {
      fontSize: 18,
      color: '#126b87',
    },
    infoTextContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    infoLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: isDarkMode ? '#9aacb1' : '#68828a',
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    infoValue: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    infoSubValue: {
      fontSize: 14,
      color: isDarkMode ? '#9aacb1' : '#4f6d77',
      marginTop: 2,
    },
    registrationBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? 'rgba(18, 107, 135, 0.15)' : '#eef2f5',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(18, 107, 135, 0.3)' : '#e6eaec',
    },
    registrationIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#126b87',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    registrationIcon: {
      fontSize: 16,
      color: '#ffffff',
    },
    registrationTextContainer: {
      flex: 1,
    },
    registrationTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 2,
    },
    registrationSubtitle: {
      fontSize: 13,
      color: isDarkMode ? '#9aacb1' : '#4f6d77',
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#111d21' : '#ffffff',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#1e333a' : '#e6eaec',
    },
    backButton: {
      flex: 1,
      height: 56,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#1e333a' : '#e6eaec',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    backButtonText: {
      color: isDarkMode ? '#ffffff' : '#032f3c',
      fontSize: 16,
      fontWeight: '800',
    },
    nextButton: {
      flex: 2,
      backgroundColor: '#126b87',
      height: 56,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '800',
    },
  });
