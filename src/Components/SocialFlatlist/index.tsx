import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
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
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [hasMore, setHasMore] = useState(true);
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);

  const getSocialPosts = async (pageNumber: number) => {
    try {
      const res = await ApiCall({
        route: `user/get-following-social/${pageNumber}`,
        token,
        verb: 'get',
      });
      if (res?.status == 200) {
        setHasMore(res?.response.hasMore);
        dispatch(SetSocial([...res?.response.content, ...socialPost]));
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log(`saga get twitter timline  error -- `, e.toString());
    }
    setPage(pageNumber);
  };

  useEffect(() => {
    const getData = async () => {
      await getSocialPosts(page);
    };
    getData();
  }, [page]);

  const { colors } = useTheme();

  return (
    <FlatList
      data={socialPost}
      style={{ flex: 1 }}
      renderItem={({ item, index }) => (
        <View
          key={index}
          style={{ ...styles.socialpostview, backgroundColor: colors.card, margin: 7 }}
        >
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
              color: colors.text,
              marginTop: getHeight(1),
              textAlign: 'center',
            }}
          >
            {item?.content}
          </Text>
          <View style={{ flexDirection: 'row', padding: 5 }}>
            {item?.source == 'twitter' ? <Twitter fill="#00acee" /> : null}
            <Text
              style={{
                marginLeft: 5,
                fontFamily: 'Rubik',
                color: '#68828A',
                alignItems: 'center',
              }}
            >
              @{item?.handler}
            </Text>
          </View>
        </View>
      )}
    />
    // <>
    //   {socialPost?.map((item, i) => (
    //     <View key={i} style={{ ...styles.socialpostview, backgroundColor: colors.card, margin: 7 }}>
    //       {item?.attachments ? (
    //         <Image
    //           style={styles.socialpostimage}
    //           resizeMode={'stretch'}
    //           source={require('@/assets/images/Photo.png')}
    //         />
    //       ) : null}
    //       <Text
    //         style={{
    //           padding: 5,
    //           fontFamily: 'Rubik',
    //           lineHeight: 18,
    //           color: colors.text,
    //           marginTop: getHeight(1),
    //           textAlign: 'center',
    //         }}
    //       >
    //         {item?.content}
    //       </Text>
    //       <View style={{ flexDirection: 'row', padding: 5 }}>
    //         {item?.source == 'twitter' ? <Twitter fill="#00acee" /> : null}
    //         <Text
    //           style={{
    //             marginLeft: 5,
    //             fontFamily: 'Rubik',
    //             color: '#68828A',
    //             alignItems: 'center',
    //           }}
    //         >
    //           @{item?.handler}
    //         </Text>
    //       </View>
    //     </View>
    //   ))}
    //   {hasMore ? (
    //     <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
    //       <TouchableOpacity
    //         onPress={async () => {
    //           await getSocialPosts(page + 1);
    //         }}
    //       >
    //         <Text>View More</Text>
    //       </TouchableOpacity>
    //     </View>
    //   ) : null}
    // </>
  );
};
export default SocialFlatlist;
