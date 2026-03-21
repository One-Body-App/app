import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { Colors } from '@/src/styles';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import { User } from '@/utils/types';
import SocialFlatlist from '../SocialFlatlist';
import BlogFlatlist from '../BlogFlatlist';
import WatchFlatlist from '../WatchFlatlist';
import ProfileHeader from './ProfileHeader';
import { getVisibleProfileTabs, ProfileTabKey } from './profileUtils';

export interface ProfileProps {
  profileData: User;
  currentUser: User;
  relatedUsers?: User[];
  handleSubscribe?: Function;
  handleUnSubscribe?: Function;
  refreshToken?: number;
}

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
};

function ProfileTabBar({ activeTab, onTabPress, visibleTabs }: ProfileTabBarProps) {
  return (
    <View style={styles.tabBarShell}>
      <View style={styles.tabBarRow}>
        {visibleTabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <Pressable
              key={tab}
              onPress={() => onTabPress(tab)}
              style={[styles.tabButton, isActive ? styles.activeTabButton : null]}
            >
              <StyledText style={[styles.tabLabel, isActive ? styles.activeTabLabel : null]}>
                {TAB_LABELS[tab]}
              </StyledText>
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
}: ProfileProps) {
  const { colors } = useTheme();
  const visibleTabs = useMemo(() => getVisibleProfileTabs(profileData), [profileData]);
  const initialTab = visibleTabs[0] ?? 'post';
  const [requestedTab, setRequestedTab] = useState<ProfileTabKey>(initialTab);
  const activeTab = visibleTabs.includes(requestedTab) ? requestedTab : initialTab;
  const headerContent = (
    <>
      <ProfileHeader
        key={`${profileData._id}-${(profileData.badgesData ?? []).map((badge) => badge._id).join(',')}`}
        profileData={profileData}
        currentUser={currentUser}
        relatedUsers={relatedUsers}
        handleSubscribe={handleSubscribe}
        handleUnSubscribe={handleUnSubscribe}
      />
      <ProfileTabBar activeTab={activeTab} onTabPress={setRequestedTab} visibleTabs={visibleTabs} />
    </>
  );
  const listKey = `${profileData._id}-${activeTab}-${refreshToken}`;

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
        emptyText="No posts yet"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  activeTabButton: {
    backgroundColor: Colors.neutral[800],
  },
  activeTabLabel: {
    color: Colors.primarySapphire.brand,
  },
  tabBarRow: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: Colors.neutral[800],
    borderBottomWidth: borderWidth.thin,
    borderTopColor: Colors.neutral[800],
    borderTopWidth: borderWidth.thin,
    flexDirection: 'row',
    gap: spacing.x8,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x10,
  },
  tabBarShell: {
    backgroundColor: '#FFFFFF',
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: borderRadius.button,
    flex: 1,
    paddingHorizontal: spacing.x10,
    paddingVertical: spacing.x10,
  },
  tabLabel: {
    color: Colors.primary.brand,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Profile;
