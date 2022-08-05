import React, { useRef, useState } from 'react';
import { FlatList, Image, Text, View } from 'react-native';
import { styles } from './styles';
import Social from '@/assets/svg/Social.svg';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';

const InstagramFlatlist = () => {
  const time = [
    {
      picture: require('@/assets/images/pray.jpeg'),
      name: '6 ways digital tech is transforming the...',
      sub: '11h',
    },
    {
      picture: require('@/assets/images/pray.jpeg'),
      name: '6 ways digital tech is transforming the...',
      sub: '1h',
    },
    {
      picture: require('@/assets/images/pray2.jpeg'),
      name: '6 ways digital tech is transforming the...',
      sub: '5h',
    },
    {
      picture: require('@/assets/images/pray.jpeg'),
      name: '6 ways digital tech is transforming the...',
      sub: '5h',
    },
  ];
  return (
    <FlatList
      style={styles.liststyle}
      contentContainerStyle={{
        justifyContent: 'space-between',
        marginTop: getHeight(1),
      }}
      data={time}
      keyExtractor={(item, index) => index.toString()}
      showsVerticalScrollIndicator={false}
      numColumns={2}
      renderItem={({ item, index }) => (
        <View style={styles.view2}>
          <Image style={styles.pictureview} source={item.picture} />
          <View style={styles.heartimg}>
            <Image style={{ width: 15, height: 15 }} source={require('@/assets/icons/heart.png')} />
            <Text style={styles.nmbrtext}>2,110</Text>
          </View>
        </View>
      )}
    />
  );
};
export default InstagramFlatlist;
