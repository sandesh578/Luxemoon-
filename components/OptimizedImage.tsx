'use client';

import Image, { type ImageProps } from 'next/image';
import { optimizeImage } from '@/lib/image';

type OptimizedImageProps = Omit<ImageProps, 'src'> & {
  src: ImageProps['src'] | null | undefined;
};

export function OptimizedImage({ src, alt, ...props }: OptimizedImageProps) {
  if (!src) {
    return <img alt={alt || ''} {...(props as any)} />;
  }

  const normalizedSrc = typeof src === 'string' ? optimizeImage(src) : src;
  return <Image src={normalizedSrc} alt={alt || ''} {...props} />;
}
