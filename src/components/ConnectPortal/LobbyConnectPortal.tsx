import React, { useState } from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
} from 'react-native';

interface LobbyProps {
  onClose: () => void;
}

const SNAP_POINTS = [0, '85%'];

const PaginationIndicator = ({ count, currentIndex }) => {
  const renderIndicators = () => {
    const indicators = [];
    for (let i = 0; i < count; i++) {
      indicators.push(
        <View
          key={i}
          style={[styles.indicator, i === currentIndex ? styles.indicatorActive : null]}
        />
      );
    }
    return indicators;
  };

  return <View style={styles.paginationContainer}>{renderIndicators()}</View>;
};

const GoTab = ({ onNext }: { onNext: () => void }) => {
  return (
    <View>
      <View>
        <Text style={styles.textTab}>Go!</Text>
        <Text style={styles.summaryText} numberOfLines={2}>
          Brief summary of what they can do or added value of using this portion of the portal.
        </Text>
        <PaginationIndicator count={3} currentIndex={0} />
      </View>
      <TouchableOpacity onPress={onNext} style={styles.button}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const ServeTab = ({ onNext }: { onNext: () => void }) => {
  return (
    <View>
      <View>
        <Text style={styles.textTab}>Serve</Text>
        <Text style={styles.summaryText} numberOfLines={2}>
          Brief summary of what they can do or added value of using this portion of the portal.
        </Text>
        <PaginationIndicator count={3} currentIndex={1} />
      </View>
      <TouchableOpacity onPress={onNext} style={styles.button}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const PeoplePlacesTab = () => {
  return (
    <View>
      <View>
        <Text style={styles.textTab}>Peolple/Places</Text>
        <Text style={styles.summaryText} numberOfLines={2}>
          Brief summary of what they can do or added value of using this portion of the portal.
        </Text>
        <PaginationIndicator count={3} currentIndex={2} />
      </View>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

function LobbyConnectPortal({ onClose }: LobbyProps) {
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [showConnectPortal, setShowConnectPortal] = useState<boolean>(false);
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
        const toValue = SNAP_POINTS.reduce((acc, point) => {
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
    setTabIndex(tabIndex + 1);
  };

  const handleBack = () => {
    setTabIndex(Math.max(0, tabIndex - 1));
  };

  return (
    <Animated.View style={[styles.modalContainer, animatedStyles]} {...panResponder.panHandlers}>
      {tabIndex === 0 && <GoTab onNext={handleNext} />}
      {tabIndex === 1 && <ServeTab onNext={handleNext} />}
      {tabIndex === 2 && <PeoplePlacesTab />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    height: '85%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    zIndex: 1000,
    justifyContent: 'flex-end',
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  image: {
    width: 400,
    height: 400,
    marginBottom: 10,
    marginLeft: 10,
    borderRadius: 10,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    textAlign: 'center',
    paddingVertical: 30,
    flexWrap: 'wrap',
    color: '#5A5C5B',
    fontSize: 25,
    paddingHorizontal: 5,
  },
  button: {
    backgroundColor: '#126B87',
    borderRadius: 25,
    width: '90%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  textTab: {
    color: '#032F3C',
    textAlign: 'center',
    fontSize: 40,
    paddingVertical: 0,
  },
  indicatorActive: {
    backgroundColor: '#032F3C',
  },
  paginationContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
    marginTop: 5,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'gray',
    marginHorizontal: 5,
  },
});

export default LobbyConnectPortal;
