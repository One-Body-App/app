import React, { useEffect, useState } from 'react';
import {
  Animated,
  View,
  Text,
  Platform,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import { TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { getFontSize, getWidth, getHeight } from '@/utils/ResponsiveFun';
import { getuserAll, getuserGet, setUserIntrest } from '@/redux/actions/UserAction';
import { ApiCall } from '@/services/api';
import AddIntrestsModel from './AddIntrestsModel';
import Button from './Button';
import { GeneralStyle } from '@/constants/GeneralStyle';
import { useNavigation, useTheme } from '@react-navigation/native';

const AnimatedHeader = ({
  animatedValue,
  HEADER_HEIGHT,
  leftComponent,
  tabBar,
  goBack,
  headerTitle,
  primarycolor,
  inerContent,
  backgroundImage,
}) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const token = useSelector((state) => state.auth.userToken);
  const intrest = useSelector((state) => state.user.userInrest);
  const user = useSelector((state) => state.auth.getProfileData);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [show, setShow] = useState(false);
  const headerHeight = animatedValue.interpolate({
    inputRange: [0, HEADER_HEIGHT + insets.top],
    outputRange: [HEADER_HEIGHT + insets.top, insets.top + 0],
    extrapolate: 'clamp',
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 180, 210],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  const opacity3 = animatedValue.interpolate({
    inputRange: [0, 180, 210],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });
  const chunk = (arr, size) =>
    arr.reduce((acc, e, i) => (i % size ? acc[acc.length - 1].push(e) : acc.push([e]), acc), []);

  const removeIntrest = async (id) => {
    const arr = intrest.filter((item) => item._id != id);
    dispatch(setUserIntrest(arr));
    try {
      const res = await ApiCall({
        route: `${user?.accountType}/remove-interest`,
        token: token,
        params: { interests: [id] },
        verb: 'patch',
      });
      if (res?.status == '200') {
        // dispatch(getuserGet({ token: token, get: 'interests', role: user?.role }));
        dispatch(getuserAll({ token: token }));
      } else {
        console.log('error', res?.response);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  const IntrestArray = (array) => {
    const arr = [];
    const a = chunk(array, Math.round(intrest.length / 2));

    if (a.length > 0 && a.length > 1) {
      for (let i = 0; i < a[0].length; i++) {
        let item1 = a[0][i];
        let item2 = a[1][i];
        arr.push({ item1, item2 });
      }
    } else if (a.length == 1) {
      let item1 = a[0][0];
      arr.push({ item1 });
    }
    return arr;
  };
  useEffect(() => {
    // dispatch(getuserGet({ token: token, get: 'interests', role: user?.role }));
  }, []);
  return (
    <View>
      <Animated.View style={{ ...styles.animview, height: headerHeight }}>
        <Animated.View style={{ ...styles.secview, opacity: opacity3 }}>
          <View style={styles.inputview}>
            <TextInput
              style={{ ...GeneralStyle.input }}
              mode="outlined"
              left={
                <TextInput.Icon
                  icon={() => (
                    <EvilIcons
                      name={'search'}
                      size={getFontSize(4)}
                      color={'#757575'}
                      style={{ marginTop: 5 }}
                    />
                  )}
                />
              }
              theme={{ roundness: 40 }}
              activeOutlineColor={'#126B87'}
              outlineColor="#126B87"
              label={'Search name, organization or topics'}
              placeholderTextColor={'#032F3C'}
            />
            {/* <TextInput
              mode="outlined"
              theme={{roundness: 20}}
              activeOutlineColor={'#5B7279'}
              label={'Search'}
              placeholder="Search"
              style={styles.sear}
            /> */}
            <TouchableOpacity style={{ alignSelf: 'center' }} onPress={() => setShow(true)}>
              <Text
                style={{
                  color: '#126B87',
                  marginVertical: getHeight(2),
                  fontFamily: 'Rubik-Medium',
                }}
              >
                Add More Interests
              </Text>
            </TouchableOpacity>

            <View style={styles.listviewstyle}>
              <FlatList
                data={IntrestArray(intrest)}
                style={{ height: getHeight(10) }}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                horizontal={true}
                ListEmptyComponent={() => (
                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        margin: 15,
                        fontSize: 12,
                        color: '#7c7c7c',
                        textAlign: 'center',
                        width: '70%',
                      }}
                    >
                      You have not any Interest click on link above to add interest.
                    </Text>
                  </View>
                )}
                renderItem={({ item, index }) => (
                  <View>
                    <TouchableOpacity
                      onPress={() => removeIntrest(item?.item1?._id)}
                      style={styles.itemtext}
                    >
                      <Text numberOfLines={1} style={{ color: 'white', maxWidth: getWidth(18) }}>
                        {item?.item1?.name}
                      </Text>
                    </TouchableOpacity>
                    {item?.item2?.name ? (
                      <TouchableOpacity
                        onPress={() => removeIntrest(item?.item2?._id)}
                        style={{
                          ...styles.itemtext,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text numberOfLines={1} style={{ color: 'white', maxWidth: getWidth(18) }}>
                          {item?.item2?.name}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
              />
            </View>
          </View>
        </Animated.View>
        <Animated.View
          style={{
            ...styles.headview2,
            opacity: opacity,
          }}
        >
          <Animated.Text style={{ ...styles.titletext, opacity: opacity }}>
            Explore Influencers & Organizations
          </Animated.Text>
        </Animated.View>
        <Animated.View
          style={{
            ...styles.headview,
            opacity: opacity3,
          }}
        >
          <TouchableOpacity onPress={() => goBack()}>
            <Ionicons name="chevron-back-outline" color={colors.primary} size={20} />
          </TouchableOpacity>
          <Animated.Text
            style={{
              ...styles.titletext,
              opacity: opacity3,
              width: '60%',
              textAlign: 'center',
            }}
          >
            Explore Influencers & Organizations
          </Animated.Text>
          <View />
        </Animated.View>
      </Animated.View>
      {tabBar}
      <AddIntrestsModel setShow={setShow} show={show} />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: 'white',
  },
  show: {
    fontWeight: 'bold',
    position: 'absolute',
  },
  secview: { flex: 1, justifyContent: 'flex-end' },
  animview: {
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  itemtext: {
    backgroundColor: '#032F3C',

    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 2,
    marginVertical: 2,

    borderWidth: 1,
    borderColor: 'gray',
  },
  componentview: {
    alignSelf: 'flex-end',
    position: 'absolute',
  },
  animtext: {
    height: 50,
    marginTop: -5,
    width: '100%',
    position: 'absolute',
  },
  listviewstyle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',

    height: getHeight(10),
    justifyContent: 'center',
  },
  inputview: {
    justifyContent: 'space-around',
    height: 170,
    width: '100%',

    alignSelf: 'flex-end',
  },
  sear: {
    height: getHeight(5),
    width: getWidth(70),
    alignSelf: 'center',
  },
  headview: {
    height: getHeight(8),
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'white',
    justifyContent: 'space-between',
    padding: 10,
    alignItems: 'center',
    shadowColor: '#126BB7',
    shadowOffset: {
      width: 0,
      height: 25,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 0,
  },
  headview2: {
    height: getHeight(7),
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'white',
    justifyContent: 'center',
    padding: 10,
    alignItems: 'center',
  },
  titletext: {
    fontSize: getFontSize(2.5),
    fontFamily: 'Rubik-Medium',
    color: '#032F3C',
  },
});

export default AnimatedHeader;
