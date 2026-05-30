import { Platform } from 'react-native';
import { getHeight } from '@/utils/ResponsiveFun';
import { spacing } from './spacing';

export const APP_HEADER_CONTROL_SIZE = 44;
export const APP_HEADER_ROW_HEIGHT = Platform.OS === 'android' ? 57 : getHeight(5.8);
export const APP_HEADER_SIDE_WIDTH = Math.max(APP_HEADER_ROW_HEIGHT, APP_HEADER_CONTROL_SIZE);
export const APP_HEADER_HORIZONTAL_INSET = spacing.x16;
export const APP_HEADER_TITLE_FONT_SIZE = 24;
export const APP_HEADER_TITLE_LINE_HEIGHT = 32;
export const APP_HEADER_TITLE_FONT_FAMILY = 'Rubik-Bold';
export const APP_HEADER_TITLE_FONT_WEIGHT = '700';
export const APP_HEADER_TITLE_LETTER_SPACING = 0.3;
export const APP_HEADER_ROW_OFFSET = Platform.OS === 'ios' ? -7 : 0;
export const APP_HEADER_ANDROID_TITLE_PADDING_LEFT = spacing.x5;
export const APP_HEADER_CONTENT_GAP = spacing.x8;
export const APP_HEADER_BACKGROUND_LIGHT = 'rgba(246,246,247,0.92)';
export const APP_HEADER_BACKGROUND_DARK = 'rgba(13,13,13,0.92)';
export const APP_HEADER_BORDER_LIGHT = '#e6eaec';
export const APP_HEADER_BORDER_DARK = 'rgba(255,255,255,0.08)';

export const CONNECT_HEADER_ROW_HEIGHT = Platform.OS === 'android' ? getHeight(7) : getHeight(5.8);
export const CONNECT_HEADER_SIDE_WIDTH = Math.max(
  CONNECT_HEADER_ROW_HEIGHT,
  APP_HEADER_CONTROL_SIZE
);
export const CONNECT_HEADER_ANDROID_TITLE_PADDING_LEFT = spacing.x5;
export const CONNECT_HEADER_CONTENT_GAP = spacing.x5;
