import React, { useState } from 'react';
import { Text, View, Touchable, StatusBar, Image, FlatList, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import Header from '@/components/Header';

import Save from '@/assets/svg/Save.svg';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import FastImage from 'react-native-fast-image';
import { OpenURLButton } from '@/src/Services/constants';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/Navigation/types';
import { setLoader } from '@/src/Redux/actions/GeneralActions';
import { ApiCall } from '@/src/Services/api';
import { getuserGet } from '@/src/Redux/actions/UserAction';
import { useTheme } from '@react-navigation/native';
import { DrawerScreenProps } from '@react-navigation/drawer';

type Props = DrawerScreenProps<RootStackParamList, 'Saved'>;

const Saved = ({ navigation }: Props) => {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const dispatch = useDispatch();

  const removePost = async (link: string) => {
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: `user/remove-post`,
        verb: 'delete',
        token: token,
        params: {
          link,
        },
      });

      if (res?.status == 200) {
        dispatch(getuserGet({ token }));
      }
      dispatch(setLoader(false));
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };
  const { colors, dark } = useTheme();
  return (
    <View style={styles.container}>
      <GeneralStatusBar hidden={false} translucent={true} />

      <Header
        title={'Saved'}
        leftView={
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />

      <View
        style={{
          marginTop: getHeight(4),
          flex: 1,
          paddingHorizontal: 5,
        }}
      >
        <FlatList
          data={user?.savedPost}
          numColumns={2}
          columnWrapperStyle={{ alignItems: 'flex-start' }}
          ItemSeparatorComponent={() => <View style={{ height: getHeight(3) }} />}
          ListEmptyComponent={() => {
            return (
              <View>
                <Text>No saved posts</Text>
              </View>
            );
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                ...styles.blogpostview,
                marginHorizontal: 10,
              }}
              onPress={() => {
                OpenURLButton(item.link);
              }}
            >
              <FastImage
                style={styles.blogpostimage}
                resizeMode={'stretch'}
                source={{ uri: item.image }}
              />
              <View
                style={{
                  top: 0,
                  position: 'absolute',
                  backgroundColor: 'white',
                  height: getHeight(4.5),
                  width: getWidth(8.5),
                  borderBottomRightRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderBottomLeftRadius: 10,
                  right: 15,
                }}
              >
                <Save height={getHeight(3)} width={getWidth(3)} />
              </View>
              <Text
                numberOfLines={2}
                style={[styles.blogpostpara, { color: dark ? colors.text : '#032F3C' }]}
              >
                {item.title}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  removePost(item.link);
                }}
              >
                <Text>Remove</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => `${item.title}-${item.createdAt}`}
        />
      </View>
    </View>
  );
};
export default Saved;
