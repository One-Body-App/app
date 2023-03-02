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
import moment from 'moment';
import Modal from 'react-native-modal';
import { Divider, RadioButton } from 'react-native-paper';
import Foundation from 'react-native-vector-icons/Foundation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SwipeListView } from 'react-native-swipe-list-view';
import AntDesign from 'react-native-vector-icons/AntDesign';

import styles from './styles';

import Button from '@/components/Button';
import Header from '@/components/Header';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { ApiCall } from '@/services/api';
import { useSelector } from 'react-redux';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { useTheme } from '@react-navigation/native';
// create a component
const Notification = ({ navigation }) => {
  const [DATA, SetDATA] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const token = useSelector((state) => state.auth.userToken);
  const [selectedIndex, setSelectedIndex] = useState(false);
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
      if (res?.status == '200') {
        SetDATA(res?.response?.data);
      } else {
        console.log('error', res?.response);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  useEffect(() => {
    getAllNotification();
  }, []);

  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <GeneralStatusBar hidden={false} translucent={true} />

      <Header
        title={'Notifications'}
        leftView={
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View>
        <Modal
          backdropOpacity={0.3}
          isVisible={modalVisible}
          onBackdropPress={() => setModalVisible(false)}
          onSwipeComplete={() => setModalVisible(false)}
          swipeDirection={['down']}
          style={styles.bottomView}
          onRequestClose={() => setModalVisible(false)}
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
                title="Deny"
                onPress={toggleModal}
                Style={styles.btn}
                titleStyle={styles.btnText}
              />
              <Button
                onPress={toggleModal}
                title="Ok"
                Style={styles.mybtn}
                titleStyle={styles.mybtnText}
              />
            </View>
          </View>
        </Modal>

        <SwipeListView
          showsVerticalScrollIndicator={false}
          useFlatList={true}
          data={DATA}
          keyExtractor={(item, index) => index}
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
                    <Text style={styles.Time}>{moment(item?.createdAt).format('YYYY-MM-DD')}</Text>
                  </View>
                  <View style={styles.active} />
                </View>
              </View>
              {selectedIndex == index ? (
                <Modal modalVisible={modalVisible} setModalVisible={setModalVisible} />
              ) : null}
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
        />
      </View>
    </View>
  );
};

export default Notification;
