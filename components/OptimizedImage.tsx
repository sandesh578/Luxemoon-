'use client';

import Image, { type ImageProps } from 'next/image';
import { optimizeImage } from '@/lib/image';

type OptimizedImageProps = Omit<ImageProps, 'src'> & {
  src: ImageProps['src'] | null | undefined;
};

export function OptimizedImage({ src, alt, ...props }: OptimizedImageProps) {
  if (!src) {
    return (
      <span
        aria-label={alt || "Image unavailable"}
        className="block h-full w-full bg-stone-100"
      />
    );
  }

  const normalizedSrc = typeof src === 'string' ? optimizeImage(src) : src;
  return <Image src={normalizedSrc} alt={alt || ''} {...props} />;
}
