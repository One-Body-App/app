import { useTheme } from '@react-navigation/native';
import { ReactElement, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from '@/components/Button';
import StyledText from '@/components/styled/Text';
import { Buttons, Colors, Typography } from '@/src/styles';
import { button } from '@/src/styles/buttons';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { header } from '@/src/styles/typography';
import { AccountType } from '@/utils/types';
import CustomModal from '@/src/components/CustomModal';

type Props = {
  children: ReactElement;
  onPress: () => void;
  buttonText: string;
  reasonText?: ReactElement;
  onboardingType: AccountType;
  activeStep: number;
  disabled?: boolean;
  loading?: boolean;
  dontUseScrollView?: boolean;
};

const indicatorStyle: ViewStyle = {
  backgroundColor: Colors.secondary.brand,
  height: 8,
  flex: 1,
  marginHorizontal: 5,
  borderRadius: borderRadius.base,
  opacity: 0.2,
};

function OnboardingStepsLayout({
  children,
  onPress,
  buttonText,
  onboardingType,
  activeStep,
  disabled,
  reasonText,
  dontUseScrollView,
  loading,
}: Props) {
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
            />
            <View style={[indicatorStyle, activeStep >= 2 ? { opacity: 1 } : null]} />
            <View style={[indicatorStyle, activeStep >= 3 ? { opacity: 1 } : null]} />
            <View style={[indicatorStyle, activeStep >= 4 ? { opacity: 1 } : null]} />
            <View style={[indicatorStyle, activeStep >= 5 ? { opacity: 1 } : null]} />
            <View style={[indicatorStyle, activeStep >= 6 ? { opacity: 1 } : null]} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row' }}>
            <View style={[indicatorStyle, activeStep >= 1 ? { opacity: 1 } : null]} />
            <View style={[indicatorStyle, activeStep >= 2 ? { opacity: 1 } : null]} />
            <View style={[indicatorStyle, activeStep >= 3 ? { opacity: 1 } : null]} />
            <View style={[indicatorStyle, activeStep >= 4 ? { opacity: 1 } : null]} />
            <View style={[indicatorStyle, activeStep >= 5 ? { opacity: 1 } : null]} />
          </View>
        )}
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {dontUseScrollView ? children : <ScrollView style={{ flex: 1 }}>{children}</ScrollView>}
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
          text={loading ? '' : buttonText}
          content={
            loading ? (
              <View>
                <ActivityIndicator animating={loading} size="small" color={colors.text} />
              </View>
            ) : null
          }
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

      <CustomModal
        modalVisible={showModal}
        onclose={() => setShowModal(false)}
        style={{ margin: 0, justifyContent: 'flex-end' }}
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
                  color={dark ? Colors.primarySapphire[400] : Colors.primary.brand}
                />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ flex: 1 }}>
              <StyledText
                style={[
                  header.h1,
                  { color: dark ? Colors.primarySapphire[400] : Colors.primary.brand },
                ]}
              >
                Why are we asking this?
              </StyledText>
              {reasonText}
            </ScrollView>
          </View>
        </View>
      </CustomModal>
    </SafeAreaView>
  );
}
export default OnboardingStepsLayout;
