import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import type {
  ConnectPortalPaymentOption,
  ConnectPortalTicketType,
} from '@/src/services/connectPortal';
import { saveConnectPortalDraft } from '@/src/services/connectPortal';
import { CreateFlowLayout, ensureExistingDraftRecord, useCreateFlowPalette } from './shared';
import useMountEffect from '@/src/hooks/useMountEffect';

type Props = StackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep4'>;

function TicketingTypeScreen({ navigation, route }: Props): React.JSX.Element {
  const palette = useCreateFlowPalette();
  const [loading, setLoading] = useState(true);
  const [draftId, setDraftId] = useState(route.params?.draftId);
  const [ticketType, setTicketType] = useState<ConnectPortalTicketType>('free');
  const [paymentOption, setPaymentOption] = useState<ConnectPortalPaymentOption>('external');

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
      setTicketType(draft.ticketType);
      setPaymentOption(draft.paymentOption);
      setLoading(false);
    })();

    return () => {
      isActive = false;
    };
  });

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
          How will the community register?
        </Text>
        <Text style={[styles.sectionBody, { color: palette.textSecondary }]}>
          Let us know if your gathering is free and open to all, or if attendees need to purchase a
          ticket to help cover costs.
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
                {option === 'free' ? 'Free Gathering' : 'Ticketed Event'}
              </Text>
              <Text
                style={[
                  styles.toggleBody,
                  { color: isActive ? palette.textSecondary : palette.textSecondary },
                ]}
              >
                {option === 'free'
                  ? 'No cost to attend. Simply invite believers to RSVP and join the fellowship.'
                  : 'Set up paid registration to help support your ministry or event expenses.'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {ticketType === 'paid' ? (
        <View style={styles.paymentSection}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>Payment Method</Text>
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
                    {option === 'external' ? 'External Link' : 'One Body Ticketing'}
                  </Text>
                  <Text style={[styles.paymentBody, { color: palette.textSecondary }]}>
                    {option === 'external'
                      ? 'Direct attendees to your church website, Eventbrite, or preferred registration platform.'
                      : 'Securely process payments right here in the app (requires setup before review).'}
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
