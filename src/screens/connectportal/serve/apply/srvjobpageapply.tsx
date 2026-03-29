import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import ServeJobPageApplySuccess from './srvjobpageapplysuccess';
import { ServeHeader, useServePalette, BRAND_COLORS } from '../shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeJobApply'>;

// Reusable Input Component
function FormInput({
  label,
  placeholder,
  theme,
  isMultiline = false,
}: {
  label: string;
  placeholder: string;
  theme: { text: string; inputBg: string; inputBorder: string };
  isMultiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.inputBox,
          {
            backgroundColor: theme.inputBg,
            borderColor: theme.inputBorder,
            color: theme.text,
          },
          isMultiline && styles.inputBoxMultiline,
        ]}
        placeholder={placeholder}
        placeholderTextColor={BRAND_COLORS.grays[500]}
        multiline={isMultiline}
      />
    </View>
  );
}

export default function ServeJobPageApply({ navigation, route }: Props) {
  const palette = useServePalette();
  const { serve } = useConnectPortalData();
  const job =
    [...serve.publicRecords, ...serve.organizerRecords].find(
      (record) => record.id === route.params.jobId
    ) || null;

  // State
  const [agreed, setAgreed] = useState(false);
  const [hasResume, setHasResume] = useState(true); // Mocking an uploaded state
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <ServeHeader
        title="Application Details"
        titleColor={palette.text}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.jobSummaryCard,
            { backgroundColor: palette.cardBg, borderColor: palette.inputBorder },
          ]}
        >
          <Text style={[styles.jobSummaryEyebrow, { color: palette.subText }]}>Applying for</Text>
          <Text style={[styles.jobSummaryTitle, { color: palette.text }]}>
            {job?.title || 'Serve opportunity'}
          </Text>
        </View>

        {/* Profile Photo Section */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: palette.text }]}>Profile photo</Text>
          <View style={styles.photoRow}>
            <View style={styles.avatarPlaceholder}>
              {/* Fallback avatar if no image is present */}
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: palette.inputBg }]}>
              <Text style={[styles.uploadBtnText, { color: palette.text }]}>Upload</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Standard Fields */}
        <FormInput label="Name" placeholder="Adam smith" theme={palette} />
        <FormInput label="Email address" placeholder="adamsmith@gmail.com" theme={palette} />
        <FormInput label="Phone number" placeholder="+1 234 3454 543" theme={palette} />
        <FormInput label="Home address" placeholder="Toronto" theme={palette} />

        {/* Enhancement: Calling/Testimony Field */}
        <FormInput
          label="Brief Testimony / Calling (Optional)"
          placeholder="Share why you feel called to this opportunity..."
          theme={palette}
          isMultiline
        />

        {/* Resume Upload Section */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: palette.text }]}>Resume</Text>
          <View
            style={[
              styles.resumeCard,
              { backgroundColor: palette.cardBg, borderColor: palette.inputBorder },
            ]}
          >
            {hasResume ? (
              <View style={styles.resumeAttached}>
                <View style={styles.pdfBadge}>
                  <Text style={styles.pdfText}>PDF</Text>
                </View>
                <Text style={[styles.resumeFilename, { color: palette.text }]} numberOfLines={1}>
                  Adamsmith_resume.pdf
                </Text>
                <TouchableOpacity onPress={() => setHasResume(false)}>
                  <Text style={[styles.deleteIcon, { color: palette.subText }]}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {hasResume && (
              <View style={styles.orDivider}>
                <View style={[styles.line, { backgroundColor: palette.inputBorder }]} />
                <Text style={[styles.orText, { color: palette.subText }]}>or</Text>
                <View style={[styles.line, { backgroundColor: palette.inputBorder }]} />
              </View>
            )}

            <TouchableOpacity style={styles.cloudUploadBtn}>
              <Text style={styles.cloudIcon}>☁️</Text>
              <Text style={styles.cloudUploadText}>Upload</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.supportText, { color: palette.subText }]}>
            Supports DOC, PDF, JPG, PNG
          </Text>
        </View>

        {/* Checkbox Section */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              { borderColor: palette.inputBorder },
              agreed && styles.checkboxChecked,
            ]}
          >
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.checkboxLabel, { color: palette.subText }]}>
            I agree to submit my personal details for perusal by poster
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer Button */}
      <View
        style={[
          styles.footer,
          { backgroundColor: palette.background, borderTopColor: palette.inputBorder },
        ]}
      >
        <TouchableOpacity
          style={[styles.submitButton, !agreed && styles.submitButtonDisabled]}
          disabled={!agreed}
          onPress={() => setShowSuccess(true)}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
      <ServeJobPageApplySuccess
        isVisible={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          navigation.navigate('ConnectPortal', { initialTab: 'Serve' });
        }}
        onReturn={() => {
          setShowSuccess(false);
          navigation.navigate('ConnectPortal', { initialTab: 'Serve' });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  jobSummaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  jobSummaryEyebrow: {
    fontSize: 12,
    fontFamily: 'OpenSans-SemiBold',
    marginBottom: 6,
  },
  jobSummaryTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Rubik-Medium',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: 'Rubik-Medium',
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    fontSize: 14,
  },
  inputBoxMultiline: {
    height: 100,
    paddingTop: 15,
    textAlignVertical: 'top',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.grays[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 30,
  },
  uploadBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  uploadBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resumeCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  resumeAttached: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  pdfBadge: {
    backgroundColor: BRAND_COLORS.primaryDark,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 10,
  },
  pdfText: {
    color: BRAND_COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  resumeFilename: {
    flex: 1,
    fontSize: 13,
  },
  deleteIcon: {
    fontSize: 16,
    padding: 4,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginVertical: 10,
  },
  line: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 12,
  },
  cloudUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  cloudIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  cloudUploadText: {
    color: BRAND_COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '500',
  },
  supportText: {
    fontSize: 12,
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: BRAND_COLORS.black,
    borderColor: BRAND_COLORS.black,
  },
  checkmark: {
    color: BRAND_COLORS.white,
    fontSize: 12,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 80,
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
  submitButton: {
    backgroundColor: BRAND_COLORS.primaryDark,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: BRAND_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
