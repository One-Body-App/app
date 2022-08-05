import React, { useState, useEffect } from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';

import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

import { useDispatch, useSelector } from 'react-redux';
import { ApiCall } from '@/services/api';
import Button from './Button';
import { getuserAll, getuserGet } from '../Redux/actions/UserAction';
import GradinteButton from './GradinteButton';

const AddIntrestsModel = (props) => {
  const { setShow, show } = props;
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.userToken);
  const user = useSelector((state) => state.auth.userData);

  const [intrest, setIntrest] = useState([]);
  const [selectedIntrest, setSelectedIntrest] = useState([]);

  useEffect(() => {
    getIntrest();
  }, []);
  const getIntrest = async () => {
    try {
      const res = await ApiCall({
        route: 'interests',
        verb: 'get',
        token: token,
      });

      if (res?.status == '200') {
        setIntrest(res?.response);
      } else {
        console.log('error', res?.response);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  const addIntrest = async () => {
    try {
      const res = await ApiCall({
        route: 'individual/add-interests',
        token: token,
        verb: 'patch',
        params: { interests: selectedIntrest },
      });
      if (res?.status == '200') {
        dispatch(getuserGet({ token: token, get: 'interests', role: user?.role }));
        setShow(false);
        setSelectedIntrest([]);
        dispatch(getuserAll({ token: token }));
      } else {
        console.log('error', res?.response);
      }
    } catch (e) {
      console.log('saga error -- ', e.toString());
    }
  };
  return (
    <Modal
      backdropOpacity={0.3}
      isVisible={show}
      onBackdropPress={() => setShow(false)}
      onSwipeComplete={() => setShow(false)}
      swipeDirection={['down']}
      style={styles.bottomView}
      onRequestClose={() => setShow(false)}
    >
      <View style={styles.content2}>
        <View style={styles.headLine} />
        <View style={styles.container}>
          <ScrollView>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'stretch',
                flexWrap: 'wrap',
              }}
            >
              {intrest.map((item) => (
                <TouchableOpacity
                  onPress={() => {
                    selectedIntrest.includes(item?._id)
                      ? setSelectedIntrest(
                          selectedIntrest.filter(function (item2) {
                            return item2 !== item?._id;
                          })
                        )
                      : setSelectedIntrest([...selectedIntrest, item?._id]);
                  }}
                  style={
                    selectedIntrest.includes(item?._id)
                      ? [styles.listItem, { backgroundColor: '#032F3C' }]
                      : styles.listItem
                  }
                >
                  <Text
                    numberOfLines={1}
                    style={
                      selectedIntrest.includes(item?._id)
                        ? { color: 'white', maxWidth: getWidth(19) }
                        : { color: '#757575', maxWidth: getWidth(19) }
                    }
                  >
                    {item?.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <GradinteButton
            text={'ADD INTERESTS'}
            btnStyle={styles.btn2}
            btnTextStyle={styles.btnText2}
            onPress={() => addIntrest()}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: 'white',
  },
  btn2: {
    backgroundColor: '#032F3C',
    width: getWidth(80),
    margin: 10,
    height: getHeight(7),
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  btnText2: {
    color: 'white',
    fontSize: getFontSize(2),
    letterSpacing: 1,
    fontFamily: 'Rubik-Medium',
  },
  imageThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
  },
  placeItemView: { padding: 10, backgroundColor: 'white' },
  input: {
    height: 40,
    paddingLeft: 15,
    width: getWidth(80),
  },
  inputView: {
    height: 40,
    margin: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 20,
  },
  bottomView: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  iconTouch: {
    justifyContent: 'center',
    alignSelf: 'center',
    paddingRight: getWidth(2),
    color: 'red',
  },
  mapImage: {
    width: '100%',
    alignSelf: 'center',
    resizeMode: 'stretch',
    height: 300,
    //margin: 10,
    marginVertical: 10,
  },
  content2: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 13,
    borderTopRightRadius: 17,
    borderTopLeftRadius: 17,
    height: getHeight(70),
  },
  headLine: {
    height: 6,
    width: 55,
    borderRadius: 5,
    backgroundColor: '#EAEAEA',
    marginBottom: 5,
  },
  listItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: 4,
    marginVertical: 5,
    backgroundColor: 'rgba(204, 204, 204, 0.1)',
    borderWidth: 1,
    borderColor: 'gray',
  },
});

export default AddIntrestsModel;
