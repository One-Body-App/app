import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { saveConnectPortalDraft } from '@/src/services/connectPortal';
import { CreateFlowLayout, ensureExistingDraftRecord, useCreateFlowPalette } from './shared';
import useMountEffect from '@/src/hooks/useMountEffect';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep2'>;

function DateLocationScreen({ navigation, route }: Props): React.JSX.Element {
  const palette = useCreateFlowPalette();
  const [loading, setLoading] = useState(true);
  const [draftId, setDraftId] = useState(route.params?.draftId);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');

  useMountEffect(() => {
    let isActive = true;

    (async () => {
      const draft = await ensureExistingDraftRecord(navigation, route.params?.draftId);
      if (!isActive) {
        return;
      }

      if (!draft) {
        return;
      }

      setDraftId(draft.id);
      setStartDate(draft.startDate);
      setEndDate(draft.endDate);
      setStartTime(draft.startTime);
      setEndTime(draft.endTime);
      setIsOnline(draft.isOnline);
      setVenueName(draft.venueName);
      setAddress(draft.address);
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

    return saveConnectPortalDraft(
      draftId,
      {
        startDate,
        endDate: endDate || startDate,
        startTime,
        endTime,
        isOnline,
        venueName: isOnline ? 'Online Event' : venueName,
        address: isOnline ? 'Online' : address,
        locationQuery: isOnline ? 'Online Event' : [venueName, address].filter(Boolean).join(', '),
      },
      completedStep !== undefined ? { completedStep } : undefined
    );
  };

  return (
    <CreateFlowLayout
      title="Date & Location"
      step={2}
      loading={loading}
      onBack={async () => {
        await persistDraft(1);
        navigation.navigate('ConnectGoCreateStep1', { draftId: draftId || route.params.draftId });
      }}
      onNext={async () => {
        const draft = await persistDraft(2);
        if (draft) {
          navigation.navigate('ConnectGoCreateStep3', { draftId: draft.id });
        }
      }}
      nextDisabled={!draftId}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          When and where are we gathering?
        </Text>
        <Text style={[styles.sectionBody, { color: palette.textSecondary }]}>
          Let people know exactly when and where to join the fellowship. Whether it’s in person or
          online, every detail helps believers connect.
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.fieldHalf}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Start Date</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
                color: palette.inputText,
              },
            ]}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={palette.inputPlaceholder}
          />
        </View>
        <View style={styles.fieldHalf}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>End Date</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
                color: palette.inputText,
              },
            ]}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={palette.inputPlaceholder}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.fieldHalf}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Start Time</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
                color: palette.inputText,
              },
            ]}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="e.g., 7:00 PM"
            placeholderTextColor={palette.inputPlaceholder}
          />
        </View>
        <View style={styles.fieldHalf}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>End Time</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
                color: palette.inputText,
              },
            ]}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="e.g., 9:00 PM"
            placeholderTextColor={palette.inputPlaceholder}
          />
        </View>
      </View>

      <View
        style={[
          styles.toggleRow,
          { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
        ]}
      >
        <View style={styles.toggleCopy}>
          <Text style={[styles.toggleTitle, { color: palette.textPrimary }]}>Online Event</Text>
          <Text style={[styles.toggleBody, { color: palette.textSecondary }]}>
            Hosting a digital fellowship? Turn this on to let the community know they can join from
            anywhere.
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={setIsOnline}
          trackColor={{ false: palette.inputBorder, true: palette.accent }}
          thumbColor="#FFFFFF"
        />
      </View>

      {!isOnline ? (
        <>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: palette.textPrimary }]}>Venue Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: palette.inputBorder,
                  color: palette.inputText,
                },
              ]}
              value={venueName}
              onChangeText={setVenueName}
              placeholder="e.g., Grace Church Fellowship Hall"
              placeholderTextColor={palette.inputPlaceholder}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: palette.textPrimary }]}>Address</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: palette.inputBg,
                  borderColor: palette.inputBorder,
                  color: palette.inputText,
                },
              ]}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g., 123 Main St, Atlanta, GA"
              placeholderTextColor={palette.inputPlaceholder}
            />
          </View>
        </>
      ) : null}
    </CreateFlowLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
    gap: 8,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Rubik-Medium',
    letterSpacing: 0.15,
  },
  input: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'OpenSans-Regular',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  toggleBody: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default DateLocationScreen;
