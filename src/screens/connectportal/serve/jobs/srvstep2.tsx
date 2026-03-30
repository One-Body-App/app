import React, { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  getConnectServeJobDraftById,
  publishConnectServeJobDraft,
  saveConnectServeJobDraft,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import { CreateFlowLayout, useCreateFlowPalette } from '../../go/createflow/shared';
import useMountEffect from '@/src/hooks/useMountEffect';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectServeCreateJobStep2'>;

type SelectOption = {
  label: string;
  value: string;
};

const OPPORTUNITY_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Full time', value: 'Full time' },
  { label: 'Part time', value: 'Part time' },
  { label: 'Contract', value: 'Contract' },
  { label: 'Volunteer', value: 'Volunteer' },
];

const COMPENSATION_FREQUENCY_OPTIONS: SelectOption[] = [
  { label: 'Per hour', value: 'per_hour' },
  { label: 'Per week', value: 'per_week' },
  { label: 'Per month', value: 'per_month' },
  { label: 'Per year', value: 'per_year' },
];

const HIRING_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
];

const showOptionPicker = (
  title: string,
  options: SelectOption[],
  onSelect: (value: string) => void
) => {
  if (options.length === 0) {
    return;
  }

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: ['Cancel', ...options.map((option) => option.label)],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        if (buttonIndex > 0) {
          onSelect(options[buttonIndex - 1].value);
        }
      }
    );
    return;
  }

  Alert.alert(
    title,
    undefined,
    [
      ...options.map((option) => ({
        text: option.label,
        onPress: () => onSelect(option.value),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ],
    { cancelable: true }
  );
};

const isValidApplicationUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function ServeCreateJobStep2({ navigation, route }: Props): React.JSX.Element {
  const palette = useCreateFlowPalette();
  const { serve } = useConnectPortalData();
  const [loading, setLoading] = useState(true);
  const [draftId, setDraftId] = useState(route.params.draftId);
  const [opportunityType, setOpportunityType] = useState('');
  const [compensationAmount, setCompensationAmount] = useState('');
  const [compensationFrequency, setCompensationFrequency] = useState<
    '' | 'per_hour' | 'per_week' | 'per_month' | 'per_year'
  >('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [hiringStatus, setHiringStatus] = useState<'open' | 'closed'>('open');

  useMountEffect(() => {
    let isActive = true;

    (async () => {
      const draft = await getConnectServeJobDraftById(route.params.draftId);
      if (!isActive) {
        return;
      }

      if (!draft) {
        navigation.navigate('ConnectServeHome');
        return;
      }

      setDraftId(draft.id);
      setOpportunityType(draft.opportunityType);
      setCompensationAmount(draft.compensationAmount);
      setCompensationFrequency(draft.compensationFrequency);
      setApplicationUrl(draft.applicationUrl);
      setHiringStatus(draft.hiringStatus);
      setLoading(false);
    })();

    return () => {
      isActive = false;
    };
  });

  const persistDraft = async (completedStep?: 1 | 2) => {
    if (!draftId) {
      return null;
    }

    return saveConnectServeJobDraft(draftId, {
      opportunityType,
      compensationAmount,
      compensationFrequency,
      applicationUrl: applicationUrl.trim(),
      hiringStatus,
      lastCompletedStep: completedStep,
    });
  };

  const nextDisabled =
    !draftId ||
    !opportunityType.trim() ||
    !compensationAmount.trim() ||
    !compensationFrequency ||
    !isValidApplicationUrl(applicationUrl);

  return (
    <CreateFlowLayout
      title="Create Job"
      step={2}
      totalSteps={2}
      loading={loading}
      onBack={async () => {
        await persistDraft(1);
        await serve.refresh();
        navigation.navigate('ConnectServeCreateJobStep1', {
          draftId: draftId || route.params.draftId,
        });
      }}
      onSave={async () => {
        await persistDraft(1);
        await serve.refresh();
        navigation.navigate('ConnectServeHome');
      }}
      saveLabel="Save Draft"
      onNext={async () => {
        if (!draftId) {
          return;
        }
        await persistDraft(2);
        const publishedJob = await publishConnectServeJobDraft(draftId);
        await serve.refresh();
        navigation.navigate('ConnectServeApplications', { jobId: publishedJob.id });
      }}
      nextLabel="Create Job"
      nextDisabled={nextDisabled}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          Finish the application details.
        </Text>
        <Text style={[styles.sectionBody, { color: palette.textSecondary }]}>
          Add the compensation and response details people need before they apply.
        </Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: palette.textPrimary }]}>Opportunity Type</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.inputButton,
            { backgroundColor: palette.inputBg, borderColor: palette.inputBorder },
          ]}
          onPress={() =>
            showOptionPicker('Opportunity Type', OPPORTUNITY_TYPE_OPTIONS, setOpportunityType)
          }
        >
          <Text
            style={[
              styles.inputButtonText,
              { color: opportunityType ? palette.inputText : palette.inputPlaceholder },
            ]}
          >
            {opportunityType || 'Choose the opportunity type'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={palette.inputPlaceholder} />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <View style={styles.fieldHalf}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Compensation</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
                color: palette.inputText,
              },
            ]}
            value={compensationAmount}
            onChangeText={setCompensationAmount}
            placeholder="Enter amount"
            placeholderTextColor={palette.inputPlaceholder}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.fieldHalf}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Frequency</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.inputButton,
              { backgroundColor: palette.inputBg, borderColor: palette.inputBorder },
            ]}
            onPress={() =>
              showOptionPicker('Compensation Frequency', COMPENSATION_FREQUENCY_OPTIONS, (value) =>
                setCompensationFrequency(
                  value as '' | 'per_hour' | 'per_week' | 'per_month' | 'per_year'
                )
              )
            }
          >
            <Text
              style={[
                styles.inputButtonText,
                { color: compensationFrequency ? palette.inputText : palette.inputPlaceholder },
              ]}
            >
              {COMPENSATION_FREQUENCY_OPTIONS.find(
                (option) => option.value === compensationFrequency
              )?.label || 'Select'}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={palette.inputPlaceholder}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: palette.textPrimary }]}>Application URL</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: palette.inputBg,
              borderColor: palette.inputBorder,
              color: palette.inputText,
            },
          ]}
          value={applicationUrl}
          onChangeText={setApplicationUrl}
          placeholder="https://example.com/apply"
          placeholderTextColor={palette.inputPlaceholder}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: palette.textPrimary }]}>Hiring Status</Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.inputButton,
            { backgroundColor: palette.inputBg, borderColor: palette.inputBorder },
          ]}
          onPress={() =>
            showOptionPicker('Hiring Status', HIRING_STATUS_OPTIONS, (value) =>
              setHiringStatus(value as 'open' | 'closed')
            )
          }
        >
          <Text style={[styles.inputButtonText, { color: palette.inputText }]}>
            {HIRING_STATUS_OPTIONS.find((option) => option.value === hiringStatus)?.label || 'Open'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color={palette.inputPlaceholder} />
        </TouchableOpacity>
      </View>
    </CreateFlowLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: 'Rubik-Bold',
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'OpenSans-Regular',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
    marginBottom: 18,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Rubik-Medium',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'OpenSans-Regular',
  },
  inputButton: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputButtonText: {
    flex: 1,
    fontSize: 15,
    paddingRight: 12,
    fontFamily: 'OpenSans-Regular',
  },
});
