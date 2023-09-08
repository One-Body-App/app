import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar, Provider, Searchbar, TextInput } from 'react-native-paper';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import { styles } from './styles';
import { useDispatch, useSelector } from 'react-redux';
import GeneralStatusBar from '@/src/components/GeneralStatusBar';
import { GeneralStyle } from '../../../constants/GeneralStyle';
import { TabView, SceneMap } from 'react-native-tab-view';

import SearchContainComponent from '@/src/components/SearchContainComponent';
import { BASE_URL } from '@/src/Services/constants';
import { ApiCall } from '@/src/Services/api';
import { RootState } from '@/src/Redux/reducers/rootReducer';
import ArticleItem from '@/src/components/ListItems/ArticleItem';
import { CompositeScreenProps, useTheme } from '@react-navigation/native';
import OptionsModal from '@/src/components/ListItems/OptionsModal';
import { ArticleType } from '@/utils/types';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { RootStackParamList } from '@/src/Navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  HomeStackParamsList,
  MainBottomStackParamsList,
  MainDrawerParamsList,
} from '@/src/navigator/types';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import { StyledTextInput } from '@/src/components/styled/TextInput';

import { Colors, Typography } from '@/src/styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyledText } from '@/src/components/styled/Text';
import Button from '@/src/components/Button';
import { spacing } from '@/src/styles/spacing';
import { borderRadius } from '@/src/styles/outlines';
import SearchIcon from '@/assets/icons/search.svg';
import { ArrowRight } from 'iconsax-react-native';
import FastImage from 'react-native-fast-image';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// type Props = DrawerScreenProps<RootStackParamList, 'Settings'>;
type Props = CompositeScreenProps<
  StackScreenProps<HomeStackParamsList, 'Search'>,
  CompositeScreenProps<
    DrawerScreenProps<MainDrawerParamsList, 'Main'>,
    BottomTabScreenProps<MainBottomStackParamsList, 'HomeTab'>
  >
>;
enum SearchType {
  search = 'search',
  profile = 'profile',
}

let timer: NodeJS.Timeout;
const keyStorage = 'recent-searchs';
const Search = () => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<ArticleType[]>([]);
  const [recentSearches, setRecentSearches] = useState<
    { item: string; type: SearchType; itemMeta?: { image?: string; whatIDo?: string } }[]
  >([]);
  const token = useSelector((state: RootState) => state.auth.userToken);
  const [show, setShow] = useState<boolean>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // const user = useSelector((state: RootState) => state.auth.getProfileData);

  // const [index, setIndex] = React.useState(0);
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

  const storeAsyncData = async (value: any) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(keyStorage, jsonValue);
    } catch (e) {
      console.log(e);
      // saving error
    }
  };

  const getAsyncData = async () => {
    try {
      const value = await AsyncStorage.getItem(keyStorage);

      if (value !== null) {
        // value previously stored
        return JSON.parse(value);
      }
      return [];
    } catch (e) {
      console.log(e);
      // error reading value
      return [];
    }
  };

  async function fetchData(text: string) {
    const res = await ApiCall({
      route: `user/search`,
      token: token,
      verb: 'post',
      params: {
        text,
      },
    });
    setIsLoading(false);

    if (res.status == 200) {
      setResults(res.response);
    }
  }

  useEffect(() => {
    if (input && input != '') {
      setIsLoading(true);
      clearTimeout(timer);

      timer = setTimeout(() => {
        fetchData(input);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [input]);

  useEffect(() => {
    const getSearchData = async () => {
      const searches = await getAsyncData();

      if (searches && searches?.length > 0) {
        setRecentSearches(searches);
      }
      setIsLoading(false);
    };
    getSearchData();
  }, []);

  useEffect(() => {
    storeAsyncData(recentSearches);
  }, [recentSearches]);

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

  const showModal = async (item: ArticleType) => {
    setCurrentPopupItem(item);
    setShow(true);
  };
  console.log(recentSearches, recentSearches.length);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={60}
    >
      <View style={{ margin: 20 }}>
        <StyledTextInput
          wrapperStyle={{ height: 45 }}
          value={input}
          autoFocus
          returnKeyType="search"
          placeholder="Search"
          clearButtonMode="always"
          onChangeText={(text) => {
            setInput(text);
          }}
          onSubmitEditing={() => {
            let addItem = true;
            if (recentSearches.length > 0) {
              recentSearches.forEach((search) => {
                if (search.item == input) {
                  addItem = false;
                }
              });
            }

            if (addItem) {
              setRecentSearches([{ item: input, type: SearchType.search }, ...recentSearches]);
            }
          }}
          leftIcon={
            <View>
              {isLoading ? (
                <ActivityIndicator
                  animating={isLoading}
                  size="small"
                  color={Colors.neutral[200]}
                  style={{ marginRight: 10 }}
                />
              ) : (
                <SearchIcon
                  style={{ height: 20, width: 20, marginRight: 10 }}
                  stroke={Colors.neutral[200]}
                />
              )}
            </View>
          }
        />
      </View>

      <View style={{ flex: 1 }}>
        {input && results.length > 0 ? (
          <>
            {/* <View
              style={{
                flexDirection: 'row',

                // paddingHorizontal: 10,
                marginBottom: 20,
                backgroundColor: Colors.neutral[700],

                paddingHorizontal: 50,
                paddingTop: 15,
                // flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  flex: 1,

                  alignItems: 'center',
                }}
              >
                <TouchableOpacity onPress={() => {}}>
                  <View
                    style={{
                      paddingBottom: 10,
                      borderBottomColor: Colors.neutral.brand,
                      borderBottomWidth: 2,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <StyledText>Accounts</StyledText>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <TouchableOpacity onPress={() => {}}>
                  <View
                    style={{
                      paddingBottom: 10,
                      borderBottomColor: Colors.neutral.brand,
                      borderBottomWidth: 2,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <StyledText>Posts</StyledText>
                  </View>
                </TouchableOpacity>
              </View>
            </View> */}

            <FlatList
              contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20 }}
              data={results}
              renderItem={({ item }) => (
                <ArticleItem
                  key={item.id}
                  item={item}
                  imageSizeType="cover"
                  blogPostStyle={{
                    // ...styles.socialpostview,
                    width: 'auto',
                    flexGrow: 1,
                    backgroundColor: colors.card,
                    marginVertical: 7,
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
                  // onPress={(item) => {
                  //   storeAsyncData([...recentSearches, input]);
                  // }}
                />
              )}
              keyExtractor={(item, index) => {
                return item.id ?? index.toString();
              }}
            />
          </>
        ) : (
          <>
            {!input && recentSearches.length > 0 ? (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                  }}
                >
                  <StyledText style={Typography.body.x3}>Recent Searches</StyledText>

                  <Button
                    onPress={() => {
                      setRecentSearches([]);
                      storeAsyncData([]);
                    }}
                    btnTextStyle={{ color: Colors.primarySapphire.brand }}
                    text="Clear all"
                  />
                </View>
                <FlatList
                  data={recentSearches}
                  contentContainerStyle={{ flex: 1, paddingHorizontal: 20 }}
                  renderItem={({ item }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 10,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          setInput(item.item);
                        }}
                        style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
                      >
                        <View
                          style={{
                            borderColor: Colors.neutral[500],
                            borderWidth: 1,
                            borderRadius: borderRadius.max,
                            padding: 8,
                            marginRight: 10,
                          }}
                        >
                          {item.itemMeta?.image ? (
                            <FastImage source={{ uri: item.itemMeta?.image }} />
                          ) : (
                            <ArrowRight
                              size="16"
                              color={Colors.primary.brand}
                              style={{ transform: [{ rotate: '-45deg' }] }}
                            />
                          )}
                        </View>
                        <StyledText>{item.item}</StyledText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setRecentSearches(
                            recentSearches.filter((search) => search.item != item.item)
                          );
                        }}
                      >
                        <Ionicons name="close-outline" size={20} />
                      </TouchableOpacity>
                    </View>
                  )}
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
                            <SearchIcon
                              style={{ height: 100, width: 100 }}
                              stroke={Colors.neutral[500]}
                            />
                          </View>
                        </View>
                        <StyledText
                          style={[
                            Typography.body.x4,
                            { textAlign: 'center', marginBottom: spacing.x16 },
                          ]}
                        >
                          No recent search
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
                          Start searching to have recent searches here
                        </StyledText>
                      </View>
                    );
                  }}
                />
              </>
            ) : (
              <>
                {!isLoading ? (
                  <StyledText style={{ textAlign: 'center' }}>No Results</StyledText>
                ) : null}
              </>
            )}
          </>
        )}
      </View>

      {/* <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: getWidth(100) }}
      /> */}
    </KeyboardAvoidingView>
  );
};
export default Search;
