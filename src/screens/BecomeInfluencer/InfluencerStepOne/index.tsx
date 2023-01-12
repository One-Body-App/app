import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { styles } from './styles';
import Logo from '@/assets/svg/LogoBlue.svg';
import GoBackIcon from '@/src/Components/GoBackIcon';
import { useTheme } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';
import { ApiCall } from '@/src/Services/api';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { useSelector } from 'react-redux';

type Props = StackScreenProps<RootStackParamList, 'InfluencerStepOne'>;

const InfluencerStepOne = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const getInfluencerProfile = async () => {
    try {
      const res = await ApiCall({
        route: `influencer/has-pending-request`,
        verb: 'get',
        token: token,
      });

      if (res?.status == 200) {
        setIsLoading(false);

        if (res.response) {
          setHasPendingRequest(true);
        }
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getInfluencerProfile();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.headview}>
        <GoBackIcon color={colors.text} />
      </View>

      {isLoading ? (
        <ScrollView>
          <ActivityIndicator animating={isLoading} size="large" color="#000" />
        </ScrollView>
      ) : (
        <>
          {hasPendingRequest ? (
            <ScrollView>
              <Text
                style={{
                  ...styles.heading,

                  color: colors.text,
                }}
              >
                Apply to be an Influencer
              </Text>
              <Text
                style={{
                  marginHorizontal: 25,
                  ...styles.text,
                }}
              >
                You have a pending request. We will get back to you as soon as possible.
              </Text>
            </ScrollView>
          ) : (
            <>
              <ScrollView>
                <View style={{ marginHorizontal: 10, marginBottom: 80 }}>
                  <Logo
                    height={getHeight(14)}
                    width={getWidth(40)}
                    style={{ alignSelf: 'center' }}
                  />

                  <Text style={{ ...styles.text, color: '#4F6D77' }}>Step 1 of 3</Text>
                  <Text
                    style={{
                      ...styles.heading,

                      color: colors.text,
                      marginTop: 20,
                    }}
                  >
                    Influencer rules
                  </Text>

                  <Text
                    style={{
                      fontFamily: 'Rubik-Regular',
                      color: colors.text,
                      fontSize: 16,
                    }}
                  >
                    In order for you to become an Influencer on the One Body app, you must meet one
                    of the following criteria:
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Rubik-Regular',
                      color: colors.text,
                      marginTop: 20,
                      fontSize: 16,
                    }}
                  >
                    <Text style={{ ...styles.point, color: colors.primary }}>a.</Text> User must be
                    a Pastor or clergy member in local community. Confirmed through account review
                    process. *Influencer accounts can be approved through cross-confirmation via
                    organization confirmation process.
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Rubik-Regular',
                      color: colors.text,
                      marginTop: 20,
                      fontSize: 16,
                    }}
                  >
                    <Text style={{ ...styles.point, color: colors.primary }}>b.</Text> User must be
                    a non-clergy public figure with a platform based on Christian values as defined
                    by One Body. This will require account review.
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Rubik-Regular',
                      color: colors.text,
                      marginTop: 20,
                      fontSize: 16,
                    }}
                  >
                    <Text style={{ ...styles.point, color: colors.primary }}>c.</Text> Instagram
                    account must be set to public. Accounts set to private cannot be aggregated.
                    *RSS must be publicly available for News or Blog publishers.
                  </Text>
                </View>
              </ScrollView>
              <View style={styles.foter}>
                <ImageBackground
                  resizeMode="stretch"
                  style={styles.backgroundimagestyle}
                  source={require('@/assets/images/waveBG.png')}
                >
                  <View style={{ width: getWidth(10) }} />
                  <View style={styles.progressBar}>
                    <View style={styles.progressBarStatus} />
                  </View>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('InfluencerStepTwo', {})}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={styles.footerText}>Next</Text>
                    <Ionicons name="chevron-forward" size={getFontSize(3)} />
                  </TouchableOpacity>
                </ImageBackground>
              </View>
            </>
          )}
        </>
      )}
    </SafeAreaView>
  );
};
export default InfluencerStepOne;
