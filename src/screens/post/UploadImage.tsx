import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  Canvas,
  ColorMatrix,
  Group,
  Image as SkiaImage,
  ImageFormat,
  Rect,
  Skia,
  Text as SkiaText,
  matchFont,
  useCanvasRef,
  useImage,
  type SkImage,
} from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';
import useMountEffect from '@/src/hooks/useMountEffect';
import StyledText from '@/components/styled/Text';
import { MainStackParamList } from '@/src/navigator/types';
import {
  cancelUploadImageRequest,
  resolveUploadImageResult,
} from '@/src/screens/post/uploadImageBridge';
import { UPLOAD_IMAGE_EXPORT_QUALITY } from '@/src/screens/post/uploadImageConfig';
import {
  buildUploadImageColorMatrix,
  type UploadImageAdjustPresetId as AdjustPresetId,
  type UploadImageFilterId as FilterId,
  UPLOAD_IMAGE_ADJUST_OPTIONS,
  UPLOAD_IMAGE_FILTERS,
} from '@/src/screens/post/uploadImageFilters';
import {
  getOrientationTransform,
  normalizeExifOrientation,
} from '@/src/screens/post/uploadImageOrientation';

type MaterialCommunityIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Props = NativeStackScreenProps<MainStackParamList, 'UploadImage'>;

type ToolId = 'crop' | 'filters' | 'adjust' | 'text' | 'stickers';
type RatioId = 'free' | '9:16' | '3:4' | '1:1';
type TransformState = {
  scale: number;
  translateX: number;
  translateY: number;
};
type TextOverlay = {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
};
type StickerOverlay = {
  id: string;
  glyph: string;
  x: number;
  y: number;
  size: number;
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
const textColorOptions = ['#ffffff', '#fef3c7', '#93c5fd', '#86efac', '#fda4af', '#111827'];
const stickerOptions = ['🙏', '✨', '💙', '🔥', '🙌', '🕊️'];
const ratioOptions: { id: RatioId; label: string; ratio: number | null }[] = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '3:4', label: '3:4', ratio: 3 / 4 },
  { id: '1:1', label: '1:1', ratio: 1 },
];

const defaultRatioForContext = (usageContext?: 'feed' | 'comment' | 'chat'): RatioId => {
  if (usageContext === 'comment') {
    return '1:1';
  }
  if (usageContext === 'chat') {
    return 'free';
  }
  return '3:4';
};

const normalizeImageUri = (uri: string) => {
  if (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('data:') ||
    uri.startsWith('ph://')
  ) {
    return uri;
  }
  if (uri.startsWith('/')) {
    return `file://${uri}`;
  }
  return uri;
};

const stripFileScheme = (uri: string) => {
  if (uri.startsWith('file://')) {
    return uri.slice(7);
  }
  return uri;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const MIN_EDITOR_SCALE = 1;
const MAX_EDITOR_SCALE = 6;

const resolveContainedSize = (
  imageWidth: number,
  imageHeight: number,
  targetWidth: number,
  targetHeight: number
) => {
  if (!imageWidth || !imageHeight || !targetWidth || !targetHeight) {
    return { width: targetWidth, height: targetHeight };
  }
  const imageAspect = imageWidth / imageHeight;
  const targetAspect = targetWidth / targetHeight;
  if (imageAspect > targetAspect) {
    const width = targetWidth;
    return { width, height: width / imageAspect };
  }
  const height = targetHeight;
  return { width: height * imageAspect, height };
};

const readImageDimensions = (image: { width: () => number; height: () => number } | null) => {
  if (!image) {
    return null;
  }
  try {
    const width = image.width();
    const height = image.height();
    if (!width || !height) {
      return null;
    }
    return { width, height };
  } catch (error) {
    return null;
  }
};

const makeOrientedImage = (image: SkImage, orientation?: number) => {
  const normalizedOrientation = normalizeExifOrientation(orientation);
  if (!normalizedOrientation || normalizedOrientation === 1) {
    return image;
  }

  const sourceWidth = image.width();
  const sourceHeight = image.height();
  if (!sourceWidth || !sourceHeight) {
    return image;
  }

  const { matrix, outputWidth, outputHeight } = getOrientationTransform(
    sourceWidth,
    sourceHeight,
    normalizedOrientation
  );
  const surface = Skia.Surface.MakeOffscreen(outputWidth, outputHeight);
  if (!surface) {
    return image;
  }

  const canvas = surface.getCanvas();
  const srcRect = Skia.XYWHRect(0, 0, sourceWidth, sourceHeight);
  const dstRect = Skia.XYWHRect(0, 0, sourceWidth, sourceHeight);
  const paint = Skia.Paint();

  canvas.save();
  canvas.concat(matrix);
  canvas.drawImageRect(image as never, srcRect, dstRect, paint);
  canvas.restore();
  surface.flush();

  return surface.makeImageSnapshot().makeNonTextureImage();
};

const toolLabel = (id: ToolId) => {
  if (id === 'crop') return 'Crop';
  if (id === 'filters') return 'Filters';
  if (id === 'adjust') return 'Adjust';
  if (id === 'text') return 'Text';
  return 'Stickers';
};

const toolIcon = (id: ToolId): MaterialCommunityIconName => {
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
  const [activeTool, setActiveTool] = useState<ToolId>('filters');
  const [filter, setFilter] = useState<FilterId>('original');
  const [adjust, setAdjust] = useState<AdjustPresetId>('none');
  const [ratio, setRatio] = useState<RatioId>(() =>
    defaultRatioForContext(route.params?.usageContext)
  );
  const [transform, setTransform] = useState<TransformState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [newTextValue, setNewTextValue] = useState('Faith');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([]);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [decodedImage, setDecodedImage] = useState<ReturnType<
    typeof Skia.Image.MakeImageFromEncoded
  > | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const resolvedRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const pinchStartRef = useRef(1);
  const fontCacheRef = useRef<Map<number, ReturnType<typeof matchFont>>>(new Map());

  const sourceUri = normalizeImageUri(route.params?.imageUri ?? FALLBACK_PREVIEW_IMAGE);
  const requestId = route.params?.requestId;
  const imageOrientation = normalizeExifOrientation(route.params?.orientation);
  const loadedImage = useImage(sourceUri);
  const baseImage =
    Platform.OS === 'android' ? (decodedImage ?? loadedImage) : (loadedImage ?? decodedImage);
  const image = useMemo(
    () => (baseImage ? makeOrientedImage(baseImage, imageOrientation) : null),
    [baseImage, imageOrientation]
  );

  const imageSourceCandidatesMemo = useMemo(() => {
    const nextCandidates: string[] = [];
    const pushCandidate = (value?: string) => {
      if (!value || nextCandidates.includes(value)) {
        return;
      }
      nextCandidates.push(value);
    };
    pushCandidate(sourceUri);
    if (sourceUri.startsWith('file://')) {
      pushCandidate(stripFileScheme(sourceUri));
    }
    return nextCandidates.length ? nextCandidates : [sourceUri];
  }, [sourceUri]);

  useMountEffect(() => {
    let cancelled = false;
    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
      new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('timeout'));
        }, timeoutMs);
        promise
          .then((value) => {
            clearTimeout(timeout);
            resolve(value);
          })
          .catch((error) => {
            clearTimeout(timeout);
            reject(error);
          });
      });

    const decodeImageFromBase64 = (value: string) => {
      const encoded = Skia.Data.fromBase64(value);
      return Skia.Image.MakeImageFromEncoded(encoded);
    };

    const decodeImageFromFetch = async (uri: string) => {
      const response = await withTimeout(fetch(uri), 7000);
      if (!response.ok) {
        throw new Error(`Unable to fetch image source: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const encoded = Skia.Data.fromBytes(bytes);
      return Skia.Image.MakeImageFromEncoded(encoded);
    };

    const tryDecodeFromFile = async (candidateUri: string) => {
      if (
        !candidateUri ||
        candidateUri.startsWith('http://') ||
        candidateUri.startsWith('https://') ||
        candidateUri.startsWith('ph://')
      ) {
        return null;
      }
      if (candidateUri.startsWith('data:')) {
        const base64Start = candidateUri.indexOf(',');
        const payload = base64Start >= 0 ? candidateUri.slice(base64Start + 1) : candidateUri;
        return decodeImageFromBase64(payload);
      }

      const pathsToTry: string[] = [];
      const pushPath = (value?: string) => {
        if (!value || pathsToTry.includes(value)) {
          return;
        }
        pathsToTry.push(value);
      };

      if (candidateUri.startsWith('file://')) {
        pushPath(stripFileScheme(candidateUri));
      } else if (candidateUri.startsWith('/')) {
        pushPath(candidateUri);
      }

      if (candidateUri.startsWith('content://')) {
        const stat = await withTimeout(RNFS.stat(candidateUri), 3500).catch(() => null);
        const originalPath =
          (stat as (RNFS.StatResult & { originalFilepath?: string }) | null)?.originalFilepath ??
          '';
        if (originalPath) {
          pushPath(originalPath);
        }
        const targetPath = `${RNFS.CachesDirectoryPath}/onebody_editor_decode_${Date.now()}_${Math.round(
          Math.random() * 1000
        )}.jpg`;
        await withTimeout(RNFS.copyFile(candidateUri, targetPath), 5000)
          .then(() => {
            pushPath(targetPath);
          })
          .catch(() => undefined);
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const path of pathsToTry) {
        // eslint-disable-next-line no-await-in-loop
        const base64 = await withTimeout(RNFS.readFile(path, 'base64'), 5000).catch(() => null);
        if (!base64) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const decoded = decodeImageFromBase64(base64);
        if (decoded) {
          return decoded;
        }
      }

      return decodeImageFromFetch(candidateUri).catch(() => null);
    };

    const tryDecodeFallback = async () => {
      if (Platform.OS !== 'android') {
        setIsPreparingImage(false);
        return;
      }
      setIsPreparingImage(true);

      const candidates = [...imageSourceCandidatesMemo];
      // eslint-disable-next-line no-restricted-syntax
      for (const candidateUri of candidates) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const encodedByUri = await withTimeout(Skia.Data.fromURI(candidateUri), 3500).catch(
            () => null
          );
          if (encodedByUri) {
            const uriDecoded = Skia.Image.MakeImageFromEncoded(encodedByUri);
            if (uriDecoded) {
              if (!cancelled) {
                setDecodedImage(uriDecoded);
                setIsPreparingImage(false);
              }
              return;
            }
          }
          // eslint-disable-next-line no-await-in-loop
          const decoded = await tryDecodeFromFile(candidateUri);
          if (decoded) {
            if (!cancelled) {
              setDecodedImage(decoded);
              setIsPreparingImage(false);
            }
            return;
          }
        } catch (error) {
          // Keep trying remaining candidates.
        }
      }

      if (!cancelled) {
        setIsPreparingImage(false);
      }
    };

    tryDecodeFallback();

    return () => {
      cancelled = true;
    };
  });

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
      const dimensions = readImageDimensions(image);
      if (!dimensions) {
        return { scale: 1, translateX: 0, translateY: 0 };
      }
      const imageWidth = dimensions.width;
      const imageHeight = dimensions.height;
      if (!cropRect.width || !cropRect.height) {
        return nextTransform;
      }

      const safeScale = clamp(nextTransform.scale, MIN_EDITOR_SCALE, MAX_EDITOR_SCALE);
      const base = resolveContainedSize(imageWidth, imageHeight, cropRect.width, cropRect.height);
      const baseWidth = base.width;
      const baseHeight = base.height;

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
    const dimensions = readImageDimensions(image);
    if (!dimensions) {
      return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
    }
    const imageWidth = dimensions.width;
    const imageHeight = dimensions.height;
    const base = resolveContainedSize(imageWidth, imageHeight, cropRect.width, cropRect.height);
    const baseWidth = base.width;
    const baseHeight = base.height;
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

  useMountEffect(() => {
    setTransform((previous) => clampTransform(previous));
  });

  const combinedColorMatrix = useMemo(
    () => buildUploadImageColorMatrix(filter, adjust),
    [adjust, filter]
  );
  const filterPreviewMatrices = useMemo(
    () =>
      Object.fromEntries(
        UPLOAD_IMAGE_FILTERS.map(({ id }) => [id, buildUploadImageColorMatrix(id, adjust)])
      ) as Record<FilterId, ReturnType<typeof buildUploadImageColorMatrix>>,
    [adjust]
  );

  const getOverlayFont = useCallback((size: number) => {
    const roundedSize = Math.max(12, Math.round(size));
    if (fontCacheRef.current.has(roundedSize)) {
      return fontCacheRef.current.get(roundedSize)!;
    }
    const font = matchFont({
      fontFamily: BODY_FONT,
      fontSize: roundedSize,
      fontWeight: '700',
    });
    fontCacheRef.current.set(roundedSize, font);
    return font;
  }, []);

  useMountEffect(() => {
    setTransform({ scale: 1, translateX: 0, translateY: 0 });
    setTextOverlays([]);
    setStickerOverlays([]);
    setAdjust('none');
    setFilter('original');
    setNewTextValue('Faith');
    setRatio(defaultRatioForContext(route.params?.usageContext));
  });

  const cropGesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(activeTool === 'crop')
      .onBegin(() => {
        setIsGestureActive(true);
        panStartRef.current = {
          x: transform.translateX,
          y: transform.translateY,
        };
      })
      .onUpdate((event) => {
        setTransform((previous) =>
          clampTransform({
            ...previous,
            translateX: panStartRef.current.x + event.translationX,
            translateY: panStartRef.current.y + event.translationY,
          })
        );
      })
      .onEnd(() => {
        setIsGestureActive(false);
      })
      .runOnJS(true);

    const pinch = Gesture.Pinch()
      .enabled(activeTool === 'crop')
      .onBegin(() => {
        setIsGestureActive(true);
        pinchStartRef.current = transform.scale;
      })
      .onUpdate((event) => {
        setTransform((previous) =>
          clampTransform({
            ...previous,
            scale: pinchStartRef.current * event.scale,
          })
        );
      })
      .onEnd(() => {
        setIsGestureActive(false);
      })
      .runOnJS(true);

    return Gesture.Simultaneous(pan, pinch);
  }, [activeTool, clampTransform, transform.scale, transform.translateX, transform.translateY]);

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

  useMountEffect(() => {
    return () => {
      if (requestId && !resolvedRef.current) {
        cancelUploadImageRequest(requestId);
        resolvedRef.current = true;
      }
    };
  });

  const cancelEditing = useCallback(() => {
    resolveAndClose({ status: 'cancelled' });
  }, [resolveAndClose]);

  const setCropRatio = useCallback((nextRatio: RatioId) => {
    setRatio(nextRatio);
    setTransform({ scale: MIN_EDITOR_SCALE, translateX: 0, translateY: 0 });
  }, []);

  const addTextOverlay = useCallback(() => {
    const trimmed = newTextValue.trim();
    if (!trimmed || !cropRect.width || !cropRect.height) {
      return;
    }
    setTextOverlays((previous) => [
      ...previous,
      {
        id: `text-${Date.now()}-${Math.round(Math.random() * 1000)}`,
        text: trimmed,
        x: cropRect.x + cropRect.width * 0.2,
        y: cropRect.y + cropRect.height * 0.52,
        size: 32,
        color: textColorOptions[0],
      },
    ]);
  }, [cropRect.height, cropRect.width, cropRect.x, cropRect.y, newTextValue]);

  const addStickerOverlay = useCallback(
    (glyph: string) => {
      if (!cropRect.width || !cropRect.height) {
        return;
      }
      setStickerOverlays((previous) => [
        ...previous,
        {
          id: `sticker-${Date.now()}-${Math.round(Math.random() * 1000)}`,
          glyph,
          x: cropRect.x + cropRect.width * 0.45,
          y: cropRect.y + cropRect.height * 0.55,
          size: 36,
        },
      ]);
    },
    [cropRect.height, cropRect.width, cropRect.x, cropRect.y]
  );

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

      const base64 = snapshot.encodeToBase64(ImageFormat.JPEG, UPLOAD_IMAGE_EXPORT_QUALITY);
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
      {Platform.OS === 'android' ? (
        <StatusBar
          barStyle={dark ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundColor}
          translucent={false}
        />
      ) : null}
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <Pressable
            onPress={() => {
              cancelEditing();
            }}
            style={styles.headerIconButton}
            disabled={isSaving}
          >
            <MaterialCommunityIcons name="close" size={30} color={textColor} />
          </Pressable>
        </View>
        <View style={styles.headerCenter}>
          <StyledText style={[styles.headerTitle, { color: textColor }]}>Edit Photo</StyledText>
        </View>
        <View style={styles.headerSideRight}>
          {isSaving ? (
            <View style={styles.doneButton}>
              <ActivityIndicator color={PRIMARY} />
            </View>
          ) : (
            <Pressable onPress={handleDone} style={styles.doneButton}>
              <StyledText style={styles.doneText}>Done</StyledText>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <GestureDetector gesture={cropGesture}>
          <View
            style={[
              styles.canvasShell,
              { width: canvasWidth, height: canvasHeight, backgroundColor: surfaceColor },
            ]}
          >
            <Canvas ref={canvasRef} style={styles.canvas}>
              <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} color={surfaceColor} />
              {image ? (
                <Group
                  clip={Skia.XYWHRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height)}
                >
                  <SkiaImage
                    image={image}
                    x={imageFrame.x}
                    y={imageFrame.y}
                    width={imageFrame.width}
                    height={imageFrame.height}
                    fit="contain"
                  >
                    <ColorMatrix matrix={combinedColorMatrix} />
                  </SkiaImage>
                  {textOverlays.map((item) => (
                    <SkiaText
                      key={item.id}
                      x={item.x}
                      y={item.y}
                      text={item.text}
                      color={item.color}
                      font={getOverlayFont(item.size)}
                    />
                  ))}
                  {stickerOverlays.map((item) => (
                    <SkiaText
                      key={item.id}
                      x={item.x}
                      y={item.y}
                      text={item.glyph}
                      color="#ffffff"
                      font={getOverlayFont(item.size)}
                    />
                  ))}
                </Group>
              ) : null}
            </Canvas>
            {isPreparingImage ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={PRIMARY} />
              </View>
            ) : null}

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
                    opacity: isGestureActive ? 1 : 0.75,
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
                    opacity: isGestureActive ? 1 : 0.75,
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
                    opacity: isGestureActive ? 1 : 0.75,
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
                    opacity: isGestureActive ? 1 : 0.75,
                  },
                ]}
              />
            </View>
          </View>
        </GestureDetector>
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
            <StyledText style={[styles.helperText, { color: mutedText }]}>
              Pinch to zoom and drag to reposition.
            </StyledText>
          </View>
        ) : null}

        {activeTool === 'filters' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {UPLOAD_IMAGE_FILTERS.map(({ id, label }) => (
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
                      <SkiaImage image={image} x={0} y={0} width={64} height={64} fit="contain">
                        <ColorMatrix matrix={filterPreviewMatrices[id]} />
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
                  {label}
                </StyledText>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {activeTool === 'adjust' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.adjustRow}
          >
            {UPLOAD_IMAGE_ADJUST_OPTIONS.map(({ id, label }) => (
              <Pressable
                key={id}
                onPress={() => setAdjust(id)}
                style={[styles.adjustPill, adjust === id ? styles.adjustPillActive : null]}
              >
                <StyledText
                  style={[styles.adjustLabel, { color: adjust === id ? '#ffffff' : mutedText }]}
                >
                  {label}
                </StyledText>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {activeTool === 'text' ? (
          <View style={styles.textTray}>
            <View style={styles.textActionRow}>
              <TextInput
                value={newTextValue}
                onChangeText={setNewTextValue}
                placeholder="Add text"
                placeholderTextColor={mutedText}
                style={[
                  styles.textInput,
                  { color: textColor, backgroundColor: dark ? '#2a2f34' : '#e6eaee' },
                ]}
              />
              <Pressable style={styles.primaryAction} onPress={addTextOverlay}>
                <StyledText style={styles.primaryActionLabel}>Add</StyledText>
              </Pressable>
              <Pressable
                style={[
                  styles.secondaryAction,
                  textOverlays.length < 1 ? styles.actionDisabled : null,
                ]}
                disabled={textOverlays.length < 1}
                onPress={() => setTextOverlays((previous) => previous.slice(0, -1))}
              >
                <StyledText style={[styles.secondaryActionLabel, { color: mutedText }]}>
                  Remove
                </StyledText>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.textColorRow}
            >
              {textColorOptions.map((color) => (
                <Pressable
                  key={color}
                  style={[styles.colorSwatch, { backgroundColor: color }]}
                  onPress={() => {
                    setTextOverlays((previous) => {
                      if (previous.length < 1) {
                        return previous;
                      }
                      const next = [...previous];
                      const lastIndex = next.length - 1;
                      next[lastIndex] = { ...next[lastIndex], color };
                      return next;
                    });
                  }}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {activeTool === 'stickers' ? (
          <View style={styles.stickersTray}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stickerRow}
            >
              {stickerOptions.map((item) => (
                <Pressable
                  key={item}
                  style={styles.stickerChip}
                  onPress={() => addStickerOverlay(item)}
                >
                  <StyledText style={styles.stickerLabel}>{item}</StyledText>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={[
                styles.secondaryAction,
                stickerOverlays.length < 1 ? styles.actionDisabled : null,
              ]}
              disabled={stickerOverlays.length < 1}
              onPress={() => setStickerOverlays((previous) => previous.slice(0, -1))}
            >
              <StyledText style={[styles.secondaryActionLabel, { color: mutedText }]}>
                Remove Last
              </StyledText>
            </Pressable>
          </View>
        ) : null}
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
                {toolLabel(id)}
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
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSide: {
    width: 86,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerSideRight: {
    width: 86,
    alignItems: 'flex-end',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: HEADER_FONT,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  doneButton: {
    minWidth: 58,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  doneText: {
    fontFamily: BODY_FONT,
    color: PRIMARY,
    fontSize: 17,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderWidth: 1.5,
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
    minHeight: 134,
    borderTopWidth: 1,
    justifyContent: 'flex-start',
    paddingTop: 14,
  },
  cropTrayContainer: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    rowGap: 12,
  },
  cropRatioRow: {
    alignItems: 'center',
    gap: 8,
  },
  cropRatioPill: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.18)',
  },
  cropRatioPillActive: {
    backgroundColor: PRIMARY,
  },
  cropRatioPillLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12.5,
    fontWeight: '600',
  },
  helperText: {
    fontFamily: OTHER_FONT,
    fontSize: 12,
    paddingHorizontal: 2,
  },
  filterRow: {
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    gap: 14,
    paddingBottom: 8,
  },
  filterItem: {
    alignItems: 'center',
    width: 96,
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
    fontSize: 11,
    textAlign: 'center',
  },
  adjustRow: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  adjustPill: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustPillActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  adjustLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12.5,
    fontWeight: '600',
  },
  textTray: {
    rowGap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  textActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  textInput: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    fontFamily: BODY_FONT,
    fontSize: 13,
  },
  primaryAction: {
    height: 34,
    borderRadius: 17,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryActionLabel: {
    color: '#ffffff',
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryAction: {
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryActionLabel: {
    fontFamily: BODY_FONT,
    fontSize: 12,
    fontWeight: '600',
  },
  textColorRow: {
    alignItems: 'center',
    gap: 10,
  },
  colorSwatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  actionDisabled: {
    opacity: 0.45,
  },
  stickersTray: {
    rowGap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  stickerRow: {
    alignItems: 'center',
    gap: 10,
  },
  stickerChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.12)',
  },
  stickerLabel: {
    fontSize: 22,
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
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default UploadImage;
