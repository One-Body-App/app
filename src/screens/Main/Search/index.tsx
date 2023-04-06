import React, { useRef, useState } from 'react';
import { Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar, Provider, Searchbar, TextInput } from 'react-native-paper';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import { TabView, SceneMap } from 'react-native-tab-view';

import SearchContainComponent from '@/components/SearchContainComponent';
import { BASE_URL } from '@/src/Services/constants';
import { ApiCall } from '@/src/Services/api';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import ArticleItem from '@/src/Components/ListItems/ArticleItem';
import { useTheme } from '@react-navigation/native';
import OptionsModal from '@/src/Components/ListItems/OptionsModal';
import { ArticleType } from '@/utils/types';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { RootStackParamList } from '@/src/Navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = DrawerScreenProps<RootStackParamList, 'Settings'>;

const Search = ({ navigation }: Props) => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<ArticleType[]>([]);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [show, setShow] = useState<boolean>();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.userProfile);

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'Recent', title: 'Most Recent' },
    { key: 'Contains', title: 'Contains' },
    { key: 'Match', title: 'Best Match' },
  ]);
  const renderScene = SceneMap({
    Recent: SearchContainComponent,
    Contains: SearchContainComponent,
    Match: SearchContainComponent,
  });

  async function fetchData(text: string) {
    if (text) {
      const res = await ApiCall({
        route: `user/search`,
        token: token,
        verb: 'post',
        params: {
          text,
        },
      });

      if (res.status == 200) {
        setResults(res.response);
      }
    } else {
      setResults([]);
    }
  }

  // const renderTabBar = (props) => {
  //   const inputRange = props.navigationState.routes.map((x, i) => i);

  //   return (
  //     <View style={styles.tabBar}>
  //       {props.navigationState.routes.map((route, i) => {
  //         return (
  //           <TouchableOpacity style={styles.tabItem} onPress={() => setIndex(i)}>
  //             <Animated.Text
  //               style={
  //                 props?.navigationState?.index == i
  //                   ? {
  //                       color: '#032F3C',
  //                       fontWeight: 'bold',
  //                     }
  //                   : {
  //                       color: '#126B87',
  //                     }
  //               }
  //             >
  //               {route.title}
  //             </Animated.Text>
  //             {props?.navigationState?.index == i ? (
  //               <View style={styles.propview} />
  //             ) : (
  //               <View style={styles.propview2} />
  //             )}
  //           </TouchableOpacity>
  //         );
  //       })}
  //     </View>
  //   );
  // };
  const { colors } = useTheme();
  const [currentPopupItem, setCurrentPopupItem] = useState<ArticleType>();

  const showModal = (item: ArticleType) => {
    setCurrentPopupItem(item);
    setShow(true);
  };

  return (
    <SafeAreaView>
      <OptionsModal show={show ?? false} setShow={setShow} currentPopupItem={currentPopupItem} />
      <Ionicons
        name="close"
        size={getFontSize(3.5)}
        onPress={() => navigation.goBack()}
        color="#126B87"
        style={{ alignSelf: 'flex-end', margin: getHeight(1), marginBottom: 0 }}
      />

      <View style={{ marginHorizontal: 20 }}>
        <Searchbar
          placeholder="Search"
          onChangeText={(text) => {
            setInput(text);
            fetchData(text);
          }}
          iconColor="#757575"
          value={input}
          theme={{ roundness: 40 }}
          placeholderTextColor={'#032F3C'}
          style={{ backgroundColor: 'transparent', borderColor: '#126B87', borderWidth: 1 }}
        />
      </View>
      <View style={{ marginTop: 20 }}>
        <FlatList
          data={results}
          renderItem={({ item }) => (
            // <View
            //   style={{
            //     padding: 10,
            //     paddingVertical: 35,
            //     borderBottomColor: '#ccc',
            //     borderBottomWidth: 1,
            //   }}
            // >
            //   <Text>{item.title}</Text>
            <ArticleItem
              key={item.id}
              item={item}
              imageSizeType="cover"
              blogPostStyle={{
                ...styles.socialpostview,
                backgroundColor: colors.card,
              }}
              blogPostImageStyle={{
                height: getHeight(22),
                width: '100%',
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                marginBottom: 5,
              }}
              blogPostTitleStyle={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: getHeight(1),
              }}
              showModal={showModal}
            />
            // </View>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>
      {/* <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: getWidth(100) }}
      /> */}
    </SafeAreaView>
  );
};
export default Search;
