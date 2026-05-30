import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import {
  formatConnectPortalDate,
  getConnectPortalEventById,
  getEventCapacityLabel,
  publishConnectPortalDraft,
} from '@/src/services/connectPortal';
import type { ConnectPortalEventDraft } from '@/src/services/connectPortal';
import {
  CreateFlowLayout,
  ensureExistingDraftRecord,
  getReviewBackRouteName,
  useCreateFlowPalette,
} from './shared';
import useMountEffect from '@/src/hooks/useMountEffect';

type Props = NativeStackScreenProps<ConnectStackParamsList, 'ConnectGoCreateStep6Review'>;

const PUBLISH_ERROR_FALLBACK = 'Unable to publish event. Please try again.';

const getPublishFailureMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const responseMessage =
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'data' in error.response &&
      error.response.data &&
      typeof error.response.data === 'object' &&
      'message' in error.response.data
        ? error.response.data.message
        : undefined;

    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage;
    }

    if (Array.isArray(responseMessage)) {
      const normalized = responseMessage
        .filter((message): message is string => typeof message === 'string' && message.trim())
        .join('\n');
      if (normalized) {
        return normalized;
      }
    }

    if ('message' in error && typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }
  }

  return PUBLISH_ERROR_FALLBACK;
};

const getScheduleSummary = (draft: ConnectPortalEventDraft) => {
  const startLine = `${formatConnectPortalDate(draft.startDate)}${
    draft.startTime ? ` • ${draft.startTime}` : ''
  }`;
  const isSingleDay = draft.isSingleDayEvent || !draft.endDate || draft.endDate === draft.startDate;

  if (isSingleDay) {
    return {
      startLine,
      endLine: draft.endTime ? `Ends ${draft.endTime}` : '',
    };
  }

  return {
    startLine,
    endLine: `${formatConnectPortalDate(draft.endDate)}${draft.endTime ? ` • ${draft.endTime}` : ''}`,
  };
};

const getTicketingSummary = (draft: ConnectPortalEventDraft) => {
  if (draft.ticketType === 'external') {
    return {
      title: 'External Registration',
      supporting: draft.externalEventUrl || 'Link to be announced',
      detail:
        'Attendees will be directed to your external website to register. They will not use the One Body app to check in.',
    };
  }

  if (draft.ticketType === 'paid') {
    return {
      title: 'Paid Ticketed Event',
      supporting: getEventCapacityLabel(draft),
      detail: `${draft.ticketTiers.length} ticket option${draft.ticketTiers.length === 1 ? '' : 's'} available`,
    };
  }

  return {
    title: 'Free Community RSVP',
    supporting: getEventCapacityLabel(draft),
    detail: `${draft.ticketTiers.length} RSVP option${draft.ticketTiers.length === 1 ? '' : 's'} inside One Body`,
  };
};

function ReviewAndConfirmScreen({ navigation, route }: Props): React.JSX.Element {
  const palette = useCreateFlowPalette();
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ConnectPortalEventDraft | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useMountEffect(() => {
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
      setLoading(false);
    })();

    return () => {
      isActive = false;
    };
  });

  const scheduleSummary = draft ? getScheduleSummary(draft) : null;
  const ticketingSummary = draft ? getTicketingSummary(draft) : null;

  return (
    <CreateFlowLayout
      title="Review & Confirm"
      step={6}
      loading={loading}
      onBack={() => {
        if (!draft) {
          navigation.navigate('ConnectGoCreateStep5', { draftId: route.params.draftId });
          return;
        }

        navigation.navigate(getReviewBackRouteName(draft), { draftId: draft.id });
      }}
      onNext={async () => {
        if (!draft || isPublishing) {
          return;
        }

        setIsPublishing(true);

        try {
          const publishedEvent = await publishConnectPortalDraft(draft.id);
          if (publishedEvent) {
            navigation.replace('ConnectGoCreateStep7Success', { draftId: publishedEvent.id });
            return;
          }

          const latestDraft = await getConnectPortalEventById(route.params.draftId);
          if (latestDraft?.status === 'published') {
            navigation.replace('ConnectGoCreateStep7Success', { draftId: latestDraft.id });
          }
        } catch (error) {
          Alert.alert('Unable to publish event', getPublishFailureMessage(error));
        } finally {
          setIsPublishing(false);
        }
      }}
      nextLabel="Publish Event"
      nextDisabled={!draft || isPublishing}
    >
      {draft ? (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
              Review your event details.
            </Text>
            <Text style={[styles.sectionBody, { color: palette.textSecondary }]}>
              Make sure everything looks right before sharing this opportunity. Once published,
              believers in your area can discover it on the Go! map.
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
            ]}
          >
            <Text style={[styles.cardEyebrow, { color: palette.accent }]}>
              {draft.category || 'EVENT'}
            </Text>
            <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>
              {draft.title || 'Untitled Gathering'}
            </Text>
            <Text style={[styles.cardBody, { color: palette.textSecondary }]}>
              {draft.description ||
                'Provide a brief description to let the community know what to expect.'}
            </Text>
          </View>

          <View
            style={[
              styles.detailCard,
              { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
            ]}
          >
            <Text style={[styles.detailTitle, { color: palette.accent }]}>Schedule</Text>
            <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
              {scheduleSummary?.startLine}
            </Text>
            {scheduleSummary?.endLine ? (
              <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
                {scheduleSummary.endLine}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.detailCard,
              { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
            ]}
          >
            <Text style={[styles.detailTitle, { color: palette.accent }]}>Location</Text>
            <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
              {draft.isOnline ? 'Online Fellowship' : draft.venueName || 'Location to be announced'}
            </Text>
            <Text style={[styles.detailSubvalue, { color: palette.textSecondary }]}>
              {draft.isOnline
                ? draft.onlineEventUrl || 'Join link to be announced'
                : draft.address || draft.locationQuery || 'To be announced'}
            </Text>
          </View>

          <View
            style={[
              styles.detailCard,
              { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
            ]}
          >
            <Text style={[styles.detailTitle, { color: palette.accent }]}>Registration</Text>
            <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
              {ticketingSummary?.title}
            </Text>
            <Text style={[styles.detailSubvalue, { color: palette.textSecondary }]}>
              {ticketingSummary?.supporting}
            </Text>
            <Text style={[styles.detailSubvalue, { color: palette.textSecondary }]}>
              {ticketingSummary?.detail}
            </Text>
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
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  cardEyebrow: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
  },
  detailTitle: {
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  detailSubvalue: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ReviewAndConfirmScreen;
