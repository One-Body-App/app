import React, { memo, useCallback, useRef } from 'react';
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

const UTILITY_ACTION_SIZE = 74;
const ACTION_SEPARATOR_WIDTH = 1;
const UTILITY_OPEN_THRESHOLD_RATIO = 0.58;
const DESTRUCTIVE_CELL_SIZE = 88;
const DESTRUCTIVE_TRAY_HORIZONTAL_INSET = 8;
const ACTION_CONTENT_GAP = 12;
const DESTRUCTIVE_TRAY_WIDTH = DESTRUCTIVE_CELL_SIZE + DESTRUCTIVE_TRAY_HORIZONTAL_INSET * 2;
const DESTRUCTIVE_ACTION_WIDTH = DESTRUCTIVE_TRAY_WIDTH + ACTION_CONTENT_GAP;
const DESTRUCTIVE_OPEN_THRESHOLD_RATIO = 0.62;
const ACTION_PANEL_INSET = 4;

type SwipeableChatListItem = {
  id: string;
  name: string;
  message: string;
  isRead: boolean;
  isMuted: boolean;
  isArchived: boolean;
};

type Props = {
  item: SwipeableChatListItem;
  onPress: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onMute: (id: string, nextMuted: boolean) => void;
  onToggleRead: (id: string, nextRead: boolean) => void;
  onArchive: (id: string) => void;
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
  onArchive,
  destructiveLabel = 'Archive',
  destructiveIconName = 'archive',
  enableDestructiveAction = true,
  enableUtilityActions = true,
  children,
}: Props) {
  const swipeableRef = useRef<SwipeableMethods | null>(null);
  const hasTriggeredDeleteThresholdRef = useRef(false);
  const hasTriggeredUtilityThresholdRef = useRef(false);
  const utilityActionCount = item.isArchived ? 1 : 3;
  const utilityTrayWidth =
    UTILITY_ACTION_SIZE * utilityActionCount +
    ACTION_SEPARATOR_WIDTH * Math.max(utilityActionCount - 1, 0);
  const utilityActionsWidth = utilityTrayWidth + ACTION_CONTENT_GAP;
  const utilityOpenThreshold = enableUtilityActions
    ? Math.max(UTILITY_ACTION_SIZE * 0.8, utilityTrayWidth * UTILITY_OPEN_THRESHOLD_RATIO)
    : 0;
  const destructiveActionsWidth = enableDestructiveAction ? DESTRUCTIVE_ACTION_WIDTH : 0;
  const deleteThreshold = destructiveActionsWidth * DESTRUCTIVE_OPEN_THRESHOLD_RATIO;

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
            threshold={utilityOpenThreshold}
            enabled={enableUtilityActions}
            direction="positive"
            onCrossThreshold={handleUtilityThresholdCross}
          />
          <View style={[styles.leftActionsWrap, { width: utilityActionsWidth }]}>
            {item.isArchived ? (
              <View style={[styles.utilityTray, { width: utilityTrayWidth }]}>
                <Pressable
                  style={[styles.utilityCell, styles.archiveAction]}
                  onPress={() => handleUtilityPress(() => onArchive(item.id), methods)}
                >
                  <MaterialIcons name="unarchive" size={22} color="#ffffff" />
                  <Text style={styles.utilityActionText}>Unarchive</Text>
                </Pressable>
              </View>
            ) : (
              <View style={[styles.utilityTray, { width: utilityTrayWidth }]}>
                <Pressable
                  style={[styles.utilityCell, styles.muteAction]}
                  onPress={() => handleUtilityPress(() => onMute(item.id, !item.isMuted), methods)}
                >
                  <MaterialIcons
                    name={item.isMuted ? 'notifications' : 'notifications-off'}
                    size={22}
                    color="#ffffff"
                  />
                  <Text style={styles.utilityActionText}>
                    {item.isMuted ? 'Unmute' : 'Silence'}
                  </Text>
                </Pressable>
                <View style={styles.utilitySeparator} />
                <Pressable
                  style={[styles.utilityCell, styles.archiveAction]}
                  onPress={() => handleUtilityPress(() => onArchive(item.id), methods)}
                >
                  <MaterialIcons name="archive" size={22} color="#ffffff" />
                  <Text style={styles.utilityActionText}>Archive</Text>
                </Pressable>
                <View style={styles.utilitySeparator} />
                <Pressable
                  style={[styles.utilityCell, styles.readAction]}
                  onPress={() =>
                    handleUtilityPress(() => onToggleRead(item.id, !item.isRead), methods)
                  }
                >
                  <MaterialIcons
                    name={item.isRead ? 'mark-email-unread' : 'mark-email-read'}
                    size={22}
                    color="#ffffff"
                  />
                  <Text style={styles.utilityActionText}>{item.isRead ? 'Unread' : 'Read'}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </>
      );
    },
    [
      enableUtilityActions,
      handleUtilityPress,
      handleUtilityThresholdCross,
      item.isArchived,
      item.id,
      item.isMuted,
      item.isRead,
      onArchive,
      onMute,
      onToggleRead,
      utilityOpenThreshold,
      utilityTrayWidth,
      utilityActionsWidth,
    ]
  );

  const handleDestructivePress = useCallback(
    (methods: SwipeableMethods) => {
      HapticService.trigger('selection');
      onDelete(item.id);
      methods.close();
    },
    [item.id, onDelete]
  );

  const renderRightActions = useCallback(
    (
      _progress: SharedValue<number>,
      translation: SharedValue<number>,
      methods: SwipeableMethods
    ) => {
      return (
        <>
          <ThresholdHapticObserver
            translation={translation}
            threshold={deleteThreshold}
            enabled={enableDestructiveAction}
            direction="negative"
            onCrossThreshold={handleDeleteThresholdCross}
          />
          <View style={[styles.rightActionsWrap, { width: destructiveActionsWidth }]}>
            <View style={[styles.destructiveTray, { width: DESTRUCTIVE_TRAY_WIDTH }]}>
              <Pressable
                style={styles.destructiveCell}
                onPress={() => handleDestructivePress(methods)}
              >
                <MaterialIcons name={destructiveIconName} size={24} color="#ffffff" />
                <Text style={styles.leftActionText}>{destructiveLabel}</Text>
              </Pressable>
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
      handleDestructivePress,
      handleDeleteThresholdCross,
      destructiveActionsWidth,
    ]
  );

  return (
    <Animated.View layout={LinearTransition.duration(180)} exiting={FadeOutLeft.duration(160)}>
      <Swipeable
        ref={swipeableRef}
        friction={1.1}
        overshootLeft={false}
        overshootRight={false}
        leftThreshold={enableUtilityActions ? utilityOpenThreshold : 10_000}
        rightThreshold={enableDestructiveAction ? deleteThreshold || 10_000 : 10_000}
        dragOffsetFromLeftEdge={16}
        dragOffsetFromRightEdge={16}
        renderLeftActions={enableUtilityActions ? renderLeftActions : undefined}
        renderRightActions={enableDestructiveAction ? renderRightActions : undefined}
        onSwipeableOpenStartDrag={resetThresholdHaptics}
        onSwipeableCloseStartDrag={resetThresholdHaptics}
        onSwipeableClose={resetThresholdHaptics}
        childrenContainerStyle={styles.childrenContainer}
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
  childrenContainer: {
    flex: 1,
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
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingVertical: ACTION_PANEL_INSET,
    paddingRight: ACTION_CONTENT_GAP,
  },
  rightActionsWrap: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: ACTION_PANEL_INSET,
    paddingLeft: ACTION_CONTENT_GAP,
  },
  utilityTray: {
    width: '100%',
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#d8e3e8',
  },
  utilityCell: {
    width: UTILITY_ACTION_SIZE,
    height: UTILITY_ACTION_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    gap: 6,
  },
  utilitySeparator: {
    width: ACTION_SEPARATOR_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  destructiveTray: {
    flex: 1,
    width: '100%',
    backgroundColor: '#d92d20',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DESTRUCTIVE_TRAY_HORIZONTAL_INSET,
  },
  destructiveCell: {
    width: DESTRUCTIVE_CELL_SIZE,
    height: DESTRUCTIVE_CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  leftActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  muteAction: {
    backgroundColor: '#6b7d96',
  },
  archiveAction: {
    backgroundColor: '#4f8596',
  },
  readAction: {
    backgroundColor: '#126b87',
  },
  utilityActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.15,
    textAlign: 'center',
  },
});

const SwipeableChatItem = memo(SwipeableChatItemComponent);

export { SwipeableChatItem };
export type { SwipeableChatListItem };
