'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LightboxModalProps {
  isOpen: boolean;
  imgSrc: string;
  caption: string;
  posterId?: string;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

export default function LightboxModal({
  isOpen,
  imgSrc,
  caption,
  onClose,
  onNext,
  onPrev,
  currentIndex,
  totalCount = 9,
}: LightboxModalProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Keyboard navigation (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onNext, onPrev]);

  // Touch swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only trigger if horizontal swipe is prominent (> 45px) and greater than vertical movement
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0 && onNext) {
        // Swiped left -> Next
        onNext();
      } else if (deltaX > 0 && onPrev) {
        // Swiped right -> Previous
        onPrev();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const displayIndex = typeof currentIndex === 'number' && currentIndex >= 0 ? currentIndex + 1 : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Artwork Inspector"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Bar with Counter and Close Button */}
          <div className="lightbox-top-bar" aria-hidden="true">
            <div className="lightbox-badge">
              <span className="lightbox-badge-dot" />
              <span className="lightbox-badge-text">
                {displayIndex ? `POSTER 0${displayIndex} / 0${totalCount}` : 'ARTWORK INSPECT'}
              </span>
            </div>

            <button
              type="button"
              className="lightbox-close-btn"
              onClick={onClose}
              aria-label="Close Inspector (Escape)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Navigation Arrow: Previous */}
          {onPrev && (
            <button
              type="button"
              className="lightbox-nav-btn lightbox-nav-prev"
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              aria-label="Previous Poster"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Navigation Arrow: Next */}
          {onNext && (
            <button
              type="button"
              className="lightbox-nav-btn lightbox-nav-next"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              aria-label="Next Poster"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Main Content Area */}
          <motion.div
            key={imgSrc}
            className="lightbox-content"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="lightbox-img"
              src={imgSrc}
              alt={caption || 'High-resolution artwork inspect view'}
            />

            <div className="lightbox-caption-bar">
              {caption && <div className="lightbox-caption">{caption}</div>}
              <div className="lightbox-hints">
                <span className="lightbox-hint-mobile">Swipe or tap arrows to navigate</span>
                <span className="lightbox-hint-desktop">Use Arrow Keys ← → to navigate • ESC to close</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
