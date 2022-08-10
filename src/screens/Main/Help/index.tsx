import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Animated,
  Image,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
import { Avatar, Provider } from 'react-native-paper';
import DropDown from 'react-native-paper-dropdown';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { styles } from './styles';
import { Icon } from 'react-native-paper/lib/typescript/components/Avatar/Avatar';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import ZendeskChat from 'react-native-zendesk-chat';
import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/services/api';

import { setFaqs, setLoader } from '@/redux//actions/GeneralActions';

const Help = ({ navigation }) => {
  const [sections, setSections] = useState([]);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.userData);
  const getSections = async () => {
    try {
      const res = await ApiCall({
        route: 'https://onebodysupport.zendesk.com/api/v2/help_center/en-us/sections.json',
        verb: 'get',
        baseurl: false,
      });
      if (res?.status == '200') {
        dispatch(setLoader(false));
        setSections([...res?.response?.sections, { name: 'Contact us' }]);
      } else {
        console.log('error', res?.response);
        dispatch(setLoader(false));
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  const openChat = () => {
    ZendeskChat.startChat({
      name: user?.name,
      email: user?.mail,
      phone: user?.phone,
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
        name: 'optional',
        email: 'optional',
        phone: 'optional',
        department: 'optional',
      },
      localizedDismissButtonTitle: 'Close',
    });
  };
  const getFAQs = async (id) => {
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        route: `https://onebodysupport.zendesk.com/api/v2/help_center/en-us/sections/${id}/articles`,
        verb: 'get',
        baseurl: false,
      });
      if (res?.status == '200') {
        dispatch(setFaqs(res?.articles));
        dispatch(setLoader(false));

        navigation.navigate('Faqs');
      } else {
        console.log('error', res?.data);
        dispatch(setLoader(false));
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  useEffect(() => {
    dispatch(setLoader(true));
    getSections();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <Header
        title={'Help'}
        leftView={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        <FlatList
          data={sections}
          style={{ height: getHeight(10), alignSelf: 'center' }}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => {
                item?.name == 'Contact us' ? openChat() : getFAQs(item?.id);
              }}
              style={{
                height: getHeight(10),
                width: getWidth(100),
                borderBottomWidth: 0.2,
                borderBottomColor: '#70747D',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: getWidth(5),
                flexDirection: 'row',
              }}
            >
              <Text
                style={{
                  color: '#032F3C',
                  fontFamily: 'Rubik-Regular',
                  fontWeight: '400',
                  fontSize: 16,
                }}
              >
                {item?.name}
              </Text>
              <AntDesign name="right" size={18} color={'#70747D'} />
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
};
export default Help;
