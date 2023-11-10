import React, { useEffect, useState } from 'react';
import { View, Touchable, StatusBar, Image, FlatList, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import Header from '@/src/components/Header';

import Save from '@/assets/svg/Save.svg';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import FastImage from 'react-native-fast-image';
import { OpenURLButton } from '@/src/Services/constants';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/src/_Navigation/types';
import { setLoader } from '@/src/Redux/actions/GeneralActions';
import { ApiCall } from '@/src/Services/api';
import { getuserGet } from '@/src/Redux/actions/UserAction';
import { useTheme } from '@react-navigation/native';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { StyledText } from '@/src/components/styled/Text';
import { Colors, Typography } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import { Bookmark, NotificationBing } from 'iconsax-react-native';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBookmark } from '@fortawesome/free-solid-svg-icons';
import { getProfile } from '@/src/Redux/actions/AuthActions';

type Props = DrawerScreenProps<RootStackParamList, 'Saved'>;

const Saved = ({ navigation }: Props) => {
  const user = useSelector((state: RootState) => state.auth.getProfileData);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const authState = useSelector((state: RootState) => state.auth);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const dispatch = useDispatch();

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      dispatch(
        getProfile.Request({
          token,
        })
      );
    });

    // Return the function to unsubscribe from the event so it gets removed on unmount
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (token) {
      dispatch(
        getProfile.Request({
          token,
        })
      );
    }
  }, [token, isRefreshing]);

  useEffect(() => {
    // if (authState.getProfileSuccess == false) {
    setIsRefreshing(false);
    // }
  }, [authState.getProfileSuccess]);

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
      <View
        style={{
          flex: 1,
          paddingHorizontal: 20,
        }}
      >
        <FlatList
          data={user?.savedPost}
          numColumns={2}
          contentContainerStyle={{ flexGrow: 1 }}
          onRefresh={() => {
            setIsRefreshing(true);
          }}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => {
            return (
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <View
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      backgroundColor: Colors.neutral[700],
                      marginBottom: spacing.x32,
                      borderRadius: borderRadius.max,
                      padding: spacing.x32,
                    }}
                  >
                    <FontAwesomeIcon icon={faBookmark} size={100} color={Colors.neutral[500]} />
                  </View>
                </View>
                <StyledText
                  style={[Typography.body.x4, { textAlign: 'center', marginBottom: spacing.x16 }]}
                >
                  You have not saved any post
                </StyledText>
                <StyledText
                  style={[
                    Typography.body.x2,
                    {
                      color: Colors.neutral[300],
                      textAlign: 'center',
                      paddingHorizontal: 40,
                    },
                  ]}
                >
                  Post you saved will show up here
                </StyledText>
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
              <StyledText
                numberOfLines={2}
                style={[styles.blogpostpara, { color: dark ? colors.text : '#032F3C' }]}
              >
                {item.title}
              </StyledText>
              <TouchableOpacity
                onPress={() => {
                  removePost(item.link);
                }}
              >
                <StyledText>Remove</StyledText>
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
