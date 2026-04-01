import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import type { RootState } from '@/src/redux/reducers/rootReducer';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { submitConnectServeJobApplication } from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import ServeJobPageApplySuccess from './srvjobpageapplysuccess';
import { ServeHeader, useServePalette, BRAND_COLORS } from '../shared';
import type { User } from '@/utils/types';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeJobApply'>;

function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  theme,
  isMultiline = false,
  keyboardType,
  autoCapitalize,
  autoCorrect,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  theme: { text: string; inputBg: string; inputBorder: string };
  isMultiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  autoCorrect?: boolean;
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
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={BRAND_COLORS.grays[500]}
        multiline={isMultiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
      />
    </View>
  );
}

const getDefaultLocation = (user?: User | null) =>
  String(user?.profile?.location?.address || '').trim();

export default function ServeJobPageApply({ navigation, route }: Props) {
  const palette = useServePalette();
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
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const profilePhotoUri = useMemo(
    () => String(currentUser?.profileImage || '').trim(),
    [currentUser?.profileImage]
  );

  const submitDisabled =
    submitting || !name.trim() || !email.trim() || !phone.trim() || !location.trim() || !agreed;

  if (!job) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <ServeHeader
          title="Application Details"
          titleColor={palette.text}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.emptyState}>
          <Text style={[styles.bodyText, { color: palette.subText }]}>Job not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            {job.title || 'Serve opportunity'}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: palette.text }]}>Profile photo</Text>
          <View style={styles.photoRow}>
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>👤</Text>
              </View>
            )}
            <View style={styles.profilePhotoCopy}>
              <Text style={[styles.profilePhotoTitle, { color: palette.text }]}>
                Using your current profile photo
              </Text>
              <Text style={[styles.profilePhotoBody, { color: palette.subText }]}>
                Update your profile photo from Edit Profile if needed.
              </Text>
            </View>
          </View>
        </View>

        <FormInput
          label="Name"
          placeholder="Adam Smith"
          value={name}
          onChangeText={setName}
          theme={palette}
          autoCapitalize="words"
        />
        <FormInput
          label="Email address"
          placeholder="adamsmith@gmail.com"
          value={email}
          onChangeText={setEmail}
          theme={palette}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <FormInput
          label="Phone number"
          placeholder="+1 234 3454 543"
          value={phone}
          onChangeText={setPhone}
          theme={palette}
          keyboardType="phone-pad"
        />
        <FormInput
          label="Home address"
          placeholder="Toronto"
          value={location}
          onChangeText={setLocation}
          theme={palette}
        />
        <FormInput
          label="Brief Testimony / Calling (Optional)"
          placeholder="Share why you feel called to this opportunity..."
          value={testimony}
          onChangeText={setTestimony}
          theme={palette}
          isMultiline
        />

        <View
          style={[
            styles.infoCard,
            { backgroundColor: palette.cardBg, borderColor: palette.inputBorder },
          ]}
        >
          <Text style={[styles.infoTitle, { color: palette.text }]}>Resume</Text>
          <Text style={[styles.infoBody, { color: palette.subText }]}>
            Resume upload support is optional for this role and can be added later. Your core
            application details will be submitted now.
          </Text>
        </View>

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
            {agreed ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={[styles.checkboxLabel, { color: palette.subText }]}>
            I agree to submit my personal details for review by the job poster.
          </Text>
        </TouchableOpacity>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: palette.background, borderTopColor: palette.inputBorder },
        ]}
      >
        <TouchableOpacity
          style={[styles.submitButton, submitDisabled && styles.submitButtonDisabled]}
          disabled={submitDisabled}
          onPress={async () => {
            if (submitDisabled) {
              return;
            }

            try {
              setSubmitting(true);
              setSubmitError('');
              await submitConnectServeJobApplication(job.id, {
                name,
                email,
                phone,
                location,
                profilePhotoUri: profilePhotoUri || undefined,
                testimony,
                consentAccepted: true,
              });
              await serve.refresh();
              setShowSuccess(true);
            } catch (error: any) {
              setSubmitError(error?.message || 'Unable to submit application right now.');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? (
            <ActivityIndicator color={BRAND_COLORS.white} />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
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
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 16,
  },
  avatarText: {
    fontSize: 30,
  },
  profilePhotoCopy: {
    flex: 1,
    gap: 4,
  },
  profilePhotoTitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
  },
  profilePhotoBody: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'OpenSans-Regular',
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'Rubik-Medium',
  },
  infoBody: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'OpenSans-Regular',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  errorText: {
    color: '#c62828',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: 'OpenSans-Regular',
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
