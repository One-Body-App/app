import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { ServeHeader, useServePalette, BRAND_COLORS } from '../shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeCreateJobStep1'>;

// Reusable Form Input Component
function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  theme,
  isMultiline = false,
  maxLength,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  theme: { text: string; inputBg: string; inputBorder: string; subText: string };
  isMultiline?: boolean;
  maxLength?: number;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
          isMultiline && styles.inputWrapperMultiline,
        ]}
      >
        <TextInput
          style={[styles.inputBox, { color: theme.text }, isMultiline && styles.inputBoxMultiline]}
          placeholder={placeholder}
          placeholderTextColor={BRAND_COLORS.grays[500]}
          value={value}
          onChangeText={onChangeText}
          multiline={isMultiline}
          maxLength={maxLength}
        />
        {maxLength && (
          <Text style={[styles.charCount, { color: theme.subText }]}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function ServeCreateJobStep1({ navigation }: Props) {
  const palette = useServePalette();

  // Form State
  const [visibility] = useState('Public');
  const [sector] = useState('');
  const [title, setTitle] = useState('Community manager for a firm');
  const [description, setDescription] = useState(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Et auctor molestie nisl quisque varius ut egestas. Risus mi tellus sit nibh vestibulum diam.'
  );
  const [requirements, setRequirements] = useState('• Accounting skills\n• Tech skills');
  const [location, setLocation] = useState('Toronto');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ServeHeader
          title="Create Job"
          titleColor={palette.text}
          onBack={() => navigation.navigate('ConnectServeHome')}
        />

        {/* Profile & Visibility Row */}
        <View style={styles.profileRow}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <TouchableOpacity
            style={[styles.visibilityDropdown, { backgroundColor: palette.inputBg }]}
          >
            <Text style={[styles.visibilityText, { color: palette.subText }]}>{visibility}</Text>
            <Text style={[styles.dropdownIcon, { color: palette.subText }]}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressInactive]} />
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Sector Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: palette.text }]}>Sector</Text>
            <TouchableOpacity
              style={[
                styles.inputWrapper,
                { backgroundColor: palette.inputBg, borderColor: palette.inputBorder },
              ]}
            >
              <Text
                style={[
                  styles.inputText,
                  { color: sector ? palette.text : BRAND_COLORS.grays[500] },
                ]}
              >
                {sector || 'Select'}
              </Text>
              <Text style={[styles.dropdownIcon, { color: palette.subText }]}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <FormInput
            label="Title"
            placeholder="e.g. Worship Pastor"
            value={title}
            onChangeText={setTitle}
            theme={palette}
          />

          <FormInput
            label="Description"
            placeholder="Describe the role..."
            value={description}
            onChangeText={setDescription}
            theme={palette}
            isMultiline
            maxLength={150}
          />

          <FormInput
            label="Requirements"
            placeholder="List required skills..."
            value={requirements}
            onChangeText={setRequirements}
            theme={palette}
            isMultiline
            maxLength={150}
          />

          <FormInput
            label="Location"
            placeholder="e.g. Atlanta, GA"
            value={location}
            onChangeText={setLocation}
            theme={palette}
          />

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Sticky Footer Button */}
        <View
          style={[
            styles.footer,
            { backgroundColor: palette.background, borderTopColor: palette.inputBorder },
          ]}
        >
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => navigation.navigate('ConnectServeCreateJobStep2')}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.grays[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarIcon: {
    fontSize: 20,
  },
  visibilityDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  visibilityText: {
    fontSize: 14,
    marginRight: 6,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 16,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: BRAND_COLORS.infoDark,
  },
  progressInactive: {
    backgroundColor: BRAND_COLORS.infoDark,
    opacity: 0.2,
  },
  scrollContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputWrapperMultiline: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  inputBox: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 14,
  },
  inputBoxMultiline: {
    height: 120,
    paddingTop: 15,
    paddingHorizontal: 15,
    textAlignVertical: 'top',
  },
  inputText: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 14,
  },
  dropdownIcon: {
    fontSize: 12,
    marginRight: 15,
  },
  charCount: {
    fontSize: 12,
    alignSelf: 'flex-end',
    paddingRight: 15,
    paddingBottom: 10,
  },
  bottomSpacer: {
    height: 100, // Space for sticky footer
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
  },
  nextButton: {
    backgroundColor: BRAND_COLORS.primaryDark,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: BRAND_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
