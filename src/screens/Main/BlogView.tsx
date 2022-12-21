import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import WebView from 'react-native-webview';

const BlogView = ({ navigation, route }) => {
  const { url } = route?.params;
  return (
    <View style={{ flex: 1 }}>
      <WebView source={{ uri: url }} />
    </View>
  );
};
export default BlogView;
