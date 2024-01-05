import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  ImageBackground,
  Dimensions,
  Animated,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { Divider } from 'react-native-paper';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Love from '@/assets/svg/redlove.svg';
import { setPrayers } from '@/src/redux/actions/GeneralActions';
import AntDesign from 'react-native-vector-icons/AntDesign';
import PrayerInputType from './PrayerInputType';
import PrayerSocials from './PrayerSocials';
import PrayerSocialsHome from './PrayerSocialsHome';
import { useNavigation } from '@react-navigation/native';

export default class LiveStreamFlatlist2 extends Component {
  constructor(props) {
    super(props);
    this.animatedValue = new Animated.Value(1);
    this.state = {
      sliderIndex: 0,
      gotop: false,
    };
  }

  setRef = (c) => {
    this.listRef = c;
  };

  onPressIn = () => {
    Animated.timing(this.animatedValue, {
      toValue: 1,

      useNativeDriver: true,
    }).reset();
    Animated.timing(this.animatedValue, {
      toValue: 0,
      duration: 6000,
      useNativeDriver: true,
    }).start();
  };

  scrollToIndex = (index, animated) => {
    try {
      if (this.state.sliderIndex < 0) {
        index = 0;
        this.listRef && this.listRef.scrollToIndex({ index, animated });
      } else if (this.props.prayers.length < this.state.sliderIndex) {
        index = this.props.prayers.length;
        this.listRef && this.listRef.scrollToIndex({ index, animated });
      } else {
        this.listRef && this.listRef.scrollToIndex({ index, animated });

        setTimeout(() => {
          this.onPressIn();
        }, 200);
      }
    } catch (error) {}
  };

  componentWillMount() {
    try {
      setInterval(
        function () {
          const { sliderIndex } = this.state;
          let nextIndex = 0;

          if (sliderIndex < this.props.prayers.length && !this.state.gotop) {
            nextIndex = sliderIndex + 1;
            this.setState({ sliderIndex: nextIndex });
            this.scrollToIndex(nextIndex, true);
          }
        }.bind(this),
        7000
      );
    } catch (error) {}
  }

  render() {
    return (
      <View>
        {!this.state.gotop ? (
          <View
            style={{
              height: getHeight(15),

              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {this.state.sliderIndex != 0 ? (
              <Animated.View
                style={{
                  width: '95%',
                  alignSelf: 'center',
                  opacity: this.animatedValue,
                  padding: 5,
                  borderRadius: 5,
                }}
              >
                <View style={{ flexDirection: 'row', width: '90%' }}>
                  {this.props.prayers[Math.round(this.state.sliderIndex - 1)]?.post?.prayerType ==
                  'anonymous' ? (
                    <View style={{ width: 40, height: 40, borderRadius: 25 }} />
                  ) : (
                    <FastImage
                      style={{ width: 40, height: 40, borderRadius: 25 }}
                      source={{
                        uri: this.props.prayers[Math.round(this.state.sliderIndex - 1)]?.userProfile
                          ?.profileImage,
                      }}
                      resizeMode={FastImage.resizeMode.stretch}
                    />
                  )}
                  <Text
                    style={{
                      fontWeight: '400',
                      alignSelf: 'center',
                      width: '90%',
                      color: 'white',
                      fontFamily: 'Rubik',
                      textAlign: 'left',
                      marginLeft: 7,
                      padding: 5,
                      paddingTop: 0,
                      paddingBottom: 15,
                      lineHeight: 20,
                    }}
                  >
                    {this.props.prayers[Math.round(this.state.sliderIndex - 1)]?.post?.prayer}
                  </Text>
                </View>
              </Animated.View>
            ) : null}
          </View>
        ) : null}
        <View style={this.state.gotop ? { height: getHeight(45) } : { height: getHeight(30) }}>
          <FlatList
            ref={this.setRef}
            data={this.props.prayers}
            contentContainerStyle={{ paddingBottom: getHeight(10) }}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            pagingEnabled={this.state.gotop == true ? false : true}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => this.props.goToprayer(item)}
                style={{
                  width: '95%',
                  alignSelf: 'center',
                  justifyContent: 'center',
                  height: getHeight(18),
                  paddingHorizontal: getWidth(4),
                  borderRadius: 5,
                }}
              >
                <View style={{ flexDirection: 'row', width: '90%' }}>
                  {item?.post?.prayerType == 'anonymous' ? (
                    <View style={{ width: 40, height: 40, borderRadius: 25 }} />
                  ) : (
                    <FastImage
                      style={{ width: 40, height: 40, borderRadius: 25 }}
                      source={{
                        uri: item?.userProfile?.profileImage,
                      }}
                      resizeMode={FastImage.resizeMode.stretch}
                    />
                  )}
                  <Text
                    style={{
                      fontWeight: '400',
                      alignSelf: 'center',
                      width: '90%',
                      color: 'white',
                      fontFamily: 'Rubik',
                      textAlign: 'left',
                      marginLeft: 7,
                      padding: 5,
                      paddingTop: 0,
                      paddingBottom: 15,
                      lineHeight: 20,
                    }}
                  >
                    {item?.post?.prayer}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: 7,
                    justifyContent: 'space-between',
                    paddingLeft: getWidth(10),
                    paddingRight: getWidth(2),
                  }}
                >
                  <PrayerSocialsHome
                    item={item}
                    color={'white'}
                    setPrayers={setPrayers}
                    prayers={this.props?.prayers}
                  />
                  {item?.post?.prayerType == 'anonymous' ? null : (
                    <TouchableOpacity
                      onPress={() => {
                        this.props.OpenConversation(item?.userProfile?._id);
                      }}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: '#9aacb1',
                          fontFamily: 'Rubik-Medium',
                        }}
                      >
                        Message
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            )}
            onMomentumScrollEnd={(event) => {
              let sliderIndex = event.nativeEvent.contentOffset.y
                ? event.nativeEvent.contentOffset.y / getHeight(18)
                : 0;
              this.setState({ sliderIndex });
            }}
            onMomentumScrollBegin={(event) => {
              this.state.sliderIndex > 1 ? this.setState({ gotop: true }) : null;
            }}
          />
        </View>
        {this.state.gotop ? (
          <TouchableOpacity
            onPress={() => this.setState({ sliderIndex: 5, gotop: false })}
            style={{
              position: 'absolute',
              bottom: getHeight(12),
              right: getWidth(3),
            }}
          >
            <AntDesign name={'caretdown'} color={'white'} size={getFontSize(3)} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
}
