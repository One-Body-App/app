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

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeCreateJobStep2'>;

// Reusable Form Input Component
function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  theme,
  keyboardType = 'default' as const,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  theme: { text: string; inputBg: string; inputBorder: string };
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url';
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
        ]}
      >
        <TextInput
          style={[styles.inputBox, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={BRAND_COLORS.grays[500]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

// Reusable Dropdown Component
function FormDropdown({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: { text: string; inputBg: string; inputBorder: string; subText: string };
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.inputWrapper,
          { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
        ]}
      >
        <Text style={[styles.inputText, { color: value ? theme.text : BRAND_COLORS.grays[500] }]}>
          {value || 'Select'}
        </Text>
        <Text style={[styles.dropdownIcon, { color: theme.subText }]}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ServeCreateJobStep2({ navigation }: Props) {
  const palette = useServePalette();

  // Form State
  const [visibility] = useState('Public');
  const [opportunityType, setOpportunityType] = useState('Full time');
  const [compensation, setCompensation] = useState('$ 50,000');
  const [frequency] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [status] = useState('Open');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ServeHeader
          title="Create Job"
          titleColor={palette.text}
          onBack={() => navigation.navigate('ConnectServeCreateJobStep1')}
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

        {/* Progress Bar (Both active for Step 2) */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <FormInput
            label="Opportunity type"
            placeholder="e.g. Full time, Part time"
            value={opportunityType}
            onChangeText={setOpportunityType}
            theme={palette}
          />

          {/* Two-Column Grid for Comp & Frequency */}
          <View style={styles.rowGrid}>
            <View style={styles.gridItem}>
              <FormInput
                label="Compensation ($)"
                placeholder="$ 50,000"
                value={compensation}
                onChangeText={setCompensation}
                theme={palette}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.gridItem}>
              <FormDropdown label="Frequency" value={frequency} theme={palette} />
            </View>
          </View>

          <FormInput
            label="Application URL"
            placeholder="Enter url"
            value={applicationUrl}
            onChangeText={setApplicationUrl}
            theme={palette}
            keyboardType="url"
          />

          <FormDropdown label="Status" value={status} theme={palette} />

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
            style={styles.createButton}
            onPress={() => navigation.navigate('ConnectServeHome')}
          >
            <Text style={styles.createButtonText}>Create</Text>
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
  inputBox: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 14,
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
  rowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16, // Requires modern RN, use margins on children otherwise
  },
  gridItem: {
    flex: 1,
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
  createButton: {
    backgroundColor: BRAND_COLORS.primaryDark,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: BRAND_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
