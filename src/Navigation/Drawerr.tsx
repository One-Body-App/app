import 'react-native-gesture-handler';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from '@react-navigation/drawer';
import React from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Bottom from './Bootom';
import Notification from '../screens/Main/Notification';
import Saved from '../screens/Main/Saved/Index';
import Chanel from '../screens/Main/Chanel';
import Prayer from '../screens/Main/Prayer';
import Setting from '../screens/Main/Setting';
import Help from '../screens/Main/Help';
import InviteFriend from '../screens/Main/InviteFriend';
import ImageModal from 'react-native-image-modal';
import { useSelector } from 'react-redux';
import ZendeskChat from 'react-native-zendesk-chat';

const Drawer = createDrawerNavigator();
function NavHeader(props) {
  const user = useSelector((state) => state.auth.userProfile);

  return (
    <View
      style={{
        backgroundColor: '#E5E5E5',

        borderTopEndRadius: 30,

        flexDirection: 'row',
        width: '100%',
        height: getHeight(22),
      }}
    >
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',

          flex: 1,
        }}
      >
        <View>
          <ImageModal
            style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              alignSelf: 'center',
            }}
            source={{ uri: user?.profileImage }}
            resizeMode={'contain'}
          />
          <Text
            numberOfLines={3}
            style={{
              fontSize: getFontSize(2.4),
              fontFamily: 'Rubik-Medium',
              marginTop: getHeight(1),
              width: getWidth(35),
              color: '#032F3C',
            }}
          >
            {user?.name}
          </Text>

          <TouchableOpacity onPress={() => props.navigation.navigate('Home', { tabs: 'Profile' })}>
            <Text
              style={{
                fontSize: getFontSize(1.8),

                color: '#4F6D77',
              }}
            >
              View My Profile
            </Text>
          </TouchableOpacity>
          {/* <Button text={'Edit'} /> */}
        </View>
      </View>
    </View>
  );
}
function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props}>
      <NavHeader {...props} />
      <DrawerItemList {...props} />
      {/* <DrawerItem
        label="Help"
        labelStyle={{color: '#4F6D77'}}
        onPress={() => {
          ZendeskChat.startChat({
            name: 'abc',
            email: 'abc@gmail.cm',
            phone: '+92300456777',
            tags: ['tag1', 'tag2'],
            department: 'help',
            // The behaviorFlags are optional, and each default to 'true' if omitted

            behaviorFlags: {
              showAgentAvailability: true,
              showChatTranscriptPrompt: true,
              showPreChatForm: true,
              showOfflineForm: true,
            },
            // The preChatFormOptions are optional & each defaults to "optional" if omitted
            preChatFormOptions: {
              name: 'required',
              email: 'abc@gmail.com',
              phone: '+92300456777',
              department: 'Help',
            },
            localizedDismissButtonTitle: 'Dismiss',
          });
        }}
      /> */}
    </DrawerContentScrollView>
  );
}
export default function Drawerr() {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerStyle: {
          backgroundColor: '#E5E5E5',
          borderBottomEndRadius: 30,
          borderTopEndRadius: 30,
          paddingLeft: getWidth(8),
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      {/* <Drawer.Screen
        name="Home"
        options={{
          headerShown: false,

          drawerInactiveTintColor: '#4F6D77',
          drawerActiveTintColor: '#032F3C',
        }}
        component={Bottom}
      /> */}
      <Drawer.Screen
        name="Pray"
        options={{
          headerShown: false,
          drawerInactiveTintColor: '#4F6D77',
          drawerActiveTintColor: '#032F3C',
          headerTintColor: '#24BFF0',
        }}
        component={Prayer}
      />
      <Drawer.Screen
        name="Notifications"
        options={{
          headerShown: false,
          drawerInactiveTintColor: '#4F6D77',
          drawerActiveTintColor: '#032F3C',
          headerTintColor: '#24BFF0',
        }}
        component={Notification}
      />
      <Drawer.Screen
        name="Channels"
        options={{
          headerShown: false,
          drawerInactiveTintColor: '#4F6D77',
          drawerActiveTintColor: '#032F3C',
          headerTintColor: '#24BFF0',
        }}
        component={Chanel}
      />
      <Drawer.Screen
        name="Saved"
        options={{
          headerShown: false,
          drawerInactiveTintColor: '#4F6D77',
          drawerActiveTintColor: '#032F3C',
          headerTintColor: '#24BFF0',
        }}
        component={Saved}
      />
      <Drawer.Screen
        name="Invite"
        options={{
          headerShown: false,
          drawerInactiveTintColor: '#4F6D77',
          drawerActiveTintColor: '#032F3C',
          headerTintColor: '#24BFF0',
        }}
        component={InviteFriend}
      />
      <Drawer.Screen
        name="Settings"
        options={{
          headerShown: false,
          drawerInactiveTintColor: '#4F6D77',
          drawerActiveTintColor: '#032F3C',
          headerTintColor: '#24BFF0',
        }}
        component={Setting}
      />
      <Drawer.Screen
        name="Help"
        options={{
          headerShown: false,
          drawerInactiveTintColor: '#4F6D77',
          drawerActiveTintColor: '#032F3C',
          headerTintColor: '#24BFF0',
        }}
        component={Help}
      />
    </Drawer.Navigator>
  );
}
