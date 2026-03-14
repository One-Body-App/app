import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import type { ConnectPortalEventDraft, TicketTier } from '@/src/services/connectPortal';
import { saveConnectPortalDraft } from '@/src/services/connectPortal';
import {
  CreateFlowLayout,
  createDraftTicketTier,
  ensureExistingDraftRecord,
  getStepFiveNextRouteName,
} from './shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep5'>;

function ConfigureTicketsScreen({ navigation, route }: Props): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ConnectPortalEventDraft | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([createDraftTicketTier()]);

  useEffect(() => {
    let isActive = true;

    (async () => {
      const nextDraft = await ensureExistingDraftRecord(navigation, route.params?.draftId);
      if (!isActive) {
        return;
      }

      if (!nextDraft) {
        return;
      }

      setDraft(nextDraft);
      setTicketTiers(
        nextDraft.ticketTiers.length > 0 ? nextDraft.ticketTiers : [createDraftTicketTier()]
      );
      setLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, [navigation, route.params?.draftId]);

  const updateTier = (tierId: string, key: keyof TicketTier, value: string) => {
    setTicketTiers((current) =>
      current.map((tier) => {
        if (tier.id !== tierId) {
          return tier;
        }

        return {
          ...tier,
          [key]: key === 'price' && draft?.ticketType === 'free' ? '0.00' : value,
        };
      })
    );
  };

  const persistDraft = async (completedStep?: 4 | 5) => {
    if (!draft) {
      return null;
    }

    const normalizedTiers = ticketTiers.map((tier, index) => ({
      ...tier,
      id: tier.id || `ticket-${index + 1}`,
      name: tier.name || `Ticket ${index + 1}`,
      price: draft.ticketType === 'free' ? '0.00' : tier.price || '0.00',
    }));

    const nextDraft = await saveConnectPortalDraft(
      draft.id,
      {
        ticketTiers: normalizedTiers,
      },
      completedStep !== undefined ? { completedStep } : undefined
    );

    if (nextDraft) {
      setDraft(nextDraft);
    }
    return nextDraft;
  };

  return (
    <CreateFlowLayout
      title="Configure Tickets"
      step={5}
      loading={loading}
      onBack={async () => {
        await persistDraft(4);
        navigation.navigate('ConnectGoCreateStep4', { draftId: draft?.id || route.params.draftId });
      }}
      onNext={async () => {
        const nextDraft = await persistDraft(5);
        if (nextDraft) {
          navigation.navigate(getStepFiveNextRouteName(nextDraft), { draftId: nextDraft.id });
        }
      }}
      nextLabel="Continue"
      nextDisabled={!draft}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Set up your ticket tiers.</Text>
        <Text style={styles.sectionBody}>
          Free events keep price at zero. Paid events can define multiple tiers before review.
        </Text>
      </View>

      {ticketTiers.map((tier) => (
        <View key={tier.id} style={styles.ticketCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Ticket Name</Text>
            <TextInput
              style={styles.input}
              value={tier.name}
              onChangeText={(value) => updateTier(tier.id, 'name', value)}
              placeholder="General Admission"
              placeholderTextColor="#8AA0A8"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={tier.quantity}
                onChangeText={(value) => updateTier(tier.id, 'quantity', value)}
                placeholder="100"
                placeholderTextColor="#8AA0A8"
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Price</Text>
              <TextInput
                style={[styles.input, draft?.ticketType === 'free' ? styles.inputDisabled : null]}
                value={draft?.ticketType === 'free' ? '0.00' : tier.price}
                onChangeText={(value) => updateTier(tier.id, 'price', value)}
                placeholder="25.00"
                placeholderTextColor="#8AA0A8"
                keyboardType="decimal-pad"
                editable={draft?.ticketType !== 'free'}
              />
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setTicketTiers((current) => [...current, createDraftTicketTier()])}
      >
        <Text style={styles.addButtonText}>Add another ticket type</Text>
      </TouchableOpacity>
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
  ticketCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7E1E5',
    backgroundColor: '#FFFFFF',
    padding: 18,
    gap: 14,
  },
  fieldGroup: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
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
  inputDisabled: {
    color: '#4F6D77',
    backgroundColor: '#F1F6F8',
  },
  addButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#126b87',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBFDFD',
  },
  addButtonText: {
    color: '#126b87',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default ConfigureTicketsScreen;
