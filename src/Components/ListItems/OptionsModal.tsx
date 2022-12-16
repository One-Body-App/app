import { NavigationProp, useNavigation, useTheme } from '@react-navigation/native';
import React from 'react';
import { View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from 'react-native-modal';
import { GeneralStyle } from '@/src/constants/GeneralStyle';
import Button from '../Button';
import Feather from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '@/src/Navigation/types';
import { styles } from './style';
import { getHeight } from '@/utils/ResponsiveFun';

type ScreenNavigationProp = NavigationProp<RootStackParamList, 'Home'>;

const OptionsModal = ({
  show,
  setShow,
  currentPopupItemId,
  hideChannelSection,
  height,
}: {
  show: boolean;
  setShow: (show: boolean) => void;
  currentPopupItemId?: string;
  hideChannelSection?: boolean;
  height?: number;
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<ScreenNavigationProp>();

  return (
    <Modal
      backdropOpacity={0.3}
      isVisible={show}
      onBackdropPress={() => setShow(false)}
      onSwipeComplete={() => setShow(false)}
      swipeDirection={['down']}
      style={styles.bottomView}
    >
      <View style={[styles.content2, { height: height ?? getHeight(45) }]}>
        <View style={styles.headLine} />
        <View style={styles.contview}>
          <View style={styles.saveview}>
            <View style={{ flex: 1 }}>
              <Button
                btnStyle={styles.savetuch}
                text="Save"
                leftIcon={
                  <Feather style={{ marginRight: 3 }} name="bookmark" size={17} color="#032F3C" />
                }
                btnTextStyle={{ color: '#032F3C' }}
                onPress={() => console.log('press')}
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
                onPress={() => console.log('press')}
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
                  if (currentPopupItemId)
                    navigation.navigate('UserProfile', {
                      id: currentPopupItemId,
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
