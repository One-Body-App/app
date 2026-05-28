import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { Alert, StyleSheet, Pressable, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoutCurve, ProfileAdd, Profile2User, Setting2 } from 'iconsax-react-native';
import Icon from '@react-native-vector-icons/ant-design';
import Feather from '@react-native-vector-icons/feather';
import { useTheme } from '@react-navigation/native';
import { RootState } from '../redux/reducers/rootReducer';
import { NO_PROFILE_IMAGE, OpenURLButton } from '@/services/constants';
import StyledText from '../components/styled/Text';
import Button from '../components/Button';
import { spacing } from '../styles/spacing';
import { profileImageList } from '../styles/items';
import * as Colors from '../styles/colors';
import * as Typography from '../styles/typography';
import { borderRadius, borderWidth } from '../styles/outlines';
import { logout } from '../redux/actions/AuthActions';
import { getCreatorMenuLabel, getCreatorMenuState } from '../utils/creatorApplication';
import { isZoeAiEligibleUser } from '../utils/zoeAccess';
import Home2Icon from '@/assets/icons/home2.svg';
import ZoeIcon from '@/assets/svg/zoeicon.svg';
import BusinessUserCurriculumIcon from '@/assets/svg/Business-User-Curriculum--Streamline-Core-Remix.svg';
import CalendarEditIcon from '@/assets/svg/Calendar-Edit--Streamline-Core-Remix.svg';

export default function DrawerContent({
  descriptors,
  state: drawerState,
  navigation,
}: DrawerContentComponentProps) {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const focusedRoute = drawerState.routes[drawerState.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const focusedOptions = focusedDescriptor.options;

  const { drawerContentStyle, drawerContentContainerStyle } = focusedOptions;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { dark, colors } = useTheme();
  const creatorStatus = user?.influencerProfile?.influencerStatus;
  const creatorMenuState = getCreatorMenuState(creatorStatus);
  const creatorMenuLabel = getCreatorMenuLabel(creatorStatus);
  const canAccessZoeAi = isZoeAiEligibleUser(user);

  return (
    <DrawerContentScrollView
      contentContainerStyle={[
        drawerContentContainerStyle,
        {
          paddingBottom: insets.bottom,
          flexGrow: 1,
          // backgroundColor: dark ? undefined : colors.background,
        },
      ]}
      style={[{ backgroundColor: dark ? undefined : colors.background }, drawerContentStyle]}
    >
      <View style={styles.drawerContent}>
        <View>
          <Pressable
            onPress={() => {
              navigation.navigate('Main', {
                screen: 'MyProfileTab',
                params: { screen: 'MyProfile' },
              });
            }}
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
                style={[Typography.body.x2M, { color: dark ? '#f6f6f7' : '#032f3c' }]}
              >
                {user?.name}
              </StyledText>
              <StyledText
                numberOfLines={1}
                style={[Typography.body.x1, { color: Colors.neutral[300] }]}
                // style={[Typography.body.x1, { color: dark ? colors.text : Colors.neutral[300] }]}
              >
                @{user?.username}
              </StyledText>

              <View>
                <View style={{ flexDirection: 'row', marginTop: spacing.x8 }}>
                  <StyledText
                    style={[Typography.body.x1M, { color: dark ? '#f6f6f7' : '#032f3c' }]}
                  >
                    {user?.followerCount ?? 0}{' '}
                  </StyledText>
                  <StyledText style={[Typography.body.x1, { color: Colors.neutral[300] }]}>
                    Connectors
                  </StyledText>
                </View>

                <View style={{ flexDirection: 'row' }}>
                  <StyledText
                    style={[Typography.body.x1M, { color: dark ? '#f6f6f7' : '#032f3c' }]}
                  >
                    {user?.following?.length ?? 0}{' '}
                  </StyledText>
                  <StyledText style={[Typography.body.x1, { color: Colors.neutral[300] }]}>
                    Connected
                  </StyledText>
                </View>
              </View>
            </View>
          </Pressable>
          <DrawerItem
            label="Home"
            focused={focusedRoute.name === 'Main'}
            onPress={() => navigation.navigate('Main')}
            icon={({ color, size }) => <Home2Icon width={size} height={size} color={color} />}
            activeTintColor={focusedOptions.drawerActiveTintColor}
            inactiveTintColor={focusedOptions.drawerInactiveTintColor ?? Colors.neutral.brand}
            activeBackgroundColor={focusedOptions.drawerActiveBackgroundColor}
            inactiveBackgroundColor="transparent"
            labelStyle={Typography.body.x2M}
            style={{ borderRadius: borderRadius.base }}
          />
          <DrawerItem
            label="Serve"
            focused={false}
            onPress={() =>
              navigation.navigate('Main', {
                screen: 'ConnectTab',
                params: { screen: 'ConnectPortal', params: { initialTab: 'Serve' } },
              })
            }
            icon={({ color, size }) => (
              <BusinessUserCurriculumIcon width={size - 4} height={size - 4} color={color} />
            )}
            activeTintColor={focusedOptions.drawerActiveTintColor}
            inactiveTintColor={focusedOptions.drawerInactiveTintColor ?? Colors.neutral.brand}
            activeBackgroundColor={focusedOptions.drawerActiveBackgroundColor}
            inactiveBackgroundColor="transparent"
            labelStyle={Typography.body.x2M}
            style={{ borderRadius: borderRadius.base }}
          />
          <DrawerItem
            label="Go!"
            focused={false}
            onPress={() =>
              navigation.navigate('Main', {
                screen: 'ConnectTab',
                params: { screen: 'ConnectPortal', params: { initialTab: 'Go!' } },
              })
            }
            icon={({ color, size }) => (
              <CalendarEditIcon width={size - 4} height={size - 4} color={color} />
            )}
            activeTintColor={focusedOptions.drawerActiveTintColor}
            inactiveTintColor={focusedOptions.drawerInactiveTintColor ?? Colors.neutral.brand}
            activeBackgroundColor={focusedOptions.drawerActiveBackgroundColor}
            inactiveBackgroundColor="transparent"
            labelStyle={[Typography.body.x2M, { fontStyle: 'italic' }]}
            style={{ borderRadius: borderRadius.base }}
          />
          {canAccessZoeAi ? (
            <DrawerItem
              label="ZoeAI"
              focused={focusedRoute.name === 'ZoeAI'}
              onPress={() => navigation.navigate('ZoeAI')}
              icon={({ color, size }) => <ZoeIcon width={size} height={size} color={color} />}
              activeTintColor={focusedOptions.drawerActiveTintColor}
              inactiveTintColor={focusedOptions.drawerInactiveTintColor ?? Colors.neutral.brand}
              activeBackgroundColor={focusedOptions.drawerActiveBackgroundColor}
              inactiveBackgroundColor="transparent"
              labelStyle={Typography.body.x2M}
              style={{ borderRadius: borderRadius.base }}
            />
          ) : null}
          <DrawerItem
            label="My Connections"
            focused={focusedRoute.name === 'Connections'}
            onPress={() => navigation.navigate('Connections')}
            icon={({ color, size }) => <Profile2User size={size} color={color} />}
            activeTintColor={focusedOptions.drawerActiveTintColor}
            inactiveTintColor={focusedOptions.drawerInactiveTintColor ?? Colors.neutral.brand}
            activeBackgroundColor={focusedOptions.drawerActiveBackgroundColor}
            inactiveBackgroundColor="transparent"
            labelStyle={Typography.body.x2M}
            style={{ borderRadius: borderRadius.base }}
          />
          <DrawerItem
            label="Saved Posts"
            focused={focusedRoute.name === 'Saved'}
            onPress={() => navigation.navigate('Saved')}
            icon={({ color, size }) => <Feather name="bookmark" size={size} color={color} />}
            activeTintColor={focusedOptions.drawerActiveTintColor}
            inactiveTintColor={focusedOptions.drawerInactiveTintColor ?? Colors.neutral.brand}
            activeBackgroundColor={focusedOptions.drawerActiveBackgroundColor}
            inactiveBackgroundColor="transparent"
            labelStyle={Typography.body.x2M}
            style={{ borderRadius: borderRadius.base }}
          />
          <DrawerItem
            label={creatorMenuLabel}
            focused={false}
            onPress={() => {
              navigation.navigate('Settings', {
                screen:
                  creatorMenuState === 'settings' ? 'InfluencerSettings' : 'InfluencerStepOne',
              });
            }}
            icon={({ color, size }) =>
              creatorMenuState === 'settings' ? (
                <Setting2 size={size} color={color} />
              ) : (
                <ProfileAdd size={size} color={color} />
              )
            }
            activeTintColor={focusedOptions.drawerActiveTintColor}
            inactiveTintColor={focusedOptions.drawerInactiveTintColor ?? Colors.neutral.brand}
            activeBackgroundColor={focusedOptions.drawerActiveBackgroundColor}
            inactiveBackgroundColor="transparent"
            labelStyle={Typography.body.x2M}
            style={{ borderRadius: borderRadius.base }}
          />
        </View>
        <View
          style={{
            // borderTopColor: Colors.neutral[800],
            // borderTopWidth: borderWidth.base,
            borderTopColor: colors.border, // Colors.neutral[900],
            borderTopWidth: borderWidth.thin,
            paddingHorizontal: spacing.x16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: spacing.x16,
          }}
        >
          <Button
            text=""
            btnStyle={{
              backgroundColor: Colors.neutral[700],
              padding: spacing.x16,
              borderRadius: borderRadius.base,
              width: 50,
            }}
            leftIcon={<LogoutCurve size={24} color={Colors.primary.brand} />}
            onPress={() => {
              Alert.alert(
                'Signing Out',
                'Are you sure you want to sign out?',
                [
                  {
                    text: 'Cancel',

                    style: 'cancel',
                    isPreferred: true,
                  },
                  {
                    text: 'Yes',
                    onPress: () => {
                      dispatch(logout());
                    },
                  },
                ],
                {
                  cancelable: true,
                }
              );
            }}
          />
          <Button
            text=""
            btnStyle={{
              backgroundColor:
                drawerState.routeNames[drawerState.index] === 'Settings'
                  ? focusedOptions.drawerActiveBackgroundColor
                  : Colors.neutral[700],

              padding: spacing.x16,
              borderRadius: borderRadius.base,
            }}
            leftIcon={<Setting2 size={24} color={dark ? '#f6f6f7' : '#032f3c'} />}
            onPress={() => {
              navigation.navigate('Settings');
            }}
          />
          <Button
            text=""
            btnStyle={{
              backgroundColor: Colors.neutral[700],
              padding: spacing.x16,
              borderRadius: borderRadius.base,
            }}
            leftIcon={
              <Icon name="customer-service" size={25} color={dark ? '#f6f6f7' : '#032f3c'} />
            }
            onPress={() => {
              OpenURLButton('https://onebody.tawk.help/');
            }}
          />
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
