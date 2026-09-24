import type { Metadata, Viewport } from 'next';
import './globals.css';
import CursorTrail from '@/components/CursorTrail';

export const metadata: Metadata = {
  title: 'Karun Pandey — Graphic Designer & Traditional Artist Portfolio',
  description:
    'Portfolio of Karun Pandey, graphic designer and traditional artist blending paper and pixels. Featuring Dead Signal brand identity, poster designs, and original sketchbook art.',
  authors: [{ name: 'Karun Pandey' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CursorTrail />
        {children}
      </body>
    </html>
  );
}
