import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { useSelector } from 'react-redux';
import { StackScreenProps } from '@react-navigation/stack';
import { useToast } from 'react-native-toast-notifications';
import OnboardingStepsLayout from '../../layout/OnboardingStepsLayout';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { AccountType, Tag } from '@/utils/types';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';

import StyledSelect from '@/components/styled/Select';
import { OnboardingStackParamList } from '@/src/navigator/types';

type Props = StackScreenProps<OnboardingStackParamList, 'OnboardingOrganizationType'>;

function OnboardingOrganizationType({ navigation }: Props) {
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [organizationTypes, setOrganizationTypes] = useState<Tag[]>([]);

  const [selectedOrganizationType, setSelectedOrganizationType] = useState<Tag['_id']>('');

  const toast = useToast();
  const getOrganizationTypes = useCallback(async () => {
    try {
      const res = await ApiCall({
        route: 'tags/organization-types',
        verb: 'get',
        token,
      });

      if (res?.status === 200) {
        setOrganizationTypes(res?.response as Tag[]);
      } else if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('error', res?.response);
      }
    } catch (e: any) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('saga error -- ', e.toString());
      }
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      getOrganizationTypes();
    }
  }, [token, getOrganizationTypes]);

  const selectedOrganizationTypeFiltered = organizationTypes.filter((item) => {
    return item._id === selectedOrganizationType;
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
      disabled={selectedOrganizationTypeFiltered.length === 0}
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
            btnText={selectedOrganizationType === '' ? 'Select' : selectedOrganizationTypeName}
            modalTitle="Select organization Type"
            hideSearch
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
