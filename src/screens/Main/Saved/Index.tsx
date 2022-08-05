import React, { useState } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  Touchable,
  StatusBar,
  Image,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import Header from '@/components/Header';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Save from '@/assets/svg/Save.svg';
import { styles } from './styles';
const DATA = [
  {
    id: '1',
    title: 'First Item',
  },
  {
    id: '2',
    title: 'Second Item',
  },
  {
    id: '3',
    title: 'Third Item',
  },
  {
    id: '4',
    title: 'Third Item',
  },
];
const Saved = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <Header
        title={'Saved'}
        leftView={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />

      <View
        style={{
          marginTop: getHeight(4),
          flex: 1,
          paddingHorizontal: 5,
          alignItems: 'center',
        }}
      >
        <FlatList
          data={DATA}
          numColumns={2}
          ItemSeparatorComponent={() => <View style={{ height: getHeight(3) }} />}
          contentContainerStyle={{ justifyContent: 'space-between' }}
          renderItem={() => (
            <View style={{ ...styles.blogpostview, marginHorizontal: 10 }}>
              <Image
                style={styles.blogpostimage}
                resizeMode={'stretch'}
                source={require('@/assets/images/pray.jpeg')}
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
              <Text numberOfLines={2} style={styles.blogpostpara}>
                Churchgoers Proud of Church’s COVID-19 kfdsakkf fdskfds kfka
              </Text>
              <View style={{ height: getHeight(1) }} />
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>
    </View>
  );
};
export default Saved;
