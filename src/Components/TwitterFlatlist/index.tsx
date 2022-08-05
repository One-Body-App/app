import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, Text, View } from 'react-native';
import { styles } from './styles';
import Social from '@/assets/svg/Social.svg';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import { useSelector } from 'react-redux';
import { ApiCall } from '@/services/api';

const TwitterFlatlist = () => {
  const [tweets, setTweets] = useState([]);

  const getTwiters = async (id) => {
    try {
      const res = await ApiCall({
        route: `https://api.twitter.com/2/users/1380592017936375815/tweets?tweet.fields=attachments,created_at&media.fields=preview_image_url&expansions=attachments.media_keys`,
        token:
          'AAAAAAAAAAAAAAAAAAAAAFP6dQEAAAAAkF1k78i42go%2BLLsmlJcE58hCcCw%3DCHdg4ofpqUzHzmx7tdNw2Op8UMCApSSZ5rOceOobMF1kIuXvcT',
        verb: 'get',
        baseurl: false,
      });
      if (res?.status == '200') {
        setTweets([...tweets, ...res?.response?.data]);
      } else {
        console.log('error', res?.response);
      }
    } catch (e) {
      console.log(`saga get my twitter timline error -- `, e.toString());
    }
  };
  var urlRegex = /(https?:\/\/[^ ]*)/;
  useEffect(() => {
    getTwiters();
  }, []);

  return (
    <FlatList
      data={tweets}
      contentContainerStyle={{ marginTop: getHeight(1) }}
      showsHorizontalScrollIndicator={false}
      ListFooterComponent={() => (
        <View style={styles.socialpostfooter}>
          <Text style={{ color: '#757575' }}>View more</Text>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
      renderItem={({ item }) => (
        <View style={styles.socialpostview}>
          {/* <Image
            style={styles.socialpostimage}
            resizeMode={'stretch'}
            source={require('./@/assets/images/Photo.png')}
          /> */}
          <Text
            style={{
              padding: 5,
              fontFamily: 'Rubik',
              lineHeight: 18,
              color: '#032f3c',
              marginTop: getHeight(1),
              textAlign: 'center',
            }}
          >
            {item?.text}
          </Text>
          <View style={{ flexDirection: 'row', padding: 5 }}>
            <Social />
            <Text
              style={{
                marginLeft: 5,
                fontFamily: 'Rubik',
                color: '#68828A',
                alignItems: 'center',
              }}
            >
              @bishopjakes
            </Text>
          </View>
        </View>
      )}
    />
  );
};
export default TwitterFlatlist;
