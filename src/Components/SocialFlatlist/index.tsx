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
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();

  const getSocialPosts = async () => {
    try {
      const res = await ApiCall({
        route: `user/get-following-social`,
        token,
        verb: 'get',
      });
      if (res?.status == 200) {
        console.log(res?.response);
        dispatch(SetSocial([...res?.response, ...socialPost]));
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log(`saga get twitter timline  error -- `, e.toString());
    }
  };

  const { colors } = useTheme();

  return (
    <>
      {socialPost.map((item, i) => (
        <View key={i} style={{ ...styles.socialpostview, backgroundColor: colors.card, margin: 7 }}>
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
      ))}
    </>
  );
};
export default SocialFlatlist;
