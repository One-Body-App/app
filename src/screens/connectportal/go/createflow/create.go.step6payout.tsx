import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { saveConnectPortalDraft } from '@/src/services/connectPortal';
import { CreateFlowLayout, ensureExistingDraftRecord } from './shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep6Payout'>;

function PayoutMethodScreen({ navigation, route }: Props): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [draftId, setDraftId] = useState(route.params?.draftId);
  const [businessName, setBusinessName] = useState('');
  const [ein, setEin] = useState('');

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
      setBusinessName(draft.businessName);
      setEin(draft.ein);
      setLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, [navigation, route.params?.draftId]);

  const persistDraft = async (markPayoutConfigured = false) => {
    if (!draftId) {
      return null;
    }

    return saveConnectPortalDraft(
      draftId,
      {
        businessName,
        ein,
      },
      markPayoutConfigured ? { completedStep: 6, markPayoutConfigured: true } : undefined
    );
  };

  return (
    <CreateFlowLayout
      title="Payout Method"
      step={6}
      loading={loading}
      onBack={async () => {
        await persistDraft(false);
        navigation.navigate('ConnectGoCreateStep5', { draftId: draftId || route.params.draftId });
      }}
      onNext={async () => {
        const draft = await persistDraft(true);
        if (draft) {
          navigation.navigate('ConnectGoCreateStep6Review', { draftId: draft.id });
        }
      }}
      nextLabel="Continue"
      nextDisabled={!draftId}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Confirm payout details.</Text>
        <Text style={styles.sectionBody}>
          This is a local-only implementation. We store the payout draft data so review and resume
          routing behave correctly, but no external payouts are created.
        </Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Legal Business Name</Text>
        <TextInput
          style={styles.input}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="Acme Events LLC"
          placeholderTextColor="#8AA0A8"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>EIN</Text>
        <TextInput
          style={styles.input}
          value={ein}
          onChangeText={setEin}
          placeholder="12-3456789"
          placeholderTextColor="#8AA0A8"
        />
      </View>
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
});

export default PayoutMethodScreen;
