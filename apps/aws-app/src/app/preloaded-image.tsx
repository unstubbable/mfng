'use client';

import * as React from 'react';

export interface PreloadedImageProps {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

const preloadPromises = new Map<string, Promise<void>>();

export function PreloadedImage({
  src,
  width,
  height,
  alt,
}: PreloadedImageProps): React.ReactNode {
  const preloadPromise =
    preloadPromises.get(src) ??
    new Promise((resolve) => {
      const preloadImage = new Image();

      preloadImage.src = src;
      preloadImage.onload = () => resolve();
      // TODO: Better error handling.
      preloadImage.onerror = () => resolve();
    });

  preloadPromises.set(src, preloadPromise);

  React.use(preloadPromise);

  return <img src={src} width={width} height={height} alt={alt} />;
}
