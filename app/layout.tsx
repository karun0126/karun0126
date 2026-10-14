import type { Metadata, Viewport } from 'next';
import './globals.css';
import CursorTrail from '@/components/CursorTrail';
import { RedSunTransitionProvider } from '@/components/RedSunTransition';

export const metadata: Metadata = {
  title: 'Karun Pandey — Graphic Designer & Traditional Artist Portfolio',
  description:
    'Portfolio of Karun Pandey, graphic designer and traditional artist blending paper and pixels. Featuring Dead Signal brand identity, poster designs, and original sketchbook art.',
  authors: [{ name: 'Karun Pandey' }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href="/images/hero-clean-bg.jpg" fetchPriority="high" />
        <link rel="preload" as="image" href="/images/hand-posters-collage.webp" />
        <link rel="preload" as="image" href="/images/about-bg-clean.webp" />
        <link rel="preload" as="image" href="/images/about-text-ink.webp" />
        <link rel="preload" as="image" href="/images/posters-slice.jpg" />
        <link rel="preload" as="image" href="/images/case-study-dome-figma.webp" />
      </head>
      <body>
        <CursorTrail />
        <RedSunTransitionProvider>
          {children}
        </RedSunTransitionProvider>
      </body>
    </html>
  );
}

