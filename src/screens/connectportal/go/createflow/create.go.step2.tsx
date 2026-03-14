import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { saveConnectPortalDraft } from '@/src/services/connectPortal';
import { CreateFlowLayout, ensureExistingDraftRecord } from './shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep2'>;

function DateLocationScreen({ navigation, route }: Props): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [draftId, setDraftId] = useState(route.params?.draftId);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
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
  }, [navigation, route.params?.draftId]);

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
        <Text style={styles.sectionTitle}>Schedule the event.</Text>
        <Text style={styles.sectionBody}>
          Use plain text for now. A later pass can replace these inputs with pickers and geocoding.
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.fieldHalf}>
          <Text style={styles.label}>Start Date</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#8AA0A8"
          />
        </View>
        <View style={styles.fieldHalf}>
          <Text style={styles.label}>End Date</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#8AA0A8"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.fieldHalf}>
          <Text style={styles.label}>Start Time</Text>
          <TextInput
            style={styles.input}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="7:00 PM"
            placeholderTextColor="#8AA0A8"
          />
        </View>
        <View style={styles.fieldHalf}>
          <Text style={styles.label}>End Time</Text>
          <TextInput
            style={styles.input}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="9:00 PM"
            placeholderTextColor="#8AA0A8"
          />
        </View>
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={styles.toggleTitle}>Online Event</Text>
          <Text style={styles.toggleBody}>
            Toggle this on to hide the physical venue fields and store the event as online-only.
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={setIsOnline}
          trackColor={{ false: '#D7E1E5', true: '#126b87' }}
          thumbColor="#FFFFFF"
        />
      </View>

      {!isOnline ? (
        <>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Venue Name</Text>
            <TextInput
              style={styles.input}
              value={venueName}
              onChangeText={setVenueName}
              placeholder="Central Park North Pavilion"
              placeholderTextColor="#8AA0A8"
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="123 Park Lane, New York, NY"
              placeholderTextColor="#8AA0A8"
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
    color: '#032f3c',
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4F6D77',
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
    fontSize: 13,
    fontWeight: '800',
    color: '#032f3c',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7E1E5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#032f3c',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1E5',
    padding: 16,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#032f3c',
  },
  toggleBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4F6D77',
  },
});

export default DateLocationScreen;
