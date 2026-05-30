import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, Switch, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';
import { Lock1 } from 'iconsax-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from 'react-native-toast-notifications';
import StyledText from '@/components/styled/Text';
import { SettingsStackParamsList } from '@/src/navigator/types';
import { setProfile } from '@/src/redux/actions/AuthActions';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { ApiCall } from '@/services/api';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';

type Props = NativeStackScreenProps<SettingsStackParamsList, 'PrivacySettings'>;

function PrivacySettings(_props: Props) {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const profile = useSelector((state: RootState) => state.auth.getProfileData);
  const toast = useToast();
  const { colors } = useTheme();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [allowTagging, setAllowTagging] = React.useState(profile?.allowTagging ?? true);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      try {
        const response = await ApiCall({
          route: 'user/my-profile',
          token,
          verb: 'get',
        });

        if (!isActive) {
          return;
        }

        if (response?.status === 200) {
          dispatch(setProfile({ token, ...response.response }));
          setAllowTagging(response.response?.allowTagging ?? true);
        }
      } finally {
        if (isActive) {
          setIsLoaded(true);
        }
      }
    };

    loadProfile();
    return () => {
      isActive = false;
    };
  }, [dispatch, token]);

  const updatePrivacy = async (nextValue: boolean) => {
    setAllowTagging(nextValue);
    setIsSaving(true);
    try {
      const response = await ApiCall({
        route: 'user/set-privacy',
        verb: 'patch',
        token,
        params: {
          allowTagging: nextValue,
        },
      });

      if (response?.status === 200) {
        dispatch(
          setProfile({
            ...(profile ?? {}),
            allowTagging: nextValue,
          })
        );
        toast.show('Privacy settings updated successfully.', {
          type: 'success',
          placement: 'top',
        });
      } else {
        setAllowTagging(!nextValue);
        toast.show(response?.response?.message ?? 'Unable to update privacy settings.', {
          type: 'danger',
          placement: 'top',
        });
      }
    } catch (_error) {
      setAllowTagging(!nextValue);
      toast.show('Unable to update privacy settings.', {
        type: 'danger',
        placement: 'top',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, marginHorizontal: spacing.x24, paddingBottom: spacing.x16 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            backgroundColor: colors.card,
            padding: spacing.x24,
            borderRadius: borderRadius.base,
            marginVertical: spacing.x16,
          }}
        >
          <StyledText
            style={[
              Typography.header.h3,
              { textTransform: 'uppercase', marginBottom: spacing.x16 },
            ]}
          >
            Privacy
          </StyledText>

          {!isLoaded ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{ alignItems: 'center', justifyContent: 'center', marginRight: spacing.x24 }}
              >
                <View
                  style={{
                    borderRadius: borderRadius.max,
                    backgroundColor: Colors.neutral[800],
                    padding: 6,
                  }}
                >
                  <Lock1 color={Colors.primary.brand} size={18} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <StyledText style={[Typography.header.h4, { color: Colors.neutral.brand }]}>
                  Allow others to tag me
                </StyledText>
                <StyledText style={[Typography.body.x2, { color: Colors.neutral[300] }]}>
                  Turn this off to hide your profile from @tag suggestions across One Body
                </StyledText>
              </View>
              <View style={{ paddingLeft: spacing.x10, alignItems: 'flex-end' }}>
                <Switch
                  disabled={isSaving}
                  value={allowTagging}
                  onValueChange={updatePrivacy}
                  trackColor={{ false: Colors.neutral[600], true: Colors.primary.brand }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default PrivacySettings;
