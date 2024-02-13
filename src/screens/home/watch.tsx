import { View, FlatList, StyleSheet, Dimensions } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import RNFetchBlob from 'rn-fetch-blob';
import { Text } from 'react-native-paper';
import { MUX_SECRET_KEY, MUX_TOKEN_ID } from '@/src/services/constants';
import SingleReels from './singleReels';

function Watch() {
  const [MuxAssets, setMuxAssets] = useState<any>('');
  // const [loading, setLoading] = useState<boolean>(true);
  const mediaRefs = useRef([]);
  useEffect(() => {
    const BasicAUth = RNFetchBlob.base64.encode(`${MUX_TOKEN_ID}:${MUX_SECRET_KEY}`);
    try {
      axios
        .get('https://api.mux.com/video/v1/assets', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${BasicAUth}`,
          },
        })
        .then((response) => {
          setMuxAssets(response?.data?.data);
        });
    } catch (error) {
      console.log(`Something Went Wrong${error}`);
    }
  }, []);
  //   const onViewableItemsChanged = useRef(({ changed }) => {
  //     changed.forEach((element) => {
  //       const cell = mediaRefs.current[element.key];
  //       if (cell) {
  //         if (element.isViewable) {
  //           //   cell.play();
  //         } else {
  //           //   cell.stop();
  //         }
  //       }
  //     });
  //   });
  // const feedItemHeight = Dimensions.get('window').height - useMaterialNavBarHeight();
  const renderItem = ({ item, index }) => {
    return (
      <View
        style={{
          height: 635,
          backgroundColor: 'black',
        }}
      >
        <SingleReels
          item={item}
          index={index}
          // ref={(PostSingleRef) => (mediaRefs.current[item.id] = PostSingleRef)}
        />
        <View
          style={{
            position: 'absolute',
            backgroundColor: 'plum',
            bottom: 0,
          }}
        >
          <Text>AYUSHSH</Text>
        </View>
      </View>
    );
  };
  return (
    <View style={[{ flex: 1 }]}>
      <FlatList
        data={MuxAssets}
        // windowSize={4}
        // initialNumToRender={1}
        // maxToRenderPerBatch={2}
        // removeClippedSubviews
        // viewabilityConfig={{
        //   itemVisiblePercentThreshold: 0,
        // }}
        renderItem={renderItem}
        pagingEnabled
        keyExtractor={(item) => item.id.toString()}
        decelerationRate="normal"
        // onViewableItemsChanged={onViewableItemsChanged.current}
      />
    </View>
  );
}

export default Watch;
