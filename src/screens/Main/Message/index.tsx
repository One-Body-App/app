import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
// import Swipeout from 'react-native-swipeout';
// import Swipeable from 'react-native-swipeable';
import {
  SafeAreaView,
  FlatList,
  View,
  Image,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Divider } from 'react-native-paper';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { getFontSize, getHeight, getWidth, timeSince } from '@/utils/ResponsiveFun';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import Header from '@/components/Header';
import { getChats, setAllSms } from '@/redux//actions/GeneralActions';
import { ApiCall } from '@/services/api';
import EmptySms from '@/assets/svg/icon_messages.svg';

const data = [
  { id: 1, Name: 'March SouLaComa', Hour: '2 hours ago' },
  { id: 2, Name: 'Movie 2', Hour: '2 hours ago' },
  { id: 3, Name: 'Movie 3', Hour: '2 hours ago' },
  { id: 4, Name: 'Movie 4', Hour: '2 hours ago' },
  { id: 5, Name: 'Movie 5', Hour: '2 hours ago' },
  { id: 6, Name: 'Movie 6', Hour: '2 hours ago' },
  { id: 7, Name: 'Movie 7', Hour: '2 hours ago' },
  { id: 8, Name: 'Movies 8', Hour: '2 hours ago' },
  { id: 9, Name: 'Movies 9', Hour: '2 hours ago' },
  { id: 10, Name: 'Movie 10', Hour: '2 hours ago' },
  { id: 11, Name: 'Movie 11', Hour: '2 hours ago' },
];

const Message = (props) => {
  const dispatch = useDispatch();
  // const [chats, setChat] = useState([]);
  const token = useSelector((state) => state.auth.userToken);
  const chats = useSelector((state) => state.general.chats);
  const [refreshing, setRefreshing] = useState(false);

  const getAllSms = async (reciverId) => {
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
  useEffect(() => {
    dispatch(getChats({ token }));
  }, []);
  const rightButtons = [
    <View
      style={{
        backgroundColor: 'red',
        flex: 1,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: getFontSize(2.5),
          marginLeft: getWidth(3),
        }}
      >
        Delete
      </Text>
    </View>,
  ];
  // const sortedChannels = useMemo(
  //   () =>
  //     chats.sort(
  //       (channelA, channelB) =>
  //         channelB.last_message?.createdAt - channelA.last_message?.createdAt,
  //     ),
  //   [chats],
  // );

  const deleteChat = async (id) => {
    try {
      const res = await ApiCall({
        route: `chat/chat-room/delete/${id}`,
        token: token,
        verb: 'delete',
      });
      if (res?.status == '200') {
        dispatch(getChats({ token }));
      } else {
        console.log('error', res?.response);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <Header
        title={'Messages'}
        leftView={
          <TouchableOpacity onPress={() => props.goBack()}>
            <Ionicons name="chevron-back" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
        refreshing={refreshing}
        ListEmptyComponent={() => (
          <View
            style={{
              flex: 1,
              height: getHeight(80),
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <EmptySms />
            <Text
              style={{
                fontSize: getFontSize(3),
                color: '#032F3C',
                fontWeight: '500',
                fontFamily: 'Rubik-Regular',
              }}
            >
              No messages yet
            </Text>
            <Text
              style={{
                width: '80%',
                textAlign: 'center',
                color: '#888C93',
                letterSpacing: 0.5,
                marginTop: 5,
              }}
            >
              Looks like you haven’t initiated a converstion with any of your influencers
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => dispatch(getChats({ token }))} />
        }
        renderItem={({ item, index }) => (
          <Swipeable onRightActionRelease={() => deleteChat(item?._id)} rightButtons={rightButtons}>
            <TouchableOpacity
              onPress={() => {
                getAllSms(item?.id);
                props.navigation.navigate(
                  'conversation',
                  item?.receiver
                    ? {
                        reciver: item?.receiver,
                        reciverId: item?._id,
                      }
                    : { reciver: item?.sender, reciverId: item?._id }
                );
              }}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                paddingHorizontal: 10,
                height: getHeight(10),
                alignItems: 'center',
              }}
            >
              <Image
                style={{ height: 60, width: 60, borderRadius: 30 }}
                source={
                  item?.receiver
                    ? { uri: item?.receiver?.profileImage }
                    : { uri: item?.sender?.profileImage }
                }
              />
              <View style={{ flex: 1, marginLeft: getWidth(5) }}>
                <Text
                  style={{
                    fontSize: getFontSize(2.3),
                    fontFamily: 'Rubik-Medium',
                  }}
                >
                  {item?.receiver ? item?.receiver?.name : item?.sender?.name}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    color: '#70747d',
                  }}
                >
                  {item?.last_message?.message || 'Tap to start chatting...'}
                </Text>
              </View>
              <View>
                {item?.unread_count ? (
                  <View
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      alignSelf: 'flex-end',
                      borderRadius: 10,
                      width: 20,
                      height: 20,
                      marginBottom: 7,
                      backgroundColor: '#032f3c',
                      color: 'white',
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                      }}
                    >
                      {item?.unread_count}
                    </Text>
                  </View>
                ) : null}
                <Text style={{ color: '#70747d' }}>
                  {timeSince(new Date(item?.last_message?.createdAt))}
                  ago
                </Text>
              </View>
            </TouchableOpacity>
          </Swipeable>
        )}
      />
    </View>
  );
};

export default Message;
