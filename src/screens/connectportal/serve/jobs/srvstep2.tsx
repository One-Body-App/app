import React, { useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  getConnectServeJobDraftById,
  publishConnectServeJobDraft,
  saveConnectServeJobDraft,
} from '@/src/services/connectPortal';
import { useConnectPortalData } from '@/src/services/connectPortal/provider';
import type { ConnectServeJobApplicationMethod } from '@/src/services/connectPortal/types';
import { CreateFlowLayout, useCreateFlowPalette } from '../../go/createflow/shared';
import useMountEffect from '@/src/hooks/useMountEffect';

type Props = NativeStackScreenProps<ConnectStackParamsList, 'ConnectServeCreateJobStep2'>;

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

const APPLICATION_METHOD_OPTIONS: Array<{
  title: string;
  description: string;
  value: ConnectServeJobApplicationMethod;
}> = [
  {
    title: 'Apply in One Body',
    description: 'Let candidates complete their application directly in the app.',
    value: 'in_app',
  },
  {
    title: 'External link',
    description: 'Send candidates to your existing application URL.',
    value: 'external_link',
  },
];

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

const isValidCompensationAmount = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 && Number.isFinite(Number(trimmed));
};

type AndroidPickerState = {
  title: string;
  options: SelectOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
} | null;

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
  const [applicationMethods, setApplicationMethods] = useState<ConnectServeJobApplicationMethod[]>(
    []
  );
  const [applicationUrl, setApplicationUrl] = useState('');
  const [hiringStatus, setHiringStatus] = useState<'open' | 'closed'>('open');
  const [pickerState, setPickerState] = useState<AndroidPickerState>(null);

  useMountEffect(() => {
    let isActive = true;

    (async () => {
      try {
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
        setApplicationMethods(draft.applicationMethods || []);
        setApplicationUrl(draft.applicationUrl);
        setHiringStatus(draft.hiringStatus);
        setLoading(false);
      } catch {
        if (!isActive) {
          return;
        }

        Alert.alert(
          'Unable to load opportunity',
          'Please try again in a moment.',
          [{ text: 'OK', onPress: () => navigation.navigate('ConnectServeHome') }],
          { cancelable: false }
        );
      }
    })();

    return () => {
      isActive = false;
    };
  });

  const hasExternalLinkMethod = applicationMethods.includes('external_link');

  const persistDraft = async (completedStep?: 1 | 2) => {
    if (!draftId) {
      return null;
    }

    return saveConnectServeJobDraft(draftId, {
      opportunityType,
      compensationAmount,
      compensationFrequency,
      applicationMethods,
      applicationUrl: hasExternalLinkMethod ? applicationUrl.trim() : '',
      hiringStatus,
      lastCompletedStep: completedStep,
    });
  };

  const toggleApplicationMethod = (method: ConnectServeJobApplicationMethod) => {
    setApplicationMethods((current) => {
      const next = current.includes(method)
        ? current.filter((value) => value !== method)
        : [...current, method];

      if (!next.includes('external_link')) {
        setApplicationUrl('');
      }

      return next;
    });
  };

  const nextDisabled =
    !draftId ||
    !opportunityType.trim() ||
    !isValidCompensationAmount(compensationAmount) ||
    !compensationFrequency ||
    applicationMethods.length < 1 ||
    (hasExternalLinkMethod && !isValidApplicationUrl(applicationUrl));

  const methodSummaryText = useMemo(() => {
    if (applicationMethods.length < 1) {
      return 'Choose at least one';
    }

    return APPLICATION_METHOD_OPTIONS.filter((option) => applicationMethods.includes(option.value))
      .map((option) => option.title)
      .join(' + ');
  }, [applicationMethods]);

  const openOptionPicker = (
    title: string,
    options: SelectOption[],
    selectedValue: string,
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

    setPickerState({
      title,
      options,
      selectedValue,
      onSelect,
    });
  };

  const closePicker = () => {
    setPickerState(null);
  };

  return (
    <View style={styles.screenRoot}>
      <CreateFlowLayout
        title="Create Job"
        step={2}
        totalSteps={2}
        loading={loading}
        onBack={async () => {
          try {
            await persistDraft(1);
            await serve.refresh();
            navigation.navigate('ConnectServeCreateJobStep1', {
              draftId: draftId || route.params.draftId,
            });
          } catch (error) {
            Alert.alert(
              'Unable to save opportunity',
              error instanceof Error ? error.message : 'Please try again in a moment.'
            );
          }
        }}
        onSave={async () => {
          try {
            await persistDraft(1);
            await serve.refresh();
            navigation.navigate('ConnectServeHome');
          } catch (error) {
            Alert.alert(
              'Unable to save opportunity',
              error instanceof Error ? error.message : 'Please try again in a moment.'
            );
          }
        }}
        saveLabel="Save Draft"
        onNext={async () => {
          if (!draftId || !isValidCompensationAmount(compensationAmount)) {
            return;
          }
          try {
            const savedDraft = await persistDraft(2);
            if (!savedDraft) {
              return;
            }
            const publishedJob = await publishConnectServeJobDraft(savedDraft.id);
            await serve.refresh();
            navigation.navigate('ConnectServeApplications', { jobId: publishedJob.id });
          } catch (error) {
            Alert.alert(
              'Unable to create job',
              error instanceof Error ? error.message : 'Please try again in a moment.'
            );
          }
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
          <Pressable
            testID="opportunity-type-trigger"
            style={[
              styles.inputButton,
              { backgroundColor: palette.inputBg, borderColor: palette.inputBorder },
            ]}
            onPress={() =>
              openOptionPicker(
                'Opportunity Type',
                OPPORTUNITY_TYPE_OPTIONS,
                opportunityType,
                setOpportunityType
              )
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
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={palette.inputPlaceholder}
            />
          </Pressable>
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
            <Pressable
              style={[
                styles.inputButton,
                { backgroundColor: palette.inputBg, borderColor: palette.inputBorder },
              ]}
              onPress={() =>
                openOptionPicker(
                  'Compensation Frequency',
                  COMPENSATION_FREQUENCY_OPTIONS,
                  compensationFrequency,
                  (value) =>
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
            </Pressable>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Application Methods</Text>
          <Text style={[styles.supportText, { color: palette.textSecondary }]}>
            {methodSummaryText}
          </Text>
          <View style={styles.methodList}>
            {APPLICATION_METHOD_OPTIONS.map((option) => {
              const selected = applicationMethods.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  testID={`application-method-${option.value}`}
                  style={[
                    styles.methodCard,
                    {
                      backgroundColor: selected ? '#EAF6FA' : palette.inputBg,
                      borderColor: selected ? '#126b87' : palette.inputBorder,
                    },
                  ]}
                  onPress={() => toggleApplicationMethod(option.value)}
                >
                  <View style={styles.methodTextWrap}>
                    <Text style={[styles.methodTitle, { color: palette.textPrimary }]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.methodDescription, { color: palette.textSecondary }]}>
                      {option.description}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={selected ? 'check-circle' : 'checkbox-blank-circle-outline'}
                    size={22}
                    color={selected ? '#126b87' : palette.inputPlaceholder}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          {hasExternalLinkMethod ? (
            <>
              <Text style={[styles.label, { color: palette.textPrimary }]}>Application URL</Text>
              <TextInput
                testID="application-url-input"
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
            </>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Hiring Status</Text>
          <Pressable
            style={[
              styles.inputButton,
              { backgroundColor: palette.inputBg, borderColor: palette.inputBorder },
            ]}
            onPress={() =>
              openOptionPicker('Hiring Status', HIRING_STATUS_OPTIONS, hiringStatus, (value) =>
                setHiringStatus(value as 'open' | 'closed')
              )
            }
          >
            <Text style={[styles.inputButtonText, { color: palette.inputText }]}>
              {HIRING_STATUS_OPTIONS.find((option) => option.value === hiringStatus)?.label ||
                'Open'}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={palette.inputPlaceholder}
            />
          </Pressable>
        </View>
      </CreateFlowLayout>

      {pickerState ? (
        <View
          testID="option-sheet-modal"
          style={styles.optionSheetOverlay}
          pointerEvents="box-none"
        >
          <Pressable style={styles.optionSheetBackdrop} onPress={closePicker} />
          <View
            style={[
              styles.optionSheetModal,
              {
                backgroundColor: palette.cardBg,
                borderColor: palette.inputBorder,
              },
            ]}
          >
            <View style={styles.optionSheetHandleWrap}>
              <View
                style={[
                  styles.optionSheetHandle,
                  { backgroundColor: palette.isDark ? '#3a4a50' : '#d1d5db' },
                ]}
              />
            </View>

            <View style={[styles.optionSheetHeader, { borderBottomColor: palette.inputBorder }]}>
              <Text style={[styles.optionSheetTitle, { color: palette.textPrimary }]}>
                {pickerState.title}
              </Text>
              <Pressable
                testID="option-sheet-close"
                onPress={closePicker}
                style={[
                  styles.optionSheetCloseButton,
                  { backgroundColor: palette.isDark ? '#032f3c' : '#f3f4f6' },
                ]}
              >
                <MaterialCommunityIcons name="close" size={20} color={palette.textPrimary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.optionSheetScroll}
              contentContainerStyle={styles.optionSheetOptions}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {pickerState.options.map((option) => {
                const selected = option.value === pickerState.selectedValue;
                return (
                  <Pressable
                    key={`${pickerState.title}-${option.value}`}
                    testID={`option-sheet-item-${option.value}`}
                    style={[
                      styles.optionSheetButton,
                      {
                        backgroundColor: selected ? palette.cardActiveBg : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      pickerState.onSelect(option.value);
                      closePicker();
                    }}
                  >
                    <Text
                      style={[
                        styles.optionSheetButtonLabel,
                        { color: selected ? palette.accent : palette.textPrimary },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selected ? (
                      <MaterialCommunityIcons name="check" size={18} color={palette.accent} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
  },
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
  supportText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    fontFamily: 'OpenSans-Regular',
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
  methodList: {
    gap: 10,
  },
  methodCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  methodTextWrap: {
    flex: 1,
    gap: 4,
  },
  methodTitle: {
    fontSize: 15,
    fontFamily: 'Rubik-Medium',
  },
  methodDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'OpenSans-Regular',
  },
  optionSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 40,
  },
  optionSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
  },
  optionSheetModal: {
    maxHeight: '72%',
    minHeight: 320,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  optionSheetContent: {
    flex: 1,
  },
  optionSheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  optionSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
  },
  optionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionSheetTitle: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
  },
  optionSheetCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSheetScroll: {
    flex: 1,
  },
  optionSheetOptions: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  optionSheetButton: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSheetButtonLabel: {
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
  },
});
