import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type BrandPaletteBackgroundProps = {
  style?: StyleProp<ViewStyle>;
};

function BrandPaletteBackground({ style }: BrandPaletteBackgroundProps) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, style]}>
      <LinearGradient
        colors={['#032f3c', '#126b87', '#032f3c']}
        locations={[0, 0.52, 1]}
        start={{ x: 0.08, y: 0.02 }}
        end={{ x: 0.92, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient
        colors={['rgba(18,210,217,0.32)', 'rgba(18,210,217,0)']}
        start={{ x: 0.95, y: 0.05 }}
        end={{ x: 0.3, y: 0.55 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.topBlob} />
      <View style={styles.bottomBlob} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBlob: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -110,
    left: -80,
    backgroundColor: 'rgba(18,210,217,0.22)',
  },
  bottomBlob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    right: -110,
    bottom: -120,
    backgroundColor: 'rgba(18,210,217,0.16)',
  },
});

export default BrandPaletteBackground;
