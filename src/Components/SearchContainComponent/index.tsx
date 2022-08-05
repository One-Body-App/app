import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { styles } from './styles';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Button from '../Button';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';

const SearchContainComponent = () => {
  const [show, setShow] = useState();
  const toggleModal = () => {
    setShow(!show);
  };
  const Data = [
    { id: 1, image: 'dfafds', name: 'Spirituality', Text: 'fsda' },
    { id: 2, image: 'dfafds', name: 'Bible', Text: 'fsda' },
    { id: 3, image: 'dfafds', name: 'World', Text: 'fsda' },
    { id: 4, image: 'dfafds', name: 'Relationships', Text: 'fsda' },
  ];
  return (
    <View style={styles.continer}>
      <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        <View style={{ ...styles.headingView, marginTop: getHeight(1) }}>
          <Text style={styles.heading}>Topics</Text>
        </View>
        <View style={{ marginTop: getHeight(1.2) }}>
          <FlatList
            data={Data}
            ListFooterComponent={<View style={{ height: getHeight(2) }} />}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            numColumns={4}
            renderItem={({ item, index }) => (
              // <View style={{justifyContent:'space-evenly'}}>
              <TouchableOpacity onPress={() => console.log('selected')} style={styles.listItem}>
                <Text numberOfLines={1} style={{ color: '#757575', maxWidth: getWidth(23) }}>
                  {item?.name}
                </Text>
              </TouchableOpacity>
              // </View>
            )}
          />
        </View>
        <View style={styles.headingView}>
          <Text style={styles.heading}>News</Text>
          <Text style={styles.text}>20+ Results</Text>
          <Text style={{ ...styles.text, color: '#126B87' }}>
            View All{' '}
            <AntDesign name="right" color={'#126B87'} style={{ marginHorizontal: getWidth(1) }} />
          </Text>
        </View>
        <View style={{ marginTop: getHeight(2.5) }}>
          <FlatList
            data={Data}
            ListFooterComponent={<View style={{ height: getHeight(2) }} />}
            keyExtractor={(item, index) => index.toString()}
            ItemSeparatorComponent={() => <View style={{ height: getHeight(2) }} />}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    width: '70%',
                    alignItems: 'center',
                  }}
                >
                  <Image
                    style={styles.image}
                    resizeMode={'stretch'}
                    source={require('@/assets/images/pray.jpeg')}
                  />
                  <View style={{ marginLeft: getWidth(2) }}>
                    <Text
                      style={{
                        ...styles.text,
                        letterSpacing: 1.5,
                        marginBottom: getHeight(0.8),
                      }}
                    >
                      {'christianity today'.toUpperCase()}
                    </Text>
                    <Text style={styles.heading} numberOfLines={2}>
                      U.S. Catholic Bishops to Discuss Banning Biden from Communion...
                    </Text>
                  </View>
                </View>
                <Entypo name="dots-three-vertical" color={'#a0a3a9'} size={getFontSize(3)} />
              </View>
            )}
          />
        </View>
        <View style={styles.headingView}>
          <Text style={styles.heading}>Blog</Text>
          <Text style={styles.text}>10 Results</Text>
          <Text style={{ ...styles.text, color: '#126B87' }}>
            View All{' '}
            <AntDesign name="right" color={'#126B87'} style={{ marginHorizontal: getWidth(1.5) }} />
          </Text>
        </View>
        <View style={{ marginTop: getHeight(2.5) }}>
          <FlatList
            data={Data}
            ListFooterComponent={<View style={{ height: getHeight(2) }} />}
            keyExtractor={(item, index) => index.toString()}
            ItemSeparatorComponent={() => <View style={{ height: getHeight(2) }} />}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    width: '70%',
                    alignItems: 'center',
                  }}
                >
                  <Image
                    style={styles.image}
                    resizeMode={'stretch'}
                    source={require('@/assets/images/pray.jpeg')}
                  />
                  <View style={{ marginLeft: getWidth(2) }}>
                    <Text
                      style={{
                        ...styles.text,
                        letterSpacing: 1.5,
                        marginBottom: getHeight(0.8),
                      }}
                    >
                      {'christianity today'.toUpperCase()}
                    </Text>
                    <Text
                      style={{
                        ...styles.heading,
                        fontSize: 13,
                        fontWeight: '400',
                      }}
                      numberOfLines={2}
                    >
                      U.S. Catholic Bishops to Discuss Banning Biden from Communion...
                    </Text>
                  </View>
                </View>
                <Entypo name="dots-three-vertical" color={'#a0a3a9'} size={getFontSize(3)} />
              </View>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
};
export default SearchContainComponent;
