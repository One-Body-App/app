import React from 'react';
import { Text, View, Image, ImageBackground, TouchableOpacity, SafeAreaView } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { styles } from './styles';

const BordingStepTwo = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.mainimg}>
          <Image source={require('@/assets/images/LogoMain.png')} />
          <Text style={{ fontFamily: 'Rubik-Regular' }}>Step 2 of 4</Text>
          <Text style={styles.heading}>End User Agreement</Text>
        </View>

        <Text style={styles.text}>
          In order for users to be an influencer they must meet ONE of the following criteria:
        </Text>
        <Text style={styles.text}>
          <Text style={styles.point}>a.</Text> Must have a confirmed Influencer account on IG or
          Twitter. (Blue check) All IG/Twitter accounts must be set as public figure accounts in
          order for API to aggregate their posts.
        </Text>
        <Text style={styles.text}>
          <Text style={styles.point}>b.</Text> User must be a Pastor or clergy member in local
          community. Confirmed through account review process. *Influencer accounts can be approved
          through cross-confirmation via organization confirmation process.
        </Text>
        <Text style={styles.text}>
          <Text style={styles.point}>c.</Text> User must be a non-clergy public figure with a
          platform based on Christian values as defined by One Body. This will require account
          review.
        </Text>
        <Text style={{ ...styles.text, alignSelf: 'flex-start' }}>
          <Ionicons name="download-outline" size={25} /> Download influencer agreement
        </Text>
        <View style={styles.checkedview}>
          <Checkbox status={'checked'} />
          <Text style={{ fontFamily: 'Rubik-Regular' }}>
            I have gone through the document and accept the Privacy Policy.
          </Text>
        </View>
        <View />
      </View>
      <View style={styles.foter}>
        <ImageBackground
          resizeMode="stretch"
          style={styles.wavebgimg}
          source={require('@/assets/images/waveBG.png')}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.footerText}>
              <Ionicons name="chevron-back" size={getFontSize(3)} /> Back
            </Text>
          </TouchableOpacity>
          <View style={styles.progressBar}>
            <View style={styles.progressBarStatus} />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('BordingStepThree')}>
            <Text style={styles.footerText}>
              Next <Ionicons name="chevron-forward" size={getFontSize(3)} />
            </Text>
          </TouchableOpacity>
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
};
export default BordingStepTwo;
