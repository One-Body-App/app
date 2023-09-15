import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { AccountType, Tag } from '@/utils/types';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { ApiCall } from '@/src/Services/api';

import { StyledSelect } from '@/src/components/styled/Select';
import { StackScreenProps } from '@react-navigation/stack';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { useToast } from 'react-native-toast-notifications';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingOrganizationType'>;

const OnboardingOrganizationType = ({ navigation }: Props) => {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [organizationTypes, setOrganizationTypes] = useState<Tag[]>([]);

  const [selectedOrganizationType, setSelectedOrganizationType] = useState<Tag['_id']>('');

  const toast = useToast();
  const getOrganizationTypes = async () => {
    try {
      const res = await ApiCall({
        route: 'tags/organization-types',
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        setOrganizationTypes(res?.response);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    if (token) {
      getOrganizationTypes();
    }
  }, [token]);

  const selectedOrganizationTypeFiltered = organizationTypes.filter((item) => {
    return item._id == selectedOrganizationType;
  });

  const selectedOrganizationTypeName =
    selectedOrganizationTypeFiltered.length > 0 ? selectedOrganizationTypeFiltered[0].name : '';

  return (
    <OnboardingStepsLayout
      buttonText="Next"
      onPress={() => {
        if (selectedOrganizationType) {
          navigation.navigate('OnboardingOrganizationInfo', {
            selectedOrganizationType: selectedOrganizationType,
          });
        } else {
          toast.show('Organization type is required', {
            type: 'danger',
          });
        }
      }}
      onboardingType={AccountType.organization}
      activeStep={1}
      disabled={selectedOrganizationTypeFiltered.length == 0}
    >
      <View style={{ marginVertical: spacing.x48, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StyledText style={[Typography.header.h1]}>What type of Organization are you?</StyledText>
          <StyledText
            style={[Typography.subheader.R, { color: Colors.neutral[200], marginTop: spacing.x8 }]}
          >
            Identify your organization type
          </StyledText>
        </View>

        <View style={{ flex: 4, marginTop: spacing.x32 }}>
          <StyledSelect
            items={organizationTypes.map((item) => {
              return {
                text: item.name,
                value: item._id,
              };
            })}
            label="Organization Type"
            selectedItem={selectedOrganizationType}
            btnText={selectedOrganizationType == '' ? 'Select' : selectedOrganizationTypeName}
            modalTitle="Select organization Type"
            onChange={(item) => {
              setSelectedOrganizationType(item);
            }}
          />
        </View>
      </View>
    </OnboardingStepsLayout>
  );
};
export default OnboardingOrganizationType;
