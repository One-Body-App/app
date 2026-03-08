import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

export default function TicketingTypeScreen() {
  const [ticketType, setTicketType] = useState('paid'); // 'free' | 'paid'
  const [paymentOption, setPaymentOption] = useState('internal'); // 'external' | 'internal'

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backIconButton}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticketing Type</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Section */}
          <View style={styles.progressHeader}>
            <Text style={styles.stepText}>Step 4 of 7</Text>
            <Text style={styles.percentageText}>56%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          {/* Section: Ticket Type */}
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>What type of tickets are you offering?</Text>
            <Text style={styles.sectionSubtitle}>
              Choose how guests will register for your event.
            </Text>
          </View>

          {/* Ticket Type Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                ticketType === 'free' ? styles.toggleButtonActive : styles.toggleButtonInactive,
              ]}
              onPress={() => setTicketType('free')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleText,
                  ticketType === 'free' ? styles.toggleTextActive : styles.toggleTextInactive,
                ]}
              >
                Free Event
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                ticketType === 'paid' ? styles.toggleButtonActive : styles.toggleButtonInactive,
              ]}
              onPress={() => setTicketType('paid')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleText,
                  ticketType === 'paid' ? styles.toggleTextActive : styles.toggleTextInactive,
                ]}
              >
                Paid Event
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conditional Payment Options */}
          {ticketType === 'paid' && (
            <View style={styles.paymentOptionsContainer}>
              <Text style={styles.paymentOptionsTitle}>Payment Options</Text>

              {/* Option 1: External Link */}
              <TouchableOpacity
                style={[styles.optionCard, paymentOption === 'external' && styles.optionCardActive]}
                onPress={() => setPaymentOption('external')}
                activeOpacity={0.9}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionIconContainer}>
                    <Text style={styles.optionIcon}>🔗</Text>
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Add external payment link</Text>
                    <Text style={styles.optionSubtitle}>
                      Use Eventbrite, Stripe, or other platforms
                    </Text>
                  </View>
                </View>
                <View style={styles.radioContainer}>
                  <View
                    style={[
                      styles.radioOuter,
                      paymentOption === 'external' && styles.radioOuterActive,
                    ]}
                  >
                    {paymentOption === 'external' && <View style={styles.radioInner} />}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Option 2: Internal Payments */}
              <TouchableOpacity
                style={[styles.optionCard, paymentOption === 'internal' && styles.optionCardActive]}
                onPress={() => setPaymentOption('internal')}
                activeOpacity={0.9}
              >
                <View style={styles.optionRow}>
                  <View style={styles.optionContent}>
                    <View style={styles.optionIconContainer}>
                      <Text style={styles.optionIcon}>💳</Text>
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>Set up One Body Payments</Text>
                      <Text style={styles.optionSubtitle}>
                        Collect payments directly through us
                      </Text>
                    </View>
                  </View>
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioOuter,
                        paymentOption === 'internal' && styles.radioOuterActive,
                      ]}
                    >
                      {paymentOption === 'internal' && <View style={styles.radioInner} />}
                    </View>
                  </View>
                </View>

                {/* Recommended Badge */}
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedIcon}>✔️</Text>
                  <Text style={styles.recommendedText}>Recommended for faster payouts</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff', // Clean white background based on screenshot
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
    backgroundColor: '#ffffff',
  },
  backIconButton: {
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
    color: '#032f3c',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
    color: '#032f3c',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#126b87', // Primary dark
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#e6eaec', // Muted track
    borderRadius: 4,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressFill: {
    width: '56%',
    height: '100%',
    backgroundColor: '#126b87', // Primary dark
    borderRadius: 4,
  },
  sectionHeaderContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#032f3c',
    marginBottom: 8,
    lineHeight: 32,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#68828a',
    lineHeight: 22,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f7f7f7', // Background light gray
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  toggleButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButtonInactive: {
    backgroundColor: 'transparent',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#126b87',
  },
  toggleTextInactive: {
    color: '#68828a',
  },
  paymentOptionsContainer: {
    marginBottom: 24,
  },
  paymentOptionsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#032f3c',
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e6eaec',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  optionCardActive: {
    borderColor: '#126b87',
    backgroundColor: '#f2f8fa', // very light primary tint
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f2f8fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIcon: {
    fontSize: 20,
  },
  optionTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#032f3c',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#68828a',
    lineHeight: 20,
  },
  radioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cdd5d8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: '#126b87',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#126b87',
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f8ea', // Light green
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  recommendedIcon: {
    fontSize: 14,
    marginRight: 8,
    color: '#0e8a3a', // Dark green text
  },
  recommendedText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#0e8a3a',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f7f7f7',
  },
  primaryButton: {
    backgroundColor: '#126b87',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#f7f7f7',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#032f3c',
    fontSize: 16,
    fontWeight: '800',
  },
});
