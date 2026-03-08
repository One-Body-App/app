import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function PayoutMethodScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const styles = getStyles(isDarkMode);

  const [businessName, setBusinessName] = useState('');
  const [ein, setEin] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backIconButton}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Step 6 of 7</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Bar attached to Header */}
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Title & Description */}
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Payout Method</Text>
            <Text style={styles.sectionSubtitle}>
              Confirm your business details and choose how you would like to receive payments.
            </Text>
          </View>

          {/* Card 1: Business Confirmation */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircleBlue}>
                <Text style={styles.iconBlue}>🏢</Text>
              </View>
              <View style={styles.cardHeaderTextContainer}>
                <Text style={styles.cardTitle}>Business Confirmation</Text>
                <Text style={styles.cardStepText}>STEP 1: IDENTITY</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Legal Business Name</Text>
              <TextInput
                style={styles.textInput}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Acme Corp LLC"
                placeholderTextColor={isDarkMode ? '#68828a' : '#9aacb1'}
              />
            </View>

            <View style={styles.inputGroupLast}>
              <Text style={styles.label}>Employer Identification Number (EIN)</Text>
              <TextInput
                style={styles.textInput}
                value={ein}
                onChangeText={setEin}
                placeholder="XX-XXXXXXX"
                placeholderTextColor={isDarkMode ? '#68828a' : '#9aacb1'}
                keyboardType="default"
              />
            </View>
          </View>

          {/* Card 2: Payout Details */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircleGreen}>
                <Text style={styles.iconGreen}>💵</Text>
              </View>
              <View style={styles.cardHeaderTextContainer}>
                <Text style={styles.cardTitle}>Payout Details</Text>
                <Text style={styles.cardStepText}>STEP 2: DESTINATION</Text>
              </View>
            </View>

            <Text style={styles.payoutInstruction}>
              Connect an external account to receive your funds securely.
            </Text>

            <TouchableOpacity style={styles.primaryActionButton}>
              <Text style={styles.actionIconWhite}>🏦</Text>
              <Text style={styles.primaryActionText}>Connect Bank (Instant)</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.secondaryActionButton}>
              <Text style={styles.actionIconDark}>✏️</Text>
              <Text style={styles.secondaryActionText}>Add Bank Details Manually</Text>
            </TouchableOpacity>

            <View style={styles.secureFooter}>
              <Text style={styles.secureIcon}>🔒</Text>
              <Text style={styles.secureText}>End-to-end encrypted verification</Text>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Navigation */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerBackButton}>
            <Text style={styles.footerBackButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.footerNextButton}>
            <Text style={styles.footerNextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Generate styles based on color scheme
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
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: isDarkMode ? '#111d21' : '#f8f9fa',
    },
    backIconButton: {
      padding: 8,
      marginLeft: -8,
    },
    iconText: {
      fontSize: 24,
      color: '#126b87',
      fontWeight: '600',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    headerSpacer: {
      width: 40,
    },
    progressTrack: {
      height: 4,
      backgroundColor: isDarkMode ? '#1e333a' : '#e6eaec',
      width: '100%',
    },
    progressFill: {
      width: '85%',
      height: '100%',
      backgroundColor: '#126b87',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 32,
      paddingBottom: 120, // Space for the absolute footer
    },
    sectionHeaderContainer: {
      alignItems: 'center',
      marginBottom: 32,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 12,
      textAlign: 'center',
    },
    sectionSubtitle: {
      fontSize: 16,
      color: isDarkMode ? '#9aacb1' : '#68828a',
      textAlign: 'center',
      lineHeight: 22,
    },
    card: {
      backgroundColor: isDarkMode ? '#1e333a' : '#ffffff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#355963' : '#e6eaec',
      padding: 20,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0 : 0.03,
      shadowRadius: 4,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#355963' : '#e6eaec',
      marginBottom: 20,
    },
    iconCircleBlue: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? 'rgba(18, 107, 135, 0.2)' : '#eef6f8',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    iconBlue: {
      fontSize: 20,
      color: '#126b87',
    },
    iconCircleGreen: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? 'rgba(14, 138, 58, 0.2)' : '#e6f8ea',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    iconGreen: {
      fontSize: 20,
      color: '#0e8a3a',
    },
    cardHeaderTextContainer: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#ffffff' : '#032f3c',
      marginBottom: 4,
    },
    cardStepText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDarkMode ? '#9aacb1' : '#68828a',
      letterSpacing: 0.5,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputGroupLast: {
      marginBottom: 0,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: isDarkMode ? '#e6eaec' : '#032f3c',
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: isDarkMode ? '#111d21' : '#ffffff',
      borderWidth: 1,
      borderColor: isDarkMode ? '#4f6d77' : '#e6eaec',
      borderRadius: 8,
      paddingHorizontal: 16,
      height: 52,
      fontSize: 15,
      color: isDarkMode ? '#ffffff' : '#032f3c',
    },
    payoutInstruction: {
      fontSize: 14,
      color: isDarkMode ? '#9aacb1' : '#4f6d77',
      textAlign: 'center',
      marginBottom: 20,
      paddingHorizontal: 8,
    },
    primaryActionButton: {
      flexDirection: 'row',
      backgroundColor: '#126b87',
      height: 52,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    actionIconWhite: {
      fontSize: 18,
      color: '#ffffff',
      marginRight: 8,
    },
    primaryActionText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '700',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDarkMode ? '#355963' : '#e6eaec',
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 12,
      fontWeight: '600',
      color: isDarkMode ? '#68828a' : '#b3c1c5',
    },
    secondaryActionButton: {
      flexDirection: 'row',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: isDarkMode ? '#4f6d77' : '#cdd5d8',
      height: 52,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    actionIconDark: {
      fontSize: 18,
      marginRight: 8,
    },
    secondaryActionText: {
      color: isDarkMode ? '#ffffff' : '#032f3c',
      fontSize: 15,
      fontWeight: '700',
    },
    secureFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    secureIcon: {
      fontSize: 12,
      marginRight: 6,
      color: isDarkMode ? '#68828a' : '#68828a',
    },
    secureText: {
      fontSize: 11,
      color: isDarkMode ? '#68828a' : '#68828a',
      fontWeight: '500',
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
    footerBackButton: {
      flex: 1,
      height: 56,
      borderRadius: 12,
      backgroundColor: isDarkMode ? '#1e333a' : '#f6f7f8',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    footerBackButtonText: {
      color: isDarkMode ? '#ffffff' : '#032f3c',
      fontSize: 16,
      fontWeight: '700',
    },
    footerNextButton: {
      flex: 2,
      backgroundColor: '#126b87',
      height: 56,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerNextButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
    },
  });
