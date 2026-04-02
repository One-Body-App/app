import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextInputProps } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import DocumentPicker from 'react-native-document-picker';
import { useSelector } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import type { RootState } from '@/src/redux/reducers/rootReducer';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { submitConnectServeJobApplication } from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import ServeJobPageApplySuccess from './srvjobpageapplysuccess';
import { ServeHeader, BRAND_COLORS } from '../shared';
import type { User } from '@/utils/types';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeJobApply'>;

type ResumeDraft = {
  uri: string;
  name: string;
  size: number;
  type: string;
};

type FieldTheme = {
  text: string;
  label: string;
  border: string;
  focusBorder: string;
  background: string;
  placeholder: string;
};

const SCREEN_COLORS = {
  page: BRAND_COLORS.grays[100],
  panel: BRAND_COLORS.white,
  ink: BRAND_COLORS.black,
  body: BRAND_COLORS.grays[700],
  muted: BRAND_COLORS.grays[600],
  border: BRAND_COLORS.grays[200],
  softBorder: BRAND_COLORS.grays[300],
  primary: '#41899f',
  primaryDark: '#126b87',
  info: '#41dbe1',
  infoSoft: '#d0f6f7',
  danger: '#b42318',
  successBg: '#eef9fb',
} as const;

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const GENERIC_UPLOAD_FAILURE =
  'Upload failed. Please ensure your document is a standard PDF or Word file and try again.';

const RESUME_MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const getDefaultLocation = (user?: User | null) =>
  String(user?.profile?.location?.address || '').trim();

const getFileExtension = (name?: string | null) => {
  const trimmed = String(name || '')
    .trim()
    .toLowerCase();
  if (!trimmed.includes('.')) {
    return '';
  }

  return trimmed.split('.').pop() || '';
};

const formatBytes = (bytes: number) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const getSupportedMimeType = (name: string, providedType?: string | null) => {
  const normalizedType = String(providedType || '')
    .trim()
    .toLowerCase();
  const extension = getFileExtension(name);
  const extensionMime = RESUME_MIME_BY_EXTENSION[extension];

  if (normalizedType && Object.values(RESUME_MIME_BY_EXTENSION).includes(normalizedType)) {
    return normalizedType;
  }

  return extensionMime || '';
};

const normalizeResumeSelection = (selection: {
  uri?: string | null;
  fileCopyUri?: string | null;
  name?: string | null;
  size?: number | null;
  type?: string | null;
}) => {
  const resolvedName = String(selection.name || '').trim();
  const resolvedUri = String(selection.fileCopyUri || selection.uri || '').trim();
  const resolvedSize = Number(selection.size || 0);
  const resolvedType = getSupportedMimeType(resolvedName, selection.type);

  if (!resolvedName || !resolvedUri) {
    return {
      error: 'Unable to read that file. Please choose a standard PDF or Word document.',
    } as const;
  }

  if (!resolvedType) {
    return {
      error: 'Please upload a PDF, DOC, or DOCX file.',
    } as const;
  }

  if (!Number.isFinite(resolvedSize) || resolvedSize <= 0) {
    return {
      error: 'That file appears to be empty. Please choose a standard PDF or Word document.',
    } as const;
  }

  if (resolvedSize > MAX_RESUME_BYTES) {
    return {
      error: 'Please choose a resume or portfolio smaller than 5MB.',
    } as const;
  }

  return {
    value: {
      uri: resolvedUri,
      name: resolvedName,
      size: resolvedSize,
      type: resolvedType,
    } satisfies ResumeDraft,
  } as const;
};

function FloatingField({
  label,
  placeholder,
  value,
  onChangeText,
  theme,
  multiline = false,
  testID,
  ...textInputProps
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  theme: FieldTheme;
  multiline?: boolean;
  testID?: string;
} & Pick<TextInputProps, 'autoCapitalize' | 'autoCorrect' | 'keyboardType'>) {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.trim().length > 0;

  return (
    <View style={styles.fieldGroup}>
      <View
        style={[
          styles.fieldShell,
          {
            backgroundColor: theme.background,
            borderColor: focused ? theme.focusBorder : theme.border,
          },
          multiline ? styles.fieldShellMultiline : null,
        ]}
      >
        <Text
          style={[
            styles.fieldLabel,
            {
              color: focused ? theme.focusBorder : theme.label,
              backgroundColor: theme.background,
            },
            raised ? styles.fieldLabelRaised : styles.fieldLabelResting,
          ]}
        >
          {label}
        </Text>
        <TextInput
          testID={testID}
          style={[
            styles.fieldInput,
            { color: theme.text },
            multiline ? styles.fieldInputMultiline : null,
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? placeholder : ''}
          placeholderTextColor={theme.placeholder}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...textInputProps}
        />
      </View>
    </View>
  );
}

export default function ServeJobPageApply({ navigation, route }: Props) {
  const toast = useToast();
  const currentUser = useSelector((state: RootState) => state.auth.getProfileData as User | null);
  const { serve } = useConnectPortalData();
  const job =
    [...serve.publicRecords, ...serve.organizerRecords].find(
      (record) => record.id === route.params.jobId
    ) || null;

  const [name, setName] = useState(String(currentUser?.name || '').trim());
  const [email, setEmail] = useState(String(currentUser?.email || '').trim());
  const [phone, setPhone] = useState(String(currentUser?.profile?.contactPhoneNumber || '').trim());
  const [location, setLocation] = useState(getDefaultLocation(currentUser));
  const [testimony, setTestimony] = useState('');
  const [resumeFile, setResumeFile] = useState<ResumeDraft | null>(null);
  const [resumeError, setResumeError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const profilePhotoUri = useMemo(
    () => String(currentUser?.profileImage || '').trim(),
    [currentUser?.profileImage]
  );

  const fieldTheme = useMemo<FieldTheme>(
    () => ({
      text: SCREEN_COLORS.body,
      label: SCREEN_COLORS.muted,
      border: SCREEN_COLORS.border,
      focusBorder: SCREEN_COLORS.primary,
      background: SCREEN_COLORS.panel,
      placeholder: BRAND_COLORS.grays[500],
    }),
    []
  );

  const submitDisabled =
    submitting || !name.trim() || !email.trim() || !phone.trim() || !location.trim() || !agreed;

  const showResumeToast = useCallback(
    (message: string) => {
      toast.show(message, { type: 'danger', placement: 'bottom' });
    },
    [toast]
  );

  const handleDocumentPick = useCallback(async () => {
    try {
      const selection = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.doc, DocumentPicker.types.docx],
        copyTo: 'cachesDirectory',
        mode: 'import',
      });

      const normalized = normalizeResumeSelection(selection);
      if ('error' in normalized) {
        setResumeFile(null);
        setResumeError(normalized.error);
        showResumeToast(normalized.error);
        return;
      }

      setResumeFile(normalized.value);
      setResumeError('');
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return;
      }

      setResumeError('Unable to open your files right now. Please try again.');
      showResumeToast('Unable to open your files right now. Please try again.');
    }
  }, [showResumeToast]);

  const handleRemoveResume = useCallback(() => {
    setResumeFile(null);
    setResumeError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitDisabled) {
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      await submitConnectServeJobApplication(job!.id, {
        name,
        email,
        phone,
        location,
        profilePhotoUri: profilePhotoUri || undefined,
        testimony,
        consentAccepted: true,
        resumeFile: resumeFile
          ? {
              uri: resumeFile.uri,
              name: resumeFile.name,
              type: resumeFile.type,
            }
          : undefined,
      });
      await serve.refresh();
      setShowSuccess(true);
    } catch (error: any) {
      const message = String(error?.message || '').trim();
      setSubmitError(message || 'Unable to submit application right now.');
    } finally {
      setSubmitting(false);
    }
  }, [
    email,
    job,
    location,
    name,
    phone,
    profilePhotoUri,
    resumeFile,
    serve,
    submitDisabled,
    testimony,
  ]);

  if (!job) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: SCREEN_COLORS.page }]}>
        <ServeHeader title="" titleColor={SCREEN_COLORS.ink} onBack={() => navigation.goBack()} />
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: SCREEN_COLORS.muted }]}>
            Job not found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: SCREEN_COLORS.page }]}>
      <ServeHeader title="" titleColor={SCREEN_COLORS.ink} onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBlock}>
          <Text style={styles.heroTitle}>Step into your calling.</Text>
          <Text style={styles.heroSubtitle}>
            We are excited to learn more about how God has equipped you for this role. Please review
            your details below and upload your resume.
          </Text>
        </View>

        <View style={styles.jobSummaryCard}>
          <Text style={styles.jobSummaryEyebrow}>Applying for</Text>
          <Text style={styles.jobSummaryTitle}>{job.title || 'Serve opportunity'}</Text>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.sectionLabel}>Profile photo</Text>
          <View style={styles.photoRow}>
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>👤</Text>
              </View>
            )}
            <View style={styles.profilePhotoCopy}>
              <Text style={styles.profilePhotoTitle}>Using your current profile photo</Text>
              <Text style={styles.profilePhotoBody}>
                Update your profile photo from Edit Profile if needed.
              </Text>
            </View>
          </View>
        </View>

        <FloatingField
          testID="serve-application-name"
          label="Name"
          placeholder="Adam Smith"
          value={name}
          onChangeText={setName}
          theme={fieldTheme}
          autoCapitalize="words"
        />
        <FloatingField
          testID="serve-application-email"
          label="Email address"
          placeholder="adamsmith@gmail.com"
          value={email}
          onChangeText={setEmail}
          theme={fieldTheme}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <FloatingField
          testID="serve-application-phone"
          label="Phone number"
          placeholder="+1 234 3454 543"
          value={phone}
          onChangeText={setPhone}
          theme={fieldTheme}
          keyboardType="phone-pad"
        />
        <FloatingField
          testID="serve-application-location"
          label="Home address"
          placeholder="Clarkston, Georgia, United States"
          value={location}
          onChangeText={setLocation}
          theme={fieldTheme}
        />

        <View style={styles.uploadBlock}>
          <Text style={styles.sectionLabel}>Upload Resume or Ministry Portfolio</Text>
          <Text style={styles.uploadHelper}>Supported formats: PDF, DOCX (Max 5MB).</Text>
          <Pressable
            testID="serve-application-upload"
            accessibilityRole="button"
            onPress={handleDocumentPick}
            style={({ pressed }) => [
              styles.uploadDropzone,
              pressed ? styles.uploadDropzonePressed : null,
            ]}
          >
            <View style={styles.uploadBadge}>
              <Text style={styles.uploadBadgeText}>Resume</Text>
            </View>
            {resumeFile ? (
              <View style={styles.uploadContent}>
                <Text style={styles.uploadTitle}>{resumeFile.name}</Text>
                <Text style={styles.uploadDescription}>
                  {formatBytes(resumeFile.size)} • Ready to share with this ministry team.
                </Text>
                <View style={styles.uploadActions}>
                  <Pressable onPress={handleDocumentPick} style={styles.uploadActionButton}>
                    <Text style={styles.uploadActionText}>Replace</Text>
                  </Pressable>
                  <Pressable onPress={handleRemoveResume} style={styles.uploadActionButton}>
                    <Text style={styles.uploadActionTextMuted}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.uploadContent}>
                <Text style={styles.uploadTitle}>Tap to upload</Text>
                <Text style={styles.uploadDescription}>
                  Add your resume or ministry portfolio before sharing your testimony below.
                </Text>
              </View>
            )}
          </Pressable>
          {resumeError ? <Text style={styles.errorText}>{resumeError}</Text> : null}
        </View>

        <FloatingField
          testID="serve-application-testimony"
          label="Brief Testimony / Calling (Optional)"
          placeholder="Share a brief testimony or describe why you feel led to serve in this specific opportunity..."
          value={testimony}
          onChangeText={setTestimony}
          theme={fieldTheme}
          multiline
          autoCapitalize="sentences"
        />

        <Pressable
          style={styles.checkboxContainer}
          onPress={() => setAgreed((current) => !current)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
        >
          <View style={[styles.checkbox, agreed ? styles.checkboxChecked : null]}>
            {agreed ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>
            I consent to share these details and documents with the ministry team for prayerful
            review of this application.
          </Text>
        </Pressable>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          testID="serve-application-submit"
          accessibilityRole="button"
          disabled={submitDisabled}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && !submitDisabled ? styles.submitButtonPressed : null,
            submitDisabled ? styles.submitButtonDisabled : null,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={BRAND_COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </Pressable>
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

export { GENERIC_UPLOAD_FAILURE, MAX_RESUME_BYTES, normalizeResumeSelection };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
  },
  heroBlock: {
    paddingTop: 8,
    paddingBottom: 22,
  },
  heroTitle: {
    color: SCREEN_COLORS.ink,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: 'Rubik-ExtraBold',
    marginBottom: 10,
  },
  heroSubtitle: {
    color: SCREEN_COLORS.body,
    fontSize: 15,
    lineHeight: 23,
    fontFamily: 'OpenSans-Regular',
  },
  jobSummaryCard: {
    backgroundColor: SCREEN_COLORS.panel,
    borderColor: SCREEN_COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
  },
  jobSummaryEyebrow: {
    color: SCREEN_COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'OpenSans-SemiBold',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  jobSummaryTitle: {
    color: SCREEN_COLORS.ink,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Rubik-SemiBold',
  },
  profileCard: {
    backgroundColor: SCREEN_COLORS.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SCREEN_COLORS.border,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
  },
  sectionLabel: {
    color: SCREEN_COLORS.ink,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Rubik-SemiBold',
    marginBottom: 10,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: BRAND_COLORS.grays[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginRight: 14,
  },
  avatarText: {
    fontSize: 30,
  },
  profilePhotoCopy: {
    flex: 1,
  },
  profilePhotoTitle: {
    color: SCREEN_COLORS.ink,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Rubik-Medium',
    marginBottom: 4,
  },
  profilePhotoBody: {
    color: SCREEN_COLORS.body,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'OpenSans-Regular',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldShell: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 72,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  fieldShellMultiline: {
    minHeight: 152,
    paddingTop: 22,
    paddingBottom: 10,
  },
  fieldLabel: {
    position: 'absolute',
    left: 16,
    paddingHorizontal: 6,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Rubik-Medium',
    zIndex: 1,
  },
  fieldLabelResting: {
    top: 26,
  },
  fieldLabelRaised: {
    top: -10,
  },
  fieldInput: {
    paddingTop: 20,
    paddingBottom: 10,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'OpenSans-Regular',
  },
  fieldInputMultiline: {
    minHeight: 112,
    paddingTop: 18,
  },
  uploadBlock: {
    marginBottom: 16,
  },
  uploadHelper: {
    color: SCREEN_COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'OpenSans-Regular',
    marginBottom: 10,
  },
  uploadDropzone: {
    backgroundColor: SCREEN_COLORS.panel,
    borderWidth: 1,
    borderColor: SCREEN_COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 18,
    padding: 18,
  },
  uploadDropzonePressed: {
    borderColor: SCREEN_COLORS.primary,
    backgroundColor: SCREEN_COLORS.successBg,
  },
  uploadBadge: {
    alignSelf: 'flex-start',
    backgroundColor: SCREEN_COLORS.infoSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
  },
  uploadBadgeText: {
    color: SCREEN_COLORS.primaryDark,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'OpenSans-SemiBold',
  },
  uploadContent: {
    gap: 4,
  },
  uploadTitle: {
    color: SCREEN_COLORS.ink,
    fontSize: 17,
    lineHeight: 24,
    fontFamily: 'Rubik-Medium',
  },
  uploadDescription: {
    color: SCREEN_COLORS.body,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'OpenSans-Regular',
  },
  uploadActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  uploadActionButton: {
    paddingVertical: 4,
  },
  uploadActionText: {
    color: SCREEN_COLORS.primaryDark,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'OpenSans-SemiBold',
  },
  uploadActionTextMuted: {
    color: SCREEN_COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'OpenSans-SemiBold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: SCREEN_COLORS.border,
    backgroundColor: SCREEN_COLORS.panel,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: SCREEN_COLORS.primary,
    borderColor: SCREEN_COLORS.primary,
  },
  checkmark: {
    color: BRAND_COLORS.white,
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
  },
  checkboxLabel: {
    flex: 1,
    color: SCREEN_COLORS.body,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'OpenSans-Regular',
  },
  errorText: {
    color: SCREEN_COLORS.danger,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'OpenSans-Regular',
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'OpenSans-Regular',
  },
  bottomSpacer: {
    height: 110,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: SCREEN_COLORS.border,
    backgroundColor: SCREEN_COLORS.page,
  },
  submitButton: {
    backgroundColor: SCREEN_COLORS.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonPressed: {
    backgroundColor: SCREEN_COLORS.primaryDark,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: BRAND_COLORS.white,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Rubik-SemiBold',
  },
});
