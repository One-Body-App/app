import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useProfileAvatarAnimation } from './useProfileAvatarAnimation';
import ProfileAvatarOverlay from './ProfileAvatarOverlay';

import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import SocialFlatlist from '../SocialFlatlist';
import BlogFlatlist from '../BlogFlatlist';
import WatchFlatlist from '../WatchFlatlist';
import ProfileHeader from './ProfileHeader';
import { ProfileProps, ProfileVariant } from './profileTypes';
import { getVisibleProfileTabs, ProfileTabKey } from './profileUtils';
import { useAvatarOverlayEligibility } from './avatarOverlayEligibility';
import {
  getRecentCompletedWatchUploadsSnapshot,
  subscribeRecentCompletedWatchUploads,
} from '@/src/services/recentCompletedWatchUploads';
import useMountEffect from '@/src/hooks/useMountEffect';

const TAB_LABELS: Record<ProfileTabKey, string> = {
  post: 'Post',
  social: 'Social',
  blog: 'Blog',
  watch: 'Watch',
};

type ProfileTabBarProps = {
  activeTab: ProfileTabKey;
  visibleTabs: ProfileTabKey[];
  onTabPress: (tab: ProfileTabKey) => void;
  variant: ProfileVariant;
};

function ProfileTabBar({ activeTab, onTabPress, visibleTabs, variant }: ProfileTabBarProps) {
  const { dark, colors } = useTheme();
  const isSelfVariant = variant === 'self';

  return (
    <View
      style={[
        styles.tabBarShell,
        isSelfVariant ? styles.selfTabBarShell : null,
        { backgroundColor: colors.background },
      ]}
    >
      <View
        style={[
          styles.tabBarRow,
          isSelfVariant
            ? styles.selfTabBarRow
            : {
                backgroundColor: colors.background,
                borderBottomColor: dark ? Colors.neutral[900] : Colors.neutral[800],
                borderTopColor: dark ? Colors.neutral[900] : Colors.neutral[800],
              },
        ]}
      >
        {visibleTabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <Pressable
              key={tab}
              onPress={() => onTabPress(tab)}
              style={[
                styles.tabButton,
                isSelfVariant ? styles.selfTabButton : null,
                isActive && !isSelfVariant
                  ? {
                      backgroundColor: dark ? Colors.neutral[900] : Colors.neutral[800],
                    }
                  : null,
              ]}
            >
              {isSelfVariant ? (
                <View style={styles.selfTabInner}>
                  <StyledText
                    style={[
                      styles.tabLabel,
                      { color: dark ? colors.text : Colors.primary.brand },
                      isActive ? styles.activeTabLabel : null,
                      styles.selfTabLabel,
                    ]}
                  >
                    {TAB_LABELS[tab]}
                  </StyledText>
                  <View
                    style={[
                      styles.selfTabIndicator,
                      isActive ? styles.selfTabIndicatorActive : null,
                    ]}
                  />
                </View>
              ) : (
                <StyledText
                  style={[
                    styles.tabLabel,
                    { color: dark ? colors.text : Colors.primary.brand },
                    isActive ? styles.activeTabLabel : null,
                  ]}
                >
                  {TAB_LABELS[tab]}
                </StyledText>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Profile({
  profileData,
  currentUser,
  relatedUsers,
  handleSubscribe,
  handleUnSubscribe,
  refreshToken = 0,
  variant = 'public',
  avatarExpansionEnabled = true,
}: ProfileProps) {
  const { colors } = useTheme();
  const avatarAnimation = useProfileAvatarAnimation();
  const canOpenAvatarOverlay = useAvatarOverlayEligibility(
    profileData.profileImage,
    avatarAnimation.expandedSize
  );
  const [recentCompletedWatchUploadsCount, setRecentCompletedWatchUploadsCount] = useState(
    getRecentCompletedWatchUploadsSnapshot().filter(
      (upload) => upload.ownerUserId === currentUser._id
    ).length
  );
  const visibleTabs = useMemo((): ProfileTabKey[] => {
    const baseTabs = getVisibleProfileTabs(profileData);
    if (variant === 'self' && recentCompletedWatchUploadsCount > 0 && !baseTabs.includes('watch')) {
      return [...baseTabs, 'watch'];
    }
    return baseTabs;
  }, [profileData, recentCompletedWatchUploadsCount, variant]);
  const initialTab = visibleTabs[0] ?? 'post';
  const [requestedTab, setRequestedTab] = useState<ProfileTabKey>(initialTab);
  const activeTab = visibleTabs.includes(requestedTab) ? requestedTab : initialTab;

  useMountEffect(() => {
    if (variant !== 'self') {
      return undefined;
    }

    return subscribeRecentCompletedWatchUploads((uploads) => {
      setRecentCompletedWatchUploadsCount(
        uploads.filter((upload) => upload.ownerUserId === currentUser._id).length
      );
    });
  });

  useEffect(() => {
    avatarAnimation.reset();

    return () => {
      avatarAnimation.reset();
    };
  }, [avatarAnimation, profileData._id, profileData.profileImage]);

  const showAvatarAnimation = variant !== 'self' && avatarExpansionEnabled && canOpenAvatarOverlay;

  const headerContent = (
    <>
      <ProfileHeader
        key={`${profileData._id}-${(profileData.badgesData ?? []).map((badge) => badge._id).join(',')}`}
        profileData={profileData}
        currentUser={currentUser}
        relatedUsers={relatedUsers}
        handleSubscribe={handleSubscribe}
        handleUnSubscribe={handleUnSubscribe}
        variant={variant}
        avatarAnimation={showAvatarAnimation ? avatarAnimation : undefined}
      />
      <ProfileTabBar
        activeTab={activeTab}
        onTabPress={setRequestedTab}
        visibleTabs={visibleTabs}
        variant={variant}
      />
    </>
  );
  const listKey = `${profileData._id}-${activeTab}-${refreshToken}`;

  const overlay = showAvatarAnimation ? (
    <ProfileAvatarOverlay imageUri={profileData.profileImage} animation={avatarAnimation} />
  ) : null;

  if (activeTab === 'social' && visibleTabs.includes('social')) {
    return (
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <SocialFlatlist
          key={listKey}
          headerItem={headerContent}
          userIdToPullData={profileData._id}
          socialType="instagram"
          emptyText="No social posts yet"
        />
        {overlay}
      </View>
    );
  }

  if (activeTab === 'blog' && visibleTabs.includes('blog')) {
    return (
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <BlogFlatlist
          key={listKey}
          headerItem={headerContent}
          userId={profileData._id}
          emptyText="No blog posts yet"
        />
        {overlay}
      </View>
    );
  }

  if (activeTab === 'watch' && visibleTabs.includes('watch')) {
    return (
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <WatchFlatlist
          key={listKey}
          headerItem={headerContent}
          userId={profileData._id}
          emptyText="No watch posts yet"
        />
        {overlay}
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <SocialFlatlist
        key={listKey}
        headerItem={headerContent}
        userIdToPullData={profileData._id}
        socialType="onebody"
        emptyText="No social posts to display"
      />
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  activeTabLabel: {
    color: Colors.primarySapphire.brand,
  },
  selfTabBarRow: {
    borderBottomColor: Colors.neutral[800],
    borderBottomWidth: borderWidth.thin,
    flexDirection: 'row',
    paddingHorizontal: spacing.x20,
  },
  selfTabBarShell: {
    marginBottom: spacing.x12,
    marginTop: spacing.x4,
  },
  selfTabButton: {
    borderRadius: 0,
    paddingHorizontal: spacing.x4,
    paddingVertical: spacing.x10,
  },
  selfTabIndicator: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.max,
    height: 3,
    marginTop: spacing.x8,
    minWidth: 28,
    width: '100%',
  },
  selfTabIndicatorActive: {
    backgroundColor: Colors.primarySapphire.brand,
  },
  selfTabInner: {
    alignItems: 'center',
    paddingHorizontal: spacing.x6,
  },
  selfTabLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  tabBarRow: {
    borderBottomColor: Colors.neutral[800],
    borderBottomWidth: borderWidth.thin,
    borderTopColor: Colors.neutral[800],
    borderTopWidth: borderWidth.thin,
    flexDirection: 'row',
    gap: spacing.x8,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x10,
  },
  tabBarShell: {},
  tabButton: {
    alignItems: 'center',
    borderRadius: borderRadius.button,
    flex: 1,
    paddingHorizontal: spacing.x10,
    paddingVertical: spacing.x10,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Profile;
