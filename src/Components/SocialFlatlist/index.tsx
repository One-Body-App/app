import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, RefreshControl, Text, View } from 'react-native';
import { styles } from './styles';
import Twitter from '@/assets/svg/Twitter.svg';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/services/api';
import { SetSocial } from '@/redux/actions/SocialActions';
import { useTheme } from '@react-navigation/native';
import { RootState } from '@/src/Redux/reducers/rootReducer';

const SocialFlatlist = () => {
  const socialPost = useSelector((state: RootState) => state.social.SocialPost);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();

  const twitterUsers = ['147895001', '1380592017936375815', '1481475468125745154'];

  const getTwiters = async (id: string) => {
    try {
      const res = await ApiCall({
        route: `https://api.twitter.com/2/users/${id}/tweets?tweet.fields=attachments,created_at&media.fields=preview_image_url`,
        token:
          'AAAAAAAAAAAAAAAAAAAAAFP6dQEAAAAAkF1k78i42go%2BLLsmlJcE58hCcCw%3DCHdg4ofpqUzHzmx7tdNw2Op8UMCApSSZ5rOceOobMF1kIuXvcT',
        verb: 'get',

        external: true,
      });
      if (res?.status == 200) {
        dispatch(SetSocial([...res?.response, ...socialPost]));
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log(`saga get twitter timline ${id} error -- `, e.toString());
    }
  };

  const getMultipleRandom = (arr: string[], num: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());

    return shuffled.slice(0, num);
  };
  const getAllTweets = () => {
    getMultipleRandom(twitterUsers, 2).map((item) => getTwiters(item));
  };

  const { colors } = useTheme();

  return (
    <FlatList
      data={socialPost}
      contentContainerStyle={{ marginTop: getHeight(1) }}
      showsHorizontalScrollIndicator={false}
      refreshing={refreshing}
      refreshControl={
        <RefreshControl enabled={true} refreshing={refreshing} onRefresh={() => getAllTweets()} />
      }
      ListFooterComponent={() => (
        <View style={styles.socialpostfooter}>
          <Text style={{ color: '#757575' }}>View more</Text>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
      renderItem={({ item }) => (
        <View style={{ ...styles.socialpostview, backgroundColor: colors.card }}>
          {item?.attachments ? (
            <Image
              style={styles.socialpostimage}
              resizeMode={'stretch'}
              source={require('@/assets/images/Photo.png')}
            />
          ) : null}
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
            <Twitter fill="#00acee" />
            <Text
              style={{
                marginLeft: 5,
                fontFamily: 'Rubik',
                color: '#68828A',
                alignItems: 'center',
              }}
            >
              @onebodynick
            </Text>
          </View>
        </View>
      )}
    />
  );
};
export default SocialFlatlist;
