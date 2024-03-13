'use client';

import * as React from 'react';

export interface ProgressiveImageProps {
  readonly thumbnailUrl: string;
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

export function ProgressiveImage({
  thumbnailUrl,
  url,
  width,
  height,
  alt,
}: ProgressiveImageProps): React.ReactNode {
  const [hasPreloadedImage, setHasPreloadedImage] = React.useState(false);

  React.useEffect(() => {
    setHasPreloadedImage(false);
    const preloadImage = new Image();

    preloadImage.src = url;
    preloadImage.onload = () => setHasPreloadedImage(true);
  }, [url]);

  return hasPreloadedImage ? (
    <img src={url} width={width} height={height} alt={alt} />
  ) : (
    <img
      src={thumbnailUrl}
      width={width}
      height={height}
      alt={alt}
      className="blur-md"
    />
  );
}
