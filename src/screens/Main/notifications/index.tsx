import React, { Component, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Animated,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';

import Modal from 'react-native-modal';
import { Divider, RadioButton } from 'react-native-paper';
import Foundation from 'react-native-vector-icons/Foundation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SwipeListView } from 'react-native-swipe-list-view';
import AntDesign from 'react-native-vector-icons/AntDesign';

import styles from './styles';

import Button from '@/src/components/Button';
import Header from '@/src/components/Header';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { ApiCall } from '@/services/api';
import { useSelector } from 'react-redux';
import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import { useTheme } from '@react-navigation/native';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import { StyledText } from '@/src/components/styled/Text';
import SearchIcon from '@/assets/icons/search.svg';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { HomeStackParamsList } from '@/src/navigator/types';
import { NotificationType } from '@/utils/types';
import { NotificationBing } from 'iconsax-react-native';
import { StackScreenProps } from '@react-navigation/stack';

// create a component
type Props = StackScreenProps<HomeStackParamsList, 'Notifications'>;

const Notification = ({ navigation }: Props) => {
  const [DATA, SetDATA] = useState<NotificationType[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isModalVisible, setModal] = useState(false);
  const startValue = new Animated.Value(0);
  const endValue = 1;
  const duration = 5000;
  const toggleModal = () => {
    setModal(!isModalVisible);
  };

  const FadeIn = () => {
    Animated.timing(startValue, {
      toValue: endValue,
      duration: duration,

      useNativeDriver: true,
    }).start();
  };

  const getAllNotification = async () => {
    try {
      const res = await ApiCall({
        route: 'user/notifications',
        verb: 'get',
        token: token,
      });
      if (res?.status == 200) {
        SetDATA(res?.response?.data);
      } else {
        console.log('error', res?.response);
      }
    } catch (e: any) {
      console.log('saga error -- ', e.toString());
    }
  };
  useEffect(() => {
    getAllNotification();
  }, []);

  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <Modal
          backdropOpacity={0.3}
          isVisible={modalVisible}
          onBackdropPress={() => setModalVisible(false)}
          onSwipeComplete={() => setModalVisible(false)}
          swipeDirection={['down']}
          style={styles.bottomView}
        >
          <View style={styles.content2}>
            <View style={styles.view}>
              <View style={styles.congrate}>
                <Text style={styles.title}>Congratulations</Text>
                <Ionicons name="ios-star" size={20} color={'#FB9218'} />
              </View>
              <AntDesign name="delete" size={30} color={'red'} onPress={toggleModal} />
            </View>
            <View style={styles.view}>
              <View style={styles.backicon}>
                <View style={styles.iconbackground}>
                  <Ionicons name="md-checkmark-circle-outline" size={40} color={'white'} />
                </View>
                <Text style={{ marginHorizontal: 10 }}>Profile Success</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text>Wed</Text>
                <Text>17 /12/21 10:00 AM</Text>
              </View>
            </View>
            <Text style={styles.paragraph2}>
              Sed sed viverra massa. Duis rutrum efficitur et gravida. Aliquam placerat nisl
              ultricies feugiat gravida. Morbi sollicitudin ut nisi quis nunc es vehicula.{'\n'}{' '}
              {'\n'} Mauris ornare arcu ac massa element pulvinar, nec auctor felis volutpat.
              Curabitur in neque non neque ornare blandit quis eget enim. Sed consequat hendrerit
              ena mauris, ac mollis mauris commodo sed.
            </Text>
          </View>
        </Modal>

        <Modal isVisible={isModalVisible}>
          <View style={styles.Notificationmodal}>
            <View style={styles.modelview}>
              <TouchableOpacity onPress={() => setModal(false)} style={styles.setmodel}>
                <Ionicons name={'close-circle-outline'} color="#24BFF0" size={35} />
              </TouchableOpacity>
              <Text style={styles.modaltext}>“Clear All Notifications” </Text>
              <Text style={styles.modalok}>Press OK to confirm </Text>
            </View>
            <View style={styles.btnview}>
              <Button
                text="Deny"
                onPress={toggleModal}
                btnStyle={styles.btn}
                btnTextStyle={styles.btnText}
              />
              <Button
                onPress={toggleModal}
                text="Ok"
                btnStyle={styles.mybtn}
                btnTextStyle={styles.mybtnText}
              />
            </View>
          </View>
        </Modal>

        <SwipeListView
          showsVerticalScrollIndicator={false}
          useFlatList={true}
          data={DATA}
          contentContainerStyle={{ flexGrow: 1 }}
          keyExtractor={(item, index) => item._id}
          ItemSeparatorComponent={() => <Divider />}
          ListHeaderComponent={() => <View style={{ height: getHeight(5.5) }} />}
          ListFooterComponent={() => <View style={{ margin: getHeight(12) }} />}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                setSelectedIndex(index), setModalVisible(!modalVisible);
              }}
            >
              {/* <View>
                <Text style={styles.date}>{item.date}</Text>
              </View> */}
              <View style={styles.card}>
                <View style={styles.RowView}>
                  <View style={styles.Iconbg}>
                    <MaterialCommunityIcons name={'bell-ring-outline'} size={30} color={'red'} />
                  </View>
                  <View>
                    <Text numberOfLines={1} style={styles.heading}>
                      {item?.title}
                    </Text>
                    <Text numberOfLines={2} style={styles.paragraph}>
                      {item?.description}
                    </Text>
                    {/* <Text style={styles.Time}>{moment(item?.createdAt).format('YYYY-MM-DD')}</Text> */}
                  </View>
                  <View style={styles.active} />
                </View>
              </View>
              {/* {selectedIndex == index ? (
                <Modal isVisible={modalVisible} />
              ) : null} */}
            </TouchableOpacity>
          )}
          renderHiddenItem={
            (FadeIn(),
            ({ item, index }) => (
              <Animated.View style={{ ...styles.hideCard, opacity: startValue }}>
                <TouchableOpacity style={styles.sildeView}>
                  <Ionicons name="archive-outline" size={getFontSize(5)} color={'white'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(!modalVisible);
                  }}
                >
                  <View style={{ ...styles.sildeView, backgroundColor: 'red' }}>
                    <AntDesign name="delete" size={getFontSize(5)} color={'white'} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          }
          leftOpenValue={90}
          rightOpenValue={-90}
          onRowOpen={(rowKey, rowMap) => {
            setTimeout(() => {}, 2000);
          }}
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
                    <NotificationBing size={100} color={Colors.neutral[500]} />
                  </View>
                </View>
                <StyledText
                  style={[Typography.body.x4, { textAlign: 'center', marginBottom: spacing.x16 }]}
                >
                  No notifications yet
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
                  Your notifications on various activities on Onebody app will show here
                </StyledText>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
};

export default Notification;
