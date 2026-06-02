import React, { useCallback, useMemo } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type TextInput as RNTextInput,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { MentionInput, useMentionSuggestions } from '@/components/mentions';
import StyledText from '@/components/styled/Text';
import {
  composerSpace,
  composerType,
  resolveComposerPalette,
  type ComposerPalette,
} from './composerTheme';

export type LecternToolId = 'photo' | 'video' | 'gif' | 'verse' | 'place' | 'writer';

export type LecternToolDef = {
  id: LecternToolId;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  visible?: boolean;
};

export type ComposerLecternProps = {
  scheme: 'dark' | 'light';
  // Mention composer pass-throughs.
  caption: string;
  onChangeCaption: (next: string) => void;
  mentions: Parameters<typeof MentionInput>[0]['mentions'];
  selection: Parameters<typeof MentionInput>[0]['selection'];
  onSelectionChange: Parameters<typeof MentionInput>[0]['onSelectionChange'];
  onSelectSuggestion: Parameters<typeof MentionInput>[0]['onSelectSuggestion'];
  onHandleBackspace: Parameters<typeof MentionInput>[0]['onHandleBackspace'];
  activeMention: Parameters<typeof MentionInput>[0]['activeMention'];
  suggestionsQuery?: string;
  // Token, used by useMentionSuggestions for fetching.
  token?: string;
  excludedUserIds?: string[];
  // Tool definitions in the order they should be rendered.
  tools: LecternToolDef[];
  onToolPress: (tool: LecternToolId) => void;
  toolPanel?: React.ReactNode;
  // The lectern itself is a controlled component so the host can flip between
  // compact options and expanded options. The caption stays visible in both.
  expanded: boolean;
  onExpandedChange: (next: boolean) => void;
  // Reports the sheet's measured height so the host can reserve space for it.
  onHeightChange?: (height: number) => void;
  captionInputRef?: React.RefObject<RNTextInput | null>;
  bottomInset?: number;
};

const EXPANDED_ICON_SIZE = 22;
const COMPACT_ICON_SIZE = 34;

const ToolButton = React.memo(function ToolButton({
  def,
  palette,
  expanded,
  onPress,
}: {
  def: LecternToolDef;
  palette: ComposerPalette;
  expanded: boolean;
  onPress: (tool: LecternToolId) => void;
}) {
  const handlePress = useCallback(
    (_event: GestureResponderEvent) => {
      onPress(def.id);
    },
    [def.id, onPress]
  );

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Add ${def.label.toLowerCase()}`}
      style={({ pressed }) => [
        styles.tool,
        expanded ? styles.toolExpanded : styles.toolCollapsed,
        {
          backgroundColor: expanded ? palette.glassElevated : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.toolIconWrap,
          expanded ? styles.toolIconWrapExpanded : styles.toolIconWrapCompact,
          {
            backgroundColor: expanded ? palette.glass : 'transparent',
            borderColor: expanded ? palette.glassBorder : 'transparent',
          },
        ]}
      >
        <MaterialIcons
          name={def.icon}
          size={expanded ? EXPANDED_ICON_SIZE : COMPACT_ICON_SIZE}
          color={palette.accent}
        />
      </View>
      {expanded ? (
        <StyledText style={[styles.toolLabel, { color: palette.textPrimary }]}>
          {def.label}
        </StyledText>
      ) : null}
    </Pressable>
  );
});

export default function ComposerLectern({
  scheme,
  caption,
  onChangeCaption,
  mentions,
  selection,
  onSelectionChange,
  onSelectSuggestion,
  onHandleBackspace,
  activeMention,
  token,
  excludedUserIds,
  tools,
  onToolPress,
  toolPanel,
  expanded,
  onExpandedChange,
  onHeightChange,
  captionInputRef,
  bottomInset = 0,
}: ComposerLecternProps): React.ReactElement {
  const palette = useMemo(() => resolveComposerPalette(scheme), [scheme]);
  const { height: windowHeight } = useWindowDimensions();
  // The sheet grows with its content (caption + tools + an optional tool panel)
  // up to a cap, and scrolls beyond that so the caption is always reachable.
  const maxExpandedHeight = Math.round(windowHeight * 0.85);
  const dragGesture = Gesture.Pan()
    .onEnd((event) => {
      'worklet';

      const shouldExpand = expanded ? event.translationY < 48 : event.translationY < -24;
      runOnJS(onExpandedChange)(shouldExpand);
    })
    .runOnJS(false);

  const visibleTools = useMemo(() => tools.filter((tool) => tool.visible !== false), [tools]);

  const {
    suggestions,
    isLoading: isMentionLoading,
    isError: isMentionError,
  } = useMentionSuggestions({
    query: activeMention?.query ?? '',
    token,
    limit: 8,
    excludedUserIds,
    enabled: Boolean(activeMention?.query),
  });

  const captionNode = (
    <View
      testID="composer-caption-field"
      style={[
        styles.captionWrap,
        { backgroundColor: palette.glass, borderColor: palette.glassBorder },
      ]}
    >
      <StyledText style={[styles.captionLabel, { color: palette.textMuted }]}>CAPTION</StyledText>
      <MentionInput
        inputRef={captionInputRef}
        activeMention={activeMention}
        value={caption}
        mentions={mentions}
        selection={selection}
        onSelectionChange={onSelectionChange}
        onChangeText={onChangeCaption}
        onSelectSuggestion={onSelectSuggestion}
        onHandleBackspace={onHandleBackspace}
        suggestions={suggestions}
        isLoading={isMentionLoading}
        isError={isMentionError}
        inputStyle={[styles.captionInput, { color: palette.textPrimary }]}
        placeholder="Share a testimony, a verse, a prayer request..."
        placeholderTextColor={palette.textMuted}
        multiline
        maxLength={500}
        textAlignVertical="top"
        suggestionsContainerStyle={{
          backgroundColor: palette.glassElevated,
          borderColor: palette.glassBorder,
        }}
      />
    </View>
  );

  return (
    <View
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}
      style={[
        styles.lectern,
        {
          backgroundColor: palette.glass,
          borderColor: palette.glassBorder,
          boxShadow: `0 -8px 24px ${palette.shadow}`,
          ...(expanded
            ? { minHeight: composerSpace.lecternExpandedHeight, maxHeight: maxExpandedHeight }
            : null),
        },
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          blurType={scheme === 'dark' ? 'chromeMaterialDark' : 'chromeMaterial'}
          blurAmount={20}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <GestureDetector gesture={dragGesture}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Collapse post options' : 'Expand post options'}
          onPress={() => onExpandedChange(!expanded)}
          style={styles.handleHitArea}
        >
          <View style={[styles.handle, { backgroundColor: palette.glassBorder }]} />
        </Pressable>
      </GestureDetector>

      {expanded ? (
        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={[
            styles.bodyExpanded,
            { paddingBottom: composerSpace.lg + bottomInset },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          {captionNode}

          <View style={[styles.toolsRow, styles.toolsRowExpanded]}>
            {visibleTools.map((tool) => (
              <ToolButton
                key={tool.id}
                def={tool}
                palette={palette}
                expanded
                onPress={onToolPress}
              />
            ))}
          </View>

          {toolPanel ? <View style={styles.toolPanelWrap}>{toolPanel}</View> : null}
        </ScrollView>
      ) : (
        <View style={[styles.bodyCompact, { paddingBottom: composerSpace.md + bottomInset }]}>
          {captionNode}

          <View style={[styles.toolsRow, styles.toolsRowCompact]}>
            {visibleTools.map((tool) => (
              <ToolButton
                key={tool.id}
                def={tool}
                palette={palette}
                expanded={false}
                onPress={onToolPress}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  lectern: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: composerSpace.lecternRadius,
    borderTopRightRadius: composerSpace.lecternRadius,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  handleHitArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    paddingTop: 8,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 999,
    opacity: 0.9,
  },
  bodyCompact: {
    paddingHorizontal: composerSpace.lg,
    gap: composerSpace.sm,
  },
  bodyScroll: {
    flexShrink: 1,
  },
  bodyExpanded: {
    paddingHorizontal: composerSpace.lg,
    gap: composerSpace.md,
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: composerSpace.xs,
    gap: composerSpace.sm,
  },
  toolsRowExpanded: {
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  toolsRowCompact: {
    paddingTop: 0,
    paddingBottom: composerSpace.xs,
  },
  tool: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolCollapsed: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  toolExpanded: {
    width: '30%',
    paddingVertical: composerSpace.sm,
    borderRadius: composerSpace.md,
    gap: 6,
  },
  toolIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  toolIconWrapExpanded: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  toolIconWrapCompact: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 0,
  },
  toolLabel: {
    ...composerType.caption,
    fontWeight: '600',
  },
  captionWrap: {
    borderRadius: composerSpace.md,
    paddingHorizontal: composerSpace.md,
    paddingTop: composerSpace.sm,
    paddingBottom: composerSpace.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  captionLabel: {
    ...composerType.eyebrow,
    fontWeight: '700',
    marginBottom: 6,
  },
  captionInput: {
    minHeight: 76,
    fontSize: 15,
    lineHeight: 22,
    padding: 0,
  },
  toolPanelWrap: {
    gap: composerSpace.sm,
  },
});
