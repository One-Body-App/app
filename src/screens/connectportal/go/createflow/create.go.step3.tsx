import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function DetailsAndCapacityScreen() {
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');

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
          <Text style={styles.headerTitle}>Details & Capacity</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Section */}
          <View style={styles.progressHeader}>
            <Text style={styles.stepText}>Step 3 of 7</Text>
            <Text style={styles.percentageText}>42% completed</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          {/* Section: Event Information */}
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>Event Information</Text>
            <Text style={styles.sectionSubtitle}>
              Provide the key details that attendees need to know about your event.
            </Text>
          </View>

          {/* Event Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Description</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what makes your event special, the agenda, and what guests should expect..."
              placeholderTextColor="#68828a"
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Capacity Limit */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Capacity Limit</Text>
            <View style={styles.capacityInputContainer}>
              <Text style={styles.inputIcon}>👥</Text>
              <TextInput
                style={styles.capacityInput}
                value={capacity}
                onChangeText={setCapacity}
                placeholder="Maximum number of attendees (e.g. 15)"
                placeholderTextColor="#68828a"
                keyboardType="number-pad"
              />
            </View>
            <Text style={styles.helperText}>Leave blank if there is no attendance limit.</Text>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              A clear description helps increase attendance by setting the right expectations. You
              can always edit this later.
            </Text>
          </View>
        </ScrollView>

        {/* Fixed Bottom Navigation */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Continue</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#f8f9fa',
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
    fontWeight: '700',
    color: '#032f3c',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 24,
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
    color: '#126b87', // Primary dark
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#68828a',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#cdd5d8', // Muted track
    borderRadius: 4,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressFill: {
    width: '42%',
    height: '100%',
    backgroundColor: '#126b87', // Primary dark
    borderRadius: 4,
  },
  sectionHeaderContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#032f3c',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#355963',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#032f3c',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cdd5d8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    minHeight: 160,
    fontSize: 16,
    color: '#032f3c',
    lineHeight: 22,
  },
  capacityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cdd5d8',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#68828a',
  },
  capacityInput: {
    flex: 1,
    fontSize: 16,
    color: '#032f3c',
  },
  helperText: {
    fontSize: 12,
    color: '#68828a',
    marginTop: 8,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#e6eaec', // Light background matching screenshot
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#355963',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e6eaec',
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#126b87',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: '#ffffff',
  },
  backButtonText: {
    color: '#126b87',
    fontSize: 16,
    fontWeight: '800',
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
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
    marginRight: 8,
  },
  arrowIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
});
