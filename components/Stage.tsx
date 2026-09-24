'use client';

import React, { useEffect, useRef, useState } from 'react';

interface StageProps {
  children: React.ReactNode;
  baseWidth?: number;
  baseHeight: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Stage({
  children,
  baseWidth = 1920,
  baseHeight,
  className = '',
  style = {},
}: StageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const clientWidth = containerRef.current.clientWidth;
        if (clientWidth > 0) {
          setScale(clientWidth / baseWidth);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);

    // Also observe element resize via ResizeObserver for responsive fluidity
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => updateScale());
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateScale);
      if (observer) observer.disconnect();
    };
  }, [baseWidth]);

  return (
    <div
      ref={containerRef}
      className={`stage-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${baseWidth} / ${baseHeight}`,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        className="stage"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
