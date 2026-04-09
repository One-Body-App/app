import { Edit, Setting2, ProfileAdd, Star1, UserRemove, LogoutCurve } from 'iconsax-react-native';
import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import FastImage from 'react-native-fast-image';
import Rate, { AndroidMarket } from 'react-native-rate';
import Feather from '@react-native-vector-icons/feather';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import AntDesignIcon from '@react-native-vector-icons/ant-design';
import { useDispatch } from 'react-redux';
import { CompositeNavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { MainDrawerParamsList, MyProfileStackParamsList } from '@/src/navigator/types';
import { User } from '@/utils/types';
import { spacing } from '@/src/styles/spacing';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { profileImageList } from '@/src/styles/items';
import { Colors, Typography } from '@/src/styles';
import StyledText from '@/components/styled/Text';
import Button from '@/components/Button';
import { NO_PROFILE_IMAGE, OpenURLButton } from '@/services/constants';
import { logout } from '@/src/redux/actions/AuthActions';
import CustomModal from '@/src/components/CustomModal';

const options = {
  AppleAppID: '1637542382',
  GooglePackageName: 'com.onebodyapp',
  AmazonPackageName: 'com.onebodyapp',
  // OtherAndroidURL: 'http://www.randomappstore.com/app/47172391',
  preferredAndroidMarket: AndroidMarket.Google,
  preferInApp: true,
  openAppStoreIfInAppFails: true,
  fallbackPlatformURL: 'https://www.onebodyapp.com',
};

type Props = {
  userData: User;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
};

function SettingsSheet({ setShowModal, showModal, userData }: Props) {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const navigation = useNavigation<
    | CompositeNavigationProp<
        StackNavigationProp<MyProfileStackParamsList, 'MyProfile'>,
        DrawerNavigationProp<MainDrawerParamsList, 'Main'>
      >
    | CompositeNavigationProp<
        StackNavigationProp<MyProfileStackParamsList, 'EditProfile'>,
        DrawerNavigationProp<MainDrawerParamsList, 'Main'>
      >
  >();

  return (
    <CustomModal
      // swipeDirection={['down']}
      // avoidKeyboard
      // backdropOpacity={0.3}
      modalVisible={showModal}
      onclose={() => setShowModal(false)}
      // style={styles.bottomView}
      style={{
        justifyContent: 'flex-end',
        margin: 0,
      }}
    >
      <View
        style={{
          padding: spacing.x24,
          borderTopRightRadius: borderRadius.large,
          borderTopLeftRadius: borderRadius.large,
          height: '100%',
          backgroundColor: colors.background,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            setShowModal(false);
          }}
          style={{ alignSelf: 'flex-end' }}
        >
          <MaterialCommunityIcons name="window-close" size={18} color={Colors.primary.brand} />
        </TouchableOpacity>
        <View
          style={{
            paddingHorizontal: spacing.x16,
            paddingVertical: spacing.x10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: Colors.neutral[900],
            borderWidth: borderWidth.thin,
            marginTop: spacing.x16,

            borderRadius: borderRadius.base,
            marginBottom: spacing.x24,
          }}
        >
          <FastImage
            resizeMode="contain"
            style={
              [
                profileImageList,
                { height: 40, width: 40, marginBottom: 0, alignSelf: 'flex-start' },
              ] as any
            }
            source={{ uri: userData?.profileImage || NO_PROFILE_IMAGE }}
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
              {userData?.name}
            </StyledText>
            <StyledText
              numberOfLines={1}
              style={[Typography.body.x1, { color: Colors.neutral[300] }]}
            >
              @{userData?.username}
            </StyledText>
          </View>
        </View>
        <ScrollView>
          <Button
            text="Edit Profile"
            leftIcon={
              <Edit color={Colors.neutral.brand} size={20} style={{ marginRight: spacing.x10 }} />
            }
            onPress={() => {
              navigation.navigate('EditProfile');
              setShowModal(false);
            }}
            btnStyle={{ marginBottom: spacing.x32 }}
          />
          <Button
            text="General Settings"
            leftIcon={
              <Setting2
                color={Colors.neutral.brand}
                size={20}
                style={{ marginRight: spacing.x10 }}
              />
            }
            onPress={() => {
              navigation.navigate('Settings');
              setShowModal(false);
            }}
            btnStyle={{ marginBottom: spacing.x32 }}
          />
          <Button
            text="Invite Your Friends"
            leftIcon={
              <ProfileAdd
                color={Colors.neutral.brand}
                size={20}
                style={{ marginRight: spacing.x10 }}
              />
            }
            onPress={() => {
              navigation.navigate('InviteFriends');
              setShowModal(false);
            }}
            btnStyle={{ marginBottom: spacing.x32 }}
          />
          {/* <Button
              text="Blocked Accounts"
              leftIcon={
                <ProfileAdd
                  color={Colors.neutral.brand}
                  size={20}
                  style={{ marginRight: spacing.x10 }}
                />
              }
              onPress={() => {}}
              btnStyle={{ marginBottom: spacing.x32 }}
            /> */}
          <Button
            text="Help & Support"
            leftIcon={
              <AntDesignIcon
                name="customer-service"
                color={Colors.neutral.brand}
                size={20}
                style={{ marginRight: spacing.x10 }}
              />
            }
            onPress={() => {
              OpenURLButton(
                'https://app.termly.io/policy-viewer/policy.html?policyUUID=84dd2dd3-ee3f-48f4-a92c-24b637820776'
              );
            }}
            btnStyle={{ marginBottom: spacing.x32 }}
          />
          <Button
            text="About Us"
            leftIcon={
              <Feather
                name="info"
                color={Colors.neutral.brand}
                size={20}
                style={{ marginRight: spacing.x10 }}
              />
            }
            onPress={() => {
              OpenURLButton('https://onebodyapp.com');
            }}
            btnStyle={{ marginBottom: spacing.x32 }}
          />
          <Button
            text="Rate Us"
            leftIcon={
              <Star1 color={Colors.neutral.brand} size={20} style={{ marginRight: spacing.x10 }} />
            }
            onPress={() => {
              Rate.rate(options, (success, errorMessage) => {
                if (errorMessage) {
                  // errorMessage comes from the native code. Useful for debugging, but probably not for users to view
                  console.error(`Example page Rate.rate() error: ${errorMessage}`);
                }
              });
            }}
            btnStyle={{ marginBottom: spacing.x32 }}
          />
          <Button
            text="Remove Account"
            onPress={() => {
              navigation.navigate('Settings', { screen: 'RemoveAccount' });
              setShowModal(false);
            }}
            btnStyle={{ marginBottom: spacing.x32 }}
            leftIcon={
              <UserRemove
                color={Colors.errorFeedback[200]}
                size={20}
                style={{ marginRight: spacing.x10 }}
              />
            }
            btnTextStyle={{ color: Colors.errorFeedback[200] }}
          />
          <Button
            text="Log out"
            onPress={() => {
              dispatch(logout());
            }}
            btnStyle={{ marginBottom: spacing.x32 }}
            leftIcon={
              <LogoutCurve
                color={Colors.errorFeedback[200]}
                size={20}
                style={{ marginRight: spacing.x10 }}
              />
            }
            btnTextStyle={{ color: Colors.errorFeedback[200] }}
          />
        </ScrollView>
      </View>
    </CustomModal>
  );
}

export default SettingsSheet;
