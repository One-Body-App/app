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

export default function BasicInfoScreen() {
  const [title, setTitle] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header Navigation */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Basic Info</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Section */}
          <View style={styles.progressHeader}>
            <Text style={styles.stepText}>Step 1 of 7</Text>
            <Text style={styles.percentageText}>14%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          {/* Event Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EVENT TITLE</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter the name of your event"
              placeholderTextColor="#9aacb1"
            />
          </View>

          {/* Event Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EVENT TYPE</Text>
            <TouchableOpacity style={styles.dropdownInput}>
              <Text style={styles.placeholderText}>Select type (e.g., Worship, Conference)</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Event Photo Upload */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EVENT PHOTO</Text>
            <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7}>
              <View style={styles.uploadIconContainer}>
                {/* Replace with an actual SVG cloud icon */}
                <Text style={styles.cloudIcon}>☁️</Text>
              </View>
              <Text style={styles.uploadPrimaryText}>Click to upload or drag and drop</Text>
              <Text style={styles.uploadSecondaryText}>PNG, JPG or WEBP (max. 5MB)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Fixed Bottom Navigation */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.draftButton}>
            <Text style={styles.draftButtonText}>Save</Text>
            <Text style={styles.draftButtonText}>Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Next Step</Text>
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
    backgroundColor: '#f6f7f8', // background-light
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
    backgroundColor: '#f6f7f8',
  },
  backButton: {
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
    paddingBottom: 100, // Space for the absolute footer
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
    fontWeight: '600',
    color: '#032f3c',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#126b87', // Primary
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#e6eaec', // Light gray track
    borderRadius: 4,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressFill: {
    width: '14%',
    height: '100%',
    backgroundColor: '#12d2d9', // Accent
    borderRadius: 4,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#032f3c',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6eaec',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: '#032f3c',
  },
  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6eaec',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#68828a',
  },
  placeholderText: {
    color: '#032f3c',
    fontSize: 16,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#b3c1c5',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  cloudIcon: {
    fontSize: 24,
  },
  uploadPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#032f3c',
    marginBottom: 4,
  },
  uploadSecondaryText: {
    fontSize: 14,
    color: '#68828a',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f6f7f8',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e6eaec',
  },
  draftButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  draftButtonText: {
    color: '#126b87',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#126b87',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 32,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  arrowIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
