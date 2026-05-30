import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type HeaderGradientOverlayProps = {
  /** Opaque color at the top of the fade. Must be an rgba(...) string. */
  color: string;
  style?: StyleProp<ViewStyle>;
};

/** Converts "rgba(r,g,b,a)" → "rgba(r,g,b,0)" so the gradient fades to the same hue at zero alpha. */
function toZeroAlpha(rgba: string): string {
  return rgba.replace(/,\s*[\d.]+\)$/, ', 0)');
}

function HeaderGradientOverlay({ color, style }: HeaderGradientOverlayProps) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, style]}>
      <LinearGradient
        colors={[color, toZeroAlpha(color)]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

export default React.memo(HeaderGradientOverlay);
