import Button from '@/src/components/Button';
import { StyledText } from '@/src/components/styled/Text';
import { Buttons, Colors, Spacing, Typography } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { AccountType } from '@/utils/types';
import { useTheme } from '@react-navigation/native';
import { ReactElement, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Modal from 'react-native-modal';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = {
  children: ReactElement;
  onPress: () => void;
  buttonText: string;
  reasonText?: ReactElement;
  onboardingType: AccountType;
  activeStep: number;
  disabled?: boolean;
};

const indicatorStyle: ViewStyle = {
  backgroundColor: Colors.secondary.brand,
  height: 8,
  flex: 1,
  marginHorizontal: 5,
  borderRadius: borderRadius.base,
  opacity: 0.2,
};

const OnboardingStepsLayout = ({
  children,
  onPress,
  buttonText,
  onboardingType,
  activeStep,
  disabled,
  reasonText,
}: Props) => {
  const { colors, dark } = useTheme();
  const [showModal, setShowModal] = useState<boolean>(false);
  return (
    <SafeAreaView
      style={{
        flex: 1,
        marginHorizontal: spacing.x24,
        marginBottom: Platform.OS == 'android' ? spacing.x24 : 0,
      }}
    >
      <View style={{ marginTop: spacing.x10 }}>
        {onboardingType == AccountType.individual ? (
          <View style={{ flexDirection: 'row' }}>
            <View
              style={[
                indicatorStyle,
                { marginHorizontal: 0 },
                activeStep >= 1 ? { opacity: 1 } : null,
              ]}
            ></View>
            <View style={[indicatorStyle, activeStep >= 2 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 3 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 4 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 5 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 6 ? { opacity: 1 } : null]}></View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row' }}>
            <View style={[indicatorStyle, activeStep >= 1 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 2 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 3 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 4 ? { opacity: 1 } : null]}></View>
            <View style={[indicatorStyle, activeStep >= 5 ? { opacity: 1 } : null]}></View>
          </View>
        )}
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={{ flex: 1 }}>{children}</ScrollView>
      </KeyboardAvoidingView>

      <View style={{ justifyContent: 'center' }}>
        {reasonText ? (
          <Button
            text="Why are we asking this?"
            onPress={() => {
              setShowModal(true);
            }}
            btnStyle={{ ...Buttons.buttonText, marginBottom: spacing.x16, flex: 1 }}
            btnTextStyle={{ ...Typography.body.x1, color: Colors.primarySapphire[500] }}
          />
        ) : null}

        <Button
          text={buttonText}
          disabled={disabled}
          btnStyle={[
            button.primary,
            {
              flex: 1,
            },
          ]}
          disabledBtnStyle={[
            button.primary,
            {
              flex: 1,
              opacity: 0.4,
            },
          ]}
          onPress={() => {
            onPress();
          }}
          btnTextStyle={{ color: '#FFF' }}
          disabledBtnTextStyle={{ color: '#FFF' }}
        />
      </View>

      <Modal
        backdropOpacity={0.3}
        isVisible={showModal}
        onBackdropPress={() => setShowModal(false)}
        onSwipeComplete={() => setShowModal(false)}
        swipeDirection={['down']}
        style={{ justifyContent: 'flex-end', margin: 0 }}
        propagateSwipe
      >
        <View
          style={{
            backgroundColor: colors.background,

            padding: spacing.x16,
            borderTopRightRadius: borderRadius.base,
            borderTopLeftRadius: borderRadius.base,
            height: '40%',
          }}
        >
          <View style={{ flex: 1, flexGrow: 1 }}>
            <View
              style={{
                alignItems: 'flex-end',
                marginBottom: spacing.x10,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  // setModalVisible(false);
                  setShowModal(false);
                  // setModalVisible(false);
                }}
              >
                <MaterialCommunityIcons
                  name="window-close"
                  size={24}
                  color={Colors.primary.brand}
                />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ flex: 1 }}>{reasonText}</ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
export default OnboardingStepsLayout;
