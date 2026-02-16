import React, { useState } from 'react';
import { Text, View, FlatList, TouchableOpacity } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import AntDesign from '@react-native-vector-icons/ant-design';
import { useSelector } from 'react-redux';
import RenderHtml from 'react-native-render-html';
import { getHeight, getWidth } from '@/utils/ResponsiveFun';
import Header from '@/components/Header';
import { styles } from './styles';
import { Colors } from '@/src/styles';
import { RootState } from '@/src/redux/reducers/rootReducer';
// import ZendeskChat from 'react-native-zendesk-chat';

function Faqs({ navigation }: { navigation: any }) {
  const faqs = useSelector((state: RootState) => state.general.faqs) as Array<{
    name?: string;
    body?: string;
  }>;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header
        title="FAQs"
        leftView={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <View style={styles.innerContainer}>
        <FlatList<{ name?: string; body?: string }>
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
                    fontFamily: 'OpenSans-Regular',
                    fontSize: 16,
                    fontWeight: '400',
                  }}
                >
                  {item?.name}
                </Text>
                {selectedIndex == index ? (
                  <AntDesign name="up" color={Colors.primarySapphire[500]} size={15} />
                ) : (
                  <AntDesign name="down" color={Colors.primarySapphire[500]} size={15} />
                )}
              </TouchableOpacity>
              {selectedIndex == index ? (
                <View
                  style={{
                    marginHorizontal: 10,
                    padding: 10,
                  }}
                >
                  <RenderHtml source={{ html: item?.body ?? '' }} />
                </View>
              ) : null}
            </View>
          )}
        />
      </View>
    </View>
  );
}
export default Faqs;
