import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import Modal from 'react-native-modal';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-simple-toast';
import { TabView, SceneMap } from 'react-native-tab-view';
import Add_badges from '@/assets/svg/Add_badges.svg';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Button from '@/components/Button';
import { styles } from './styles';
import FastImage from 'react-native-fast-image';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { GernalStyle } from '../../../constants/GernalStyle';
import TwitterFlatlist from '@/components/TwitterFlatlist';
import BlogFlatlist from '@/components/BlogFlatlist';
import InstagramFlatlist from '@/components/InstagramFlatlist';
import Icon from 'react-native-vector-icons/Ionicons';
import ImageModal from 'react-native-image-modal';
import { setLoader } from '@/redux//actions/GernalActions';
import { ApiCall } from '@/services/api';

const UserProfile = ({ navigation, route }) => {
  const { id, role } = route.params;
  const dispatch = useDispatch();
  const [user, setUser] = useState();
  const token = useSelector((state) => state.auth.userToken);

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'Instagram', title: 'Instagram' },
    { key: 'Blog', title: 'Blog' },
    { key: 'Twitter', title: 'Twitter' },
  ]);

  const renderScene = SceneMap({
    Instagram: InstagramFlatlist,
    Blog: BlogFlatlist,
    Twitter: TwitterFlatlist,
  });
  const renderTabBar = (props) => {
    return (
      <View style={styles.tabBar}>
        {props.navigationState.routes.map((route, i) => {
          return (
            <TouchableOpacity style={styles.tabItem} onPress={() => setIndex(i)}>
              <Animated.Text
                style={
                  props?.navigationState?.index == i
                    ? {
                        color: '#032F3C',
                        fontFamily: 'Rubik-Medium',
                      }
                    : {
                        color: '#032F3C',
                        fontFamily: 'Rubik-Regular',
                      }
                }
              >
                {route.title}
              </Animated.Text>
              {props?.navigationState?.index == i ? <View style={styles.propview} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  useEffect(() => {
    dispatch(setLoader(true));
    getUser();
  }, []);
  const getUser = async () => {
    try {
      const res = await ApiCall({
        route: `user/${id}/${role}`,
        verb: 'get',
        token: token,
      });
      if (res?.status == '200') {
        dispatch(setLoader(false));
        setUser(res?.data);
      } else {
        console.log('error', res?.data);
        dispatch(setLoader(false));
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  const OpenConversation = async (id) => {
    // onCreateOrJoin(id);
    dispatch(setLoader(true));
    try {
      const res = await ApiCall({
        params: { receiver: id },
        token: token,
        route: 'chat/new-chat-room',
        verb: 'post',
      });

      if (res?.status == '200') {
        dispatch(setLoader(false));

        navigation.navigate(
          'conversation',
          res?.data?.receiver
            ? {
                reciver: res?.data?.receiver,
                reciverId: res?.data?._id,
              }
            : { reciver: res?.data?.sender, reciverId: res?.data?._id }
        );
        // navigation.navigate('conversation');
      } else {
        console.log('error', res?.data);
      }
    } catch (e) {
      console.log('chanel create err --- ', e);
    }
  };

  return (
    <View style={{ backgroundColor: 'white', flex: 1 }}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <ScrollView
        contentContainerStyle={{ height: getHeight(125) }}
        showsVerticalScrollIndicator={false}
        style={{ marginTop: getHeight(2) }}
      >
        <View style={{ alignSelf: 'center' }}>
          <ImageModal
            style={{
              width: 150,
              height: 150,
              alignSelf: 'center',
              marginVertical: 10,
              borderRadius: 75,
            }}
            source={{
              uri: user?.profileImage,
            }}
            resizeMode={'contain'}
          />
        </View>
        <Text
          style={{
            fontWeight: '500',
            color: '#032f3c',
            textAlign: 'center',
            fontSize: 20,
          }}
        >
          {user?.name}
        </Text>
        <Text
          style={{
            textAlign: 'center',
            marginBottom: 10,
            color: '#5b7279',
            marginTop: 5,
          }}
        >
          @{user?.userName}
        </Text>
        {/* {user.role != 'individual' ? (
          <Text style={{textAlign: 'center', color: '#5B7279'}}>
            @nickdreamsalot . Minister and Ideator
          </Text>
        ) : null} */}
        <View style={styles.manyimageview}>
          <View>
            <FlatList
              data={user?.badges_data}
              numColumns={3}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <FastImage
                  style={styles.firstimage}
                  source={{
                    uri: item?.badge,
                  }}
                  resizeMode={FastImage.resizeMode.stretch}
                />
              )}
            />
          </View>
        </View>
        {user?.isInfluencer == true ? (
          <Text style={styles.onebodytext}>{user?.website}</Text>
        ) : null}
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              color: '#032f3c',
              fontFamily: 'Rubik-Regular',
              marginVertical: getHeight(1),
            }}
          >
            Influencing 1.4k
          </Text>
        </View>
        <View style={styles.bottomView}>
          <Button
            text={'Subscribed'}
            btnStyle={{
              ...styles.btn,
              backgroundColor: '#F6F6F6',
              borderWidth: 0,
            }}
            btnTextStyle={{
              ...GernalStyle.btnText,
              color: '#595959',
              letterSpacing: 0,
            }}
          />
          <Button
            text={'Message'}
            onPress={() => OpenConversation(user?._id)}
            btnStyle={styles.btn}
            btnTextStyle={{
              ...GernalStyle.btnText,
              color: '#032f3c',
              letterSpacing: 0,
            }}
          />
        </View>

        {user?.isInfluencer == true ? (
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            renderTabBar={renderTabBar}
            onIndexChange={setIndex}
            initialLayout={{ width: getWidth(100) }}
          />
        ) : null}
      </ScrollView>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.header}>
        <Icon name="chevron-back" style={{ margin: getFontSize(3) }} size={20} color={'#032f3c'} />
      </TouchableOpacity>
    </View>
  );
};
export default UserProfile;
