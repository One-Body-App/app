import { NavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import React from 'react';
import { View, Share, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from 'react-native-modal';
import { GeneralStyle } from '@/src/constants/GeneralStyle';
import Button from '../Button';
import Feather from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '@/src/Navigation/types';
import { styles } from './style';
import { getHeight } from '@/utils/ResponsiveFun';
import { setLoader } from '@/src/Redux/actions/GeneralActions';
import { ApiCall } from '@/src/Services/api';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { ArticleType } from '@/utils/types';
import { isObject } from 'lodash';
import { getuserGet } from '@/src/Redux/actions/UserAction';

type ScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;

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
  const { colors } = useTheme();
  const navigation = useNavigation<ScreenNavigationProp>();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const user = useSelector((state: RootState) => state.auth.userProfile);
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
      <View style={[styles.content2, { height: height ?? getHeight(35) }]}>
        <View style={styles.headLine} />
        <View style={styles.contview}>
          <View style={styles.saveview}>
            <View style={{ flex: 1 }}>
              <Button
                btnStyle={styles.savetuch}
                text={isThisPostSaved ? 'Remove' : 'Save'}
                leftIcon={
                  <Feather style={{ marginRight: 3 }} name="bookmark" size={17} color="#032F3C" />
                }
                btnTextStyle={{ color: '#032F3C' }}
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
            <View style={{ flex: 1 }}>
              <Button
                btnStyle={styles.sharetouch}
                text="Share"
                leftIcon={
                  <MaterialCommunityIcons
                    style={{ marginRight: 3 }}
                    name="share-outline"
                    size={18}
                    color="#032F3C"
                  />
                }
                btnTextStyle={{ color: '#032F3C' }}
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
            <View style={{ marginHorizontal: 10 }}>
              <Button
                btnStyle={{
                  ...GeneralStyle.btn,
                  backgroundColor: '#f6f6f6',
                  flexDirection: 'row',
                }}
                text="View Channel"
                btnTextStyle={{ color: '#032F3C' }}
                onPress={() => {
                  setShow(false);
                  if (currentPopupItem)
                    navigation.navigate('UserProfile', {
                      id: currentPopupItem?.userData._id,
                    });
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
              // backgroundColor: 'red',
              // backgroundColor: '#e6eaec',
              flexDirection: 'row',
            }}
            btnTextStyle={{ ...GeneralStyle.btnText, color: '#032f3c' }}
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
