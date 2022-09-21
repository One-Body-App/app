import React, { useEffect, useState } from 'react';
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
import { GeneralStyle } from '../../../constants/GeneralStyle';
import TwitterFlatlist from '@/components/TwitterFlatlist';
import BlogFlatlist from '@/components/BlogFlatlist';
import InstagramFlatlist from '@/components/InstagramFlatlist';
import Icon from 'react-native-vector-icons/Ionicons';
import Selected from '@/assets/svg/Selected.svg';
import { ApiCall } from '@/services/api';
import { getProfile } from '@/redux//actions/AuthActions';
import ImageModal from 'react-native-image-modal';

const MyProfile = (props) => {
  const user = useSelector((state) => state.auth.userProfile);
  const token = useSelector((state) => state.auth.userToken);
  const dispatch = useDispatch();
  const [badgesList, setBadgesList] = useState([]);
  const [requestModel, setRequestModel] = useState(false);
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'Instagram', title: 'Instagram' },
    { key: 'Blog', title: 'Blog' },
    { key: 'Twitter', title: 'Twitter' },
  ]);

  const [selectedBadge, setSelectedBadge] = useState(user?.badges);

  const renderScene = SceneMap({
    Instagram: InstagramFlatlist,
    Blog: BlogFlatlist,
    Twitter: TwitterFlatlist,
  });
  const renderTabBar = (props) => {
    const inputRange = props.navigationState.routes.map((x, i) => i);

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
  const unselect = (id) => {
    const array = selectedBadge.filter((item) => item != id);

    setSelectedBadge(array);
  };

  const getBadeg = async () => {
    try {
      const res = await ApiCall({
        route: 'user/badges',
        verb: 'get',
        token: token,
      });
      if (res?.status == '200') {
        setBadgesList(res?.data);
      } else {
        console.log('error', res?.datas);
      }
    } catch (e) {
      console.log('saga error on what i Do -- ', e.toString());
    }
  };

  const setBadegs = async (id) => {
    try {
      const res = await ApiCall({
        route: 'user/assign-badge',
        token: token,
        params: { badges: selectedBadge },
        verb: 'patch',
      });
      if (res.status == '200') {
        dispatch(getProfile({ token: token, role: user.role }));
      } else {
        console.log('error', res);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    getBadeg();
  }, []);

  return (
    <View style={{ backgroundColor: 'white', flex: 1 }}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />
      <Modal
        backdropOpacity={0.3}
        isVisible={requestModel}
        onBackdropPress={() => setRequestModel(false)}
        onSwipeComplete={() => setRequestModel(false)}
        swipeDirection={['down']}
        style={styles.bottomView}
        onRequestClose={() => setRequestModel(false)}
      >
        <View style={styles.content2}>
          <View style={styles.headLine} />
          <View style={styles.profileview}>
            <Text
              style={{
                color: '#032F3C',
                marginLeft: 20,
                marginRight: 20,
                textAlign: 'center',
                letterSpacing: 0.25,
              }}
            >
              <Text style={{ fontWeight: 'bold' }}>Select upto 3 badage</Text> you would like to
              display on your profile
            </Text>
            <View style={{ marginTop: 10, height: getHeight(35) }}>
              <FlatList
                data={badgesList}
                numColumns={3}
                showsHorizontalScrollIndicator={false}
                ListFooterComponent={() => <View style={{ padding: 7 }} />}
                ItemSeparatorComponent={() => <View style={{ margin: 7 }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      selectedBadge.includes(item?._id)
                        ? unselect(item?._id)
                        : selectedBadge.length < 3
                        ? setSelectedBadge([...selectedBadge, item?._id])
                        : Toast.show('You cannot select more then 3 badges!');
                    }}
                    style={styles.ideaterview}
                  >
                    <FastImage
                      style={{ width: 100, height: 100, borderRadius: 50 }}
                      source={{
                        uri: item?.badge,
                      }}
                      resizeMode={FastImage.resizeMode.stretch}
                    />
                    {selectedBadge.includes(item?._id) ? (
                      <Selected
                        style={{
                          position: 'absolute',
                          alignSelf: 'center',

                          marginTop: getHeight(5),
                        }}
                      />
                    ) : null}
                    <Text
                      style={{
                        color: '#032F3C',
                        fontFamily: 'Rubik-Medium',
                        marginTop: getHeight(1),
                      }}
                    >
                      {item?.title}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                setBadegs();
                setRequestModel(false);
              }}
              style={{ ...GeneralStyle.btn, backgroundColor: '#e6eaec' }}
            >
              <Text
                style={{
                  color: '#032F3C',
                  fontWeight: 'bold',
                  letterSpacing: 1.25,
                }}
              >
                DONE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ScrollView
        contentContainerStyle={{ height: getHeight(102) }}
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

          <TouchableOpacity
            style={{ marginHorizontal: getWidth(1) }}
            onPress={() => {
              getBadeg();
              setRequestModel(true);
            }}
          >
            <Add_badges />
          </TouchableOpacity>
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
            text={'Edit Profile'}
            onPress={() => props.navigation.navigate('editProfile')}
            btnStyle={styles.btn}
            btnTextStyle={{
              ...GeneralStyle.btnText,
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
      <TouchableOpacity onPress={() => props.goBack()} style={styles.header}>
        <Icon name="chevron-back" style={{ margin: getFontSize(3) }} size={20} color={'#032f3c'} />
      </TouchableOpacity>
    </View>
  );
};
export default MyProfile;
