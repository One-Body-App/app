import React, { useState, useEffect } from 'react';
import { View, Animated, TouchableOpacity } from 'react-native';

import { Divider } from 'react-native-paper';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SwipeListView } from 'react-native-swipe-list-view';
import AntDesign from '@react-native-vector-icons/ant-design';

import { useSelector } from 'react-redux';
import { useTheme } from '@react-navigation/native';
import { NotificationBing } from 'iconsax-react-native';
import { StackScreenProps } from '@react-navigation/stack';
import styles from './styles';

import Button from '@/components/Button';
import { getFontSize, getHeight } from '@/utils/ResponsiveFun';
import { ApiCall } from '@/src/services/api';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import StyledText from '@/components/styled/Text';
import { RootState } from '@/src/redux/reducers/rootReducer';
import { HomeStackParamsList } from '@/src/navigator/types';
import { NotificationType } from '@/utils/types';
import CustomModal from '@/src/components/CustomModal';

// create a component
type Props = StackScreenProps<HomeStackParamsList, 'Notifications'>;

function Notification({ navigation }: Props) {
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
      duration,

      useNativeDriver: true,
    }).start();
  };

  const getAllNotification = async () => {
    try {
      const res = await ApiCall({
        route: 'user/notifications',
        verb: 'get',
        token,
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
        <CustomModal
          modalVisible={modalVisible}
          onclose={() => setModalVisible(false)}
          style={styles.bottomView}
        >
          <View style={styles.content2}>
            <View style={styles.view}>
              <View style={styles.congrate}>
                <StyledText style={styles.title}>Congratulations</StyledText>
                <Ionicons name="ios-star" size={20} color="#FB9218" />
              </View>
              <AntDesign name="delete" size={30} color="red" onPress={toggleModal} />
            </View>
            <View style={styles.view}>
              <View style={styles.backicon}>
                <View style={styles.iconbackground}>
                  <Ionicons name="md-checkmark-circle-outline" size={40} color="white" />
                </View>
                <StyledText style={{ marginHorizontal: 10 }}>Profile Success</StyledText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <StyledText>Wed</StyledText>
                <StyledText>17 /12/21 10:00 AM</StyledText>
              </View>
            </View>
            <StyledText style={styles.paragraph2}>
              Sed sed viverra massa. Duis rutrum efficitur et gravida. Aliquam placerat nisl
              ultricies feugiat gravida. Morbi sollicitudin ut nisi quis nunc es vehicula.{'\n'}{' '}
              {'\n'} Mauris ornare arcu ac massa element pulvinar, nec auctor felis volutpat.
              Curabitur in neque non neque ornare blandit quis eget enim. Sed consequat hendrerit
              ena mauris, ac mollis mauris commodo sed.
            </StyledText>
          </View>
        </CustomModal>

        <CustomModal modalVisible={isModalVisible}>
          <View style={styles.Notificationmodal}>
            <View style={styles.modelview}>
              <TouchableOpacity onPress={() => setModal(false)} style={styles.setmodel}>
                <Ionicons name="close-circle-outline" color="#24BFF0" size={35} />
              </TouchableOpacity>
              <StyledText style={styles.modaltext}>“Clear All Notifications” </StyledText>
              <StyledText style={styles.modalok}>Press OK to confirm </StyledText>
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
        </CustomModal>

        <SwipeListView
          showsVerticalScrollIndicator={false}
          useFlatList
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
                setSelectedIndex(index);
                setModalVisible(!modalVisible);
              }}
            >
              {/* <View>
                <StyledText style={styles.date}>{item.date}</StyledText>
              </View> */}
              <View style={styles.card}>
                <View style={styles.RowView}>
                  <View style={styles.Iconbg}>
                    <MaterialCommunityIcons name="bell-ring-outline" size={30} color="red" />
                  </View>
                  <View>
                    <StyledText numberOfLines={1} style={styles.heading}>
                      {item?.title}
                    </StyledText>
                    <StyledText numberOfLines={2} style={styles.paragraph}>
                      {item?.description}
                    </StyledText>
                    {/* <StyledText style={styles.Time}>{moment(item?.createdAt).format('YYYY-MM-DD')}</StyledText> */}
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
                  <Ionicons name="archive-outline" size={getFontSize(5)} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(!modalVisible);
                  }}
                >
                  <View style={{ ...styles.sildeView, backgroundColor: 'red' }}>
                    <AntDesign name="delete" size={getFontSize(5)} color="white" />
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
                  Your notifications on various activities on One Body app will show here
                </StyledText>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}

export default Notification;
