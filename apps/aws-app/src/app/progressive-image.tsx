import * as React from 'react';
import {PreloadedImage} from './preloaded-image.js';

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
  return (
    <React.Suspense
      key={thumbnailUrl}
      fallback={
        <img
          src={thumbnailUrl}
          width={width}
          height={height}
          alt={alt}
          className="blur-md"
        />
      }
    >
      <PreloadedImage src={url} width={width} height={height} alt={alt} />
    </React.Suspense>
  );
}
