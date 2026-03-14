'use client';

import dynamic from 'next/dynamic';

const FloatingWhatsApp = dynamic(
  () => import('./FloatingWhatsApp').then((mod) => mod.FloatingWhatsApp),
  { ssr: false }
);

export function ClientOverlays() {
  return <FloatingWhatsApp />;
}
