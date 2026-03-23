import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ScrollView,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';

// One Body Brand Color Palette
const BRAND_COLORS = {
  white: '#FFFFFF',
  black: '#032f3c',
  primaryDark: '#126b87',
  infoDark: '#12d2d9',
  overlay: 'rgba(3, 47, 60, 0.5)', // Dark overlay for the modal
  grays: {
    100: '#e6eaec',
    200: '#cdd5d8',
    300: '#b3c1c5',
    400: '#9aacb1',
    500: '#81979e',
    600: '#68828a',
    700: '#4f6d77',
    800: '#355963',
    900: '#000015',
  },
};

// Reusable Custom Radio Button
function RadioOption({
  label,
  isSelected,
  onSelect,
  theme,
}: {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  theme: { radioBorder: string; text: string };
}) {
  return (
    <TouchableOpacity style={styles.radioContainer} onPress={onSelect} activeOpacity={0.7}>
      <View
        style={[
          styles.radioOuterCircle,
          { borderColor: isSelected ? BRAND_COLORS.primaryDark : theme.radioBorder },
        ]}
      >
        {isSelected && <View style={styles.radioInnerCircle} />}
      </View>
      <Text style={[styles.radioLabel, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface ReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, notes: string) => void;
}

export default function ServeReportOpportunity({ isVisible, onClose, onSubmit }: ReportModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Dynamic Theme Mapping
  const theme = {
    background: isDark ? BRAND_COLORS.grays[900] : BRAND_COLORS.white,
    text: isDark ? BRAND_COLORS.white : BRAND_COLORS.black,
    subText: isDark ? BRAND_COLORS.grays[300] : BRAND_COLORS.grays[600],
    inputBg: isDark ? BRAND_COLORS.grays[800] : BRAND_COLORS.grays[100],
    inputBorder: isDark ? BRAND_COLORS.grays[700] : BRAND_COLORS.grays[200],
    radioBorder: isDark ? BRAND_COLORS.grays[500] : BRAND_COLORS.black, // Darker border in light mode per design
  };

  const [selectedReason, setSelectedReason] = useState('Fake opportunity');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const reportReasons = [
    'Fake opportunity',
    'Inappropriate posting',
    'Wrong location',
    'Misleading or false information',
    'Violation of Terms of service',
    'More',
  ];

  const handleSubmit = () => {
    onSubmit(selectedReason, additionalNotes);
    // Reset state after submission if needed
    setSelectedReason('Fake opportunity');
    setAdditionalNotes('');
  };

  return (
    <Modal animationType="fade" transparent visible={isVisible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.overlayTouchable} activeOpacity={1} onPress={onClose}>
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            {/* Prevent touch events inside the modal from closing it */}
            <TouchableOpacity activeOpacity={1}>
              {/* Header */}
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <MaterialIcons name="chevron-left" size={32} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Report Opportunity</Text>
                <View style={styles.headerSpacer} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <Text style={[styles.promptText, { color: theme.text }]}>
                  What is your reason for reporting this opportunity?
                </Text>

                {/* Radio Options */}
                <View style={styles.optionsList}>
                  {reportReasons.map((reason) => (
                    <RadioOption
                      key={reason}
                      label={reason}
                      isSelected={selectedReason === reason}
                      onSelect={() => setSelectedReason(reason)}
                      theme={theme}
                    />
                  ))}
                </View>

                {/* Additional Notes Field */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Additional notes</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                    ]}
                  >
                    <TextInput
                      style={[styles.inputBox, { color: theme.text }]}
                      placeholder="write"
                      placeholderTextColor={BRAND_COLORS.grays[500]}
                      multiline
                      maxLength={150}
                      value={additionalNotes}
                      onChangeText={setAdditionalNotes}
                    />
                    <Text style={[styles.charCount, { color: theme.subText }]}>
                      {additionalNotes.length}/150
                    </Text>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: BRAND_COLORS.overlay,
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380, // Prevents modal from getting too wide on tablets
    borderRadius: 20,
    paddingVertical: 16,
    maxHeight: '85%', // Ensures it doesn't overflow the screen
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerSpacer: {
    width: 24, // Matches close button width to center title
  },
  title: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'Lato', // Added per your design requests
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  promptText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Lato',
    lineHeight: 24,
    marginBottom: 24,
  },
  optionsList: {
    marginBottom: 24,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  radioOuterCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInnerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: BRAND_COLORS.primaryDark,
  },
  radioLabel: {
    fontSize: 16,
    fontFamily: 'Lato',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Lato',
    marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    height: 120, // Taller for multiline
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  inputBox: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Open Sans',
    alignSelf: 'flex-end',
    paddingRight: 12,
    paddingBottom: 8,
  },
  submitButton: {
    backgroundColor: BRAND_COLORS.primaryDark,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: BRAND_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lato',
  },
});
