'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import Stage from './Stage';

// Register GSAP CustomEase plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(CustomEase);
  try {
    CustomEase.create('cinematic', '0.22, 1, 0.36, 1');
  } catch {
    // Custom ease may already exist
  }
}

export default function HeroSection() {
  const movingGroupRef = useRef<HTMLDivElement>(null);
  const skipBtnRef = useRef<HTMLButtonElement>(null);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      if (movingGroupRef.current) {
        gsap.set(movingGroupRef.current, { x: 0 });
      }
      setIsIntroComplete(true);
      return;
    }

    // Lock body scroll during the entrance animation
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Start position: -1950px in 1920x1080 stage coordinates
    // At -1950px, the hand is completely off-screen left (-813px)
    // and the black curtain attached at 780px covers from -33px to 3167px (entire 1920px stage is solid black)
    const startX = -1950;

    if (movingGroupRef.current) {
      gsap.set(movingGroupRef.current, {
        x: startX,
        y: 0,
        rotation: 0,
        scale: 1,
        force3D: true,
      });
    }

    // Master Timeline: Animate Hand + Posters + Black Curtain smoothly from Left -> Right
    // Stops exactly at resting position x: 0 (left: 1137px), revealing the home page
    const tl = gsap.timeline({
      delay: 0.15,
      onComplete: () => {
        setIsIntroComplete(true);
        document.body.style.overflow = originalOverflow;
        if (skipBtnRef.current) {
          gsap.to(skipBtnRef.current, {
            opacity: 0,
            duration: 0.3,
            pointerEvents: 'none',
          });
        }
      },
    });

    tlRef.current = tl;

    tl.to(
      movingGroupRef.current,
      {
        x: 0,
        duration: 2.1,
        ease: 'cinematic',
      },
      0
    );

    // Keyboard shortcut to skip intro (Escape or Space)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        tl.progress(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      tl.kill();
    };
  }, []);

  const handleSkip = () => {
    if (tlRef.current) {
      tlRef.current.progress(1);
    }
  };

  return (
    <section id="hero" className="slide-frame" aria-label="Hero Section">
      <Stage baseHeight={1080}>
        <h1
          className="sr-only"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          Karun Pandey — Graphic Designer & Traditional Artist
        </h1>

        {/* Clean Hero Base Layer (Revealed progressively from left to right) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="stage-img hero-base-bg"
          src="/images/hero-clean-bg.jpg"
          alt="Karun Pandey Portfolio Hero — Artistic portrait and bold KRXN typography"
          loading="eager"
          decoding="sync"
        />

        {/* Moving Group: Figma Group 79 Hand + Posters Collage + Black Trailing Curtain */}
        <div ref={movingGroupRef} className="hero-hand-group" aria-hidden="true">
          {/* Black Underlay behind right side of posters for seamless solid tone */}
          <div className="hero-hand-right-underlay" />

          {/* Proper Figma Group 79 Collage: Hand holding Marty Supreme, Sinners, Cowboy Bebop, 18x2 (No artificial cutout) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="hero-hand-img"
            src="/images/hand-posters-collage.png"
            alt=""
            loading="eager"
            decoding="sync"
          />

          {/* Trailing black background on the right side of the hand group */}
          <div className="hero-black-curtain" />
        </div>

      </Stage>

      {/* Subtle Skip Button (Positioned at section level so it remains full-size and touch-friendly on mobile) */}
      {!isIntroComplete && (
        <button
          ref={skipBtnRef}
          type="button"
          className="hero-skip-btn"
          onClick={handleSkip}
          aria-label="Skip Intro Animation"
        >
          <span className="hero-skip-desktop">SKIP [ESC]</span>
          <span className="hero-skip-mobile">SKIP</span>
        </button>
      )}

      {/* Mobile Hero Tagline & Scroll Cue (Appears cleanly below stage on mobile viewports) */}
      <div className="hero-mobile-footer" aria-hidden="true">
        <div className="hero-mobile-tagline">
          <span className="hero-mobile-artist">KARUN PANDEY</span>
          <span className="hero-mobile-dot">•</span>
          <span className="hero-mobile-sub">GRAPHIC DESIGN & ART</span>
        </div>
        <div className="hero-mobile-scroll-cue">
          <span>EXPLORE</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </section>
  );
}
