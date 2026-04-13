import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import RNFS from 'react-native-fs';
import {
  Canvas,
  ColorMatrix,
  Group,
  Image as SkiaImage,
  ImageFormat,
  Line,
  Path,
  Rect,
  Skia,
  Text as SkiaText,
  matchFont,
  useCanvasRef,
  useImage,
} from '@shopify/react-native-skia';
import { useToast } from 'react-native-toast-notifications';
import BrandPaletteBackground from '@/components/BrandPaletteBackground';
import StyledText from '@/components/styled/Text';
import { ApiCall } from '@/services/api';
import { borderRadius } from '@/src/styles/outlines';
import { spacing } from '@/src/styles/spacing';

export type EditorAsset = {
  uri: string;
  fileName?: string;
  fileSize?: number;
  type?: string;
};

export type SavedMedia = {
  url: string;
  name: string;
};

type UsageContext = 'watch' | 'feed' | 'comment';
type ClientModerationDecision = 'safe' | 'unsure' | 'blocked' | 'unclassified';
type ClientModerationScores = {
  neutral: number;
  drawing: number;
  sexy: number;
  porn: number;
  hentai: number;
};

type Props = {
  visible: boolean;
  asset: EditorAsset | null;
  token?: string;
  userId?: string;
  saveMode?: 'upload' | 'local';
  usageContext?: UsageContext;
  onCancel: () => void;
  onSaved: (media: SavedMedia) => void;
};

const FILTER_IDS = [
  'original',
  'grace',
  'peace',
  'spirit',
  'clarendon',
  'rise',
  'sierra',
  'juno',
  'gingham',
  'moon',
  'inkwell',
  'lark',
  'hudson',
  'valencia',
  'aden',
  'willow',
  'perpetua',
  'reyes',
] as const;

type ToolId = 'crop' | 'filters' | 'adjust' | 'text' | 'stickers' | 'draw';
type FilterId = (typeof FILTER_IDS)[number];
type AdjustPresetId = 'none' | 'lift' | 'depth' | 'vivid';
type RatioId = 'free' | '9:16' | '3:4' | '1:1';

type TransformState = {
  scale: number;
  translateX: number;
  translateY: number;
};

type Point = {
  x: number;
  y: number;
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
  color: string;
};

type DrawStroke = {
  id: string;
  color: string;
  width: number;
  points: Point[];
};

type EditorSnapshot = {
  transform: TransformState;
  filter: FilterId;
  adjust: AdjustPresetId;
  ratio: RatioId;
  textOverlays: TextOverlay[];
  stickerOverlays: StickerOverlay[];
  drawStrokes: DrawStroke[];
  drawColor: string;
  drawWidth: number;
};

const PRIMARY = '#41899f';
const INFO = '#41dbe1';
const LIGHT_BG = '#ffffff';
const LIGHT_TEXT = '#000015';
const LIGHT_SURFACE = '#e6eaec';
const DARK_BG = '#121212';
const DARK_TEXT = '#e6eaec';
const HEADER_HEIGHT = 56;
const TRAY_HEIGHT = 120;
const NAV_HEIGHT = 72;
const HISTORY_LIMIT = 15;
const JPEG_QUALITY = 50;
const MAX_EDITOR_BYTES = 50 * 1024 * 1024;
const MAX_UPLOAD_QUEUE = 30;
const PENDING_UPLOAD_CACHE_KEY = '@onebody:editorPendingUploads';
const CLIENT_NSFW_REVIEW_ROUTE = '';

const HEADER_FONT = Platform.select({
  ios: 'Rubik-Bold',
  android: 'Rubik-Bold',
  default: 'Rubik-Bold',
});
const BODY_FONT = Platform.select({
  ios: 'SF Pro Text',
  android: 'sans-serif',
  default: 'System',
});
const ALT_FONT = Platform.select({
  ios: 'OpenSans-Regular',
  android: 'OpenSans-Regular',
  default: 'OpenSans-Regular',
});

const ratioOptions: { id: RatioId; label: string; ratio: number | null }[] = [
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '3:4', label: '3:4', ratio: 3 / 4 },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: 'free', label: 'Free', ratio: null },
];

const drawColorOptions = ['#41dbe1', '#41899f', '#ffffff', '#111827', '#f59e0b', '#ef4444'];
const drawWidthOptions = [3, 5, 8, 12];
const textColorOptions = ['#ffffff', '#e6eaec', '#41dbe1', '#f59e0b', '#ef4444', '#111827'];
const stickerOptions = [
  { id: 'cross', glyph: '+' },
  { id: 'dove', glyph: '*' },
  { id: 'pray', glyph: 'o' },
  { id: 'shield', glyph: '#' },
  { id: 'heart', glyph: '<3' },
];

const ensureJpegFileName = (input?: string) => {
  const fallback = `edited_${Date.now()}.jpg`;
  if (!input) {
    return fallback;
  }
  const dot = input.lastIndexOf('.');
  if (dot < 0) {
    return `${input}.jpg`;
  }
  return `${input.slice(0, dot)}.jpg`;
};

const normalizeUri = (uri: string) => {
  if (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://')
  ) {
    return uri;
  }
  return `file://${uri}`;
};

const extractHttpUrl = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.startsWith('http')) {
    return value;
  }
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const keys = ['url', 'fileUrl', 'mediaUrl', 'signedUrl', 'location', 'path', 'cdnUrl'];
  const direct = keys
    .map((key) => record[key])
    .find((candidate) => typeof candidate === 'string' && candidate.startsWith('http'));
  if (typeof direct === 'string') {
    return direct;
  }
  const nestedKeys = ['data', 'response', 'file', 'media', 'result'];
  // eslint-disable-next-line no-restricted-syntax
  for (const key of nestedKeys) {
    const nested = extractHttpUrl(record[key]);
    if (nested) {
      return nested;
    }
  }
  return undefined;
};

const defaultModerationScores: ClientModerationScores = {
  neutral: 0,
  drawing: 0,
  sexy: 0,
  porn: 0,
  hentai: 0,
};

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

const identityMatrix = () => [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

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

const compose4x5 = (...matrices: number[][]) =>
  matrices.reduce((acc, matrix) => multiply4x5(acc, matrix), identityMatrix());

const grayscaleBase = [
  0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0.2126, 0.7152, 0.0722, 0, 0, 0, 0, 0,
  1, 0,
];

const FILTER_PRESETS: Record<FilterId, { label: string; matrix: number[] }> = {
  original: {
    label: 'Original',
    matrix: identityMatrix(),
  },
  grace: {
    label: 'Grace',
    matrix: compose4x5(
      makeContrastMatrix(1.05),
      [1.12, 0.02, 0, 0, 8, 0, 1.04, 0.02, 0, 3, 0, 0, 0.9, 0, -4, 0, 0, 0, 1, 0]
    ),
  },
  peace: {
    label: 'Peace',
    matrix: compose4x5(
      makeSaturationMatrix(0.98),
      [0.95, 0, 0.08, 0, -6, 0, 1.02, 0.06, 0, 0, 0.03, 0.04, 1.12, 0, 10, 0, 0, 0, 1, 0]
    ),
  },
  spirit: {
    label: 'Spirit',
    matrix: compose4x5(makeContrastMatrix(1.18), grayscaleBase),
  },
  clarendon: {
    label: 'Clarendon',
    matrix: compose4x5(
      makeContrastMatrix(1.1),
      makeSaturationMatrix(1.1),
      [1.05, 0, 0.03, 0, 3, 0, 1.03, 0.02, 0, 2, 0, 0.02, 1.16, 0, 10, 0, 0, 0, 1, 0]
    ),
  },
  rise: {
    label: 'Rise',
    matrix: compose4x5(
      makeBrightnessMatrix(0.05),
      [1.16, 0.02, 0, 0, 14, 0, 1.1, 0, 0, 8, 0, 0, 0.98, 0, 2, 0, 0, 0, 1, 0]
    ),
  },
  sierra: {
    label: 'Sierra',
    matrix: compose4x5(
      makeContrastMatrix(0.96),
      [1.08, 0.02, 0, 0, 10, 0, 1.02, 0.01, 0, 5, 0, 0, 0.92, 0, 2, 0, 0, 0, 1, 0]
    ),
  },
  juno: {
    label: 'Juno',
    matrix: compose4x5(
      makeContrastMatrix(1.08),
      makeSaturationMatrix(1.18),
      [1.08, 0.01, 0, 0, 2, 0, 1.02, 0, 0, 0, 0, 0, 0.92, 0, -4, 0, 0, 0, 1, 0]
    ),
  },
  gingham: {
    label: 'Gingham',
    matrix: compose4x5(
      makeContrastMatrix(0.9),
      makeSaturationMatrix(0.88),
      [1.03, 0.02, 0, 0, 6, 0, 1.01, 0.01, 0, 3, 0, 0, 0.98, 0, 2, 0, 0, 0, 1, 0]
    ),
  },
  moon: {
    label: 'Moon',
    matrix: compose4x5(makeContrastMatrix(1.07), grayscaleBase),
  },
  inkwell: {
    label: 'Inkwell',
    matrix: compose4x5(makeContrastMatrix(1.28), makeBrightnessMatrix(-0.03), grayscaleBase),
  },
  lark: {
    label: 'Lark',
    matrix: compose4x5(
      makeBrightnessMatrix(0.03),
      makeSaturationMatrix(1.03),
      [1.04, 0, 0.01, 0, 4, 0, 1.06, 0, 0, 5, 0, 0, 0.98, 0, 1, 0, 0, 0, 1, 0]
    ),
  },
  hudson: {
    label: 'Hudson',
    matrix: compose4x5(
      makeContrastMatrix(1.14),
      [1.06, 0, 0.04, 0, 3, 0, 1.06, 0.01, 0, 2, 0, 0.02, 1.24, 0, 12, 0, 0, 0, 1, 0]
    ),
  },
  valencia: {
    label: 'Valencia',
    matrix: compose4x5(
      makeContrastMatrix(1.01),
      [1.1, 0.02, 0, 0, 10, 0, 1.03, 0.01, 0, 3, 0, 0, 0.88, 0, -1, 0, 0, 0, 1, 0]
    ),
  },
  aden: {
    label: 'Aden',
    matrix: compose4x5(
      makeContrastMatrix(0.93),
      makeSaturationMatrix(0.9),
      [1.06, 0, 0, 0, 6, 0, 1, 0, 0, 3, 0, 0, 0.96, 0, 3, 0, 0, 0, 1, 0]
    ),
  },
  willow: {
    label: 'Willow',
    matrix: compose4x5(
      makeContrastMatrix(0.92),
      [0.31, 0.31, 0.31, 0, 8, 0.31, 0.31, 0.31, 0, 5, 0.31, 0.31, 0.31, 0, 10, 0, 0, 0, 1, 0]
    ),
  },
  perpetua: {
    label: 'Perpetua',
    matrix: compose4x5(
      makeContrastMatrix(1.02),
      [1, 0, 0, 0, 0, 0, 1.08, 0, 0, 6, 0, 0, 1.06, 0, -6, 0, 0, 0, 1, 0]
    ),
  },
  reyes: {
    label: 'Reyes',
    matrix: compose4x5(
      makeContrastMatrix(0.95),
      makeSaturationMatrix(0.9),
      [1.08, 0, 0, 0, 10, 0, 1.03, 0, 0, 8, 0, 0, 0.9, 0, 4, 0, 0, 0, 1, 0]
    ),
  },
};

const filterMatrixById = (filter: FilterId) => {
  return FILTER_PRESETS[filter].matrix;
};

const adjustMatrixById = (adjust: AdjustPresetId) => {
  if (adjust === 'lift') {
    return multiply4x5(makeBrightnessMatrix(0.06), makeContrastMatrix(1.02));
  }
  if (adjust === 'depth') {
    return multiply4x5(makeContrastMatrix(1.14), makeSaturationMatrix(0.95));
  }
  if (adjust === 'vivid') {
    return multiply4x5(makeSaturationMatrix(1.2), makeContrastMatrix(1.06));
  }
  return identityMatrix();
};

const filterLabel = (id: FilterId) => {
  return FILTER_PRESETS[id].label;
};

const defaultRatioForContext = (usageContext: UsageContext): RatioId => {
  if (usageContext === 'watch') return '9:16';
  if (usageContext === 'comment') return '1:1';
  return '3:4';
};

const cloneSnapshot = (snapshot: EditorSnapshot): EditorSnapshot => ({
  transform: { ...snapshot.transform },
  filter: snapshot.filter,
  adjust: snapshot.adjust,
  ratio: snapshot.ratio,
  textOverlays: snapshot.textOverlays.map((item) => ({ ...item })),
  stickerOverlays: snapshot.stickerOverlays.map((item) => ({ ...item })),
  drawStrokes: snapshot.drawStrokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((point) => ({ ...point })),
  })),
  drawColor: snapshot.drawColor,
  drawWidth: snapshot.drawWidth,
});

const buildPathFromPoints = (points: Point[]) => {
  if (points.length === 0) {
    return null;
  }
  const path = Skia.Path.Make();
  path.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    path.lineTo(points[index].x, points[index].y);
  }
  return path;
};

function SkiaImageEditorModal({
  visible,
  asset,
  token,
  userId,
  saveMode = 'upload',
  usageContext = 'feed',
  onCancel,
  onSaved,
}: Props) {
  const { dark } = useTheme();
  const toast = useToast();
  const canvasRef = useCanvasRef();

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [tool, setTool] = useState<ToolId>('filters');
  const [filter, setFilter] = useState<FilterId>('original');
  const [adjust, setAdjust] = useState<AdjustPresetId>('none');
  const [ratio, setRatio] = useState<RatioId>(defaultRatioForContext(usageContext));
  const [transform, setTransform] = useState<TransformState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const [gestureActive, setGestureActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [sourceUri, setSourceUri] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([]);
  const [drawStrokes, setDrawStrokes] = useState<DrawStroke[]>([]);
  const [drawColor, setDrawColor] = useState(drawColorOptions[0]);
  const [drawWidth, setDrawWidth] = useState(drawWidthOptions[1]);
  const [newTextValue, setNewTextValue] = useState('Faith');

  const undoStackRef = useRef<EditorSnapshot[]>([]);
  const redoStackRef = useRef<EditorSnapshot[]>([]);
  const preGestureRef = useRef<EditorSnapshot | null>(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const pinchStartRef = useRef(1);
  const activeStrokeIdRef = useRef<string | null>(null);
  const hasChangesRef = useRef(false);
  const fontCacheRef = useRef<Map<number, ReturnType<typeof matchFont>>>(new Map());

  const image = useImage(sourceUri, () => {
    setErrorMessage('Unable to load selected image.');
  });

  const textColor = dark ? DARK_TEXT : LIGHT_TEXT;
  const bgColor = dark ? DARK_BG : LIGHT_BG;
  const surfaceColor = dark ? '#1a1a1a' : LIGHT_SURFACE;

  const shouldUseLowMemoryMode = useMemo(() => {
    const sourceBytes = asset?.fileSize ?? 0;
    const imageWidth = image?.width() ?? 0;
    const imageHeight = image?.height() ?? 0;
    return (
      sourceBytes >= 12 * 1024 * 1024 ||
      (imageWidth > 0 && imageHeight > 0 && imageWidth * imageHeight > 16_000_000)
    );
  }, [asset?.fileSize, image]);

  const currentSnapshot = useCallback(
    (): EditorSnapshot =>
      cloneSnapshot({
        transform,
        filter,
        adjust,
        ratio,
        textOverlays,
        stickerOverlays,
        drawStrokes,
        drawColor,
        drawWidth,
      }),
    [
      adjust,
      drawColor,
      drawStrokes,
      drawWidth,
      filter,
      ratio,
      stickerOverlays,
      textOverlays,
      transform,
    ]
  );

  const applySnapshot = useCallback((snapshot: EditorSnapshot) => {
    const cloned = cloneSnapshot(snapshot);
    setTransform(cloned.transform);
    setFilter(cloned.filter);
    setAdjust(cloned.adjust);
    setRatio(cloned.ratio);
    setTextOverlays(cloned.textOverlays);
    setStickerOverlays(cloned.stickerOverlays);
    setDrawStrokes(cloned.drawStrokes);
    setDrawColor(cloned.drawColor);
    setDrawWidth(cloned.drawWidth);
    hasChangesRef.current = true;
  }, []);

  const pushUndo = useCallback((snapshot: EditorSnapshot) => {
    undoStackRef.current = [...undoStackRef.current, cloneSnapshot(snapshot)].slice(-HISTORY_LIMIT);
    redoStackRef.current = [];
  }, []);

  const commitAndSet = useCallback(
    (updater: () => void) => {
      pushUndo(currentSnapshot());
      updater();
      hasChangesRef.current = true;
    },
    [currentSnapshot, pushUndo]
  );

  const beginMutableAction = useCallback(() => {
    if (!preGestureRef.current) {
      preGestureRef.current = currentSnapshot();
    }
  }, [currentSnapshot]);

  const endMutableAction = useCallback(() => {
    if (preGestureRef.current) {
      pushUndo(preGestureRef.current);
      preGestureRef.current = null;
      hasChangesRef.current = true;
    }
  }, [pushUndo]);

  const resetStateForNewAsset = useCallback(() => {
    const nextDefaultRatio = defaultRatioForContext(usageContext);
    setTool('filters');
    setFilter('original');
    setAdjust('none');
    setRatio(nextDefaultRatio);
    setTransform({ scale: 1, translateX: 0, translateY: 0 });
    setTextOverlays([]);
    setStickerOverlays([]);
    setDrawStrokes([]);
    setDrawColor(drawColorOptions[0]);
    setDrawWidth(drawWidthOptions[1]);
    setNewTextValue('Faith');
    undoStackRef.current = [];
    redoStackRef.current = [];
    preGestureRef.current = null;
    activeStrokeIdRef.current = null;
    hasChangesRef.current = false;
  }, [usageContext]);

  const prevAssetUriRef = useRef(asset?.uri);
  const prevAssetFileSizeRef = useRef(asset?.fileSize);
  const prevVisibleRef = useRef(visible);
  const prevResetStateRef = useRef(resetStateForNewAsset);
  if (
    prevAssetUriRef.current !== asset?.uri ||
    prevAssetFileSizeRef.current !== asset?.fileSize ||
    prevVisibleRef.current !== visible ||
    prevResetStateRef.current !== resetStateForNewAsset
  ) {
    prevAssetUriRef.current = asset?.uri;
    prevAssetFileSizeRef.current = asset?.fileSize;
    prevVisibleRef.current = visible;
    prevResetStateRef.current = resetStateForNewAsset;
    if (!visible || !asset?.uri) {
      setSourceUri('');
      setErrorMessage('');
    } else if (typeof asset.fileSize === 'number' && asset.fileSize > MAX_EDITOR_BYTES) {
      const maxMb = Math.round(MAX_EDITOR_BYTES / (1024 * 1024));
      setErrorMessage(`Image is larger than ${maxMb}MB. Please choose a smaller image.`);
      setSourceUri('');
    } else {
      setIsPreparing(true);
      setErrorMessage('');
      try {
        setSourceUri(normalizeUri(asset.uri));
        resetStateForNewAsset();
      } finally {
        setIsPreparing(false);
      }
    }
  }

  const prevShouldUseLowMemoryModeRef = useRef(shouldUseLowMemoryMode);
  if (prevShouldUseLowMemoryModeRef.current !== shouldUseLowMemoryMode) {
    prevShouldUseLowMemoryModeRef.current = shouldUseLowMemoryMode;
    if (shouldUseLowMemoryMode) {
      toast.show('Low-memory mode enabled for this image.', {
        type: 'normal',
        placement: 'bottom',
      });
    }
  }

  const selectedRatio = useMemo(
    () => ratioOptions.find((option) => option.id === ratio)?.ratio ?? null,
    [ratio]
  );

  const cropRect = useMemo(() => {
    const { width, height } = canvasSize;
    if (!width || !height) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    if (!selectedRatio) {
      return { x: 0, y: 0, width, height };
    }
    let rectWidth = width;
    let rectHeight = rectWidth / selectedRatio;
    if (rectHeight > height) {
      rectHeight = height;
      rectWidth = rectHeight * selectedRatio;
    }
    return {
      x: (width - rectWidth) / 2,
      y: (height - rectHeight) / 2,
      width: rectWidth,
      height: rectHeight,
    };
  }, [canvasSize, selectedRatio]);

  const imageFrame = useMemo(() => {
    const imageWidth = image?.width() ?? 0;
    const imageHeight = image?.height() ?? 0;
    if (!imageWidth || !imageHeight || !cropRect.width || !cropRect.height) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

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

    const scaledWidth = baseWidth * transform.scale;
    const scaledHeight = baseHeight * transform.scale;

    return {
      x: cropRect.x + cropRect.width / 2 - scaledWidth / 2 + transform.translateX,
      y: cropRect.y + cropRect.height / 2 - scaledHeight / 2 + transform.translateY,
      width: scaledWidth,
      height: scaledHeight,
    };
  }, [cropRect.height, cropRect.width, cropRect.x, cropRect.y, image, transform]);

  const combinedColorMatrix = useMemo(() => {
    const byFilter = filterMatrixById(filter);
    const byAdjust = adjustMatrixById(adjust);
    return multiply4x5(byAdjust, byFilter);
  }, [adjust, filter]);

  const drawPaths = useMemo(
    () =>
      drawStrokes
        .map((stroke) => ({
          ...stroke,
          path: buildPathFromPoints(stroke.points),
        }))
        .filter((stroke) => stroke.path !== null),
    [drawStrokes]
  );

  const clampTransform = useCallback(
    (next: TransformState): TransformState => {
      if (!cropRect.width || !cropRect.height || !imageFrame.width || !imageFrame.height) {
        return next;
      }
      const horizontalSlack = Math.max(0, (imageFrame.width - cropRect.width) / 2);
      const verticalSlack = Math.max(0, (imageFrame.height - cropRect.height) / 2);
      return {
        scale: Math.min(shouldUseLowMemoryMode ? 3 : 4, Math.max(1, next.scale)),
        translateX: Math.min(horizontalSlack, Math.max(-horizontalSlack, next.translateX)),
        translateY: Math.min(verticalSlack, Math.max(-verticalSlack, next.translateY)),
      };
    },
    [cropRect.height, cropRect.width, imageFrame.height, imageFrame.width, shouldUseLowMemoryMode]
  );

  const clampPointToCrop = useCallback(
    (x: number, y: number): Point => ({
      x: Math.min(cropRect.x + cropRect.width, Math.max(cropRect.x, x)),
      y: Math.min(cropRect.y + cropRect.height, Math.max(cropRect.y, y)),
    }),
    [cropRect.height, cropRect.width, cropRect.x, cropRect.y]
  );

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(tool !== 'draw')
      .onBegin(() => {
        beginMutableAction();
        setGestureActive(true);
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
        setGestureActive(false);
        endMutableAction();
      })
      .runOnJS(true);

    const pinch = Gesture.Pinch()
      .enabled(tool !== 'draw')
      .onBegin(() => {
        beginMutableAction();
        setGestureActive(true);
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
        setGestureActive(false);
        endMutableAction();
      })
      .runOnJS(true);

    const drawPan = Gesture.Pan()
      .enabled(tool === 'draw')
      .onBegin((event) => {
        beginMutableAction();
        setGestureActive(true);
        const nextStrokeId = `stroke_${Date.now()}_${Math.round(Math.random() * 1000)}`;
        activeStrokeIdRef.current = nextStrokeId;
        const point = clampPointToCrop(event.x, event.y);
        setDrawStrokes((previous) => [
          ...previous,
          {
            id: nextStrokeId,
            color: drawColor,
            width: drawWidth,
            points: [point],
          },
        ]);
      })
      .onUpdate((event) => {
        const point = clampPointToCrop(event.x, event.y);
        const activeStrokeId = activeStrokeIdRef.current;
        if (!activeStrokeId) {
          return;
        }
        setDrawStrokes((previous) =>
          previous.map((stroke) =>
            stroke.id === activeStrokeId
              ? {
                  ...stroke,
                  points: [...stroke.points, point],
                }
              : stroke
          )
        );
      })
      .onEnd(() => {
        activeStrokeIdRef.current = null;
        setGestureActive(false);
        endMutableAction();
      })
      .runOnJS(true);

    return Gesture.Simultaneous(pan, pinch, drawPan);
  }, [
    beginMutableAction,
    clampPointToCrop,
    clampTransform,
    drawColor,
    drawWidth,
    endMutableAction,
    tool,
    transform.scale,
    transform.translateX,
    transform.translateY,
  ]);

  const getOverlayFont = useCallback((size: number) => {
    const rounded = Math.max(10, Math.round(size));
    if (fontCacheRef.current.has(rounded)) {
      return fontCacheRef.current.get(rounded)!;
    }
    const font = matchFont({
      fontFamily: BODY_FONT,
      fontSize: rounded,
      fontStyle: 'normal',
      fontWeight: '600',
    });
    fontCacheRef.current.set(rounded, font);
    return font;
  }, []);

  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) {
      return;
    }
    const previous = stack[stack.length - 1];
    undoStackRef.current = stack.slice(0, -1);
    redoStackRef.current = [...redoStackRef.current, currentSnapshot()].slice(-HISTORY_LIMIT);
    applySnapshot(previous);
  }, [applySnapshot, currentSnapshot]);

  const redo = useCallback(() => {
    const stack = redoStackRef.current;
    if (stack.length === 0) {
      return;
    }
    const next = stack[stack.length - 1];
    redoStackRef.current = stack.slice(0, -1);
    undoStackRef.current = [...undoStackRef.current, currentSnapshot()].slice(-HISTORY_LIMIT);
    applySnapshot(next);
  }, [applySnapshot, currentSnapshot]);

  const onCanvasLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasSize({ width, height });
  }, []);

  const maybeCancel = useCallback(() => {
    if (!hasChangesRef.current) {
      onCancel();
      return;
    }
    Alert.alert('Discard changes?', 'Your edits will be lost.', [
      { text: 'Keep Editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: onCancel,
      },
    ]);
  }, [onCancel]);

  const runClientModeration = useCallback(async () => {
    return {
      decision: 'unclassified' as ClientModerationDecision,
      scores: defaultModerationScores,
      error: 'nsfwjs-client-check-pending',
    };
  }, []);

  const queuePendingUpload = useCallback(
    async (params: { localUri: string; fileName: string; reason?: string }) => {
      try {
        const raw = await AsyncStorage.getItem(PENDING_UPLOAD_CACHE_KEY);
        const existing = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : [];
        const nextItem = {
          localUri: params.localUri,
          fileName: params.fileName,
          usageContext,
          userId: userId ?? '',
          reason: params.reason ?? '',
          createdAt: new Date().toISOString(),
        };
        const nextQueue = [...existing, nextItem].slice(-MAX_UPLOAD_QUEUE);
        await AsyncStorage.setItem(PENDING_UPLOAD_CACHE_KEY, JSON.stringify(nextQueue));
      } catch (error) {
        // Best-effort local queue; do not block save flow.
      }
    },
    [usageContext, userId]
  );

  const uploadEditedFile = useCallback(
    async (
      fileUri: string,
      fileName: string,
      moderation: {
        decision: ClientModerationDecision;
        scores?: ClientModerationScores | null;
        error?: string;
      }
    ): Promise<SavedMedia> => {
      const fileParam = {
        uri: fileUri,
        type: 'image/jpeg',
        name: fileName,
      } as any;
      const formData = new FormData();
      formData.append('file', fileParam);
      if (userId) {
        formData.append('userId', userId);
      }
      formData.append('clientModerationModel', 'nsfwjs');
      formData.append('clientModerationDecision', moderation.decision);
      if (moderation.scores) {
        formData.append('clientModerationScores', JSON.stringify(moderation.scores));
      }
      if (moderation.error) {
        formData.append('clientModerationError', moderation.error);
      }

      const authToken = token && token.length > 0 ? token : true;
      let result = await ApiCall({
        route: 'v1/posts/media',
        verb: 'post',
        token: authToken,
        params: formData,
        isFormUrlEncode: true,
      });
      if (result.status !== 200) {
        result = await ApiCall({
          route: 'posts/media',
          verb: 'post',
          token: authToken,
          params: formData,
          isFormUrlEncode: true,
        });
      }
      if (result.status !== 200) {
        throw new Error('Media upload request failed.');
      }
      const uploadedUrl = extractHttpUrl(result.response);
      if (!uploadedUrl) {
        throw new Error('Media uploaded but no URL returned by API.');
      }

      if (moderation.decision === 'unsure' && CLIENT_NSFW_REVIEW_ROUTE) {
        await ApiCall({
          route: CLIENT_NSFW_REVIEW_ROUTE,
          verb: 'post',
          token: authToken,
          params: {
            userId,
            mediaUrl: uploadedUrl,
            source: 'skia-image-editor',
            moderationModel: 'nsfwjs',
            moderationDecision: moderation.decision,
            moderationScores: moderation.scores,
            moderationError: moderation.error || '',
            createdAt: new Date().toISOString(),
          },
        });
      }

      return {
        url: uploadedUrl,
        name: fileName,
      };
    },
    [token, userId]
  );

  const saveEditedImage = useCallback(async () => {
    if (!canvasRef.current || !cropRect.width || !cropRect.height) {
      return;
    }

    let localUri = '';
    let fileName = '';

    try {
      setIsSaving(true);

      const snapshot = canvasRef.current.makeImageSnapshot(
        Skia.XYWHRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height)
      );
      if (!snapshot) {
        throw new Error('Unable to export edited image.');
      }

      const baseImage = snapshot.makeNonTextureImage();
      const sourceWidth = baseImage.width();
      const sourceHeight = baseImage.height();
      const longEdgeTarget = usageContext === 'watch' ? 2560 : 1440;
      const longEdge = Math.max(sourceWidth, sourceHeight);
      const ratioScale = longEdge > 0 ? Math.min(1, longEdgeTarget / longEdge) : 1;
      const outWidth = Math.max(1, Math.round(sourceWidth * ratioScale));
      const outHeight = Math.max(1, Math.round(sourceHeight * ratioScale));

      const surface = Skia.Surface.MakeOffscreen(outWidth, outHeight);
      if (!surface) {
        throw new Error('Unable to allocate export surface.');
      }

      const exportCanvas = surface.getCanvas();
      const srcRect = Skia.XYWHRect(0, 0, sourceWidth, sourceHeight);
      const dstRect = Skia.XYWHRect(0, 0, outWidth, outHeight);
      const paint = Skia.Paint();
      exportCanvas.drawImageRect(baseImage, srcRect, dstRect, paint);
      surface.flush();

      const exportImage = surface.makeImageSnapshot().makeNonTextureImage();
      const encoded = exportImage.encodeToBase64(ImageFormat.JPEG, JPEG_QUALITY);
      if (!encoded) {
        throw new Error('Unable to encode edited image.');
      }

      fileName = ensureJpegFileName(asset?.fileName);
      const localPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
      await RNFS.writeFile(localPath, encoded, 'base64');
      localUri = `file://${localPath}`;

      if (saveMode === 'local') {
        onSaved({ url: localUri, name: fileName });
        return;
      }

      setIsUploading(true);
      const moderationPayload = await runClientModeration();
      const uploaded = await uploadEditedFile(localUri, fileName, moderationPayload);
      onSaved(uploaded);
    } catch (error: any) {
      if (localUri && saveMode === 'upload') {
        await queuePendingUpload({
          localUri,
          fileName: fileName || ensureJpegFileName(asset?.fileName),
          reason: error?.message,
        });
      }
      toast.show(error?.message ?? 'Unable to save edited image.', {
        type: 'danger',
        placement: 'bottom',
      });
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  }, [
    asset?.fileName,
    canvasRef,
    cropRect.height,
    cropRect.width,
    cropRect.x,
    cropRect.y,
    onSaved,
    queuePendingUpload,
    runClientModeration,
    saveMode,
    toast,
    uploadEditedFile,
    usageContext,
  ]);

  const addTextOverlay = useCallback(() => {
    const text = newTextValue.trim();
    if (!text || !cropRect.width || !cropRect.height) {
      return;
    }
    commitAndSet(() => {
      const next: TextOverlay = {
        id: `txt_${Date.now()}_${Math.round(Math.random() * 1000)}`,
        text,
        x: cropRect.x + cropRect.width * 0.2,
        y: cropRect.y + cropRect.height * 0.5,
        size: 30,
        color: textColorOptions[0],
      };
      setTextOverlays((previous) => [...previous, next]);
    });
  }, [commitAndSet, cropRect.height, cropRect.width, cropRect.x, cropRect.y, newTextValue]);

  const addStickerOverlay = useCallback(
    (glyph: string) => {
      if (!cropRect.width || !cropRect.height) {
        return;
      }
      commitAndSet(() => {
        const next: StickerOverlay = {
          id: `stk_${Date.now()}_${Math.round(Math.random() * 1000)}`,
          glyph,
          x: cropRect.x + cropRect.width * 0.45,
          y: cropRect.y + cropRect.height * 0.5,
          size: 34,
          color: INFO,
        };
        setStickerOverlays((previous) => [...previous, next]);
      });
    },
    [commitAndSet, cropRect.height, cropRect.width, cropRect.x, cropRect.y]
  );

  if (!visible || !asset) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={maybeCancel}
    >
      <View style={[styles.screen, { backgroundColor: 'transparent' }]}>
        <BrandPaletteBackground />
        <View style={styles.header}>
          <TouchableOpacity onPress={maybeCancel} style={styles.headerAction}>
            <MaterialCommunityIcons name="close" size={30} color={textColor} />
          </TouchableOpacity>
          <StyledText style={[styles.headerTitle, { color: textColor }]}>Edit Photo</StyledText>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={undo}
              style={styles.undoButton}
              disabled={undoStackRef.current.length === 0 || isSaving || isUploading}
            >
              <StyledText
                style={[
                  styles.undoLabel,
                  {
                    opacity:
                      undoStackRef.current.length === 0 || isSaving || isUploading ? 0.45 : 1,
                  },
                ]}
              >
                Undo
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={redo}
              style={styles.undoButton}
              disabled={redoStackRef.current.length === 0 || isSaving || isUploading}
            >
              <StyledText
                style={[
                  styles.undoLabel,
                  {
                    opacity:
                      redoStackRef.current.length === 0 || isSaving || isUploading ? 0.45 : 1,
                  },
                ]}
              >
                Redo
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveEditedImage}
              disabled={isSaving || isUploading || !!errorMessage}
              style={[styles.doneButton, { opacity: errorMessage ? 0.6 : 1 }]}
            >
              {isSaving || isUploading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <StyledText style={styles.doneLabel}>Done</StyledText>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body} onLayout={onCanvasLayout}>
          {errorMessage ? (
            <View style={styles.errorCard}>
              <StyledText style={styles.errorTitle}>Unable to Load</StyledText>
              <StyledText style={styles.errorMessage}>{errorMessage}</StyledText>
              <TouchableOpacity style={styles.errorButton} onPress={onCancel}>
                <StyledText style={styles.errorButtonLabel}>Choose Another Image</StyledText>
              </TouchableOpacity>
            </View>
          ) : (
            <GestureDetector gesture={gesture}>
              <View style={styles.canvasContainer}>
                <Canvas ref={canvasRef} style={styles.canvas}>
                  <Rect
                    x={0}
                    y={0}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    color={surfaceColor}
                  />
                  {image && imageFrame.width > 0 ? (
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

                      {drawPaths.map((stroke) => (
                        <Path
                          key={stroke.id}
                          path={stroke.path!}
                          // eslint-disable-next-line react/style-prop-object
                          style="stroke"
                          strokeWidth={stroke.width}
                          strokeCap="round"
                          strokeJoin="round"
                          color={stroke.color}
                        />
                      ))}

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
                          color={item.color}
                          font={getOverlayFont(item.size)}
                        />
                      ))}
                    </Group>
                  ) : null}
                </Canvas>

                {selectedRatio ? (
                  <>
                    <View
                      pointerEvents="none"
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
                    {gestureActive ? (
                      <Canvas pointerEvents="none" style={styles.gridOverlay}>
                        <Line
                          p1={{ x: cropRect.x + cropRect.width / 3, y: cropRect.y }}
                          p2={{
                            x: cropRect.x + cropRect.width / 3,
                            y: cropRect.y + cropRect.height,
                          }}
                          color="rgba(255,255,255,0.3)"
                          strokeWidth={1}
                        />
                        <Line
                          p1={{ x: cropRect.x + (cropRect.width * 2) / 3, y: cropRect.y }}
                          p2={{
                            x: cropRect.x + (cropRect.width * 2) / 3,
                            y: cropRect.y + cropRect.height,
                          }}
                          color="rgba(255,255,255,0.3)"
                          strokeWidth={1}
                        />
                        <Line
                          p1={{ x: cropRect.x, y: cropRect.y + cropRect.height / 3 }}
                          p2={{
                            x: cropRect.x + cropRect.width,
                            y: cropRect.y + cropRect.height / 3,
                          }}
                          color="rgba(255,255,255,0.3)"
                          strokeWidth={1}
                        />
                        <Line
                          p1={{ x: cropRect.x, y: cropRect.y + (cropRect.height * 2) / 3 }}
                          p2={{
                            x: cropRect.x + cropRect.width,
                            y: cropRect.y + (cropRect.height * 2) / 3,
                          }}
                          color="rgba(255,255,255,0.3)"
                          strokeWidth={1}
                        />
                      </Canvas>
                    ) : null}
                  </>
                ) : null}
              </View>
            </GestureDetector>
          )}

          {isPreparing ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={PRIMARY} />
            </View>
          ) : null}
        </View>

        <View style={[styles.tray, { backgroundColor: dark ? '#171717' : '#f3f5f6' }]}>
          {tool === 'filters' ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trayContent}
            >
              {FILTER_IDS.map((id) => (
                <TouchableOpacity
                  key={id}
                  onPress={() => commitAndSet(() => setFilter(id))}
                  style={styles.previewItem}
                >
                  <View
                    style={[styles.previewThumb, filter === id ? styles.previewThumbActive : null]}
                  >
                    {shouldUseLowMemoryMode ? (
                      <View
                        style={[
                          styles.previewPlaceholder,
                          { backgroundColor: dark ? '#28303a' : '#d5dde2' },
                        ]}
                      />
                    ) : (
                      <Canvas style={styles.previewCanvas}>
                        {image ? (
                          <SkiaImage image={image} x={0} y={0} width={64} height={64} fit="contain">
                            <ColorMatrix
                              matrix={multiply4x5(adjustMatrixById(adjust), filterMatrixById(id))}
                            />
                          </SkiaImage>
                        ) : (
                          <Rect x={0} y={0} width={64} height={64} color={surfaceColor} />
                        )}
                      </Canvas>
                    )}
                  </View>
                  <StyledText
                    style={[styles.previewLabel, { color: filter === id ? PRIMARY : textColor }]}
                  >
                    {filterLabel(id)}
                  </StyledText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}

          {tool === 'crop' ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trayContent}
            >
              {ratioOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => commitAndSet(() => setRatio(option.id))}
                  style={[styles.ratioPill, ratio === option.id ? styles.ratioPillActive : null]}
                >
                  <StyledText
                    style={[
                      styles.ratioLabel,
                      { color: ratio === option.id ? '#ffffff' : textColor },
                    ]}
                  >
                    {option.label}
                  </StyledText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}

          {tool === 'adjust' ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trayContent}
            >
              {(
                [
                  ['none', 'Reset'],
                  ['lift', 'Lift'],
                  ['depth', 'Depth'],
                  ['vivid', 'Vivid'],
                ] as [AdjustPresetId, string][]
              ).map(([id, label]) => (
                <TouchableOpacity
                  key={id}
                  onPress={() => commitAndSet(() => setAdjust(id))}
                  style={[styles.ratioPill, adjust === id ? styles.ratioPillActive : null]}
                >
                  <StyledText
                    style={[styles.ratioLabel, { color: adjust === id ? '#ffffff' : textColor }]}
                  >
                    {label}
                  </StyledText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}

          {tool === 'text' ? (
            <View style={styles.trayStack}>
              <View style={styles.textRow}>
                <TextInput
                  value={newTextValue}
                  onChangeText={setNewTextValue}
                  placeholder="Add text"
                  placeholderTextColor={dark ? '#7a838e' : '#8a95a1'}
                  style={[
                    styles.textInput,
                    { color: textColor, backgroundColor: dark ? '#222' : '#e8ecef' },
                  ]}
                />
                <TouchableOpacity style={styles.actionButton} onPress={addTextOverlay}>
                  <StyledText style={styles.actionButtonLabel}>Add</StyledText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    textOverlays.length === 0 ? styles.actionButtonDisabled : null,
                  ]}
                  disabled={textOverlays.length === 0}
                  onPress={() =>
                    commitAndSet(() =>
                      setTextOverlays((previous) =>
                        previous.slice(0, Math.max(previous.length - 1, 0))
                      )
                    )
                  }
                >
                  <StyledText style={styles.actionButtonLabel}>Remove</StyledText>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorRow}
              >
                {textColorOptions.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => {
                      if (textOverlays.length === 0) {
                        return;
                      }
                      commitAndSet(() =>
                        setTextOverlays((previous) => {
                          const next = [...previous];
                          const lastIndex = next.length - 1;
                          next[lastIndex] = { ...next[lastIndex], color };
                          return next;
                        })
                      );
                    }}
                    style={[styles.colorSwatch, { backgroundColor: color }]}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {tool === 'stickers' ? (
            <View style={styles.trayStack}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trayContent}
              >
                {stickerOptions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.stickerChip}
                    onPress={() => addStickerOverlay(item.glyph)}
                  >
                    <StyledText style={styles.stickerGlyph}>{item.glyph}</StyledText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.rowCenter}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    stickerOverlays.length === 0 ? styles.actionButtonDisabled : null,
                  ]}
                  disabled={stickerOverlays.length === 0}
                  onPress={() =>
                    commitAndSet(() =>
                      setStickerOverlays((previous) =>
                        previous.slice(0, Math.max(previous.length - 1, 0))
                      )
                    )
                  }
                >
                  <StyledText style={styles.actionButtonLabel}>Remove Last</StyledText>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {tool === 'draw' ? (
            <View style={styles.trayStack}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorRow}
              >
                {drawColorOptions.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setDrawColor(color)}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      drawColor === color ? styles.colorSwatchActive : null,
                    ]}
                  />
                ))}
              </ScrollView>
              <View style={styles.textRow}>
                {drawWidthOptions.map((size) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setDrawWidth(size)}
                    style={[styles.sizePill, drawWidth === size ? styles.sizePillActive : null]}
                  >
                    <StyledText
                      style={[
                        styles.sizePillLabel,
                        { color: drawWidth === size ? '#fff' : textColor },
                      ]}
                    >
                      {size}px
                    </StyledText>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    drawStrokes.length === 0 ? styles.actionButtonDisabled : null,
                  ]}
                  disabled={drawStrokes.length === 0}
                  onPress={() => commitAndSet(() => setDrawStrokes([]))}
                >
                  <StyledText style={styles.actionButtonLabel}>Clear</StyledText>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>

        <View style={[styles.nav, { backgroundColor: bgColor }]}>
          {(
            [
              ['crop', 'crop'],
              ['filters', 'image-filter-center-focus-weak'],
              ['adjust', 'tune-vertical'],
              ['text', 'format-text'],
              ['stickers', 'sticker-emoji'],
              ['draw', 'draw'],
            ] as [ToolId, string][]
          ).map(([id, icon]) => {
            const active = tool === id;
            return (
              <TouchableOpacity key={id} style={styles.navItem} onPress={() => setTool(id)}>
                <MaterialCommunityIcons
                  name={icon as any}
                  size={24}
                  color={active ? PRIMARY : 'rgba(107,114,128,0.6)'}
                />
                <StyledText
                  style={[styles.navLabel, { color: active ? PRIMARY : 'rgba(107,114,128,0.6)' }]}
                >
                  {id}
                </StyledText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    paddingHorizontal: spacing.x13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.max,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: HEADER_FONT,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.x8,
  },
  undoButton: {
    minWidth: 52,
    height: 34,
    borderRadius: borderRadius.max,
    borderWidth: 1,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x8,
  },
  undoLabel: {
    color: PRIMARY,
    fontFamily: BODY_FONT,
    fontSize: 13,
    fontWeight: '600',
  },
  doneButton: {
    minWidth: 72,
    height: 38,
    backgroundColor: PRIMARY,
    borderRadius: borderRadius.max,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x13,
  },
  doneLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: BODY_FONT,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.x16,
    paddingBottom: spacing.x13,
  },
  canvasContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
  cropBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: INFO,
    borderRadius: 16,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  tray: {
    height: TRAY_HEIGHT,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
    justifyContent: 'center',
  },
  trayStack: {
    rowGap: spacing.x8,
  },
  trayContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.x16,
    columnGap: spacing.x13,
  },
  previewItem: {
    alignItems: 'center',
    rowGap: spacing.x8,
  },
  previewThumb: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.5)',
    overflow: 'hidden',
  },
  previewThumbActive: {
    borderColor: PRIMARY,
  },
  previewCanvas: {
    width: 64,
    height: 64,
    margin: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewPlaceholder: {
    width: 64,
    height: 64,
    margin: 2,
    borderRadius: 10,
  },
  previewLabel: {
    fontSize: 11,
    fontFamily: ALT_FONT,
    fontWeight: '600',
  },
  ratioPill: {
    height: 38,
    paddingHorizontal: spacing.x16,
    borderRadius: borderRadius.max,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratioPillActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  ratioLabel: {
    fontSize: 13,
    fontFamily: BODY_FONT,
    fontWeight: '600',
  },
  nav: {
    height: NAV_HEIGHT,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.x8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 2,
    minWidth: 52,
  },
  navLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: ALT_FONT,
    fontWeight: '700',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    marginTop: spacing.x24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: INFO,
    backgroundColor: '#3c4b64',
    padding: spacing.x16,
    rowGap: spacing.x10,
  },
  errorTitle: {
    color: '#f2f4f8',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: HEADER_FONT,
  },
  errorMessage: {
    color: '#d9e0ea',
    fontSize: 15,
    fontFamily: BODY_FONT,
  },
  errorButton: {
    height: 46,
    borderRadius: borderRadius.max,
    backgroundColor: '#27c6cf',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.x5,
  },
  errorButtonLabel: {
    color: '#083046',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: HEADER_FONT,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.x8,
    paddingHorizontal: spacing.x16,
  },
  textInput: {
    flex: 1,
    minHeight: 38,
    borderRadius: borderRadius.max,
    paddingHorizontal: spacing.x13,
    fontSize: 14,
    fontFamily: BODY_FONT,
  },
  actionButton: {
    height: 36,
    borderRadius: borderRadius.max,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x13,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: ALT_FONT,
  },
  colorRow: {
    alignItems: 'center',
    paddingHorizontal: spacing.x16,
    columnGap: spacing.x10,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.6)',
  },
  colorSwatchActive: {
    borderColor: PRIMARY,
    borderWidth: 3,
  },
  stickerChip: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(65, 137, 159, 0.1)',
  },
  stickerGlyph: {
    fontSize: 20,
    color: PRIMARY,
    fontFamily: ALT_FONT,
    fontWeight: '700',
  },
  rowCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizePill: {
    height: 34,
    borderRadius: borderRadius.max,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x10,
  },
  sizePillActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  sizePillLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: BODY_FONT,
  },
});

export default SkiaImageEditorModal;
