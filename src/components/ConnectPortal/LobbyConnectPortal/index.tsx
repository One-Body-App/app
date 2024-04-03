import React, { useState } from 'react';
import { View, TouchableOpacity, PanResponder, Animated } from 'react-native';
import styles from './styles';
import LobbyConnectPortalTab from './tab';

// images
const PeoplePlacesTabImage = require('../../../assets/images/Places.png');
const ServeTabImage = require('../../../assets/images/Serve2.png');
const GoTabImage = require('../../../assets/images/Mapa2.png');

interface TabType {
  id?: number;
  title: string;
  image: any;
  summary: string;
  buttonLabel: string;
}

const tabs: TabType[] = [
  {
    id: 1,
    title: 'Go',
    image: GoTabImage,
    summary:
      'Brief summary of what they can do or added value of using this portion of the portal.',
    buttonLabel: 'Get Started',
  },
  {
    id: 2,
    title: 'Serve',
    image: ServeTabImage,
    summary:
      'Brief summary of what they can do or added value of using this portion of the portal.',
    buttonLabel: 'Next',
  },
  {
    id: 3,
    title: 'People/Places',
    image: PeoplePlacesTabImage,
    summary:
      'Brief summary of what they can do or added value of using this portion of the portal.',
    buttonLabel: 'Next',
  },
];

interface LobbyProps {
  onClose: () => void;
}

const SNAP_POINTS = [0, '85%'];

function LobbyConnectPortal({ onClose }: LobbyProps) {
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [pan] = useState(new Animated.Value(0));

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        Animated.event([null, { dy: pan }], { useNativeDriver: false })(_, gestureState);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 50) {
        onClose();
      } else {
        const toValue = SNAP_POINTS.reduce((acc: any, point: any) => {
          if (gestureState.dy > acc && gestureState.dy < point) {
            return acc;
          }
          return point;
        }, SNAP_POINTS[0]);
        Animated.spring(pan, { toValue, useNativeDriver: false }).start();
      }
    },
  });

  const animatedStyles = {
    transform: [{ translateY: pan }],
  };

  const handleNext = () => {
    if (tabIndex === tabs.length - 1) {
      onClose();
      return;
    }
    setTabIndex(tabIndex + 1);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onClose} style={styles.overlay} />
      <Animated.View style={[styles.modalContainer, animatedStyles]} {...panResponder.panHandlers}>
        {tabs.map((tab, index) => (
          <LobbyConnectPortalTab
            key={`tab-${tab.id}`}
            id={tab.id}
            index={index}
            activeIndex={tabIndex}
            buttonLabel={tab.buttonLabel}
            image={tab.image}
            summary={tab.summary}
            title={tab.title}
            onNext={handleNext}
          />
        ))}
      </Animated.View>
    </View>
  );
}

export default LobbyConnectPortal;
