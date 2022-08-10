import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Animated,
  Image,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
import { Avatar, Provider } from 'react-native-paper';
import DropDown from 'react-native-paper-dropdown';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Header from '@/components/Header';
import Button from '@/components/Button';
import { styles } from './styles';
import { Icon } from 'react-native-paper/lib/typescript/components/Avatar/Avatar';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import ZendeskChat from 'react-native-zendesk-chat';
import { useSelector } from 'react-redux';

import RenderHtml from 'react-native-render-html';

const Faqs = ({ navigation }) => {
  const faqs = useSelector((state) => state.general.faqs);
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent={true}
      />

      <Header
        title={'FAQs'}
        leftView={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        <FlatList
          data={faqs}
          style={{ height: getHeight(10), alignSelf: 'center' }}
          keyExtractor={(item, index) => index.toString()}
          ItemSeparatorComponent={() => <View style={{ height: getHeight(1.5) }} />}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View
              style={{
                width: getWidth(96),
                borderBottomWidth: 0.45,
                borderBottomColor: '#70747D',
                borderRadius: 10,
              }}
            >
              <TouchableOpacity
                onPress={() =>
                  selectedIndex == index ? setSelectedIndex(null) : setSelectedIndex(index)
                }
                style={{
                  flex: 1,
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  height: getHeight(5),
                  flexDirection: 'row',
                  marginHorizontal: 10,
                }}
              >
                <Text
                  style={{
                    color: ' #032F3C',
                    fontFamily: 'Rubik-Regular',
                    fontSize: 16,
                    fontWeight: '400',
                  }}
                >
                  {item?.name}
                </Text>
                {selectedIndex == index ? (
                  <AntDesign name="up" color={'#5B7279'} size={15} />
                ) : (
                  <AntDesign name="down" color={'#5B7279'} size={15} />
                )}
              </TouchableOpacity>
              {selectedIndex == index ? (
                <View
                  style={{
                    marginHorizontal: 10,
                    padding: 10,
                  }}
                >
                  <RenderHtml source={{ html: item?.body }} />
                </View>
              ) : null}
            </View>
          )}
        />
      </View>
    </View>
  );
};
export default Faqs;
