import React, { useState } from 'react';
import {
  Text,
  View,
  Touchable,
  StatusBar,
  ScrollView,
  Image,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getFontSize, getHeight, getWidth } from '@/utils/ResponsiveFun';
import GeneralStatusBar from '@/components/GeneralStatusBar';
import Header from '@/components/Header';
import { styles } from './styles';

function PrivacyPolicy({ navigation }) {
  return (
    <View style={styles.container}>
      <GeneralStatusBar
        backgroundColor="white"
        barStyle="dark-content"
        hidden={false}
        translucent
      />

      <Header
        title="Privacy Policy"
        leftView={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={20} />
          </TouchableOpacity>
        }
        RightView={<View style={{ width: getWidth(5) }} />}
      />
      <ScrollView>
        <View style={{ flex: 1, paddingTop: getHeight(5.5) }}>
          <Text style={styles.textstyle}>Overview</Text>
          <Text style={styles.litetext}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dis sed ullamcorper malesuada
            lobortis. Dui id eu ipsum ultrices.
          </Text>

          <Text style={styles.textstyle}>Your Consent</Text>
          <Text style={styles.litetext}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dis sed ullamcorper malesuada
            lobortis. Dui id eu ipsum ultrices.
          </Text>

          <Text style={styles.textstyle}>Information We Collect</Text>
          <Text style={styles.litetext}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dis sed ullamcorper malesuada
            lobortis. Dui id eu ipsum ultrices.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                height: 7,
                width: 7,
                borderRadius: 3,
                backgroundColor: '#4F6D77',
                marginLeft: getWidth(6),
              }}
            />
            <Text style={{ ...styles.litetext, marginLeft: getWidth(3) }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                height: 7,
                width: 7,
                borderRadius: 3,
                backgroundColor: '#4F6D77',
                marginLeft: getWidth(6),
              }}
            />
            <Text style={{ ...styles.litetext, marginLeft: getWidth(3) }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </Text>
          </View>
          <Text style={styles.textstyle}>Use of Personal Information</Text>

          <Text style={styles.litetext}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dis sed ullamcorper malesuada
            lobortis. Dui id eu ipsum ultrices.
          </Text>

          <Text style={styles.textstyle}>Aggregated Data</Text>
          <Text style={styles.litetext}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dis sed ullamcorper malesuada
            lobortis. Dui id eu ipsum ultrices.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
export default PrivacyPolicy;
