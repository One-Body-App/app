import { useNavigation, useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import parse from 'rss-to-json';
import { SetAllBlog } from '@/redux/actions/SocialActions';
import { ApiCall } from '@/services/api';
import { styles } from './styles';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { OpenURLButton } from '@/src/Services/constants';

const HomeBlogComponent = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const allBlog = useSelector((state: RootState) => state.social.AllBlog);

  const [refreshing, setRefreshing] = useState(false);

  const getAllBlog = async () => {
    try {
      const res = await ApiCall({
        route: `blogs/get-feed/all-blogs`,
        verb: 'get',
        token: token,
      });
      if (res?.status == 200) {
        dispatch(SetAllBlog(res?.response[0]));
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };

  useEffect(() => {
    getAllBlog();
  }, []);

  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <FlatList
        data={allBlog}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        refreshControl={
          <RefreshControl enabled={true} refreshing={refreshing} onRefresh={() => getAllBlog()} />
        }
        ListHeaderComponent={() => <View style={{ padding: 2 }} />}
        ListFooterComponent={() => <View style={{ padding: 7 }} />}
        ItemSeparatorComponent={() => <View style={{ padding: 7 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              // navigation.navigate('BlogView', { url: item?.link });
              OpenURLButton(item?.link);
            }}
            style={{ ...styles.blogpostview, marginHorizontal: 10, backgroundColor: colors.card }}
          >
            {item?.enclosures ? (
              <FastImage
                style={styles.blogpostimage}
                resizeMode={'stretch'}
                source={{ uri: item?.enclosures[0]?.url }}
              />
            ) : null}
            <Text numberOfLines={2} style={styles.blogpostpara}>
              {item?.title}
            </Text>

            <Text numberOfLines={2} style={styles.blogposthour}>
              {item?.author}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
export default HomeBlogComponent;
