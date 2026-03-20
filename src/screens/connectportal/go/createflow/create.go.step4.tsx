import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import type {
  ConnectPortalPaymentOption,
  ConnectPortalTicketType,
} from '@/src/services/connectPortal';
import { saveConnectPortalDraft } from '@/src/services/connectPortal';
import { CreateFlowLayout, ensureExistingDraftRecord, useCreateFlowPalette } from './shared';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep4'>;

function TicketingTypeScreen({ navigation, route }: Props): React.JSX.Element {
  const palette = useCreateFlowPalette();
  const [loading, setLoading] = useState(true);
  const [draftId, setDraftId] = useState(route.params?.draftId);
  const [ticketType, setTicketType] = useState<ConnectPortalTicketType>('free');
  const [paymentOption, setPaymentOption] = useState<ConnectPortalPaymentOption>('external');

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
      setTicketType(draft.ticketType);
      setPaymentOption(draft.paymentOption);
      setLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, [navigation, route.params?.draftId]);

  const persistDraft = async (completedStep?: 3 | 4) => {
    if (!draftId) {
      return null;
    }

    return saveConnectPortalDraft(
      draftId,
      {
        ticketType,
        paymentOption: ticketType === 'free' ? 'external' : paymentOption,
        payoutConfigured: false,
      },
      completedStep !== undefined ? { completedStep } : undefined
    );
  };

  return (
    <CreateFlowLayout
      title="Ticketing Type"
      step={4}
      loading={loading}
      onBack={async () => {
        await persistDraft(3);
        navigation.navigate('ConnectGoCreateStep3', { draftId: draftId || route.params.draftId });
      }}
      onNext={async () => {
        const draft = await persistDraft(4);
        if (draft) {
          navigation.navigate('ConnectGoCreateStep5', { draftId: draft.id });
        }
      }}
      nextDisabled={!draftId}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          How will people register?
        </Text>
        <Text style={[styles.sectionBody, { color: palette.textSecondary }]}>
          Choose the ticket type first, then decide whether a paid event should use internal or
          external payments.
        </Text>
      </View>

      <View style={styles.toggleRow}>
        {(['free', 'paid'] as ConnectPortalTicketType[]).map((option) => {
          const isActive = ticketType === option;
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.toggleCard,
                {
                  backgroundColor: isActive ? palette.cardActiveBg : palette.cardBg,
                  borderColor: isActive ? palette.cardActiveBorder : palette.cardBorder,
                },
              ]}
              onPress={() => {
                setTicketType(option);
                if (option === 'free') {
                  setPaymentOption('external');
                }
              }}
            >
              <Text
                style={[
                  styles.toggleTitle,
                  { color: isActive ? palette.accent : palette.textPrimary },
                ]}
              >
                {option === 'free' ? 'Free Event' : 'Paid Event'}
              </Text>
              <Text
                style={[
                  styles.toggleBody,
                  { color: isActive ? palette.textSecondary : palette.textSecondary },
                ]}
              >
                {option === 'free'
                  ? 'Attendees register without payment.'
                  : 'Collect payment for one or more ticket tiers.'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {ticketType === 'paid' ? (
        <View style={styles.paymentSection}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Payment Option</Text>
          {(['external', 'internal'] as ConnectPortalPaymentOption[]).map((option) => {
            const isActive = paymentOption === option;
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.paymentCard,
                  {
                    backgroundColor: isActive ? palette.cardActiveBg : palette.cardBg,
                    borderColor: isActive ? palette.cardActiveBorder : palette.cardBorder,
                  },
                ]}
                onPress={() => setPaymentOption(option)}
              >
                <View style={styles.paymentCopy}>
                  <Text style={[styles.paymentTitle, { color: palette.textPrimary }]}>
                    {option === 'external' ? 'External payment link' : 'OneBody internal payouts'}
                  </Text>
                  <Text style={[styles.paymentBody, { color: palette.textSecondary }]}>
                    {option === 'external'
                      ? 'Keep payments on Eventbrite, Stripe, or another external checkout.'
                      : 'Complete the local payout setup step before review.'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isActive ? palette.radioActiveBorder : palette.radioBorder,
                      backgroundColor: isActive ? palette.radioActiveBg : palette.cardBg,
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
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
    fontSize: 14,
    lineHeight: 20,
  },
  toggleRow: {
    gap: 12,
  },
  toggleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  toggleTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  toggleBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  paymentSection: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  paymentCopy: {
    flex: 1,
    gap: 4,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  paymentBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
});

export default TicketingTypeScreen;
