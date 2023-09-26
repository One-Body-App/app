import { CompositeNavigationProp, NavigationProp, useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import React from 'react';
import { View, Share, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from 'react-native-modal';
import { GeneralStyle } from '@/src/constants/GeneralStyle';
import Button from '../Button';
import Feather from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '@/src/_Navigation/types';
import { styles } from './style';
import { getHeight } from '@/utils/ResponsiveFun';
import { setLoader } from '@/src/Redux/actions/GeneralActions';
import { ApiCall } from '@/src/Services/api';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { ArticleType } from '@/utils/types';
import { isObject } from 'lodash';
import { getuserGet } from '@/src/Redux/actions/UserAction';
import {
  ExploreStackParamsList,
  MainDrawerParamsList,
  MainBottomStackParamsList,
} from '@/src/navigator/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';

type ScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ExploreStackParamsList, 'Explore'>,
  CompositeNavigationProp<
    DrawerNavigationProp<MainDrawerParamsList, 'Main'>,
    BottomTabNavigationProp<MainBottomStackParamsList, 'ExploreTab'>
  >
>;
const OptionsModal = ({
  show,
  setShow,
  currentPopupItem,
  hideChannelSection,
  height,
}: {
  show: boolean;
  setShow: (show: boolean) => void;
  currentPopupItem?: ArticleType;
  hideChannelSection?: boolean;
  height?: number;
}) => {
  const { colors, dark } = useTheme();
  const navigation = useNavigation<ScreenNavigationProp>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.getProfileData);
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

  const savePost = async (
    title: string,

    createdAt?: Date,
    userId?: string,
    link?: string,
    image?: string
  ) => {
    dispatch(setLoader(true));

    try {
      const res = await ApiCall({
        route: `user/save-post`,
        verb: 'post',
        token: token,
        params: {
          title,
          image,
          createdAt,
          userId,
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
  let isThisPostSaved = false;
  if (user?.savedPost) {
    user?.savedPost.forEach((savedPost) => {
      if (savedPost.link == currentPopupItem?.link) {
        isThisPostSaved = true;
      }
    });
  }

  return (
    <Modal
      backdropOpacity={0.3}
      isVisible={show}
      onBackdropPress={() => setShow(false)}
      onSwipeComplete={() => setShow(false)}
      swipeDirection={['down']}
      style={styles.bottomView}
    >
      <View
        style={[
          styles.content2,
          { height: height ?? getHeight(35), backgroundColor: colors.background },
        ]}
      >
        <View style={[styles.headLine, { backgroundColor: dark ? '#000000' : '#EAEAEA' }]} />
        <View style={styles.contview}>
          <View style={styles.saveview}>
            <View style={{ flex: 1, paddingRight: 5 }}>
              <Button
                btnStyle={[styles.savetuch, { backgroundColor: colors.onPrimary }]}
                text={isThisPostSaved ? 'Remove' : 'Save'}
                leftIcon={
                  <Feather
                    style={{ marginRight: 3 }}
                    name="bookmark"
                    size={17}
                    color={colors.secondary}
                  />
                }
                btnTextStyle={{ color: colors.secondary }}
                onPress={() => {
                  if (isThisPostSaved) {
                    if (currentPopupItem?.link) removePost(currentPopupItem?.link);
                  } else {
                    savePost(
                      isObject(currentPopupItem?.title)
                        ? currentPopupItem?.title?.a.$text
                        : currentPopupItem?.title,

                      currentPopupItem?.created,
                      currentPopupItem?.userData._id,
                      currentPopupItem?.link,
                      currentPopupItem?.image.url
                    );
                  }
                }}
              />
            </View>

            {/* <TouchableOpacity style={styles.savetuch}>
                <Text style={{color: '#032F3C'}}>Save</Text>
              </TouchableOpacity> */}
            <View style={{ flex: 1, paddingLeft: 5 }}>
              <Button
                btnStyle={[styles.sharetouch, { backgroundColor: colors.onPrimary }]}
                text="Share"
                leftIcon={
                  <MaterialCommunityIcons
                    style={{ marginRight: 3 }}
                    name="share-outline"
                    size={18}
                    color={colors.secondary}
                  />
                }
                btnTextStyle={{ color: colors.secondary }}
                onPress={async () => {
                  await Share.share({
                    title: `${currentPopupItem?.title}`,
                    url:
                      Platform.OS == 'ios' && currentPopupItem?.link ? currentPopupItem?.link : '',
                    message:
                      Platform.OS == 'android' && currentPopupItem?.link
                        ? currentPopupItem?.link
                        : '',
                  });
                }}
              />
            </View>

            {/* <TouchableOpacity style={styles.sharetouch}>
                <MaterialCommunityIcons name="rocket" size={20} color="#900" />
                <Text style={{color: '#032F3C'}}>Share</Text>
              </TouchableOpacity> */}
          </View>
          {/* <Button
              btnStyle={styles.reporttouch}
              text="Report"
              leftIcon={
                <AntDesign
                  style={{ marginRight: 5 }}
                  name="infocirlceo"
                  size={14}
                  color="#E90202"
                />
              }
              btnTextStyle={{ color: '#E90202' }}
              onPress={() => console.log('press')}
            /> */}
          {/* <TouchableOpacity style={styles.reporttouch}>
              <Text style={{color: '#E90202'}}>Report</Text>
            </TouchableOpacity> */}
          {/* <TouchableOpacity style={styles.linktouch}>
              <Text style={{color: '#032F3C'}}>Link</Text>
            </TouchableOpacity> */}
          {hideChannelSection ? null : (
            <View>
              <Button
                btnStyle={{
                  ...GeneralStyle.btn,
                  backgroundColor: colors.onPrimary,
                  flexDirection: 'row',
                  flexGrow: 1,
                  marginHorizontal: 0,
                }}
                text="View Channel"
                btnTextStyle={{ color: colors.secondary }}
                onPress={() => {
                  setShow(false);
                  if (currentPopupItem) {
                    navigation.navigate('Main', {
                      screen: 'ExploreTab',
                      params: {
                        screen: 'UserProfile',
                        params: {
                          id: currentPopupItem?.userData._id,
                        },
                      },
                    });
                  }
                }}
              />
            </View>
          )}

          {/* <Button
              btnStyle={{
                ...GeneralStyle.btn,
                backgroundColor: '#f6f6f6',
                flexDirection: 'row',
              }}
              text="Unsubscribe"
              btnTextStyle={{ color: '#032F3C' }}
              onPress={() => console.log('press')}
            /> */}

          <Button
            text={'CLOSE'}
            btnStyle={{
              ...GeneralStyle.btn,
              flexDirection: 'row',
              flexGrow: 1,
            }}
            btnTextStyle={{ ...GeneralStyle.btnText, color: colors.secondary }}
            onPress={() => {
              setShow(false);
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

export default OptionsModal;
