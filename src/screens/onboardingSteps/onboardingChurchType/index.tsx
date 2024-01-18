import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
import { useToast } from 'react-native-toast-notifications';
import { useTheme } from '@react-navigation/native';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/src/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { AccountType, ChurchType } from '@/utils/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';

import StyledSelect from '@/src/components/styled/Select';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { header } from '@/src/styles/typography';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingChurchType'>;

function OnboardingChurchType({ navigation }: Props) {
  const { dark, colors } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [churchTypes, setChurchTypes] = useState<ChurchType[]>([]);

  const [selectedChurchType, setSelectedChurchType] = useState<ChurchType['_id']>('');
  const [selectedChurchSubType, setSelectedChurchSubType] = useState<ChurchType['_id']>('');

  const toast = useToast();
  const getChurchTypes = async () => {
    try {
      const res = await ApiCall({
        route: 'global/church-type',
        verb: 'get',
        token,
      });

      if (res?.status == 200) {
        setChurchTypes(res?.response);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    if (token) {
      getChurchTypes();
    }
  }, [token]);

  const selectedChurchTypeFiltered = churchTypes.filter((item) => {
    return item._id == selectedChurchType;
  });

  const selectedChurchTypeName =
    selectedChurchTypeFiltered.length > 0 ? selectedChurchTypeFiltered[0].churchType : '';

  const selectedChurchSubTypeFiltered =
    selectedChurchTypeFiltered.length > 0
      ? selectedChurchTypeFiltered[0].children.filter((item) => {
          return item._id == selectedChurchSubType;
        })
      : [];

  const selectedChurchSubTypeName =
    selectedChurchSubTypeFiltered.length > 0 ? selectedChurchSubTypeFiltered[0].churchType : '';

  return (
    <OnboardingStepsLayout
      buttonText="Next"
      onPress={() => {
        if (selectedChurchType) {
          navigation.navigate('OnboardingChurchAttend', {
            selectedChurchType: selectedChurchTypeName,
            selectedChurchSubType: selectedChurchSubTypeName,
          });
        } else {
          toast.show('Church type required', {
            type: 'danger',
          });
        }
      }}
      onboardingType={AccountType.individual}
      activeStep={1}
      disabled={
        selectedChurchTypeFiltered.length < 1 ||
        (selectedChurchTypeFiltered.length > 0 &&
          selectedChurchTypeFiltered[0].children.length > 0 &&
          selectedChurchSubTypeFiltered.length < 1)
      }
      reasonText={
        <>
          <StyledText style={{ color: dark ? colors.text : Colors.primary.brand }}>
            Denomination info helps us to understand the type of content you would be most
            interested in seeing to enhance your One Body experience.
          </StyledText>
          <StyledText> </StyledText>
          <StyledText style={{ color: dark ? colors.text : Colors.primary.brand }}>
            You can decide if you want this info to be Public or Private in your Profile settings.
          </StyledText>
        </>
      }
    >
      <View style={{ marginVertical: spacing.x20, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StyledText
            style={[
              Typography.header.h1,
              { color: dark ? Colors.primarySapphire[400] : Colors.primary.brand },
            ]}
          >
            What type of Church do you attend?
          </StyledText>
          <StyledText
            style={[
              Typography.subheader.R,
              { color: dark ? Colors.main.black : Colors.neutral[300], marginTop: spacing.x8 },
            ]}
          >
            Identify your denomination
          </StyledText>
        </View>

        <View style={{ flex: 4, marginTop: spacing.x32 }}>
          <StyledSelect
            items={churchTypes.map((item) => {
              return {
                text: item.churchType,
                value: item._id,
              };
            })}
            label="Denomination"
            selectedItem={selectedChurchType}
            btnText={selectedChurchType == '' ? 'Select' : selectedChurchTypeName}
            modalTitle="Select your Denomination"
            onChange={(item) => {
              setSelectedChurchType(item);
              setSelectedChurchSubType('');
            }}
          />

          {selectedChurchTypeFiltered.length > 0 &&
          selectedChurchTypeFiltered[0]?.children?.length > 0 ? (
            <StyledSelect
              wrapperStyle={{ marginTop: spacing.x24 }}
              items={selectedChurchTypeFiltered[0].children.map((item) => {
                return {
                  text: item.churchType,
                  value: item._id,
                };
              })}
              label="Sub Denomination or Association"
              btnText={selectedChurchSubType == '' ? 'Select' : selectedChurchSubTypeName}
              onChange={(item) => {
                setSelectedChurchSubType(item);
              }}
              modalTitle="Select sub Denomination"
            />
          ) : null}
        </View>
      </View>
    </OnboardingStepsLayout>
  );
}
export default OnboardingChurchType;
