import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, useColorScheme } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { BRAND_COLORS } from '../shared';

interface SuccessModalProps {
  isVisible: boolean;
  onClose: () => void;
  onReturn: () => void;
}

export default function ServeJobPageApplySuccess({
  isVisible,
  onClose,
  onReturn,
}: SuccessModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Dynamic Theme Mapping
  const theme = {
    modalBg: isDark ? BRAND_COLORS.grays[900] : BRAND_COLORS.white,
    text: isDark ? BRAND_COLORS.white : BRAND_COLORS.black,
    subText: isDark ? BRAND_COLORS.grays[200] : BRAND_COLORS.grays[600],
    borderColor: isDark ? BRAND_COLORS.grays[800] : BRAND_COLORS.grays[100],
    iconBg: isDark ? BRAND_COLORS.grays[800] : BRAND_COLORS.grays[100],
  };

  return (
    <Modal animationType="fade" transparent visible={isVisible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.modalBg, borderColor: theme.borderColor },
          ]}
        >
          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="chevron-left" size={32} color={theme.text} />
          </Pressable>

          {/* Success Graphic (Pure RN implementation of the CSS art) */}
          <View style={styles.graphicContainer}>
            {/* Sparkles/Bling background lines */}
            <View style={[styles.blingLine, styles.blingTopLeft]} />
            <View style={[styles.blingLine, styles.blingTopRight]} />
            <View style={[styles.blingLine, styles.blingBottomLeft]} />
            <View style={[styles.blingLine, styles.blingBottomRight]} />

            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          </View>

          {/* Messaging */}
          <Text style={[styles.title, { color: theme.text }]}>
            Application submitted successfully
          </Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            Thank you for stepping out to serve. The poster will review your details soon.
          </Text>

          {/* CTA Button */}
          <Pressable style={styles.primaryButton} onPress={onReturn}>
            <Text style={styles.primaryButtonText}>Return to Opportunities</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: BRAND_COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: 14,
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 8,
  },
  graphicContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND_COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  checkMark: {
    color: BRAND_COLORS.white,
    fontSize: 32,
    fontWeight: '700',
    marginTop: 2, // optical alignment
  },
  blingLine: {
    position: 'absolute',
    width: 12,
    height: 3,
    backgroundColor: BRAND_COLORS.infoDark,
    borderRadius: 2,
    opacity: 0.6,
  },
  blingTopLeft: {
    top: 15,
    left: 15,
    transform: [{ rotate: '45deg' }],
  },
  blingTopRight: {
    top: 15,
    right: 15,
    transform: [{ rotate: '-45deg' }],
  },
  blingBottomLeft: {
    bottom: 15,
    left: 15,
    transform: [{ rotate: '-45deg' }],
  },
  blingBottomRight: {
    bottom: 15,
    right: 15,
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontFamily: 'Rubik',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: BRAND_COLORS.primaryDark,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: BRAND_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Rubik',
  },
});
