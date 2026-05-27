import React, { useRef } from 'react';
import { View, Pressable, ScrollView, Platform, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import { Link1 } from 'iconsax-react-native';
import { ShareAndroid, ShareIos } from 'iconoir-react-native';
// import Clipboard from '@react-native-clipboard/clipboard';
import { useToast } from 'react-native-toast-notifications';
import { styles } from './styles';

import { Colors } from '@/src/styles';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import { fontSize } from '@/src/styles/typography';
import { borderRadius, borderWidth } from '@/src/styles/outlines';
import { NO_PROFILE_IMAGE } from '@/services/constants';
import CustomClipboard, { CustomClipboardHandle } from '@/src/components/CustomClipboard';

function InviteFriend() {
  const { dark, colors } = useTheme();
  const clipboardRef = useRef<CustomClipboardHandle>(null);
  const userProfile = useSelector((state: RootState) => state.auth.getProfileData);
  const shareUrl = `https://www.onebodyapp.com/?u=${userProfile?.userId}`;

  const toast = useToast();
  return (
    <>
      <CustomClipboard ref={clipboardRef} />

      <LinearGradient
        colors={dark ? [colors.background] : ['#12D2D9', '#126B87']}
        style={{ flex: 1, paddingTop: spacing.x88 }}
      >
        <ScrollView style={styles.container}>
          <View style={[styles.innerContainer, { backgroundColor: colors.card }]}>
            <View
              style={{
                borderColor: 'white',
                borderWidth: borderWidth.base,
                position: 'absolute',
                borderRadius: borderRadius.max,
                backgroundColor: 'white',
                top: -30,
              }}
            >
              <FastImage
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: borderRadius.max,
                }}
                source={{
                  uri: userProfile?.profileImage ? userProfile?.profileImage : NO_PROFILE_IMAGE,
                }}
                resizeMode={FastImage.resizeMode.stretch}
              />
            </View>
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: spacing.x24,
                marginTop: spacing.x16,
              }}
            >
              <StyledText style={[fontSize.x2, { color: colors.text, textAlign: 'center' }]}>
                {userProfile?.name}
              </StyledText>
              <StyledText style={[fontSize.x2, { color: colors.text, textAlign: 'center' }]}>
                Invites You to join them on One Body
              </StyledText>
              <StyledText
                style={[fontSize.x1, { color: Colors.neutral[300], textAlign: 'center' }]}
              >
                Scan QR Code to signup for an account
              </StyledText>
            </View>
            <QRCode
              size={200}
              value={shareUrl}
              logo={
                dark
                  ? // eslint-disable-next-line global-require
                    require('@/assets/images/logo_header_white.png')
                  : // eslint-disable-next-line global-require
                    require('@/assets/images/logo.png')
              }
              logoSize={30}
              logoMargin={5}
              color={dark ? colors.text : Colors.primarySapphire.brand}
              backgroundColor={colors.card}
              logoBackgroundColor={colors.card}
            />
          </View>

          <View
            style={[
              styles.innerContainer,
              {
                marginTop: spacing.x24,
                backgroundColor: colors.card,
                flexDirection: 'row',
                marginBottom: spacing.x32,
              },
            ]}
          >
            <Pressable
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                // Clipboard.setString(shareUrl);
                clipboardRef.current?.copy(shareUrl || '');
                toast.show('Link copied to the clipboard', {
                  placement: 'bottom',
                });
              }}
            >
              <View
                style={{
                  padding: spacing.x20,
                  borderColor: Colors.neutral[800],
                  borderWidth: borderWidth.base,
                  borderRadius: borderRadius.max,
                  marginBottom: spacing.x10,
                }}
              >
                <Link1 color={Colors.neutral[300]} />
              </View>
              <StyledText style={{ textAlign: 'center' }}>Copy invite link</StyledText>
            </Pressable>
            <Pressable
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={async () => {
                await Share.share({
                  title: `${userProfile?.name} invites You to join them on One Body`,
                  url: Platform.OS === 'ios' && shareUrl ? shareUrl : '',
                  message: Platform.OS === 'android' && shareUrl ? shareUrl : '',
                });
              }}
            >
              <View
                style={{
                  padding: spacing.x20,
                  borderColor: Colors.neutral[800],
                  borderWidth: borderWidth.base,
                  borderRadius: borderRadius.max,
                  marginBottom: spacing.x10,
                }}
              >
                {Platform.OS === 'android' ? (
                  <ShareAndroid color={Colors.neutral[300]} height={25} width={25} />
                ) : (
                  <ShareIos color={Colors.neutral[300]} height={25} width={25} />
                )}
              </View>
              <StyledText style={{ textAlign: 'center' }}>Share invite link</StyledText>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}
export default InviteFriend;
