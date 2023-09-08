import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { AccountType, ChurchType } from '@/utils/types';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { ApiCall } from '@/src/Services/api';

import { StyledSelect } from '@/src/components/styled/Select';
import { StackScreenProps } from '@react-navigation/stack';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { useToast } from 'react-native-toast-notifications';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingChurchType'>;

const OnboardingChurchType = ({ navigation }: Props) => {
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
        token: token,
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
    >
      <View style={{ marginVertical: spacing.x48, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StyledText style={[Typography.header.h1]}>What type of Church do you attend?</StyledText>
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[200], marginTop: spacing.x8 }]}
          >
            Identify your church type
          </StyledText>
        </View>

        <View style={{ flex: 4 }}>
          <StyledSelect
            items={churchTypes.map((item) => {
              return {
                text: item.churchType,
                value: item._id,
              };
            })}
            label="Church type"
            selectedItem={selectedChurchType}
            btnText={selectedChurchType == '' ? 'Select' : selectedChurchTypeName}
            modalTitle="Select church type"
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
              label="Church sub type"
              btnText={selectedChurchSubType == '' ? 'Select' : selectedChurchSubTypeName}
              onChange={(item) => {
                setSelectedChurchSubType(item);
              }}
              modalTitle="Select church sub type"
            />
          ) : null}
        </View>
      </View>
    </OnboardingStepsLayout>
  );
};
export default OnboardingChurchType;
