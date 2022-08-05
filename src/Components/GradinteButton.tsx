import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const GradinteButton = ({
  text,
  leftIcon,
  RightIcon,
  btnTextStyle,
  btnStyle,
  onPress,
}) => {
  return (
    <LinearGradient colors={['#126b87', '#032f3c']} style={btnStyle}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => (onPress ? onPress() : console.log('null'))}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          width: '100%',
        }}>
        {leftIcon}
        <Text style={[btnTextStyle]}>{text}</Text>
        {RightIcon}
      </TouchableOpacity>
    </LinearGradient>
  );
};
export default GradinteButton;
