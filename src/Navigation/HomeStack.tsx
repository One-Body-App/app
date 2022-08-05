import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useSelector } from 'react-redux';
import ConfirmPassword from '../screens/Auth/ConfirmPassword';
import NewPassword from '../screens/Auth/NewPassword';
import InfluencerStepOne from '../screens/BecomeInfluencer/InfluencerStepOne';
import InfluencerStepThree from '../screens/BecomeInfluencer/InfluencerStepThree';
import InfluencerStepTwo from '../screens/BecomeInfluencer/InfluencerStepTwo';
import LoadingPage from '../screens/loadingPage';
import Deactivateaccount from '../screens/Main/Deactivateaccount';
import EditProfile from '../screens/Main/EditProfile';
import Help from '../screens/Main/Help';
import IndividualSteps from '../screens/Main/IndividualSteps';
import OrgnizationSteps from '../screens/Main/OrgnizationSteps';
import PasswordChange from '../screens/Main/PasswordChange';
import PhoneValidate from '../screens/Main/PhoneValidate';
import PhoneValidateOtp from '../screens/Main/PhoneValidateOtp';
import Prayer from '../screens/Main/Prayer';
import Deactivateaccountconfirm from '../screens/Main/Deactiveaccountconfirm';
import Deactivateaccountotp from '../screens/Main/Deactivateaccountotp';
import Setting from '../screens/Main/Setting';
import LandingScreen from '../screens/questionnaireScreens/home';
import Drawerr from './Drawerr';
import Notificationandemail from '../screens/Main/Notificationandemail';
import ConversationScreen from '../screens/Main/Message/conversation';
import PhoneNumberUpdate from '../screens/Main/PhoneNumberUpdate';
import Search from '../screens/Main/Search';
import AddPhoneNumber from '../screens/Main/AddPhoneNumber';
import UserProfile from '../screens/Main/UserProfile';
import BlogView from '../screens/Main/BlogView';
import Faqs from '../screens/Main/Help/Faqs';

const Stack = createNativeStackNavigator();
const HomeStack = () => {
  const user = useSelector((state) => state.auth.userData);
  console.log('userrrrr', user);
  return (
    <Stack.Navigator
      initialRouteName={
        user?.isProfileCompleted
          ? 'loading'
          : user?.role == 'individual'
          ? 'IndividualSteps'
          : 'OrgnizationSteps'
      }
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Bootombar" component={Drawerr} />
      <Stack.Screen name="InfluencerStepOne" component={InfluencerStepOne} />
      <Stack.Screen name="InfluencerStepTwo" component={InfluencerStepTwo} />
      <Stack.Screen name="InfluencerStepThree" component={InfluencerStepThree} />
      <Stack.Screen name="Prayer" component={Prayer} />
      <Stack.Screen name="IndividualSteps" component={IndividualSteps} />
      <Stack.Screen name="OrgnizationSteps" component={OrgnizationSteps} />
      <Stack.Screen name="Help" component={Help} />
      <Stack.Screen name="Faqs" component={Faqs} />
      <Stack.Screen name="Deactivateaccount" component={Deactivateaccount} />
      <Stack.Screen name="editProfile" component={EditProfile} />
      <Stack.Screen name="setting" component={Setting} />
      <Stack.Screen name="passwordChange" component={PasswordChange} />
      <Stack.Screen name="phoneValidate" component={PhoneValidate} />

      <Stack.Screen name="confirm" component={ConfirmPassword} />

      <Stack.Screen name="newpassword" component={NewPassword} />

      <Stack.Screen name="loading" component={LoadingPage} />
      <Stack.Screen name="conversation" component={ConversationScreen} />
      <Stack.Screen
        options={{ headerShown: false }}
        name="Notificationandemail"
        component={Notificationandemail}
      />
      <Stack.Screen name="Deactivateaccountotp" component={Deactivateaccountotp} />
      <Stack.Screen name="Deactivateaccountconfirm" component={Deactivateaccountconfirm} />
      <Stack.Screen name="PhoneNumberUpdate" component={PhoneNumberUpdate} />
      <Stack.Screen name="AddPhoneNumber" component={AddPhoneNumber} />
      <Stack.Screen name="UserProfile" component={UserProfile} />

      <Stack.Screen name="Search" component={Search} options={{ presentation: 'modal' }} />
      <Stack.Screen name="BlogView" component={BlogView} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
};

export default HomeStack;

// {
//   /* <Stack.Screen name="forget" component={ForgotPassword} /> */
// }
// {
//   /* <Stack.Screen name="landing" component={LandingScreen} /> */
// }
// {
//   /* <Stack.Screen name="PhoneValidateOtp" component={PhoneValidateOtp} /> */
// }
