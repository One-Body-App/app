import { StyleSheet, Platform } from 'react-native';
import { Colors } from '../../styles';
import { borderWidth } from '../../styles/outlines';
import { spacing } from '../../styles/spacing';

import { AccountType, Badge, RefreshListRef, User } from '@/utils/types';
import BlogFlatlist from '../BlogFlatlist';
import SocialFlatlist from '../SocialFlatlist';

type Route = {
  key: string;
  title: string;
};

export interface ProfileProps {
  profileData: User;
  currentUser: User;
  relatedUsers?: User[];
  handleSubscribe?: Function;
  handleUnSubscribe?: Function;
  refreshContent?: boolean;
  setRefreshContent?: Function;
}

export const profileImagesize = 80;
export const HEADER_EXPANDED_HEIGHT = 550;
export const HEADER_COLLAPSED_HEIGHT = 190;

import { Tabs } from 'react-native-collapsible-tab-view';
import { createRef, useEffect } from 'react';
import ProfileHeader from './ProfileHeader';
import { useTheme } from '@react-navigation/native';

const Profile = ({
  profileData,
  currentUser,
  relatedUsers,
  handleSubscribe,
  handleUnSubscribe,
  refreshContent,
  setRefreshContent,
}: ProfileProps) => {
  const socialList = createRef<RefreshListRef>();

  useEffect(() => {
    if (refreshContent && setRefreshContent) {
      setRefreshContent(false);
      socialList.current?.setRefreshing();
    }
  }, [refreshContent]);

  const onlyOneTab =
    profileData?.influencerProfile?.influencerStatus != 'approved' ||
    !profileData?.influencerProfile?.rssUrl;

  const { colors } = useTheme();

  return (
    <Tabs.Container
      lazy
      renderHeader={(props) => {
        return (
          <ProfileHeader
            profileData={profileData}
            currentUser={currentUser}
            relatedUsers={relatedUsers}
            handleSubscribe={handleSubscribe}
            handleUnSubscribe={handleUnSubscribe}
            {...props}
          />
        );
      }}
      minHeaderHeight={HEADER_COLLAPSED_HEIGHT}
      headerContainerStyle={{
        backgroundColor: colors.card,
        shadowOffset: {
          width: 0,
          height: onlyOneTab ? 0 : 2,
        },
        shadowOpacity: onlyOneTab ? 0 : 0.23,
        shadowRadius: 2.62,
        borderBottomWidth: Platform.OS == 'ios' ? borderWidth.thin : 0,
        borderBottomColor: Platform.OS == 'ios' ? Colors.neutral[800] : undefined,
        // paddingBottom: onlyOneTab ? spacing.x10 : undefined,
      }}
      renderTabBar={onlyOneTab ? () => null : undefined}
    >
      <Tabs.Tab name="social" label="Social">
        <SocialFlatlist ref={socialList} userIdToPullData={profileData._id} />
      </Tabs.Tab>

      {profileData?.influencerProfile?.influencerStatus == 'approved' &&
      profileData?.influencerProfile?.rssUrl ? (
        <Tabs.Tab name="blog" label="Blog/News">
          <BlogFlatlist userId={profileData._id} />
        </Tabs.Tab>
      ) : null}
    </Tabs.Container>
  );
};

const styles = StyleSheet.create({
  bottomView: {
    justifyContent: 'flex-end',
    margin: 0,
  },

  content2: {
    // backgroundColor: 'white',
    alignItems: 'center',
    padding: 13,
    borderTopRightRadius: 17,
    borderTopLeftRadius: 17,
    // height: getHeight(70),
    flex: 1,
  },
});

export default Profile;
