import React from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import StyledText from '../../styled/Text';
import styles from './styles';
import { spacing } from '@/src/styles/spacing';

export interface TabType {
  id?: number;
  title: string;
  image: any;
  summary: string;
  buttonLabel: string;
}

const PaginationIndicator = ({ count, currentIndex }: { count: number; currentIndex: number }) => {
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

type TabProps = TabType & { onNext: () => void; activeIndex: number; index: number };

const LobbyConnectPortalTab = ({
  onNext,
  image,
  title,
  summary,
  buttonLabel,
  activeIndex,
  index,
}: TabProps) => {
  if (index !== activeIndex) return null;
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.x5,
        alignItems: 'center',
        backgroundColor: '#fff',
      }}
    >
      <Image source={image} style={styles.image} />
      <View
        style={{
          padding: spacing.x10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: spacing.x5,
        }}
      >
        <StyledText style={[styles.textTab, { fontWeight: 'bold' }]}>{title}</StyledText>
        <StyledText style={styles.summaryText} numberOfLines={2}>
          {summary}
        </StyledText>
        <PaginationIndicator count={3} currentIndex={index} />
      </View>
      <TouchableOpacity onPress={onNext} style={styles.button}>
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LobbyConnectPortalTab;
