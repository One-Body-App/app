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
import { useTheme } from '@react-navigation/native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
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

export function useCreateFlowPalette() {
  const { dark } = useTheme();
  return {
    isDark: dark,
    screenBg: dark ? '#0e131a' : '#F6F7F8',
    headerTitle: dark ? '#e6eaec' : '#032f3c',
    accent: dark ? '#41dbe1' : '#126b87',
    textPrimary: dark ? '#e6eaec' : '#032f3c',
    textSecondary: dark ? '#9aacb1' : '#4F6D77',
    textMuted: dark ? 'rgba(230,234,236,0.72)' : 'rgba(3,47,60,0.62)',
    inputBg: dark ? 'rgba(14,19,26,0.72)' : '#FFFFFF',
    inputBorder: dark ? 'rgba(255,255,255,0.1)' : '#D7E1E5',
    inputText: dark ? '#e6eaec' : '#032f3c',
    inputPlaceholder: dark ? '#9aacb1' : '#8AA0A8',
    cardBg: dark ? '#181a1c' : '#FFFFFF',
    cardBorder: dark ? 'rgba(255,255,255,0.1)' : '#D7E1E5',
    cardActiveBg: dark ? 'rgba(65,219,225,0.12)' : '#EEF6F8',
    cardActiveBorder: dark ? '#41dbe1' : '#126b87',
    progressTrack: dark ? 'rgba(255,255,255,0.1)' : '#DCE7EB',
    progressFill: dark ? '#41dbe1' : '#126b87',
    footerBg: dark ? '#0e131a' : '#F6F7F8',
    footerBorder: dark ? 'rgba(255,255,255,0.08)' : '#E6EAEC',
    secondaryBtnBg: dark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
    secondaryBtnBorder: dark ? 'rgba(255,255,255,0.12)' : '#C7D6DB',
    secondaryBtnText: dark ? '#e6eaec' : '#032f3c',
    primaryBtnBg: dark ? '#41dbe1' : '#126b87',
    primaryBtnText: dark ? '#032f3c' : '#FFFFFF',
    radioBorder: dark ? 'rgba(255,255,255,0.2)' : '#C4D4D9',
    radioActiveBg: dark ? '#41dbe1' : '#126b87',
    radioActiveBorder: dark ? '#41dbe1' : '#126b87',
    dashedBorder: dark ? 'rgba(255,255,255,0.16)' : '#9FB6BE',
    dashedBg: dark ? 'rgba(255,255,255,0.03)' : '#FBFDFD',
    disabledInputBg: dark ? 'rgba(255,255,255,0.04)' : '#F1F6F8',
    successBubbleBg: dark ? 'rgba(65,219,225,0.14)' : '#EAF5F7',
  };
}

export type CreateFlowColors = ReturnType<typeof useCreateFlowPalette>;

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
  const palette = useCreateFlowPalette();
  const progressWidth = `${Math.max(0, Math.min(100, (step / 7) * 100))}%` as `${number}%`;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.screenBg }]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { backgroundColor: palette.screenBg }]}>
          <TouchableOpacity
            style={[styles.headerButton, !onBack ? styles.headerButtonHidden : null]}
            onPress={onBack}
            disabled={!onBack}
          >
            <MaterialIcons name="chevron-left" size={28} color={palette.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.headerTitle }]}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: palette.textPrimary }]}>
              Step {step} of 7
            </Text>
            <Text style={[styles.progressPercent, { color: palette.accent }]}>
              {Math.round((step / 7) * 100)}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: palette.progressTrack }]}>
            <View
              style={[
                styles.progressFill,
                { width: progressWidth, backgroundColor: palette.progressFill },
              ]}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={palette.accent} />
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>

            <View
              style={[
                styles.footer,
                {
                  backgroundColor: palette.footerBg,
                  borderTopColor: palette.footerBorder,
                },
              ]}
            >
              {saveLabel && onSave ? (
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    {
                      backgroundColor: palette.secondaryBtnBg,
                      borderColor: palette.secondaryBtnBorder,
                    },
                  ]}
                  onPress={onSave}
                >
                  <Text style={[styles.secondaryButtonText, { color: palette.secondaryBtnText }]}>
                    {saveLabel}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    {
                      backgroundColor: palette.secondaryBtnBg,
                      borderColor: palette.secondaryBtnBorder,
                    },
                    !onBack ? styles.secondaryButtonHidden : null,
                  ]}
                  onPress={onBack}
                  disabled={!onBack}
                >
                  <Text style={[styles.secondaryButtonText, { color: palette.secondaryBtnText }]}>
                    {backLabel}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: palette.primaryBtnBg },
                  nextDisabled ? styles.primaryButtonDisabled : null,
                ]}
                onPress={onNext}
                disabled={nextDisabled}
              >
                <Text style={[styles.primaryButtonText, { color: palette.primaryBtnText }]}>
                  {nextLabel}
                </Text>
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
  },
  headerButton: {
    minWidth: 36,
  },
  headerButtonHidden: {
    opacity: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  headerSpacer: {
    minWidth: 36,
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
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
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
    borderTopWidth: 1,
  },
  primaryButton: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
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
  },
  secondaryButtonHidden: {
    opacity: 0.4,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
