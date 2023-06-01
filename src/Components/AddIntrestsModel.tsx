import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import { useDispatch, useSelector } from 'react-redux';
import { getuserAll, getInterests, addUserInterest } from '../Redux/actions/UserAction';
import GradientButton from './GradientButton';
import Toast from 'react-native-simple-toast';

type Route = {
  key: string;
  title: string;
};

const AddIntrestsModel = (props: any) => {
  const { setShow, show } = props;
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.userToken);
  const userState = useSelector((state: RootState) => state.user);
  const authState = useSelector((state: RootState) => state.auth);
  const [selectedIntrest, setSelectedIntrest] = React.useState<Route[]>([]);

  useEffect(() => {
    dispatch(getInterests.Request({ token: token }));
  }, []);

  useEffect(() => {
    if (userState?.getInterestsSuccess == false) {
      Toast.show('Unable to fetch interests!');
    }
  }, [userState?.getInterestsSuccess]);

  useEffect(() => {
    if (userState?.addUserInterestSuccess == true) {
      setShow(false);
      setSelectedIntrest([]);
      dispatch(getuserAll({ token: token }));
    } else if (userState?.addUserInterestSuccess == false) {
      Toast.show('Unable to add interests!');
    }
  }, [userState?.addUserInterestSuccess]);

  return (
    <Modal
      backdropOpacity={0.3}
      isVisible={show}
      onBackdropPress={() => setShow(false)}
      onSwipeComplete={() => setShow(false)}
      swipeDirection={['down']}
      style={styles.bottomView}
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
              {authState?.getProfileData?.interests?.length > 0 &&
                authState?.getProfileData?.interests?.map((item: any) => (
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
                    key={item?._id}
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
          <GradientButton
            text={'ADD INTERESTS'}
            btnStyle={styles.btn2}
            btnTextStyle={styles.btnText2}
            onPress={() =>
              dispatch(addUserInterest.Request({ token: token, interests: selectedIntrest }))
            }
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
