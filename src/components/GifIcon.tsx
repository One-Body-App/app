import React from 'react';
import GifSvg from '@/assets/svg/gif.svg';

type Props = {
  size?: number;
  color?: string;
};

function GifIcon({ size = 20, color = '#126b87' }: Props) {
  return <GifSvg width={size} height={size} color={color} />;
}

export default GifIcon;
