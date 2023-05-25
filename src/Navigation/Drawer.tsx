// import 'react-native-gesture-handler';
// import {
//   createDrawerNavigator,
//   DrawerContentComponentProps,
//   DrawerContentScrollView,
//   DrawerItem,
//   DrawerItemList,
// } from '@react-navigation/drawer';
// import React from 'react';
// import { View, Image, Text, TouchableOpacity } from 'react-native';
// import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

import Notification from '../screens/Main/Notification';
import Saved from '../screens/Main/Saved/Index';
import Chanel from '../screens/Main/Chanel';
import Prayer from '../screens/Main/Prayer';

import Help from '../screens/Main/Help';
import InviteFriend from '../screens/Main/InviteFriend';
// import ImageModal from 'react-native-image-modal';
// import { useSelector } from 'react-redux';
// import ZendeskChat from 'react-native-zendesk-chat';
// import { RootState } from '../Redux/reducers/rootReducer';
// import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
// import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
// import { faCircle } from '@fortawesome/free-solid-svg-icons/faCircle';
// import { useTheme } from '@react-navigation/native';

// const Drawer = createDrawerNavigator();
// function NavHeader(props: DrawerContentComponentProps) {
//   const user = useSelector((state: RootState) => state.auth.userProfile);
//   const { dark } = useTheme();

//   return (
//     <View
//       style={{
//         // backgroundColor: '#E5E5E5',

//         flex: 1,
//       }}
//     >
//       <View
//         style={{
//           alignItems: 'center',
//           justifyContent: 'center',
//           flex: 1,
//         }}
//       >
//         <View style={{ flex: 1, marginVertical: 30 }}>
//           <View
//             style={{
//               flex: 1,

//               justifyContent: 'center',
//               alignItems: 'center',
//               alignContent: 'center',
//             }}
//           >
//             {user?.profileImage ? (
//               <View>
//                 <ImageModal
//                   style={{
//                     width: 90,
//                     height: 90,
//                     borderRadius: 45,
//                   }}
//                   source={{ uri: user?.profileImage }}
//                   resizeMode={'contain'}
//                 />
//               </View>
//             ) : (
//               <FontAwesomeIcon
//                 icon={faUser}
//                 size={90}
//                 mask={faCircle}
//                 style={{ color: '#000' }}
//                 transform="shrink-6"
//               />
//             )}
//           </View>
//           <Text
//             numberOfLines={2}
//             style={{
//               fontSize: getFontSize(1.8),
//               fontFamily: 'Rubik-Medium',
//               marginTop: getHeight(1),
//               textAlign: 'center',

//               color: dark ? '#9AACB1' : '#032F3C',
//             }}
//           >
//             {user?.name}
//           </Text>

//           <TouchableOpacity onPress={() => props.navigation.navigate('MyProfile')}>
//             <Text
//               style={{
//                 fontSize: getFontSize(1.8),

//                 color: '#4F6D77',
//                 textAlign: 'center',
//               }}
//             >
//               View My Profile
//             </Text>
//           </TouchableOpacity>
//           {/* <Button text={'Edit'} /> */}
//         </View>
//       </View>
//     </View>
//   );
// }
// function CustomDrawerContent(props: DrawerContentComponentProps) {
//   return (
//     <DrawerContentScrollView {...props}>
//       <NavHeader {...props} />
//       <DrawerItemList {...props} />
//       {/* <DrawerItem
//         label="Help"
//         labelStyle={{color: '#4F6D77'}}
//         onPress={() => {
//           ZendeskChat.startChat({
//             name: 'abc',
//             email: 'abc@gmail.cm',
//             phone: '+92300456777',
//             tags: ['tag1', 'tag2'],
//             department: 'help',
//             // The behaviorFlags are optional, and each default to 'true' if omitted

//             behaviorFlags: {
//               showAgentAvailability: true,
//               showChatTranscriptPrompt: true,
//               showPreChatForm: true,
//               showOfflineForm: true,
//             },
//             // The preChatFormOptions are optional & each defaults to "optional" if omitted
//             preChatFormOptions: {
//               name: 'required',
//               email: 'abc@gmail.com',
//               phone: '+92300456777',
//               department: 'Help',
//             },
//             localizedDismissButtonTitle: 'Dismiss',
//           });
//         }}
//       /> */}
//     </DrawerContentScrollView>
//   );
// }
// export default function Drawerr() {
//   return (
//     <Drawer.Navigator
//       screenOptions={{
//         drawerType: 'front',
//         drawerStyle: {
//           // backgroundColor: '#E5E5E5',
//           // backgroundColor: 'transparent',
//           borderBottomEndRadius: 30,
//           borderTopEndRadius: 30,
//         },
//         // overlayColor: '#000',
//       }}
//       drawerContent={(props) => <CustomDrawerContent {...props} />}
//     >
//       <Drawer.Screen
//         name="Home"
//         options={{
//           headerShown: false,

//           // drawerInactiveTintColor: '#4F6D77',
//           // drawerActiveTintColor: '#032F3C',
//         }}
//         component={Bottom}
//       />
//       {/* <Drawer.Screen
//         name="Pray"
//         options={{
//           headerShown: false,
//           drawerInactiveTintColor: '#4F6D77',
//           drawerActiveTintColor: '#032F3C',
//           headerTintColor: '#24BFF0',
//         }}
//         component={Prayer}
//       /> */}
//       <Drawer.Screen
//         name="Notifications"
//         options={{
//           headerShown: false,
//           // drawerInactiveTintColor: '#4F6D77',
//           // drawerActiveTintColor: '#032F3C',
//           // headerTintColor: '#24BFF0',
//         }}
//         component={Notification}
//       />
//       <Drawer.Screen
//         name="Connections"
//         options={{
//           headerShown: false,
//           // drawerInactiveTintColor: '#4F6D77',
//           // drawerActiveTintColor: '#032F3C',
//           // headerTintColor: '#24BFF0',
//         }}
//         component={Chanel}
//       />
//       <Drawer.Screen
//         name="Saved"
//         options={{
//           headerShown: false,
//           // drawerInactiveTintColor: '#4F6D77',
//           // drawerActiveTintColor: '#032F3C',
//           // headerTintColor: '#24BFF0',
//         }}
//         component={Saved}
//       />
//       <Drawer.Screen
//         name="Invite"
//         options={{
//           headerShown: false,
//           // drawerInactiveTintColor: '#4F6D77',
//           // drawerActiveTintColor: '#032F3C',
//           // headerTintColor: '#24BFF0',
//         }}
//         component={InviteFriend}
//       />
//       <Drawer.Screen
//         name="Settings"
//         options={{
//           headerShown: false,
//           // drawerInactiveTintColor: '#4F6D77',
//           // drawerActiveTintColor: '#032F3C',
//           // headerTintColor: '#24BFF0',
//         }}
//         component={Setting}
//       />
//       <Drawer.Screen
//         name="Help"
//         options={{
//           headerShown: false,
//           // drawerInactiveTintColor: '#4F6D77',
//           // drawerActiveTintColor: '#032F3C',
//           // headerTintColor: '#24BFF0',
//         }}
//         component={Help}
//       />
//     </Drawer.Navigator>
//   );
// }

import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  DrawerItem,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import {
  useTheme,
  Avatar,
  Title,
  Caption,
  Paragraph,
  Drawer,
  Text,
  TouchableRipple,
  Switch,
  Button,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Bottom from './Bottom';
import { useSelector } from 'react-redux';
import { RootState } from '../Redux/reducers/rootReducer';
import { NO_PROFILE_IMAGE, OpenURLButton } from '../Services/constants';
import Setting from '../screens/Main/Setting';
import HomeStack from './HomeStack';

const DrawerNavigation = createDrawerNavigator();

export default function DrawerElem(props: DrawerContentComponentProps) {
  return (
    <DrawerNavigation.Navigator drawerContent={() => <DrawerContent {...props} />}>
      <DrawerNavigation.Screen
        name="Home"
        options={{
          headerShown: false,
        }}
        component={Bottom}
      />
      {/* <DrawerNavigation.Screen
        name="PrayerWall"
        options={{
          headerShown: false,
          // drawerInactiveTintColor: '#4F6D77',
          // drawerActiveTintColor: '#032F3C',
          // headerTintColor: '#24BFF0',
        }}
        component={Prayer}
      /> */}
      <DrawerNavigation.Screen
        name="Notifications"
        options={{
          headerShown: false,
          // drawerInactiveTintColor: '#4F6D77',
          // drawerActiveTintColor: '#032F3C',
          // headerTintColor: '#24BFF0',
        }}
        component={Notification}
      />
      <DrawerNavigation.Screen
        name="Connections"
        options={{
          headerShown: false,
          // drawerInactiveTintColor: '#4F6D77',
          // drawerActiveTintColor: '#032F3C',
          // headerTintColor: '#24BFF0',
        }}
        component={Chanel}
      />

      <DrawerNavigation.Screen
        name="Saved"
        options={{
          headerShown: false,
          // drawerInactiveTintColor: '#4F6D77',
          // drawerActiveTintColor: '#032F3C',
          // headerTintColor: '#24BFF0',
        }}
        component={Saved}
      />
      {/* <DrawerNavigation.Screen
        name="Invite"
        options={{
          headerShown: false,
          // drawerInactiveTintColor: '#4F6D77',
          // drawerActiveTintColor: '#032F3C',
          // headerTintColor: '#24BFF0',
        }}
        component={InviteFriend}
      /> */}
      <DrawerNavigation.Screen
        name="Settings"
        options={{
          headerShown: false,
          // drawerInactiveTintColor: '#4F6D77',
          // drawerActiveTintColor: '#032F3C',
          // headerTintColor: '#24BFF0',
        }}
        component={Setting}
      />
      <DrawerNavigation.Screen
        name="Help"
        options={{
          headerShown: false,
          // drawerInactiveTintColor: '#4F6D77',
          // drawerActiveTintColor: '#032F3C',
          // headerTintColor: '#24BFF0',
        }}
        component={Help}
      />
    </DrawerNavigation.Navigator>
  );
}

function DrawerContent(props: DrawerContentComponentProps) {
  const user = useSelector((state: RootState) => state.auth.getProfileData);

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerContent}>
        <View style={styles.userInfoSection}>
          <View style={{ flex: 1 }}>
            <Avatar.Image
              source={{
                uri: user?.profileImage || NO_PROFILE_IMAGE,
              }}
              size={60}
            />
          </View>
          <View style={{ padding: 10, flex: 2 }}>
            <Title style={styles.title} numberOfLines={1}>
              {user?.name}
            </Title>
            <Caption style={styles.caption}>@{user?.username}</Caption>
            <Button
              onPress={() => props.navigation.navigate('MyProfile')}
              mode="text"
              style={{ marginLeft: -5, alignItems: 'flex-start', marginTop: 3 }}
              // contentStyle={{ marginLeft: -5 }}
              labelStyle={{ paddingHorizontal: 0, marginHorizontal: 6, marginVertical: 4 }}
            >
              View Profile
            </Button>
          </View>
        </View>
        <Drawer.Section style={styles.drawerSection}>
          <DrawerItem
            label="Home"
            onPress={() => {
              props.navigation.navigate('Home', { screen: 'HomeTab' });
            }}
          />
          {/* <DrawerItem
            label="Prayer Wall"
            onPress={() => {
              props.navigation.navigate('PrayerWall');
            }}
          /> */}
          <DrawerItem
            label="Notifications"
            onPress={() => {
              props.navigation.navigate('Notifications');
            }}
          />
          <DrawerItem
            label="Connections"
            onPress={() => {
              props.navigation.navigate('Connections');
            }}
          />
          {/* <DrawerItem label="Prayers" onPress={() => {}} /> */}
          <DrawerItem
            label="Saved"
            onPress={() => {
              props.navigation.navigate('Saved');
            }}
          />
          {/* <DrawerItem
            label="Invite"
            onPress={() => {
              props.navigation.navigate('Invite');
            }}
          /> */}
        </Drawer.Section>
        <Drawer.Section>
          <DrawerItem
            label="Settings"
            onPress={() => {
              props.navigation.navigate('Settings');
            }}
          />
          <DrawerItem
            label="Help"
            onPress={() => {
              OpenURLButton('https://usersuccess.onebodyapp.com/portal/en/kb/one-body-inc');
            }}
          />
        </Drawer.Section>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginTop: 20,
    flex: 1,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
  },
  row: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  paragraph: {
    fontWeight: 'bold',
    marginRight: 3,
  },
  drawerSection: {
    marginTop: 15,
  },
  preference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
