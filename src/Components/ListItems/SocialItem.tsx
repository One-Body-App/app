import { getHeight } from '@/utils/ResponsiveFun';
import React from 'react';
import { Image, StyleProp, Text, View, ViewStyle } from 'react-native';
import Twitter from '@/assets/svg/Twitter.svg';
import { useTheme } from '@react-navigation/native';
import { styles } from './style';

const SocialItem = ({
  item,
  socialPostviewStyle,
}: {
  item: {
    content: string;
    source: 'twitter' | 'instagram';
    handler: string;
  };
  socialPostviewStyle?: StyleProp<ViewStyle>;
}) => {
  const { colors } = useTheme();
  console.log(item);
  return (
    <View
      style={[
        styles.socialpostview,
        { backgroundColor: colors.card, margin: 7 },
        socialPostviewStyle,
      ]}
    >
      <Text
        style={{
          padding: 5,
          fontFamily: 'Rubik',
          lineHeight: 18,
          color: colors.text,
          marginTop: getHeight(1),
          textAlign: 'center',
        }}
      >
        {item?.content}
      </Text>
      <View style={{ flexDirection: 'row', padding: 5 }}>
        {item?.source == 'twitter' ? <Twitter fill="#00acee" /> : null}
        <Text
          style={{
            marginLeft: 5,
            fontFamily: 'Rubik',
            color: '#68828A',
            alignItems: 'center',
          }}
        >
          @{item?.handler}
        </Text>
      </View>
    </View>
  );
};

export default SocialItem;
