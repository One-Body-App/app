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

export default function EventSuccessScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeIconButton}>
            <Text style={styles.iconText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Success</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Section */}
          <View style={styles.progressHeader}>
            <Text style={styles.stepText}>Setup Complete</Text>
            <Text style={styles.percentageText}>100%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          {/* Hero Section */}
          <View style={styles.heroContainer}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkIcon}>✔️</Text>
            </View>
            <Text style={styles.heroTitle}>Your Event is Live!</Text>
            <Text style={styles.heroSubtitle}>
              Congratulations! Your event is now visible to the community and ready for
              registrations.
            </Text>
          </View>

          {/* QR Code Card */}
          <View style={styles.qrCard}>
            <View style={styles.qrOuterBox}>
              <View style={styles.qrInnerBox}>
                {/* Replace with actual QR Code component/image */}
                <Text style={styles.qrPlaceholderIcon}>📱</Text>
                <Text style={styles.qrPlaceholderText}>QR Code</Text>
              </View>
            </View>
            <Text style={styles.qrTitle}>Event Access Pass</Text>
            <Text style={styles.qrSubtitle}>Scan or share this code to invite guests</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.buttonIconWhite}>🔗</Text>
              <Text style={styles.primaryButtonText}>Share to Home Feed</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.buttonIconDark}>📊</Text>
              <Text style={styles.secondaryButtonText}>Go to Event Dashboard</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Bottom Tool Row */}
          <View style={styles.toolsRow}>
            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.toolIconCircle}>
                <Text style={styles.toolIcon}>📥</Text>
              </View>
              <Text style={styles.toolLabel}>SAVE QR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.toolIconCircle}>
                <Text style={styles.toolIcon}>📋</Text>
              </View>
              <Text style={styles.toolLabel}>COPY LINK</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolButton}>
              <View style={styles.toolIconCircle}>
                <Text style={styles.toolIcon}>•••</Text>
              </View>
              <Text style={styles.toolLabel}>MORE</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// Generate styles based on color scheme
const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111d21' : '#f6f7f8',
    },
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      backgroundColor: isDarkMode ? '#111d21' : '#f6f7f8',
    },
    closeIconButton: {
      padding: 8,
      marginLeft: -8,
    },
    iconText: {
      fontSize: 22,
      color: isDarkMode ? '#ffffff' : '#032f3c',
      fontWeight: '300',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    headerSpacer: {
      width: 40,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 8,
    },
    stepText: {
      fontSize: 14,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    percentageText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#126b87',
    },
    progressTrack: {
      height: 6,
      backgroundColor: isDarkMode ? '#1e333a' : '#e6eaec',
      borderRadius: 4,
      marginBottom: 32,
      overflow: 'hidden',
    },
    progressFill: {
      width: '100%',
      height: '100%',
      backgroundColor: '#126b87',
    },
    heroContainer: {
      alignItems: 'center',
      marginBottom: 32,
      paddingHorizontal: 16,
    },
    checkCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: isDarkMode ? 'rgba(18, 107, 135, 0.2)' : '#eef6f8',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    checkIcon: {
      fontSize: 24,
      color: '#126b87',
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 12,
      textAlign: 'center',
    },
    heroSubtitle: {
      fontSize: 15,
      color: isDarkMode ? '#9aacb1' : '#4f6d77',
      textAlign: 'center',
      lineHeight: 22,
    },
    qrCard: {
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
      padding: 24,
      alignItems: 'center',
      marginBottom: 24,
    },
    qrOuterBox: {
      width: 200,
      height: 200,
      backgroundColor: isDarkMode ? '#111d21' : '#e6eaec',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    qrInnerBox: {
      width: 140,
      height: 140,
      backgroundColor: '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    qrPlaceholderIcon: {
      fontSize: 40,
      marginBottom: 8,
    },
    qrPlaceholderText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#032f3c',
    },
    qrTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 4,
    },
    qrSubtitle: {
      fontSize: 13,
      color: isDarkMode ? '#9aacb1' : '#68828a',
    },
    actionContainer: {
      marginBottom: 24,
    },
    primaryButton: {
      flexDirection: 'row',
      backgroundColor: '#126b87',
      height: 56,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    buttonIconWhite: {
      fontSize: 18,
      color: '#ffffff',
      marginRight: 8,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
    },
    secondaryButton: {
      flexDirection: 'row',
      backgroundColor: isDarkMode ? '#1e333a' : '#e6eaec',
      height: 56,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonIconDark: {
      fontSize: 18,
      marginRight: 8,
    },
    secondaryButtonText: {
      color: isDarkMode ? '#ffffff' : '#126b87',
      fontSize: 16,
      fontWeight: '700',
    },
    divider: {
      height: 1,
      backgroundColor: isDarkMode ? '#355963' : '#e6eaec',
      marginBottom: 24,
    },
    toolsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 32,
    },
    toolButton: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0 : 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    toolIcon: {
      fontSize: 18,
      color: '#68828a',
    },
    toolLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: isDarkMode ? '#9aacb1' : '#68828a',
      letterSpacing: 0.5,
    },
  });
