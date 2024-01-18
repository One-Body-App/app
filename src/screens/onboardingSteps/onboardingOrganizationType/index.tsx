import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
import { useToast } from 'react-native-toast-notifications';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/src/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { AccountType, Tag } from '@/utils/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';

import StyledSelect from '@/src/components/styled/Select';
import { OnboardingStackParamList } from '@/src/navigator/types';
import { header } from '@/src/styles/typography';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingOrganizationType'>;

function OnboardingOrganizationType({ navigation }: Props) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [organizationTypes, setOrganizationTypes] = useState<Tag[]>([]);

  const [selectedOrganizationType, setSelectedOrganizationType] = useState<Tag['_id']>('');

  const toast = useToast();
  const getOrganizationTypes = async () => {
    try {
      const res = await ApiCall({
        route: 'tags/organization-types',
        verb: 'get',
        token,
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
            selectedOrganizationType,
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
      reasonText={
        <StyledText style={{ color: Colors.primary.brand }}>
          Denomination info helps us to understand the type of content you would be most interested
          in seeing to enhance your One Body experience. You can decide if you want this info to be
          Public or Private in your Profile settings.
        </StyledText>
      }
    >
      <View style={{ marginVertical: spacing.x20, flex: 1 }}>
        <View style={{ flex: 1 }}>
          <StyledText style={[Typography.header.h1, { color: Colors.primary.brand }]}>
            What type of Organization are you?
          </StyledText>
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
}
export default OnboardingOrganizationType;
