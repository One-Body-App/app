import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ReactNode } from 'react';
import type {
  ConnectPortalCreateStep,
  ConnectPortalEventDraft,
  TicketTier,
} from '@/src/services/connectPortal';
import {
  createConnectPortalDraft,
  getConnectPortalResumeResolution,
  requiresPayoutStep,
} from '@/src/services/connectPortal';

type CreateFlowLayoutProps = {
  title: string;
  step: ConnectPortalCreateStep;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  saveLabel?: string;
  onSave?: () => void;
  loading?: boolean;
  nextDisabled?: boolean;
};

export const ensureStepOneDraftRecord = async (draftId?: string) => {
  if (!draftId) {
    return createConnectPortalDraft();
  }

  const resolution = await getConnectPortalResumeResolution(draftId);
  if (resolution.kind === 'draft') {
    return resolution.draft;
  }

  return null;
};

export const ensureExistingDraftRecord = async (
  navigation: {
    navigate: (...args: any[]) => void;
  },
  draftId?: string
) => {
  const resolution = await getConnectPortalResumeResolution(draftId);
  if (resolution.kind === 'draft') {
    return resolution.draft;
  }

  navigation.navigate('ConnectGoMyEvents', {
    initialFilter: 'Draft',
    resumeError: resolution.message,
  });
  return null;
};

export const getStepFiveNextRouteName = (
  draft: Pick<ConnectPortalEventDraft, 'ticketType' | 'paymentOption'>
) => (requiresPayoutStep(draft) ? 'ConnectGoCreateStep6Payout' : 'ConnectGoCreateStep6Review');

export const getReviewBackRouteName = (
  draft: Pick<ConnectPortalEventDraft, 'ticketType' | 'paymentOption'>
) => (requiresPayoutStep(draft) ? 'ConnectGoCreateStep6Payout' : 'ConnectGoCreateStep5');

export const createDraftTicketTier = (overrides?: Partial<TicketTier>): TicketTier => ({
  id: overrides?.id || `ticket-${Math.round(Math.random() * 100000)}`,
  name: overrides?.name || 'General Admission',
  quantity: overrides?.quantity || '100',
  price: overrides?.price || '0.00',
});

export function CreateFlowLayout({
  title,
  step,
  children,
  onBack,
  onNext,
  nextLabel = 'Next',
  backLabel = 'Back',
  saveLabel,
  onSave,
  loading = false,
  nextDisabled = false,
}: CreateFlowLayoutProps): React.JSX.Element {
  const progressWidth = `${Math.max(0, Math.min(100, (step / 7) * 100))}%` as `${number}%`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.headerButton, !onBack ? styles.headerButtonHidden : null]}
            onPress={onBack}
            disabled={!onBack}
          >
            <Text style={styles.headerButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Step {step} of 7</Text>
            <Text style={styles.progressPercent}>{Math.round((step / 7) * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#126b87" />
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>

            <View style={styles.footer}>
              {saveLabel && onSave ? (
                <TouchableOpacity style={styles.secondaryButton} onPress={onSave}>
                  <Text style={styles.secondaryButtonText}>{saveLabel}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.secondaryButton, !onBack ? styles.secondaryButtonHidden : null]}
                  onPress={onBack}
                  disabled={!onBack}
                >
                  <Text style={styles.secondaryButtonText}>{backLabel}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.primaryButton, nextDisabled ? styles.primaryButtonDisabled : null]}
                onPress={onNext}
                disabled={nextDisabled}
              >
                <Text style={styles.primaryButtonText}>{nextLabel}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F6F7F8',
  },
  headerButton: {
    minWidth: 52,
  },
  headerButtonHidden: {
    opacity: 0,
  },
  headerButtonText: {
    color: '#126b87',
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#032f3c',
  },
  headerSpacer: {
    minWidth: 52,
  },
  progressWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#032f3c',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#126b87',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DCE7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#126b87',
    borderRadius: 4,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 128,
    gap: 16,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#F6F7F8',
    borderTopWidth: 1,
    borderTopColor: '#E6EAEC',
  },
  primaryButton: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#126b87',
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minWidth: 110,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D6DB',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonHidden: {
    opacity: 0.4,
  },
  secondaryButtonText: {
    color: '#032f3c',
    fontSize: 15,
    fontWeight: '700',
  },
});
