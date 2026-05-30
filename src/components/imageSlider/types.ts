export type ImageType = 'image' | 'gif';

export type ImageForSlider = {
  url: string;
  height: number;
  width: number;
  type: ImageType;
  gifAspectRatio?: number;
  id?: string;
};
