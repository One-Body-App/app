import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';
import { Children, ReactElement, ReactNode, cloneElement, isValidElement, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  useWindowDimensions,
  View,
  TextStyle,
  ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
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
  buttonStyle?: ViewStyle;
  buttonTextStyle?: TextStyle;
};

const onboardingStepsScrollInsets = { bottom: spacing.x16 };
const onboardingStepsAndroidPadding =
  Platform.OS === 'android' ? { paddingBottom: spacing.x16 } : {};

const indicatorStyle: ViewStyle = {
  backgroundColor: Colors.secondary.brand,
  height: 8,
  flex: 1,
  marginHorizontal: 5,
  borderRadius: borderRadius.base,
  opacity: 0.2,
};

const applyReasonTextColor = (node: ReactNode, color: string): ReactNode => {
  if (node == null || typeof node === 'string' || typeof node === 'number') {
    return node;
  }

  if (!isValidElement(node)) {
    return node;
  }

  const element = node as ReactElement<{ children?: ReactNode; style?: unknown }>;
  const children = element.props?.children;
  const nextChildren = children
    ? Children.map(children, (child) => applyReasonTextColor(child, color))
    : children;

  if (element.type === StyledText) {
    const style = element.props?.style;
    const mergedStyle = Array.isArray(style) ? [...style, { color }] : [style, { color }];

    return cloneElement(element, { style: mergedStyle, children: nextChildren });
  }

  return cloneElement(element, { children: nextChildren });
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
  buttonStyle,
  buttonTextStyle,
}: Props) {
  const { colors, dark } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [showModal, setShowModal] = useState<boolean>(false);
  const modalHeight = Math.round(windowHeight * 0.3);
  const reasonContent = reasonText && dark ? applyReasonTextColor(reasonText, '#FFF') : reasonText;
  return (
    <>
      <SafeAreaView
        style={{
          flex: 1,
          marginHorizontal: spacing.x24,
          marginBottom: Platform.OS === 'android' ? spacing.x24 : 0,
        }}
      >
        <View style={{ marginTop: spacing.x20 }}>
          {onboardingType === AccountType.individual ? (
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
              buttonStyle,
            ]}
            disabledBtnStyle={[
              button.primary,
              {
                flex: 1,
                opacity: 0.4,
              },
              buttonStyle,
            ]}
            onPress={() => {
              onPress();
            }}
            btnTextStyle={[{ color: '#FFF' }, buttonTextStyle]}
            disabledBtnTextStyle={[{ color: '#FFF' }, buttonTextStyle]}
          />
        </View>
      </SafeAreaView>

      <CustomModal
        modalVisible={showModal}
        onclose={() => setShowModal(false)}
        style={{
          margin: 0,
          justifyContent: 'flex-start',
          flex: 0,
          height: modalHeight,
          minHeight: modalHeight,
          maxHeight: modalHeight,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,

            padding: spacing.x16,
            borderTopRightRadius: borderRadius.base,
            borderTopLeftRadius: borderRadius.base,
          }}
        >
          <View style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={onboardingStepsAndroidPadding}
              contentInset={onboardingStepsScrollInsets}
              scrollIndicatorInsets={onboardingStepsScrollInsets}
              contentInsetAdjustmentBehavior="never"
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <StyledText
                  style={[
                    header.h1,
                    {
                      color: dark ? Colors.primarySapphire[400] : Colors.primary.brand,
                      flex: 1,
                      paddingRight: spacing.x16,
                    },
                  ]}
                >
                  Why are we asking this?
                </StyledText>
                <Pressable
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
                </Pressable>
              </View>
              {reasonContent}
            </ScrollView>
          </View>
        </View>
      </CustomModal>
    </>
  );
}
export default OnboardingStepsLayout;
