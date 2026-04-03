import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { launchImageLibrary } from 'react-native-image-picker';
import ImagePicker from 'react-native-image-crop-picker';
import Icon from '@react-native-vector-icons/material-design-icons';
import { Add, Calendar, Link21, Location, ShieldTick, HomeHashtag } from 'iconsax-react-native';
import { format, parseISO } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useTheme } from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getBadges, profileUpdate, setUserBadges } from '@/src/redux/actions/AuthActions';
import { setLoader } from '@/src/redux/actions/GeneralActions';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { Colors, Typography } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { OpenURLButton } from '@/services/constants';
import { AccountType, Badge } from '@/utils/types';
import StyledText from '@/components/styled/Text';
import CustomModal from '@/components/CustomModal';
import Selected from '@/assets/svg/Selected.svg';
import ProfileFill from '@/assets/svg/ProfileFill.svg';
import { ProfileProps } from './profileTypes';
import { getProfileDisplayName, getProfileRoleLabel, getProfileTypeLabel } from './profileUtils';

const PROFILE_PIC_RATE_KEY = '@profile_pic_changes';
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

async function getRecentProfilePicChanges(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_PIC_RATE_KEY);
    if (!raw) return [];
    const all: number[] = JSON.parse(raw);
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    return all.filter((ts) => ts > cutoff);
  } catch {
    return [];
  }
}

async function recordProfilePicChange(recentTimestamps: number[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      PROFILE_PIC_RATE_KEY,
      JSON.stringify([...recentTimestamps, Date.now()])
    );
  } catch {
    // Storage failure is non-critical
  }
}

const COVER_HEIGHT = 150;
const AVATAR_SIZE = 84;
const DEFAULT_PROFILE_IMAGE = 'https://cdn.onebodyapp.com/user/no-image.png';

const modalStyles = StyleSheet.create({
  bottomView: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  content: {
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
    padding: spacing.x16,
  },
});

const formatCount = (value?: number) => {
  const count = Number(value ?? 0);

  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }

  return `${count}`;
};

function ProfileHeader({
  profileData,
  currentUser,
  handleSubscribe,
  handleUnSubscribe,
  variant = 'public',
}: ProfileProps) {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const authState = useSelector((state: RootState) => state.auth);
  const { colors } = useTheme();
  const isOwnProfile = profileData._id === currentUser._id;
  const displayName = useMemo(() => getProfileDisplayName(profileData), [profileData]);
  const roleLabel = useMemo(() => getProfileRoleLabel(profileData), [profileData]);
  const typeLabel = useMemo(() => getProfileTypeLabel(profileData), [profileData]);
  const persistedBadgeIds = useMemo(
    () => (profileData.badgesData ?? []).map((badge) => badge._id),
    [profileData.badgesData]
  );
  const joinedLabel = useMemo(() => {
    if (!profileData.createdAt) {
      return '';
    }

    const parsedDate = parseISO(profileData.createdAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    return format(parsedDate, 'MMMM yyyy');
  }, [profileData.createdAt]);
  const isConnected = currentUser.following?.includes(profileData._id);
  const isSelfVariant = variant === 'self';
  const [requestModal, setRequestModal] = useState(false);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<string[]>(persistedBadgeIds);
  const showSelfProfileMediaControls = isOwnProfile && isSelfVariant;

  const badgeMap = useMemo(() => {
    const allBadges = Array.isArray(authState?.getBadgesData) ? authState.getBadgesData : [];
    return new Map(allBadges.map((badge: Badge) => [badge._id, badge]));
  }, [authState?.getBadgesData]);

  const displayedBadges = useMemo(() => {
    return persistedBadgeIds
      .map((badgeId) => {
        const fromProfile = (profileData.badgesData ?? []).find((badge) => badge._id === badgeId);
        return fromProfile ?? badgeMap.get(badgeId);
      })
      .filter(Boolean) as Badge[];
  }, [badgeMap, persistedBadgeIds, profileData.badgesData]);
  const isAddOnlyBadgeRail = isOwnProfile && displayedBadges.length === 0;
  const useCompactAddOnlyBadge = isSelfVariant && isAddOnlyBadgeRail;
  const badgeTrailingContent = useMemo(() => {
    if (useCompactAddOnlyBadge) {
      return <Add size={20} color="#FFFFFF" />;
    }

    if (displayedBadges.length < 3) {
      return (
        <View style={[styles.badgeAddButton, isSelfVariant ? styles.selfBadgeAddButton : null]}>
          <Add size={16} color="#FFFFFF" />
        </View>
      );
    }

    return null;
  }, [displayedBadges.length, isSelfVariant, useCompactAddOnlyBadge]);

  const handleToggleBadge = (badgeId: string) => {
    setSelectedBadgeIds((previous) => {
      if (previous.includes(badgeId)) {
        return previous.filter((selectedId) => selectedId !== badgeId);
      }

      if (previous.length >= 3) {
        Toast.show('You cannot select more than 3 badges!', Toast.LONG);
        return previous;
      }

      return [...previous, badgeId];
    });
  };

  const openBadgeModal = () => {
    setSelectedBadgeIds(persistedBadgeIds);
    dispatch(getBadges.Request({ token }));
    setRequestModal(true);
  };

  const handlePickAvatar = async () => {
    try {
      const recentChanges = await getRecentProfilePicChanges();
      if (recentChanges.length >= RATE_LIMIT_MAX) {
        const oldestTs = Math.min(...recentChanges);
        const resetDate = new Date(oldestTs + RATE_LIMIT_WINDOW_MS);
        Toast.show(
          `Profile picture limit reached. You can update again after ${format(resetDate, 'MMM d, yyyy')}.`,
          Toast.LONG
        );
        return;
      }

      const response = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
      if (response.didCancel || !response.assets?.length) return;

      const sourceUri = response.assets[0].uri ?? '';
      const cropped = await ImagePicker.openCropper({
        path: sourceUri,
        mediaType: 'photo',
        cropperCircleOverlay: true,
        forceJpg: true,
        compressImageMaxHeight: 150,
      });

      await recordProfilePicChange(recentChanges);
      const remaining = RATE_LIMIT_MAX - (recentChanges.length + 1);

      const formData = new FormData();
      formData.append('photo', {
        name: `profileImage${profileData._id}`,
        type: cropped.mime ?? 'image/jpeg',
        uri: cropped.path ?? '',
      } as any);
      dispatch(setLoader(true));
      dispatch(
        profileUpdate({
          data: formData,
          token,
          accountType: (profileData.accountType ?? AccountType.individual) as AccountType,
        })
      );

      const noticeMsg =
        remaining > 0
          ? `Profile picture updated. ${remaining} update${remaining === 1 ? '' : 's'} remaining in the next 60 days.`
          : 'Profile picture updated. This was your last update for the next 60 days.';
      Toast.show(noticeMsg, Toast.LONG);
    } catch {
      // User cancelled picker or cropper
    }
  };

  const handlePickHeader = async () => {
    try {
      const response = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
      if (response.didCancel || !response.assets?.length) return;

      const sourceUri = response.assets[0].uri ?? '';
      const screenWidth = Dimensions.get('screen').width;
      const cropped = await ImagePicker.openCropper({
        path: sourceUri,
        width: screenWidth,
        height: COVER_HEIGHT,
        mediaType: 'photo',
        forceJpg: true,
        compressImageMaxWidth: screenWidth,
        compressImageMaxHeight: COVER_HEIGHT,
      });

      const formData = new FormData();
      formData.append('headerImage', {
        name: `headerImage${profileData._id}`,
        type: cropped.mime ?? 'image/jpeg',
        uri: cropped.path ?? '',
      } as any);
      dispatch(setLoader(true));
      dispatch(
        profileUpdate({
          data: formData,
          token,
          accountType: (profileData.accountType ?? AccountType.individual) as AccountType,
        })
      );
    } catch {
      // User cancelled picker or cropper
    }
  };

  const openDirectMessage = () => {
    if (isOwnProfile) {
      return;
    }

    const chatParams = {
      conversationType: 'direct' as const,
      peerUserId: profileData._id,
      peerName: displayName,
      peerUsername: profileData.username,
      peerAvatarUri: profileData.profileImage,
    };

    let navigator = navigation as any;
    while (navigator) {
      const routeNames = navigator.getState?.()?.routeNames ?? [];

      if (routeNames.includes('Messages')) {
        navigator.navigate('Messages', {
          screen: 'ChatDetail',
          params: chatParams,
        });
        return;
      }

      if (routeNames.includes('Main')) {
        navigator.navigate('Main', {
          screen: 'Messages',
          params: {
            screen: 'ChatDetail',
            params: chatParams,
          },
        });
        return;
      }

      if (routeNames.includes('MainRoot')) {
        navigator.navigate('MainRoot', {
          screen: 'Main',
          params: {
            screen: 'Messages',
            params: {
              screen: 'ChatDetail',
              params: chatParams,
            },
          },
        });
        return;
      }

      navigator = navigator.getParent?.();
    }
  };

  const handleWebsitePress = () => {
    if (!profileData.website) {
      return;
    }

    const websiteUrl = profileData.website.startsWith('http')
      ? profileData.website
      : `https://${profileData.website}`;

    OpenURLButton(websiteUrl);
  };

  const handleShareProfile = async () => {
    const profileUrl = profileData.username
      ? `https://app.onebodyapp.com/profile/${profileData.username}`
      : undefined;

    await Share.share({
      title: `Check out ${displayName} on One Body`,
      url: profileUrl,
      message: profileUrl ? `Check out ${displayName} on One Body\n${profileUrl}` : displayName,
    });
  };

  const openEditProfile = (openMediaPicker?: 'photo' | 'header') => {
    navigation.navigate('EditProfile', openMediaPicker ? { openMediaPicker } : undefined);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerSection}>
        <View style={styles.coverWrap}>
          {profileData.profileHeader ? (
            <Image
              source={{ uri: profileData.profileHeader }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coverFallback} />
          )}

          {showSelfProfileMediaControls ? (
            <TouchableOpacity
              accessibilityLabel="Edit cover image"
              onPress={() => {
                handlePickHeader().catch(() => undefined);
              }}
              style={styles.coverEditButton}
              testID="profile-cover-edit-button"
            >
              <Icon name="pencil-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {(displayedBadges.length > 0 || isOwnProfile) &&
          (isOwnProfile ? (
            <TouchableOpacity
              onPress={openBadgeModal}
              style={[
                styles.badgeRail,
                isSelfVariant ? styles.selfBadgeRail : null,
                isAddOnlyBadgeRail ? styles.badgeRailAddOnly : null,
                isSelfVariant && isAddOnlyBadgeRail ? styles.selfBadgeRailAddOnly : null,
              ]}
            >
              {!useCompactAddOnlyBadge
                ? displayedBadges
                    .slice(0, 3)
                    .map((badge) => (
                      <FastImage
                        key={badge._id}
                        source={{ uri: badge.badge }}
                        style={styles.badgeImage}
                        resizeMode={FastImage.resizeMode.contain}
                      />
                    ))
                : null}
              {badgeTrailingContent}
            </TouchableOpacity>
          ) : (
            <View style={[styles.badgeRail, isSelfVariant ? styles.selfBadgeRail : null]}>
              {displayedBadges.slice(0, 3).map((badge) => (
                <FastImage
                  key={badge._id}
                  source={{ uri: badge.badge }}
                  style={styles.badgeImage}
                  resizeMode={FastImage.resizeMode.contain}
                />
              ))}
            </View>
          ))}
      </View>

      <View style={styles.content}>
        {isSelfVariant ? (
          <View style={styles.selfHeroRow}>
            <View style={styles.selfHero}>
              {showSelfProfileMediaControls ? (
                <TouchableOpacity
                  accessibilityLabel="Edit profile photo"
                  activeOpacity={0.85}
                  onPress={() => {
                    handlePickAvatar().catch(() => undefined);
                  }}
                  style={styles.avatarEditButton}
                  testID="profile-avatar-edit-button"
                >
                  <View style={[styles.avatarWrap, styles.selfAvatarWrap]}>
                    {profileData.profileImage ? (
                      <FastImage
                        source={{ uri: profileData.profileImage }}
                        style={[styles.avatar, styles.selfAvatar]}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.selfAvatar, styles.avatarFallback]}>
                        <ProfileFill width={56} height={56} color={Colors.primarySapphire.brand} />
                      </View>
                    )}
                    <View pointerEvents="none" style={styles.avatarEditBadge}>
                      <Icon name="pencil-outline" size={16} color="#FFFFFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={[styles.avatarWrap, styles.selfAvatarWrap]}>
                  {profileData.profileImage ? (
                    <FastImage
                      source={{ uri: profileData.profileImage }}
                      style={[styles.avatar, styles.selfAvatar]}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.selfAvatar, styles.avatarFallback]}>
                      <ProfileFill width={56} height={56} color={Colors.primarySapphire.brand} />
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.selfActionRow}>
              <TouchableOpacity
                onPress={() => openEditProfile()}
                style={[styles.secondaryAction, styles.selfActionButton]}
              >
                <StyledText style={styles.secondaryActionText}>Edit Profile</StyledText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  handleShareProfile().catch(() => undefined);
                }}
                style={[styles.primaryAction, styles.selfActionButton]}
              >
                <StyledText style={styles.primaryActionText}>Share Profile</StyledText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.heroRow}>
            <View style={styles.avatarWrap}>
              {profileData.profileImage ? (
                <FastImage
                  source={{ uri: profileData.profileImage }}
                  style={styles.avatar}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <ProfileFill width={50} height={50} color={Colors.primarySapphire.brand} />
                </View>
              )}
            </View>

            <View style={styles.actionRow}>
              {isOwnProfile ? (
                <TouchableOpacity onPress={() => openEditProfile()} style={styles.ownProfileAction}>
                  <StyledText style={styles.primaryActionText}>Edit Profile</StyledText>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[
                      styles.secondaryAction,
                      profileData.allowDirectMessages === false && styles.disabledAction,
                    ]}
                    onPress={openDirectMessage}
                    disabled={profileData.allowDirectMessages === false}
                  >
                    <StyledText style={styles.secondaryActionText}>Message</StyledText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryAction, isConnected ? styles.connectedAction : null]}
                    onPress={() => {
                      if (isConnected) {
                        handleUnSubscribe?.(profileData._id);
                      } else {
                        handleSubscribe?.(profileData._id);
                      }
                    }}
                  >
                    <StyledText style={styles.primaryActionText}>
                      {isConnected ? 'Connected' : 'Connect'}
                    </StyledText>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        <View style={styles.identityBlock}>
          <View style={styles.nameRow}>
            <StyledText numberOfLines={2} style={styles.nameText}>
              {displayName}
            </StyledText>
            {profileData.influencerProfile?.influencerStatus === 'approved' ? (
              <Icon
                name="check-decagram"
                size={20}
                color={Colors.primarySapphire.brand}
                style={styles.verifiedIcon}
              />
            ) : null}
          </View>

          <View style={styles.subtitleRow}>
            {profileData.username ? (
              <StyledText style={styles.mutedText}>{`@${profileData.username}`}</StyledText>
            ) : null}
            {profileData.username && roleLabel ? (
              <StyledText style={styles.mutedText}> • </StyledText>
            ) : null}
            {roleLabel ? <StyledText style={styles.subtitleText}>{roleLabel}</StyledText> : null}
          </View>

          {profileData.bio ? (
            <StyledText style={styles.bioText}>{profileData.bio}</StyledText>
          ) : null}

          {(Boolean(
            profileData.profile?.location?.address && profileData.profile?.isLocationPublic
          ) ||
            Boolean(joinedLabel)) && (
            <View style={styles.inlineMetaRow}>
              {profileData.profile?.location?.address && profileData.profile?.isLocationPublic ? (
                <View style={styles.inlineMetaItem}>
                  <Location size={18} color={Colors.neutral.brand} />
                  <StyledText style={styles.inlineMetaText}>
                    {profileData.profile.location.address}
                  </StyledText>
                </View>
              ) : null}

              {joinedLabel ? (
                <View style={styles.inlineMetaItem}>
                  <Calendar size={18} color={Colors.neutral.brand} />
                  <StyledText style={styles.inlineMetaText}>Joined {joinedLabel}</StyledText>
                </View>
              ) : null}
            </View>
          )}

          <View style={styles.metaRow}>
            <ShieldTick size={18} color={Colors.neutral.brand} />
            <StyledText style={styles.metaLabel}>Profile</StyledText>
            <StyledText style={styles.metaSeparator}> • </StyledText>
            <StyledText style={styles.metaValue}>{typeLabel}</StyledText>
          </View>

          {profileData.profile?.churchType && profileData.profile?.isChurchTypePublic ? (
            <View style={styles.metaRow}>
              <HomeHashtag size={18} color={Colors.neutral.brand} />
              <StyledText style={styles.metaLabel}>Denomination</StyledText>
              <StyledText style={styles.metaSeparator}> • </StyledText>
              <StyledText style={styles.metaValue}>
                {profileData.profile.churchType}
                {profileData.profile.churchSubType ? ` - ${profileData.profile.churchSubType}` : ''}
              </StyledText>
            </View>
          ) : null}

          {profileData.website ? (
            <TouchableOpacity style={styles.metaRow} onPress={handleWebsitePress}>
              <Link21 size={18} color={Colors.neutral.brand} />
              <StyledText style={styles.websiteText}>{profileData.website}</StyledText>
            </TouchableOpacity>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <StyledText style={styles.statCount}>
                {formatCount(profileData.followerCount)}
              </StyledText>
              <StyledText style={styles.statLabel}>Connectors</StyledText>
            </View>
            <View style={styles.statItem}>
              <StyledText style={styles.statCount}>
                {formatCount(profileData.following?.length)}
              </StyledText>
              <StyledText style={styles.statLabel}>Connections</StyledText>
            </View>
          </View>
        </View>
      </View>

      <CustomModal
        modalVisible={requestModal}
        onclose={() => setRequestModal(false)}
        style={modalStyles.bottomView}
      >
        <View style={[modalStyles.content, { backgroundColor: colors.background }]}>
          <SafeAreaView style={{ flex: 1, width: '100%' }}>
            <StyledText style={styles.badgeModalTitle}>
              Select up to 3 badges you would like to display on your profile
            </StyledText>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.badgeSelectionGrid}>
                {(authState?.getBadgesData ?? []).map((badge: Badge) => {
                  const isSelected = selectedBadgeIds.includes(badge._id);

                  return (
                    <TouchableOpacity
                      key={badge._id}
                      onPress={() => handleToggleBadge(badge._id)}
                      style={styles.badgeSelectionItem}
                    >
                      <FastImage
                        source={{ uri: badge.badge }}
                        style={styles.badgeSelectionImage}
                        resizeMode={FastImage.resizeMode.contain}
                      />
                      {isSelected ? (
                        <View style={styles.selectedBadgeOverlay}>
                          <Selected />
                        </View>
                      ) : null}
                      <StyledText style={styles.badgeSelectionLabel}>{badge.title}</StyledText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity
              onPress={() => {
                dispatch(setUserBadges.Request({ token, badges: selectedBadgeIds }));
                setRequestModal(false);
              }}
              style={styles.badgeDoneButton}
            >
              <StyledText style={styles.badgeDoneButtonText}>Done</StyledText>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.x10,
    justifyContent: 'flex-end',
    marginLeft: spacing.x16,
  },
  avatar: {
    borderColor: '#FFFFFF',
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: borderWidth.base,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    alignItems: 'center',
    backgroundColor: Colors.primarySapphire.brand,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: borderWidth.base,
    bottom: 2,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 2,
    width: 30,
  },
  avatarEditButton: {
    alignSelf: 'flex-start',
  },
  avatarWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: AVATAR_SIZE / 2 + 4,
    padding: 4,
  },
  badgeAddButton: {
    alignItems: 'center',
    backgroundColor: Colors.primarySapphire.brand,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  badgeDoneButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary.brand,
    borderRadius: borderRadius.button,
    marginTop: spacing.x16,
    paddingVertical: spacing.x13,
  },
  badgeDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badgeImage: {
    borderRadius: borderRadius.max,
    height: 34,
    width: 34,
  },
  badgeModalTitle: {
    marginBottom: spacing.x16,
    textAlign: 'center',
  },
  badgeRail: {
    alignItems: 'center',
    backgroundColor: 'rgba(78, 78, 78, 0.78)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: borderWidth.hairline,
    borderRadius: 24,
    bottom: 14,
    flexDirection: 'row',
    gap: spacing.x8,
    paddingHorizontal: spacing.x8,
    paddingVertical: spacing.x8,
    position: 'absolute',
    right: spacing.x20,
  },
  badgeRailAddOnly: {
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.x8,
    paddingVertical: spacing.x8,
    width: 56,
  },
  badgeSelectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.x10,
    justifyContent: 'space-between',
  },
  badgeSelectionImage: {
    aspectRatio: 1,
    width: '80%',
  },
  badgeSelectionItem: {
    alignItems: 'center',
    marginBottom: spacing.x16,
    minWidth: '30%',
    width: '30%',
  },
  badgeSelectionLabel: {
    color: Colors.primary.brand,
    marginTop: spacing.x8,
    textAlign: 'center',
  },
  bioText: {
    color: Colors.neutral[200],
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.x8,
  },
  connectedAction: {
    backgroundColor: Colors.neutral[800],
  },
  container: {
    width: '100%',
  },
  coverEditButton: {
    alignItems: 'center',
    backgroundColor: Colors.primarySapphire.brand,
    borderColor: '#FFFFFF',
    borderRadius: 21,
    borderWidth: borderWidth.base,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.x16,
    top: spacing.x12,
    width: 42,
    zIndex: 2,
  },
  content: {
    paddingHorizontal: spacing.x20,
    paddingBottom: spacing.x20,
    paddingTop: spacing.x12,
  },
  coverFallback: {
    backgroundColor: Colors.neutral[600],
    height: COVER_HEIGHT,
    width: '100%',
  },
  coverImage: {
    height: COVER_HEIGHT,
    width: '100%',
  },
  coverWrap: {
    height: COVER_HEIGHT,
    position: 'relative',
  },
  headerSection: {
    position: 'relative',
  },
  disabledAction: {
    opacity: 0.45,
  },
  heroRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.x12,
    marginTop: -(AVATAR_SIZE / 2),
  },
  identityBlock: {
    gap: spacing.x12,
  },
  inlineMetaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.x8,
  },
  inlineMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.x12,
    marginTop: spacing.x2,
  },
  inlineMetaText: {
    color: Colors.neutral[300],
    fontSize: 13,
  },
  metaLabel: {
    ...Typography.body.x2M,
    fontSize: 14,
    lineHeight: 18,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.x8,
  },
  metaSeparator: {
    color: Colors.neutral[300],
  },
  metaValue: {
    fontSize: 14,
    lineHeight: 18,
  },
  mutedText: {
    color: Colors.neutral[300],
    fontSize: 14,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  nameText: {
    color: Colors.neutral.brand,
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  ownProfileAction: {
    alignItems: 'center',
    backgroundColor: Colors.primarySapphire.brand,
    borderRadius: borderRadius.button,
    justifyContent: 'center',
    minHeight: 46,
    minWidth: 164,
    paddingHorizontal: spacing.x20,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: Colors.primarySapphire.brand,
    borderRadius: borderRadius.button,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.x16,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: Colors.neutral[900],
    borderRadius: borderRadius.button,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.x16,
  },
  secondaryActionText: {
    color: Colors.neutral.brand,
    fontSize: 14,
    fontWeight: '500',
  },
  selfActionButton: {
    borderRadius: 22,
    flex: 0,
    minHeight: 42,
    paddingHorizontal: spacing.x12,
    width: '48%',
  },
  selfActionRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.x8,
    marginLeft: spacing.x16,
    marginRight: spacing.x2,
    marginTop: spacing.x8,
  },
  selfAvatar: {
    height: 96,
    width: 96,
  },
  selfAvatarWrap: {
    borderRadius: 52,
    marginTop: -48,
    padding: 5,
  },
  selfBadgeAddButton: {
    backgroundColor: Colors.primary.brand,
    height: 28,
    width: 28,
  },
  selfBadgeRail: {
    backgroundColor: 'rgba(3, 47, 60, 0.64)',
    bottom: spacing.x12,
    minHeight: 42,
    paddingHorizontal: spacing.x6,
    paddingVertical: spacing.x6,
    right: spacing.x16,
  },
  selfBadgeRailAddOnly: {
    alignItems: 'center',
    backgroundColor: 'rgba(53, 89, 99, 0.78)',
    borderRadius: 21,
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: 42,
  },
  selfHero: {
    alignItems: 'flex-start',
    marginBottom: spacing.x8,
  },
  selfHeroRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginBottom: spacing.x10,
  },
  selectedBadgeOverlay: {
    position: 'absolute',
    top: 4,
  },
  statCount: {
    color: Colors.neutral.brand,
    fontSize: 16,
    fontWeight: '700',
  },
  statItem: {
    gap: spacing.x4,
  },
  statLabel: {
    color: Colors.neutral[300],
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.x24,
    marginTop: spacing.x4,
  },
  subtitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subtitleText: {
    fontSize: 13,
  },
  verifiedIcon: {
    marginLeft: spacing.x8,
    marginTop: 1,
  },
  websiteText: {
    color: Colors.primarySapphire.brand,
    fontSize: 14,
    marginLeft: spacing.x8,
  },
});

export default ProfileHeader;
