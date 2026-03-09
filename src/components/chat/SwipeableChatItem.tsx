import React, { memo, useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  FadeOutLeft,
  LinearTransition,
  SharedValue,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { HapticService } from '@/src/services/haptic';

const UTILITY_ACTION_WIDTH = 70;
const UTILITY_ACTIONS_WIDTH = UTILITY_ACTION_WIDTH * 2;
const DELETE_SWIPE_THRESHOLD_RATIO = 0.8;
const ACTION_PANEL_INSET = 4;

type SwipeableChatListItem = {
  id: string;
  name: string;
  message: string;
  isRead: boolean;
  isMuted: boolean;
};

type Props = {
  item: SwipeableChatListItem;
  onPress: () => void;
  onDelete: (id: string) => void;
  onMute: (id: string, nextMuted: boolean) => void;
  onToggleRead: (id: string, nextRead: boolean) => void;
  destructiveLabel?: string;
  destructiveIconName?: string;
  enableDestructiveAction?: boolean;
  enableUtilityActions?: boolean;
  children?: React.ReactNode;
};

type ThresholdHapticObserverProps = {
  translation: SharedValue<number>;
  threshold: number;
  enabled: boolean;
  direction: 'positive' | 'negative';
  onCrossThreshold: () => void;
};

function ThresholdHapticObserver({
  translation,
  threshold,
  enabled,
  direction,
  onCrossThreshold,
}: ThresholdHapticObserverProps) {
  useAnimatedReaction(
    () => {
      if (!enabled || threshold <= 0) {
        return false;
      }

      return direction === 'positive'
        ? translation.value >= threshold
        : translation.value <= -threshold;
    },
    (hasCrossed, previouslyCrossed) => {
      if (hasCrossed && !previouslyCrossed) {
        runOnJS(onCrossThreshold)();
      }
    },
    [direction, enabled, onCrossThreshold, threshold, translation]
  );

  return null;
}

function SwipeableChatItemComponent({
  item,
  onPress,
  onDelete,
  onMute,
  onToggleRead,
  destructiveLabel = 'Archive',
  destructiveIconName = 'archive',
  enableDestructiveAction = true,
  enableUtilityActions = true,
  children,
}: Props) {
  const swipeableRef = useRef<SwipeableMethods | null>(null);
  const [rowWidth, setRowWidth] = useState(0);
  const hasTriggeredDeleteThresholdRef = useRef(false);
  const hasTriggeredUtilityThresholdRef = useRef(false);

  const deleteThreshold =
    enableDestructiveAction && rowWidth > 0 ? rowWidth * DELETE_SWIPE_THRESHOLD_RATIO : 0;

  const handleLayout = useCallback(
    (event: any) => {
      const nextWidth = Number(event?.nativeEvent?.layout?.width || 0);
      if (nextWidth > 0 && nextWidth !== rowWidth) {
        setRowWidth(nextWidth);
      }
    },
    [rowWidth]
  );

  const resetThresholdHaptics = useCallback(() => {
    hasTriggeredDeleteThresholdRef.current = false;
    hasTriggeredUtilityThresholdRef.current = false;
  }, []);

  const handleUtilityPress = useCallback((callback: () => void, methods: SwipeableMethods) => {
    HapticService.trigger('selection');
    callback();
    methods.close();
  }, []);

  const handleUtilityThresholdCross = useCallback(() => {
    if (hasTriggeredUtilityThresholdRef.current) {
      return;
    }

    hasTriggeredUtilityThresholdRef.current = true;
    HapticService.trigger('impactLight');
  }, []);

  const handleDeleteThresholdCross = useCallback(() => {
    if (hasTriggeredDeleteThresholdRef.current) {
      return;
    }

    hasTriggeredDeleteThresholdRef.current = true;
    HapticService.trigger('impactLight');
  }, []);

  const renderLeftActions = useCallback(
    (
      _progress: SharedValue<number>,
      translation: SharedValue<number>,
      methods: SwipeableMethods
    ) => {
      return (
        <>
          <ThresholdHapticObserver
            translation={translation}
            threshold={UTILITY_ACTIONS_WIDTH}
            enabled={enableUtilityActions}
            direction="positive"
            onCrossThreshold={handleUtilityThresholdCross}
          />
          <View style={styles.leftActionsWrap}>
            <Pressable
              style={[styles.utilityAction, styles.muteAction]}
              onPress={() => handleUtilityPress(() => onMute(item.id, !item.isMuted), methods)}
            >
              <View style={styles.actionIconBadge}>
                <MaterialIcons
                  name={item.isMuted ? 'notifications' : 'notifications-off'}
                  size={18}
                  color="#ffffff"
                />
              </View>
              <Text style={styles.utilityActionText}>{item.isMuted ? 'Unmute' : 'Silence'}</Text>
            </Pressable>
            <Pressable
              style={[styles.utilityAction, styles.readAction]}
              onPress={() => handleUtilityPress(() => onToggleRead(item.id, !item.isRead), methods)}
            >
              <View style={[styles.actionIconBadge, styles.readActionIconBadge]}>
                <MaterialIcons
                  name={item.isRead ? 'mark-email-unread' : 'mark-email-read'}
                  size={18}
                  color="#ffffff"
                />
              </View>
              <Text style={styles.utilityActionText}>{item.isRead ? 'Unread' : 'Read'}</Text>
            </Pressable>
          </View>
        </>
      );
    },
    [
      enableUtilityActions,
      handleUtilityPress,
      handleUtilityThresholdCross,
      item.id,
      item.isMuted,
      item.isRead,
      onMute,
      onToggleRead,
    ]
  );

  const renderRightActions = useCallback(
    (_progress: SharedValue<number>, translation: SharedValue<number>) => {
      return (
        <>
          <ThresholdHapticObserver
            translation={translation}
            threshold={deleteThreshold}
            enabled={enableDestructiveAction}
            direction="negative"
            onCrossThreshold={handleDeleteThresholdCross}
          />
          <View style={[styles.rightActionsWrap, rowWidth > 0 ? { width: rowWidth } : null]}>
            <View style={styles.rightActionSurface}>
              <View style={[styles.actionIconBadge, styles.destructiveIconBadge]}>
                <MaterialIcons name={destructiveIconName} size={18} color="#ffffff" />
              </View>
              <Text style={styles.leftActionText}>{destructiveLabel}</Text>
            </View>
          </View>
        </>
      );
    },
    [
      deleteThreshold,
      destructiveIconName,
      destructiveLabel,
      enableDestructiveAction,
      handleDeleteThresholdCross,
      rowWidth,
    ]
  );

  const handleOpen = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'left' && enableDestructiveAction) {
        onDelete(item.id);
      }
    },
    [enableDestructiveAction, item.id, onDelete]
  );

  return (
    <Animated.View
      layout={LinearTransition.duration(180)}
      exiting={FadeOutLeft.duration(160)}
      onLayout={handleLayout}
    >
      <Swipeable
        ref={swipeableRef}
        friction={1.5}
        overshootLeft={false}
        overshootRight={false}
        leftThreshold={enableUtilityActions ? UTILITY_ACTIONS_WIDTH : 10_000}
        rightThreshold={enableDestructiveAction ? deleteThreshold || 10_000 : 10_000}
        renderLeftActions={enableUtilityActions ? renderLeftActions : undefined}
        renderRightActions={enableDestructiveAction ? renderRightActions : undefined}
        onSwipeableOpenStartDrag={resetThresholdHaptics}
        onSwipeableCloseStartDrag={resetThresholdHaptics}
        onSwipeableClose={resetThresholdHaptics}
        onSwipeableOpen={handleOpen}
      >
        <Pressable onPress={onPress} style={styles.contentPressable}>
          {children ?? (
            <View style={styles.fallbackContent}>
              <Text style={styles.fallbackName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.fallbackMessage} numberOfLines={1}>
                {item.message}
              </Text>
            </View>
          )}
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  contentPressable: {
    backgroundColor: 'transparent',
  },
  fallbackContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  fallbackName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  fallbackMessage: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  leftActionsWrap: {
    width: UTILITY_ACTIONS_WIDTH,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingVertical: ACTION_PANEL_INSET,
    gap: 2,
  },
  rightActionsWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: ACTION_PANEL_INSET,
  },
  rightActionSurface: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: '#d92d20',
    borderRadius: 24,
    overflow: 'hidden',
    paddingLeft: 18,
    paddingRight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leftActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  utilityAction: {
    width: UTILITY_ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
    paddingTop: 12,
    paddingBottom: 10,
  },
  actionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  readActionIconBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  destructiveIconBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  muteAction: {
    backgroundColor: '#6b7d96',
  },
  readAction: {
    backgroundColor: '#126b87',
  },
  utilityActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.15,
  },
});

const SwipeableChatItem = memo(SwipeableChatItemComponent);

export { SwipeableChatItem };
export type { SwipeableChatListItem };
