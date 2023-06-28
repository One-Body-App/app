import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  TextInput,
  FlatList,
  Button,
} from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '@/components/Header';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { ApiCall } from '@/services/api';
import { useDispatch, useSelector } from 'react-redux';
import { getChats, setAllSms } from '@/redux//actions/GeneralActions';

const ConversationScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.userToken);
  const user = useSelector((state) => state.auth.getProfileData);
  const messages = useSelector((state) => state.general.allSms);

  const { reciver, reciverId } = route.params;
  console.log('reciver profile image  ', reciver?.accountType);
  const [sms, setSms] = useState(null);

  const smsSendDb = async (sms) => {
    try {
      const res = await ApiCall({
        params: { message: sms, receiver: reciver?._id, chatRoom: reciverId },
        token: token,
        route: 'chat/send-message',
        verb: 'post',
      });

      if (res?.status == '200') {
        getAllSms();
        dispatch(getChats({ token }));
        setSms(null);
      } else {
      }
    } catch (e) {
      console.log('chanel create err --- ', e);
    }
  };
  const getAllSms = async () => {
    try {
      const res = await ApiCall({
        route: `chat/chat-room/${reciverId}/messages`,
        verb: 'get',
        token: token,
      });
      if (res?.status == '200') {
        const newArrayOfObj = res?.response?.data.map(
          ({ sender: user, message: text, ...rest }) => ({
            user,
            text,
            ...rest,
          })
        );
        dispatch(setAllSms(newArrayOfObj));
      } else {
        console.log('error', res?.data);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  const readAllSms = async () => {
    try {
      const res = await ApiCall({
        route: `chat/chat-room/${reciverId}/messages`,
        verb: 'patch',
        token: token,
      });
      if (res?.status == '200') {
        dispatch(getChats({ token }));
      } else {
        console.log('error', res);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  useEffect(() => {
    getAllSms();
    readAllSms();
    return () => {
      dispatch(setAllSms([]));
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />
      <View style={styles.headview}>
        <Ionicons
          name="chevron-back"
          onPress={() => navigation.goBack()}
          style={{ opacity: 20 }}
          size={20}
        />

        <View style={styles.imageview2}>
          <Image style={styles.selfimage} source={{ uri: reciver?.profileImage }} />
          <Text style={styles.messagetext}>{reciver?.name}</Text>
        </View>

        <View style={{ width: getWidth(5) }} />
      </View>

      <GiftedChat
        messages={messages}
        renderAvatarOnTop
        renderInputToolbar={() => (
          <View style={styles.footer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputs}
                value={sms}
                placeholder="Write your message..."
                multiline={true}
                placeholderTextColor={'gray'}
                underlineColorAndroid="transparent"
                onChangeText={(e) => setSms(e)}
              />
            </View>

            <TouchableOpacity
              onPress={() => {
                smsSendDb(sms);
              }}
              style={styles.btnSend}
            >
              <MaterialIcons name="send" size={20} color="#032F3C" />
            </TouchableOpacity>
          </View>
        )}
        // renderUsernameOnMessage
        showAvatarForEveryMessage
        user={{
          _id: user?.userID,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headview: {
    height: getHeight(8),

    flexDirection: 'row',
    backgroundColor: 'white',
    justifyContent: 'space-between',
    padding: 10,
    alignItems: 'center',
    shadowColor: '#126BB7',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 0,
    marginBottom: -getHeight(3.8),
  },
  titletext: {
    fontSize: getFontSize(2.5),
    fontFamily: 'Rubik-Medium',
    color: '#032F3C',
  },
  viewstyle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getWidth(5),
    justifyContent: 'center',
    minHeight: getHeight(9),
    maxHeight: getHeight(9),
  },
  imageview2: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagetext: {
    fontSize: getFontSize(2.5),
    fontFamily: 'Rubik-Medium',
    color: '#032F3C',
  },
  selfimage: { width: 30, height: 30, marginRight: 10, borderRadius: 15 },
  imageviewstyle: {
    width: 40,
    borderRadius: 20,
    height: 40,
    position: 'absolute',
    left: -50,
  },
  list: {
    paddingHorizontal: 17,
  },
  footer: {
    flexDirection: 'row',

    height: 60,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    padding: 5,
  },
  btnSend: {
    backgroundColor: '#12D2D9',
    width: 50,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSend: {
    width: 20,
    height: 20,

    alignSelf: 'center',
  },
  inputContainer: {
    borderBottomColor: '#F5FCFF',
    backgroundColor: '#F6F6F6',
    borderRadius: 10,
    borderBottomWidth: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  inputs: {
    height: 40,
    marginLeft: 16,
    borderBottomColor: '#F6F6F6',
    flex: 1,
  },
  balloon: {
    maxWidth: 280,
    padding: 15,
    borderRadius: 10,
  },
  itemIn: {
    alignSelf: 'flex-start',
    marginLeft: 40,
  },
  itemOut: {
    alignSelf: 'flex-end',
    backgroundColor: '#EBF3F5',
  },
  time: {
    alignSelf: 'flex-end',
    margin: 15,
    fontSize: 12,
    color: '#808080',
  },
  item: {
    marginVertical: 8,
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#eeeeee',
    borderRadius: 30,
    padding: 5,
  },
});

export default ConversationScreen;
