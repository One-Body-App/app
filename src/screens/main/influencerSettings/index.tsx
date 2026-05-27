import React, { useCallback, useRef, useState } from 'react';
import { Animated, Linking, ScrollView, Switch, TextInput, Pressable, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useTheme } from '@react-navigation/native';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/src/services/api';
import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import StyledTextInput from '@/components/styled/TextInput';
import styles, { C } from './styles';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BADGES = ['Preacher', 'Writer', 'Pastor', 'Artist', 'Community Influencer'];
const MAX_BADGES = 5;
const MAX_SOURCES = 10;

const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

type ToastType = 'success' | 'error' | 'warn';

type ContentSource = { id: string; label: string; value: string; placeholder: string };

type StatusConfig = { label: string; bg: string; textColor: string; dotColor: string };

const STATUS_MAP: Record<string, StatusConfig> = {
  pending: {
    label: 'Status: Pending Approval',
    bg: C.gray100,
    textColor: C.cyan,
    dotColor: C.cyan,
  },
  approved: {
    label: 'Status: Approved Creator',
    bg: C.successBg,
    textColor: C.successText,
    dotColor: C.successText,
  },
  rejected: {
    label: 'Status: Action Required',
    bg: C.errorBg,
    textColor: C.errorText,
    dotColor: C.errorText,
  },
  coaching: {
    label: 'Status: In Coaching',
    bg: C.gray100,
    textColor: C.sapphireDark,
    dotColor: C.sapphireDark,
  },
};

const TOAST_BG: Record<ToastType, string> = {
  success: '#12AC7B',
  error: '#DC2C10',
  warn: '#D96A00',
};

// Default two pinned sources
const DEFAULT_SOURCES: ContentSource[] = [
  {
    id: 'youtube',
    label: 'YouTube Channel URL',
    value: '',
    placeholder: 'https://youtube.com/@yourchannel',
  },
  { id: 'rss', label: 'Blog / RSS Feed URL', value: '', placeholder: 'https://yourblog.com/feed' },
];

let extraSourceCounter = 0;
const makeSourceId = () => `extra_${++extraSourceCounter}`;

function getInitialSources(rssUrl?: string): ContentSource[] {
  return DEFAULT_SOURCES.map((source) =>
    source.id === 'rss' && rssUrl ? { ...source, value: rssUrl } : source
  );
}

function getInfluencerProfileSeedKey(influencerProfile: any): string {
  return JSON.stringify({
    comments: influencerProfile?.comments ?? '',
    category: influencerProfile?.category ?? [],
    rssUrl: influencerProfile?.rssUrl ?? '',
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function FieldLabel({ text, color }: { text: string; color: string }) {
  return <StyledText style={[styles.fieldLabel, { color }]}>{text}</StyledText>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
type InfluencerSettingsFormProps = {
  colors: {
    background: string;
    card: string;
    text: string;
  };
  influencerProfile: any;
  isLocked: boolean;
  status?: string;
  userToken: RootState['auth']['userToken'];
};

function InfluencerSettingsForm({
  colors,
  influencerProfile,
  isLocked,
  status,
  userToken,
}: InfluencerSettingsFormProps) {
  // Identity state
  const [bio, setBio] = useState(influencerProfile?.comments ?? '');
  const [website, setWebsite] = useState('');
  const [selectedBadges, setSelectedBadges] = useState<string[]>(
    influencerProfile?.category?.length ? influencerProfile.category : []
  );

  // Content sources: starts with 2 pinned, extras can be added up to MAX_SOURCES total
  const [sources, setSources] = useState<ContentSource[]>(() =>
    getInitialSources(influencerProfile?.rssUrl)
  );

  // Community toggles
  const [shopEnabled, setShopEnabled] = useState(false);
  const [eventsEnabled, setEventsEnabled] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>('success');
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Toast
  // ---------------------------------------------------------------------------
  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToastMessage(message);
      setToastType(type);
      Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, bounciness: 6 }).start();
      toastTimer.current = setTimeout(() => {
        Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
          setToastMessage(null)
        );
      }, 3000);
    },
    [toastAnim]
  );

  // ---------------------------------------------------------------------------
  // Badge logic
  // ---------------------------------------------------------------------------
  const toggleBadge = useCallback(
    (badge: string) => {
      if (isLocked) return;
      if (selectedBadges.includes(badge)) {
        setSelectedBadges((prev) => prev.filter((b) => b !== badge));
      } else {
        if (selectedBadges.length >= MAX_BADGES) {
          showToast('Maximum 5 badges allowed', 'warn');
          return;
        }
        setSelectedBadges((prev) => [...prev, badge]);
      }
    },
    [isLocked, selectedBadges, showToast]
  );

  // ---------------------------------------------------------------------------
  // Content sources logic
  // ---------------------------------------------------------------------------
  const updateSource = useCallback((id: string, value: string) => {
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
  }, []);

  const addSource = useCallback(() => {
    if (sources.length >= MAX_SOURCES) {
      showToast('Maximum 10 content sources reached', 'warn');
      return;
    }
    setSources((prev) => [
      ...prev,
      {
        id: makeSourceId(),
        label: `Content Source ${prev.length + 1}`,
        value: '',
        placeholder: 'https://...',
      },
    ]);
  }, [sources.length, showToast]);

  const removeSource = useCallback((id: string) => {
    // Only allow removing non-pinned sources
    if (id === 'youtube' || id === 'rss') return;
    setSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // ---------------------------------------------------------------------------
  // URL validation
  // ---------------------------------------------------------------------------
  const validateUrls = useCallback((): string | null => {
    if (website && !URL_REGEX.test(website)) return 'Website URL is invalid';
    const invalidSource = sources.find((src) => src.value && !URL_REGEX.test(src.value));
    if (invalidSource) {
      return `${invalidSource.label} is not a valid URL`;
    }
    return null;
  }, [website, sources]);

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  const handleSave = useCallback(async () => {
    const urlError = validateUrls();
    if (urlError) {
      showToast(urlError, 'error');
      return;
    }
    setIsSaving(true);
    try {
      const sourceMap = sources.reduce<Record<string, string>>((acc, s) => {
        acc[s.id] = s.value;
        return acc;
      }, {});
      const res = await ApiCall({
        route: 'user/creator-settings',
        verb: 'patch',
        token: userToken,
        params: {
          bio,
          website,
          badges: selectedBadges,
          contentSources: sourceMap,
          shopEnabled,
          eventsEnabled,
        },
      });
      if (res?.status === 200) {
        showToast('Settings saved', 'success');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch (_e) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [
    validateUrls,
    showToast,
    userToken,
    bio,
    website,
    selectedBadges,
    sources,
    shopEnabled,
    eventsEnabled,
  ]);

  // ---------------------------------------------------------------------------
  // Account claim CTA hijack
  // ---------------------------------------------------------------------------
  const statusConfig: StatusConfig | null = status ? (STATUS_MAP[status] ?? null) : null;
  const atSourceCap = sources.length >= MAX_SOURCES;

  const toastAnimStyle = {
    ...styles.toast,
    backgroundColor: TOAST_BG[toastType],
    opacity: toastAnim,
    transform: [
      { translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
    ],
  };

  // Shared input wrapper style (matches StyledTextInput internals)
  const inputWrapStyle = {
    flexDirection: 'row' as const,
    backgroundColor: Colors.neutral[700],
    paddingHorizontal: spacing.x16,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  };

  const inputTextStyle = {
    flex: 1,
    paddingVertical: spacing.x10,
    color: colors.text,
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
  };

  let sourceFooter: React.ReactNode = null;
  if (!isLocked) {
    if (atSourceCap) {
      sourceFooter = (
        <StyledText style={styles.sourceCapMsg}>
          Maximum of {MAX_SOURCES} content sources reached.
        </StyledText>
      );
    } else {
      sourceFooter = (
        <Pressable style={styles.addSourceBtn} onPress={addSource}>
          <View style={styles.addSourceCircle}>
            <StyledText style={styles.addSourcePlus}>+</StyledText>
          </View>
          <StyledText style={styles.addSourceLabel}>
            Add Content Source ({sources.length}/{MAX_SOURCES})
          </StyledText>
        </Pressable>
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {/* ── Status Banner ─────────────────────────────────────── */}
          {statusConfig ? (
            <View style={[styles.statusBanner, { backgroundColor: statusConfig.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusConfig.dotColor }]} />
              <StyledText style={[styles.statusText, { color: statusConfig.textColor }]}>
                {statusConfig.label}
              </StyledText>
            </View>
          ) : null}

          {/* ── Section 1: Identity & Profile ─────────────────────── */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeaderRow}>
              <StyledText style={[styles.cardTitle, { color: C.sapphireDark }]}>
                Identity & Profile
              </StyledText>
              {isLocked ? (
                <View style={styles.reviewTag}>
                  <StyledText style={styles.reviewTagText}>Under Review</StyledText>
                </View>
              ) : null}
            </View>

            {/* Bio */}
            <View style={styles.fieldGroup}>
              <FieldLabel text="Influencer Bio" color={colors.text} />
              <View style={[inputWrapStyle, { alignItems: 'flex-start' }]}>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell your community about your ministry and calling..."
                  placeholderTextColor={Colors.neutral[500]}
                  multiline
                  numberOfLines={4}
                  editable={!isLocked}
                  style={[
                    inputTextStyle,
                    { height: 96, textAlignVertical: 'top', paddingTop: spacing.x10 },
                  ]}
                />
              </View>
            </View>

            {/* Website */}
            <View style={styles.fieldGroup}>
              <FieldLabel text="Ministry / Personal Website" color={colors.text} />
              <StyledTextInput
                value={website}
                onChangeText={setWebsite}
                placeholder="https://yourministry.com"
                placeholderTextColor={Colors.neutral[500]}
                keyboardType="url"
                autoCapitalize="none"
                editable={!isLocked}
              />
            </View>

            {/* Badges */}
            <View style={styles.fieldGroupLast}>
              <FieldLabel text={`Influencer Badges (up to ${MAX_BADGES})`} color={colors.text} />
              <View style={styles.badgeRow} pointerEvents={isLocked ? 'none' : 'auto'}>
                {BADGES.map((badge) => {
                  const isSelected = selectedBadges.includes(badge);
                  return (
                    <Pressable
                      key={badge}
                      onPress={() => toggleBadge(badge)}
                      style={[
                        styles.badgeChip,
                        isSelected && styles.badgeChipSelected,
                        isLocked && { opacity: 0.5 },
                      ]}
                    >
                      <StyledText
                        style={[styles.badgeText, isSelected && styles.badgeTextSelected]}
                      >
                        {badge}
                      </StyledText>
                    </Pressable>
                  );
                })}
              </View>
              <StyledText style={styles.badgeHint}>
                {selectedBadges.length}/{MAX_BADGES} selected
              </StyledText>
            </View>
          </View>

          {/* ── Section 2: Content Sources ────────────────────────── */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeaderRow}>
              <StyledText style={[styles.cardTitle, { color: C.sapphireDark }]}>
                Content Sources
              </StyledText>
              {isLocked ? (
                <View style={styles.reviewTag}>
                  <StyledText style={styles.reviewTagText}>Under Review</StyledText>
                </View>
              ) : null}
            </View>

            {sources.map((src, index) => {
              const isPinned = src.id === 'youtube' || src.id === 'rss';
              const isLast = index === sources.length - 1;
              return (
                <View
                  key={src.id}
                  style={[styles.fieldGroup, isLast && !atSourceCap && styles.fieldGroupLast]}
                >
                  <FieldLabel text={src.label} color={colors.text} />
                  <View style={styles.sourceRow}>
                    <View style={styles.sourceInputWrap}>
                      <StyledTextInput
                        value={src.value}
                        onChangeText={(v) => updateSource(src.id, v)}
                        placeholder={src.placeholder}
                        placeholderTextColor={Colors.neutral[500]}
                        keyboardType="url"
                        autoCapitalize="none"
                        editable={!isLocked}
                      />
                    </View>
                    {!isPinned ? (
                      <Pressable
                        style={[styles.sourceDeleteBtn, { backgroundColor: colors.card }]}
                        onPress={() => removeSource(src.id)}
                      >
                        <StyledText style={styles.sourceDeleteText}>x</StyledText>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}

            {/* Add button or cap message */}
            {sourceFooter}
          </View>

          {/* ── Section 3: Community & Store ──────────────────────── */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.cardHeaderRow, { marginBottom: spacing.x12 }]}>
              <StyledText style={[styles.cardTitle, { color: C.sapphireDark }]}>
                Community & Store
              </StyledText>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <StyledText style={[styles.toggleTitle, { color: colors.text }]}>
                  Feature My Shop
                </StyledText>
                <StyledText style={styles.toggleSub}>
                  Link your profile to the One Body Shop Portal
                </StyledText>
              </View>
              <Switch
                value={shopEnabled}
                onValueChange={setShopEnabled}
                disabled={isLocked}
                trackColor={{ false: Colors.neutral[800], true: C.cyan }}
                thumbColor={C.white}
              />
            </View>

            <View style={styles.toggleDivider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <StyledText style={[styles.toggleTitle, { color: colors.text }]}>
                  Feature My Events
                </StyledText>
                <StyledText style={styles.toggleSub}>
                  Display your events in the Connect Portal
                </StyledText>
              </View>
              <Switch
                value={eventsEnabled}
                onValueChange={setEventsEnabled}
                disabled={isLocked}
                trackColor={{ false: Colors.neutral[800], true: C.cyan }}
                thumbColor={C.white}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Fixed Save Button ──────────────────────────────────── */}
      <View
        style={[styles.saveBar, { backgroundColor: colors.background }]}
        pointerEvents="box-none"
      >
        <Pressable
          style={[styles.saveBtn, (isSaving || isLocked) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving || isLocked}
        >
          <StyledText style={styles.saveBtnText}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </StyledText>
        </Pressable>
      </View>

      {/* ── Toast ──────────────────────────────────────────────── */}
      {toastMessage ? (
        <Animated.View style={toastAnimStyle}>
          <StyledText style={styles.toastText}>{toastMessage}</StyledText>
        </Animated.View>
      ) : null}
    </View>
  );
}

function InfluencerSettings() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const userToken = useSelector((state: RootState) => state.auth.userToken);
  const userProfile = useSelector((state: RootState) => state.auth.getProfileData);

  const influencerProfile = userProfile?.influencerProfile;
  const status = influencerProfile?.influencerStatus;
  const isLocked = status === 'pending';
  const isClaimed = (influencerProfile as any)?.isClaimed !== false;

  if (!isClaimed) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.claimWrap}>
          <View style={styles.claimIconCircle}>
            <StyledText style={{ fontSize: 30, color: C.cyan }}>!</StyledText>
          </View>
          <StyledText style={[styles.claimTitle, { color: colors.text }]}>
            This Account Is Unclaimed
          </StyledText>
          <StyledText style={styles.claimBody}>
            Verify your identity to take ownership of this Creator profile and unlock full access.
          </StyledText>
          <Pressable
            style={styles.claimBtn}
            onPress={() => Linking.openURL('onebody://verification')}
          >
            <StyledText style={styles.claimBtnText}>Claim This Account</StyledText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <InfluencerSettingsForm
        key={getInfluencerProfileSeedKey(influencerProfile)}
        colors={colors}
        influencerProfile={influencerProfile}
        isLocked={isLocked}
        status={status}
        userToken={userToken}
      />
      <Pressable
        onPress={() => navigation.navigate('CreatorBlogDashboard' as never)}
        style={{
          position: 'absolute',
          right: spacing.x24,
          bottom: 96,
          backgroundColor: Colors.primarySapphire.brand,
          paddingHorizontal: spacing.x16,
          paddingVertical: spacing.x12,
          borderRadius: borderRadius.button,
        }}
      >
        <StyledText style={{ color: '#FFFFFF', fontFamily: 'Rubik-Medium', fontSize: 13 }}>
          Manage Blogs
        </StyledText>
      </Pressable>
    </View>
  );
}

export default InfluencerSettings;
