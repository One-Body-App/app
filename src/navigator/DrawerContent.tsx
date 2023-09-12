import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useSelector } from 'react-redux';
import { RootState } from '../Redux/reducers/rootReducer';
import { NO_PROFILE_IMAGE } from '../Services/constants';
import { StyledText } from '../components/styled/Text';
import Button from '../components/Button';
import FastImage from 'react-native-fast-image';
import { spacing } from '../styles/spacing';
import { profileImageList } from '../styles/items';
import { Colors, Typography } from '../styles';
import { borderRadius, borderWidth } from '../styles/outlines';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DrawerContent({
  descriptors,
  state,
  ...rest
}: DrawerContentComponentProps) {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const focusedOptions = focusedDescriptor.options;

  const { drawerContentStyle, drawerContentContainerStyle } = focusedOptions;
  const insets = useSafeAreaInsets();

  return (
    <DrawerContentScrollView
      {...rest}
      contentContainerStyle={[
        drawerContentContainerStyle,
        { paddingBottom: insets.bottom, flexGrow: 1 },
      ]}
      style={drawerContentStyle}
    >
      <View style={styles.drawerContent}>
        <View>
          <TouchableOpacity
            style={{
              paddingHorizontal: spacing.x16,
              paddingVertical: spacing.x10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderColor: Colors.neutral[900],
              borderWidth: borderWidth.thin,
              margin: spacing.x16,
              flex: 1,
              borderRadius: borderRadius.base,
            }}
          >
            <FastImage
              resizeMode="contain"
              style={[
                profileImageList,
                { height: 40, width: 40, marginBottom: 0, alignSelf: 'flex-start' },
              ]}
              source={{ uri: user?.profileImage || NO_PROFILE_IMAGE }}
            />

            <View
              style={{
                flex: 1,

                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}
            >
              <StyledText
                numberOfLines={1}
                style={[Typography.body.x2M, { color: Colors.neutral.brand }]}
              >
                {user?.name}
              </StyledText>
              <StyledText
                numberOfLines={1}
                style={[Typography.body.x1, { color: Colors.neutral[300] }]}
              >
                @{user?.username}
              </StyledText>

              <View>
                <View style={{ flexDirection: 'row', marginTop: spacing.x8 }}>
                  <StyledText style={[Typography.body.x1M, { color: Colors.neutral.brand }]}>
                    {user?.following.length}{' '}
                  </StyledText>
                  <StyledText style={[Typography.body.x1, { color: Colors.neutral[300] }]}>
                    Connectors
                  </StyledText>
                </View>
                {user?.followerCount && user?.followerCount > 0 ? (
                  <View style={{ flexDirection: 'row' }}>
                    <StyledText style={[Typography.body.x1M, { color: Colors.neutral.brand }]}>
                      200{' '}
                    </StyledText>
                    <StyledText style={[Typography.body.x1, { color: Colors.neutral[300] }]}>
                      Connections
                    </StyledText>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
          <DrawerItemList descriptors={descriptors} state={state} {...rest} />
        </View>
        <View
          style={{
            borderTopColor: Colors.neutral[800],
            borderTopWidth: borderWidth.base,
            paddingHorizontal: spacing.x16,
          }}
        >
          <StyledText>test</StyledText>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },

  userInfoSection: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginTop: 20,
    flex: 1,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
  },
  row: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  paragraph: {
    fontWeight: 'bold',
    marginRight: 3,
  },
  drawerSection: {
    marginTop: 15,
  },
  preference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
