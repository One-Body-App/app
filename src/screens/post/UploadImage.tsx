import { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import {
  Canvas,
  ColorMatrix,
  Group,
  Image as SkiaImage,
  ImageFormat,
  Rect,
  Skia,
  useCanvasRef,
  useImage,
} from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';
import StyledText from '@/components/styled/Text';
import { MainStackParamList } from '@/src/navigator/types';
import {
  cancelUploadImageRequest,
  resolveUploadImageResult,
} from '@/src/screens/post/uploadImageBridge';

type Props = StackScreenProps<MainStackParamList, 'UploadImage'>;

type ToolId = 'crop' | 'filters' | 'adjust' | 'text' | 'stickers';
type FilterId = 'original' | 'warm' | 'cool' | 'bw' | 'dramatic';
type RatioId = 'free' | '9:16' | '3:4' | '1:1';
type TransformState = {
  scale: number;
  translateX: number;
  translateY: number;
};

const PRIMARY = '#116d86';
const LIGHT_BACKGROUND = '#ffffff';
const DARK_BACKGROUND = '#121212';
const LIGHT_SURFACE = '#f3f4f6';
const DARK_SURFACE = '#1e1e1e';
const LIGHT_TEXT = '#000015';
const DARK_TEXT = '#e6eaec';
const HEADER_FONT = 'Rubik-Bold';
const BODY_FONT = 'OpenSans-Medium';
const OTHER_FONT = 'OpenSans-Regular';

const FALLBACK_PREVIEW_IMAGE =
  'https://images.unsplash.com/photo-1583997052301-0042b33fc598?auto=format&fit=crop&w=1440&q=80';
const ratioOptions: { id: RatioId; label: string; ratio: number | null }[] = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '3:4', label: '3:4', ratio: 3 / 4 },
  { id: '1:1', label: '1:1', ratio: 1 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const identityMatrix = () => [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

const multiply4x5 = (a: number[], b: number[]) => {
  const out = new Array(20).fill(0);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const idx = row * 5 + col;
      out[idx] =
        a[row * 5 + 0] * (col === 4 ? 0 : b[col + 0]) +
        a[row * 5 + 1] * (col === 4 ? 0 : b[col + 5]) +
        a[row * 5 + 2] * (col === 4 ? 0 : b[col + 10]) +
        a[row * 5 + 3] * (col === 4 ? 0 : b[col + 15]) +
        (col === 4 ? a[row * 5 + 4] : 0);
      if (col === 4) {
        out[idx] += b[row * 5 + 4];
      }
    }
  }
  return out;
};

const makeBrightnessMatrix = (delta: number) => {
  const shift = delta * 255;
  return [1, 0, 0, 0, shift, 0, 1, 0, 0, shift, 0, 0, 1, 0, shift, 0, 0, 0, 1, 0];
};

const makeContrastMatrix = (value: number) => {
  const t = 128 * (1 - value);
  return [value, 0, 0, 0, t, 0, value, 0, 0, t, 0, 0, value, 0, t, 0, 0, 0, 1, 0];
};

const makeSaturationMatrix = (saturation: number) => {
  const ir = 0.213;
  const ig = 0.715;
  const ib = 0.072;
  const inv = 1 - saturation;
  const r = ir * inv;
  const g = ig * inv;
  const b = ib * inv;
  return [
    r + saturation,
    g,
    b,
    0,
    0,
    r,
    g + saturation,
    b,
    0,
    0,
    r,
    g,
    b + saturation,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];
};

const filterMatrixById = (filter: FilterId) => {
  if (filter === 'warm') {
    return multiply4x5(makeSaturationMatrix(0.92), makeBrightnessMatrix(0.04));
  }
  if (filter === 'cool') {
    return [0.95, 0, 0.08, 0, -6, 0, 1.0, 0.05, 0, 0, 0.02, 0.04, 1.05, 0, 8, 0, 0, 0, 1, 0];
  }
  if (filter === 'bw') {
    return [
      0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0,
      0, 0, 1, 0,
    ];
  }
  if (filter === 'dramatic') {
    return multiply4x5(makeContrastMatrix(1.18), makeSaturationMatrix(0.9));
  }
  return identityMatrix();
};

const filterLabel = (id: FilterId) => {
  if (id === 'warm') return 'Warm';
  if (id === 'cool') return 'Cool';
  if (id === 'bw') return 'B&W';
  if (id === 'dramatic') return 'Dramatic';
  return 'Original';
};

const toolLabel = (id: ToolId) => {
  if (id === 'crop') return 'Crop';
  if (id === 'filters') return 'Filters';
  if (id === 'adjust') return 'Adjust';
  if (id === 'text') return 'Text';
  return 'Stickers';
};

const toolIcon = (id: ToolId) => {
  if (id === 'crop') return 'crop';
  if (id === 'filters') return 'image-filter-center-focus-weak';
  if (id === 'adjust') return 'tune-vertical';
  if (id === 'text') return 'format-text';
  return 'sticker-emoji';
};

function UploadImage({ navigation, route }: Props) {
  const { dark } = useTheme();
  const { width } = useWindowDimensions();
  const canvasRef = useCanvasRef();
  const [activeTool, setActiveTool] = useState<ToolId>('crop');
  const [filter, setFilter] = useState<FilterId>('original');
  const [ratio, setRatio] = useState<RatioId>('free');
  const [transform, setTransform] = useState<TransformState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const resolvedRef = useRef(false);

  const sourceUri = route.params?.imageUri ?? FALLBACK_PREVIEW_IMAGE;
  const requestId = route.params?.requestId;
  const image = useImage(sourceUri);

  const textColor = dark ? DARK_TEXT : LIGHT_TEXT;
  const backgroundColor = dark ? DARK_BACKGROUND : LIGHT_BACKGROUND;
  const surfaceColor = dark ? DARK_SURFACE : LIGHT_SURFACE;
  const mutedText = dark ? 'rgba(230,234,236,0.62)' : 'rgba(60,78,95,0.74)';
  const borderColor = dark ? '#2a2e32' : '#d9e0e5';

  const canvasWidth = Math.min(width - 32, 420);
  const canvasHeight = canvasWidth * 1.25;

  const selectedRatio = useMemo(
    () => ratioOptions.find((option) => option.id === ratio)?.ratio ?? null,
    [ratio]
  );

  const cropRect = useMemo(() => {
    if (!selectedRatio) {
      return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
    }

    const maxWidth = canvasWidth;
    const maxHeight = canvasHeight;
    let cropWidth = maxWidth;
    let cropHeight = cropWidth / selectedRatio;

    if (cropHeight > maxHeight) {
      cropHeight = maxHeight;
      cropWidth = cropHeight * selectedRatio;
    }

    return {
      x: (canvasWidth - cropWidth) / 2,
      y: (canvasHeight - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    };
  }, [canvasHeight, canvasWidth, selectedRatio]);

  const clampTransform = useCallback(
    (nextTransform: TransformState): TransformState => {
      if (!image) {
        return { scale: 1, translateX: 0, translateY: 0 };
      }
      const imageWidth = image.width();
      const imageHeight = image.height();
      if (!imageWidth || !imageHeight || !cropRect.width || !cropRect.height) {
        return nextTransform;
      }

      const safeScale = clamp(nextTransform.scale, 1, 4);
      const imageAspect = imageWidth / imageHeight;
      const cropAspect = cropRect.width / cropRect.height;

      let baseWidth = cropRect.width;
      let baseHeight = cropRect.height;
      if (imageAspect > cropAspect) {
        baseHeight = cropRect.height;
        baseWidth = baseHeight * imageAspect;
      } else {
        baseWidth = cropRect.width;
        baseHeight = baseWidth / imageAspect;
      }

      const scaledWidth = baseWidth * safeScale;
      const scaledHeight = baseHeight * safeScale;
      const horizontalSlack = Math.max(0, (scaledWidth - cropRect.width) / 2);
      const verticalSlack = Math.max(0, (scaledHeight - cropRect.height) / 2);

      return {
        scale: safeScale,
        translateX: clamp(nextTransform.translateX, -horizontalSlack, horizontalSlack),
        translateY: clamp(nextTransform.translateY, -verticalSlack, verticalSlack),
      };
    },
    [cropRect.height, cropRect.width, image]
  );

  const imageFrame = useMemo(() => {
    if (!image) {
      return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
    }
    const imageWidth = image.width();
    const imageHeight = image.height();
    const imageAspect = imageWidth / imageHeight;
    const cropAspect = cropRect.width / cropRect.height;

    let baseWidth = cropRect.width;
    let baseHeight = cropRect.height;
    if (imageAspect > cropAspect) {
      baseHeight = cropRect.height;
      baseWidth = baseHeight * imageAspect;
    } else {
      baseWidth = cropRect.width;
      baseHeight = baseWidth / imageAspect;
    }
    const drawWidth = baseWidth * transform.scale;
    const drawHeight = baseHeight * transform.scale;
    return {
      x: cropRect.x + cropRect.width / 2 - drawWidth / 2 + transform.translateX,
      y: cropRect.y + cropRect.height / 2 - drawHeight / 2 + transform.translateY,
      width: drawWidth,
      height: drawHeight,
    };
  }, [
    canvasHeight,
    canvasWidth,
    cropRect.height,
    cropRect.width,
    cropRect.x,
    cropRect.y,
    image,
    transform,
  ]);

  const filters = useMemo<FilterId[]>(() => ['original', 'warm', 'cool', 'bw', 'dramatic'], []);

  useEffect(() => {
    setTransform({ scale: 1, translateX: 0, translateY: 0 });
  }, [ratio, sourceUri]);

  const resolveAndClose = useCallback(
    (
      result:
        | { status: 'saved'; uri: string; fileName?: string; fileSize?: number; type?: string }
        | { status: 'cancelled' }
    ) => {
      if (requestId && !resolvedRef.current) {
        resolveUploadImageResult(requestId, result);
        resolvedRef.current = true;
      }
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    [navigation, requestId]
  );

  useEffect(() => {
    return () => {
      if (requestId && !resolvedRef.current) {
        cancelUploadImageRequest(requestId);
        resolvedRef.current = true;
      }
    };
  }, [requestId]);

  const cancelEditing = useCallback(() => {
    resolveAndClose({ status: 'cancelled' });
  }, [resolveAndClose]);

  const nudgeCrop = useCallback(
    (dx: number, dy: number) => {
      setTransform((previous) =>
        clampTransform({
          ...previous,
          translateX: previous.translateX + dx,
          translateY: previous.translateY + dy,
        })
      );
    },
    [clampTransform]
  );

  const zoomCrop = useCallback(
    (delta: number) => {
      setTransform((previous) =>
        clampTransform({
          ...previous,
          scale: previous.scale + delta,
        })
      );
    },
    [clampTransform]
  );

  const setCropRatio = useCallback((nextRatio: RatioId) => {
    setRatio(nextRatio);
  }, []);

  const handleDone = useCallback(async () => {
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      const snapshot = canvasRef.current?.makeImageSnapshot(
        Skia.XYWHRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height)
      );
      if (!snapshot) {
        resolveAndClose({
          status: 'saved',
          uri: sourceUri,
          fileName: route.params?.fileName,
          fileSize: route.params?.fileSize,
          type: route.params?.type ?? 'image/jpeg',
        });
        return;
      }

      const base64 = snapshot.encodeToBase64(ImageFormat.JPEG, 50);
      const outputNameBase = route.params?.fileName ?? `edited_${Date.now()}.jpg`;
      const outputName = outputNameBase.toLowerCase().endsWith('.jpg')
        ? outputNameBase
        : `${outputNameBase.split('.').slice(0, -1).join('.') || outputNameBase}.jpg`;
      const outputPath = `${RNFS.CachesDirectoryPath}/onebody_${Date.now()}_${Math.round(
        Math.random() * 1000
      )}.jpg`;
      await RNFS.writeFile(outputPath, base64, 'base64');
      const stat = await RNFS.stat(outputPath).catch(() => null);

      resolveAndClose({
        status: 'saved',
        uri: `file://${outputPath}`,
        fileName: outputName,
        fileSize: stat ? Number(stat.size) : undefined,
        type: 'image/jpeg',
      });
    } catch (error) {
      resolveAndClose({
        status: 'saved',
        uri: sourceUri,
        fileName: route.params?.fileName,
        fileSize: route.params?.fileSize,
        type: route.params?.type ?? 'image/jpeg',
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    canvasRef,
    isSaving,
    resolveAndClose,
    route.params?.fileName,
    route.params?.fileSize,
    route.params?.type,
    sourceUri,
    cropRect.height,
    cropRect.width,
    cropRect.x,
    cropRect.y,
  ]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            cancelEditing();
          }}
          style={styles.headerButton}
          disabled={isSaving}
        >
          <MaterialCommunityIcons name="close" size={31} color={textColor} />
        </Pressable>
        <StyledText style={[styles.headerTitle, { color: textColor }]}>Edit Photo</StyledText>
        {isSaving ? (
          <View style={styles.headerButton}>
            <ActivityIndicator color={PRIMARY} />
          </View>
        ) : (
          <Pressable onPress={handleDone} style={styles.headerButton}>
            <StyledText style={styles.doneText}>Done</StyledText>
          </Pressable>
        )}
      </View>

      <View style={styles.body}>
        <View
          style={[
            styles.canvasShell,
            { width: canvasWidth, height: canvasHeight, backgroundColor: surfaceColor },
          ]}
        >
          <Canvas ref={canvasRef} style={styles.canvas}>
            <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} color={surfaceColor} />
            {image ? (
              <Group clip={Skia.XYWHRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height)}>
                <SkiaImage
                  image={image}
                  x={imageFrame.x}
                  y={imageFrame.y}
                  width={imageFrame.width}
                  height={imageFrame.height}
                  fit="fill"
                >
                  <ColorMatrix matrix={filterMatrixById(filter)} />
                </SkiaImage>
              </Group>
            ) : null}
          </Canvas>

          <View pointerEvents="none" style={styles.cropOverlay}>
            <View
              style={[
                styles.cropShade,
                {
                  left: 0,
                  top: 0,
                  width: canvasWidth,
                  height: cropRect.y,
                },
              ]}
            />
            <View
              style={[
                styles.cropShade,
                {
                  left: 0,
                  top: cropRect.y + cropRect.height,
                  width: canvasWidth,
                  height: Math.max(0, canvasHeight - (cropRect.y + cropRect.height)),
                },
              ]}
            />
            <View
              style={[
                styles.cropShade,
                {
                  left: 0,
                  top: cropRect.y,
                  width: cropRect.x,
                  height: cropRect.height,
                },
              ]}
            />
            <View
              style={[
                styles.cropShade,
                {
                  left: cropRect.x + cropRect.width,
                  top: cropRect.y,
                  width: Math.max(0, canvasWidth - (cropRect.x + cropRect.width)),
                  height: cropRect.height,
                },
              ]}
            />
            <View
              style={[
                styles.cropBorder,
                {
                  left: cropRect.x,
                  top: cropRect.y,
                  width: cropRect.width,
                  height: cropRect.height,
                },
              ]}
            />
            <View
              style={[
                styles.cropGridVertical,
                {
                  left: cropRect.x + cropRect.width / 3,
                  top: cropRect.y,
                  height: cropRect.height,
                },
              ]}
            />
            <View
              style={[
                styles.cropGridVertical,
                {
                  left: cropRect.x + (cropRect.width * 2) / 3,
                  top: cropRect.y,
                  height: cropRect.height,
                },
              ]}
            />
            <View
              style={[
                styles.cropGridHorizontal,
                {
                  left: cropRect.x,
                  top: cropRect.y + cropRect.height / 3,
                  width: cropRect.width,
                },
              ]}
            />
            <View
              style={[
                styles.cropGridHorizontal,
                {
                  left: cropRect.x,
                  top: cropRect.y + (cropRect.height * 2) / 3,
                  width: cropRect.width,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View
        style={[styles.contextTray, { backgroundColor: surfaceColor, borderTopColor: borderColor }]}
      >
        {activeTool === 'crop' ? (
          <View style={styles.cropTrayContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cropRatioRow}
            >
              {ratioOptions.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.cropRatioPill,
                    ratio === option.id ? styles.cropRatioPillActive : null,
                  ]}
                  onPress={() => setCropRatio(option.id)}
                >
                  <StyledText
                    style={[
                      styles.cropRatioPillLabel,
                      { color: ratio === option.id ? '#ffffff' : mutedText },
                    ]}
                  >
                    {option.label}
                  </StyledText>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.cropControls}>
              <Pressable style={styles.cropActionButton} onPress={() => zoomCrop(-0.12)}>
                <MaterialCommunityIcons name="minus" size={20} color={textColor} />
              </Pressable>
              <Pressable style={styles.cropActionButton} onPress={() => zoomCrop(0.12)}>
                <MaterialCommunityIcons name="plus" size={20} color={textColor} />
              </Pressable>
              <Pressable style={styles.cropActionButton} onPress={() => nudgeCrop(-20, 0)}>
                <MaterialCommunityIcons name="arrow-left" size={20} color={textColor} />
              </Pressable>
              <Pressable style={styles.cropActionButton} onPress={() => nudgeCrop(20, 0)}>
                <MaterialCommunityIcons name="arrow-right" size={20} color={textColor} />
              </Pressable>
              <Pressable style={styles.cropActionButton} onPress={() => nudgeCrop(0, -20)}>
                <MaterialCommunityIcons name="arrow-up" size={20} color={textColor} />
              </Pressable>
              <Pressable style={styles.cropActionButton} onPress={() => nudgeCrop(0, 20)}>
                <MaterialCommunityIcons name="arrow-down" size={20} color={textColor} />
              </Pressable>
            </View>
          </View>
        ) : null}
        {activeTool === 'filters' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {filters.map((id) => (
              <Pressable key={id} style={styles.filterItem} onPress={() => setFilter(id)}>
                <View
                  style={[
                    styles.filterThumb,
                    {
                      borderColor: filter === id ? PRIMARY : 'transparent',
                      backgroundColor: dark ? '#2a2f34' : '#d9dde1',
                    },
                  ]}
                >
                  <Canvas style={styles.filterCanvas}>
                    {image ? (
                      <SkiaImage image={image} x={0} y={0} width={64} height={64} fit="cover">
                        <ColorMatrix matrix={filterMatrixById(id)} />
                      </SkiaImage>
                    ) : (
                      <Rect x={0} y={0} width={64} height={64} color={surfaceColor} />
                    )}
                  </Canvas>
                </View>
                <StyledText
                  style={[
                    styles.filterLabel,
                    {
                      color: filter === id ? PRIMARY : mutedText,
                      fontWeight: filter === id ? '700' : '500',
                    },
                  ]}
                >
                  {filterLabel(id)}
                </StyledText>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.placeholderTray}>
            <StyledText style={[styles.placeholderText, { color: mutedText }]}>
              {toolLabel(activeTool)} controls are enabled in Skia core and will surface here.
            </StyledText>
          </View>
        )}
      </View>

      <View
        style={[styles.toolNav, { backgroundColor: surfaceColor, borderTopColor: borderColor }]}
      >
        {(['crop', 'filters', 'adjust', 'text', 'stickers'] as ToolId[]).map((id) => {
          const active = activeTool === id;
          return (
            <Pressable key={id} style={styles.toolItem} onPress={() => setActiveTool(id)}>
              <MaterialCommunityIcons
                name={toolIcon(id)}
                size={26}
                color={active ? PRIMARY : mutedText}
              />
              <StyledText
                style={[
                  styles.toolLabel,
                  {
                    color: active ? PRIMARY : mutedText,
                    fontWeight: active ? '700' : '600',
                  },
                ]}
              >
                {toolLabel(id).toUpperCase()}
              </StyledText>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: HEADER_FONT,
    fontSize: 40 / 2,
    fontWeight: '700',
  },
  doneText: {
    fontFamily: BODY_FONT,
    color: PRIMARY,
    fontSize: 34 / 2,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  canvasShell: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  canvas: {
    flex: 1,
  },
  cropOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cropShade: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  cropBorder: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  cropGridVertical: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  cropGridHorizontal: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  contextTray: {
    height: 120,
    borderTopWidth: 1,
    justifyContent: 'center',
  },
  cropTrayContainer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    rowGap: 10,
  },
  cropRatioRow: {
    alignItems: 'center',
    gap: 10,
  },
  cropRatioPill: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(113,128,150,0.2)',
  },
  cropRatioPillActive: {
    backgroundColor: PRIMARY,
  },
  cropRatioPillLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '600',
  },
  cropControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: 8,
  },
  cropActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(113,128,150,0.2)',
  },
  filterRow: {
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 16,
  },
  filterItem: {
    alignItems: 'center',
    width: 76,
  },
  filterThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  filterCanvas: {
    width: 64,
    height: 64,
  },
  filterLabel: {
    marginTop: 8,
    fontFamily: BODY_FONT,
    fontSize: 22 / 2,
  },
  placeholderTray: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  placeholderText: {
    fontFamily: OTHER_FONT,
    fontSize: 24 / 2,
    textAlign: 'center',
  },
  toolNav: {
    height: 72,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  toolItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  toolLabel: {
    fontFamily: OTHER_FONT,
    fontSize: 20 / 2,
    letterSpacing: 0.5,
  },
});

export default UploadImage;
