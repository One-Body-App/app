import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  ImageBackground,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const StepFive = (props) => {
  const time = [
    {
      picture: require('@/assets/images/pray.jpeg'),
      name: 'Nick Crawford',
      sub: 'Minister & Ideator',
    },
    {
      picture: require('@/assets/images/placeholder.png'),
      name: 'Robert Madu',
      sub: 'Minister & Ideator',
    },
    {
      picture: require('@/assets/images/placeholder.png'),
      name: 'Nick Crawford',
      sub: 'Minister & Ideator',
    },
    {
      picture: require('@/assets/images/placeholder.png'),
      name: 'Nick Crawford',
      sub: 'Minister & Ideator',
    },
    {
      picture: require('@/assets/images/placeholder.png'),
      name: 'Nick Crawford',
      sub: 'Minister & Ideator',
    },
    {
      picture: require('@/assets/images/placeholder.png'),
      name: 'Nick Crawford',
      sub: 'Minister & Ideator',
    },
    {
      picture: require('@/assets/images/placeholder.png'),
      name: 'Nick Crawford',
      sub: 'Minister & Ideator',
    },
    {
      picture: require('@/assets/images/placeholder.png'),
      name: 'Nick Crawford',
      sub: 'Minister & Ideator',
    },
    {
      picture: require('@/assets/images/pray2.jpeg'),
      name: 'Nick Crawford',
      sub: 'Minister & Ideator',
    },
    {
      picture: require('@/assets/images/placeholder.png'),
      name: 'Nick Crawford',
      sub: 'Minister & Ideator',
    },
    {
      picture: require('@/assets/images/placeholder.png'),
      name: 'Nick Crawford',
      sub: 'Minister & Ideator',
    },
    {
      picture: require('@/assets/images/placeholder.png'),
      name: 'Nick Crawford',
      sub: 'Minister & Ideator',
    },
  ];
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        resizeMode="cover"
        style={{ flex: 1 }}
        source={require('@/assets/images/gradient.png')}
      >
        <Text
          style={{
            color: '#032F3C',
            fontWeight: '700',
            textAlign: 'center',
            marginHorizontal: 40,
            marginTop: 20,
          }}
        >
          Select Influencers & Organizations
          <Text style={{ fontWeight: '500' }}> to personalize your Social Feed</Text>
        </Text>
        <View
          style={{
            margin: 20,
            marginHorizontal: 30,
            borderWidth: 1,
            borderRadius: 20,
            borderColor: '#032F3C',
          }}
        >
          <TextInput
            style={{ padding: 12, paddingLeft: 0, marginLeft: 35 }}
            placeholder="Search by Name & Organization"
          />
          <Image
            style={{ position: 'absolute', top: 8, left: 10 }}
            source={require('@/assets/icons/search.png')}
          />
        </View>
        {/* <View style={{ marginHorizontal: 20, }}> */}
        <FlatList
          style={{ marginBottom: 30, marginHorizontal: 10 }}
          contentContainerStyle={{ justifyContent: 'space-between' }}
          data={time}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          numColumns={3}
          renderItem={({ item, index }) => (
            <View style={{ marginLeft: 20 }}>
              <Image style={{ width: 80, height: 80, borderRadius: 40 }} source={item.picture} />
              <View style={{ marginLeft: -7 }}>
                <Text
                  style={{
                    margin: 5,
                    fontWeight: '700',
                    fontSize: 12,
                    marginTop: 15,
                  }}
                >
                  {item.name}
                </Text>
                <Text style={{ color: '#757575', fontSize: 12, marginBottom: 10 }}>{item.sub}</Text>
              </View>
            </View>
          )}
        />
        {/* </View> */}
        <View style={styles.footer}>
          <ImageBackground
            resizeMode="contain"
            style={{ width: '100%', height: 160, zIndex: 1 }}
            source={require('@/assets/images/footer.png')}
          >
            <TouchableOpacity
              onPress={() => props.navigation.navigate('loading')}
              style={{
                flexDirection: 'row',
                position: 'absolute',
                top: 80,
                right: 50,
              }}
            >
              <Text style={styles.footerText}>NEXT</Text>
              <Image style={{ height: 20 }} source={require('@/assets/icons/arrowRight.png')} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => props.navigation.goBack()}
              style={{
                flexDirection: 'row',
                position: 'absolute',
                top: 80,
                left: 40,
              }}
            >
              <Image style={{ height: 20 }} source={require('@/assets/icons/backBlack.png')} />
              <Text style={[styles.footerText, { marginLeft: 20 }]}>BACK</Text>
            </TouchableOpacity>
            <View style={styles.progressBar}>
              <View style={styles.progressBarStatus} />
            </View>
          </ImageBackground>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default StepFive;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  listItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
    borderRadius: 10,
    marginHorizontal: 7,
    marginVertical: 5,
    backgroundColor: 'rgba(204, 204, 204, 0.1)',
    borderWidth: 1,
    borderColor: 'gray',
  },
  footerText: {
    textAlign: 'center',
    color: '#032F3C',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 20,
  },
  footer: {
    // height: 1s20,
    // margin: -10,
    justifyContent: 'flex-end',
    position: 'absolute',
    width: '100%',
    bottom: -60,
    // flex: 1
  },
  progressBar: {
    width: 100,
    height: 7,
    backgroundColor: '#032F3C',
    borderRadius: 5,
    position: 'absolute',
    top: 85,
    left: '35%',
  },
  progressBarStatus: {
    position: 'absolute',
    backgroundColor: '#12D2D9',
    width: 100,
    height: 7,
    borderRadius: 5,
  },
});
