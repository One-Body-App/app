declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';

  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module '*.webp';
declare module '*.wav';
declare module '*.json';
declare module '*.module.scss' {
  const classes: Record<string, string>;
  export default classes;
}

declare module 'color';
