import React, { useRef, useState } from 'react';
import { Animated, FlatList, Image, Text, View } from 'react-native';
import { styles } from './styles';
import Social from '@/assets/svg/Social.svg';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import { useSelector } from 'react-redux';

const BlogFlatlist = () => {
  // const offset = useRef(new Animated.Value(0)).current;
  const user = useSelector((state) => state.auth.userProfile);

  const Data = [
    { id: 1, image: 'dfafds', Text: 'fsda' },
    { id: 2, image: 'dfafds', Text: 'fsda' },
    { id: 3, image: 'dfafds', Text: 'fsda' },
    { id: 4, image: 'dfafds', Text: 'fsda' },
    { id: 5, image: 'dfafds', Text: 'fsda' },
    { id: 6, image: 'dfafds', Text: 'fsda' },
    { id: 7, image: 'dfafds', Text: 'fsda' },
    { id: 8, image: 'dfafds', Text: 'fsda' },
    { id: 9, image: 'dfafds', Text: 'fsda' },
  ];

  // const opacity = offset.interpolate({
  //   inputRange: [0, 180, 210],
  //   outputRange: [0, 0.5, 1],
  //   extrapolate: 'clamp',
  // });
  return (
    <View>
      <FlatList
        data={Data}
        numColumns={2}
        contentContainerStyle={{
          marginTop: getHeight(1),
        }}
        // onScroll={Animated.event(
        //   [{nativeEvent: {contentOffset: {y: offset}}}],
        //   {
        //     useNativeDriver: false,
        //   },
        // )}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={() => <View style={{ padding: 7 }} />}
        ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
        renderItem={() => (
          <View style={styles.blogpostview}>
            <Image
              style={styles.blogpostimage}
              resizeMode={'stretch'}
              source={require('@/assets/images/pray.jpeg')}
            />
            <Text numberOfLines={2} style={styles.blogpostpara}>
              Churchgoers Proud of Church’s COVID-19 kfdsakkf fdskfds kfka
            </Text>
            <Text style={styles.blogposthour}>11h ago</Text>
          </View>
        )}
      />
      {/* <Animated.View
        style={{
          ...styles.headview2,
          opacity: opacity,
        }}>
        <Animated.Text style={{...styles.titletext, opacity: opacity}}>
          {user?.name}
        </Animated.Text>
      </Animated.View> */}
    </View>
  );
};
export default BlogFlatlist;
