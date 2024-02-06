import React from 'react';
import { View, TouchableOpacity, SafeAreaView } from 'react-native';

import { SceneMap, TabView } from 'react-native-tab-view';
import { StackScreenProps } from '@react-navigation/stack';
import { AddSquare } from 'iconsax-react-native';
import { useTheme } from '@react-navigation/native';
import { styles } from './styles';

import WallComponent from '@/components/prayerWallComponent';
import PrayersComponent from '@/components/prayerWallMyPrayersComponent';
import TestimoniesComponent from '@/components/prayerWallTestimoniesComponent';
import { PrayerWallStackParamsList } from '@/src/navigator/types';
import { Colors } from '@/src/styles';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';
import StyledText from '@/components/styled/Text';
import { fontSize } from '@/src/styles/typography';
import PrayerWallSavedPrayersComponent from '@/components/prayerWallSavedPrayersComponent';

type Props = StackScreenProps<PrayerWallStackParamsList, 'index'>;

function Prayer({ navigation }: Props) {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'Wall', title: 'Wall' },
    { key: 'Testimonies', title: 'Testimonies' },
    { key: 'Saved', title: 'Saved' },
    { key: 'MyPrayers', title: 'My Prayers' },
  ]);
  const { colors } = useTheme();

  const renderScene = SceneMap({
    Wall: WallComponent,
    Testimonies: TestimoniesComponent,
    Saved: PrayerWallSavedPrayersComponent,
    MyPrayers: PrayersComponent,
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingBottom: spacing.x24 }}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          sceneContainerStyle={{ paddingBottom: spacing.x48 }}
          renderTabBar={(props) => {
            return (
              <View style={styles.tabBar}>
                {props.navigationState.routes.map((route, i) => {
                  return (
                    <TouchableOpacity style={styles.tabItem} onPress={() => setIndex(i)}>
                      {props?.navigationState?.index == i ? (
                        <StyledText
                          style={{ color: colors.text, fontWeight: 'bold', ...fontSize.x092 }}
                        >
                          {route.title}
                        </StyledText>
                      ) : (
                        <StyledText style={{ color: colors.text, ...fontSize.x092 }}>
                          {route.title}
                        </StyledText>
                      )}
                      {props?.navigationState?.index == i ? <View style={styles.viewun} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          }}
          onIndexChange={setIndex}
        />
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Prayer');
          }}
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
          }}
        >
          <View
            style={{
              backgroundColor: Colors.primarySapphire.brand,
              width: spacing.x64,
              height: spacing.x64,
              borderRadius: borderRadius.max,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AddSquare color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
export default Prayer;
