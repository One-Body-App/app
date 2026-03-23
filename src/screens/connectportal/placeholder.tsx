import React from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import StyledText from '@/components/styled/Text';
import type { ConnectStackParamsList } from '@/src/navigator/types';
import { Colors, Typography } from '@/src/styles';
import { spacing } from '@/src/styles/spacing';

type Props = NativeStackScreenProps<ConnectStackParamsList, 'ConnectPlacesHome'>;

function ConnectPortalPlaceholderScreen({ navigation, route }: Props): React.JSX.Element {
  const { dark } = useTheme();
  const title = route.name === 'ConnectPlacesHome' ? 'Places' : 'Connect Portal';

  return (
    <SafeAreaView style={[styles.safeArea, dark ? styles.safeAreaDark : null]}>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, dark ? styles.backButtonDark : null]}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={dark ? Colors.primarySapphire[700] : Colors.primary.brand}
          />
        </TouchableOpacity>

        <View style={styles.content}>
          <StyledText style={[styles.eyebrow, dark ? styles.textDarkMuted : null]}>
            CONNECT PORTAL
          </StyledText>
          <StyledText style={[styles.title, dark ? styles.textDark : null]}>{title}</StyledText>
          <StyledText style={[styles.body, dark ? styles.textDarkMuted : null]}>
            This screen is reserved for future Connect portal work.
          </StyledText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6FBFC',
  },
  safeAreaDark: {
    backgroundColor: '#0D0D0D',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.x16,
    paddingVertical: spacing.x16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE7EB',
  },
  backButtonDark: {
    backgroundColor: '#111B20',
    borderColor: '#234550',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x24,
    gap: spacing.x10,
  },
  eyebrow: {
    ...Typography.body.x1M,
    color: Colors.primarySapphire.brand,
  },
  title: {
    ...Typography.header.h2,
    color: Colors.primary.brand,
    textAlign: 'center',
  },
  body: {
    ...Typography.body.x2,
    color: Colors.neutral[300],
    textAlign: 'center',
  },
  textDark: {
    color: Colors.primarySapphire[700],
  },
  textDarkMuted: {
    color: Colors.neutral[500],
  },
});

export default ConnectPortalPlaceholderScreen;
