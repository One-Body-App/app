import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, Pressable, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import type { ConnectPortalTicketType } from '@/src/services/connectPortal';
import { saveConnectPortalDraft } from '@/src/services/connectPortal';
import { CreateFlowLayout, ensureExistingDraftRecord, useCreateFlowPalette } from './shared';
import useMountEffect from '@/src/hooks/useMountEffect';

type Props = NativeStackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep4'>;

const isValidExternalEventUrl = (value: string) => {
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

function TicketingTypeScreen({ navigation, route }: Props): React.JSX.Element {
  const palette = useCreateFlowPalette();
  const [loading, setLoading] = useState(true);
  const [draftId, setDraftId] = useState(route.params?.draftId);
  const [ticketType, setTicketType] = useState<ConnectPortalTicketType>('free');
  const [externalEventUrl, setExternalEventUrl] = useState('');

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
      setTicketType(draft.ticketType === 'paid' ? 'external' : draft.ticketType);
      setExternalEventUrl(draft.externalEventUrl || '');
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
        paymentOption: 'external',
        externalEventUrl: ticketType === 'external' ? externalEventUrl.trim() : '',
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
          navigation.navigate(
            ticketType === 'external' ? 'ConnectGoCreateStep6Review' : 'ConnectGoCreateStep5',
            { draftId: draft.id }
          );
        }
      }}
      nextDisabled={
        !draftId || (ticketType === 'external' && !isValidExternalEventUrl(externalEventUrl))
      }
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
          How will the community register?
        </Text>
        <Text style={[styles.sectionBody, { color: palette.textSecondary }]}>
          Choose whether believers will RSVP through One Body&apos;s free gathering flow or be
          redirected straight to your own registration destination.
        </Text>
      </View>

      <View style={styles.toggleRow}>
        {(['free', 'external'] as ConnectPortalTicketType[]).map((option) => {
          const isActive = ticketType === option;
          return (
            <Pressable
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
              }}
            >
              <Text
                style={[
                  styles.toggleTitle,
                  { color: isActive ? palette.accent : palette.textPrimary },
                ]}
              >
                {option === 'free' ? 'Free Gathering' : 'External Link'}
              </Text>
              <Text style={[styles.toggleBody, { color: palette.textSecondary }]}>
                {option === 'free'
                  ? "Use One Body's free RSVP setup so attendees can register directly in the app."
                  : 'Send attendees straight to your website, Eventbrite, or preferred registration platform.'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {ticketType === 'external' ? (
        <View style={styles.formSection}>
          <Text style={[styles.label, { color: palette.textPrimary }]}>External Event Link</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: palette.inputBg,
                borderColor: palette.inputBorder,
                color: palette.inputText,
              },
            ]}
            value={externalEventUrl}
            onChangeText={setExternalEventUrl}
            placeholder="https://yourchurch.org/events/spring-gathering"
            placeholderTextColor={palette.inputPlaceholder}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.helperText, { color: palette.textSecondary }]}>
            Attendees will be redirected directly to this link. No One Body registration flow will
            be shown.
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.comingSoonCard,
          {
            backgroundColor: palette.cardBg,
            borderColor: palette.cardBorder,
          },
        ]}
      >
        <View style={styles.paymentCopy}>
          <Text style={[styles.paymentTitle, { color: palette.textPrimary }]}>
            One Body Paid Ticketing
          </Text>
          <Text style={[styles.paymentBody, { color: palette.textSecondary }]}>
            Coming soon. Paid ticketing is not available in the app right now.
          </Text>
        </View>
        <View style={[styles.comingSoonBadge, { backgroundColor: palette.disabledInputBg }]}>
          <Text style={[styles.comingSoonBadgeText, { color: palette.textSecondary }]}>
            Coming soon
          </Text>
        </View>
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
  formSection: {
    gap: 10,
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
  helperText: {
    fontSize: 13,
    lineHeight: 18,
  },
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    opacity: 0.72,
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
  comingSoonBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  comingSoonBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default TicketingTypeScreen;
