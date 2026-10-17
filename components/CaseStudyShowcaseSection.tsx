'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import Stage from './Stage';
import { useRedSunTransition } from './RedSunTransition';

/* ==========================================================================
   CASE STUDY SHOWCASE SECTION
   Direct 1:1 pixel reproduction of Figma node 550:9 (Desktop - 33 / Frame 99)
   Authoring canvas: 1920 × 1245 px within responsive Stage architecture
   Continuously attached directly to Posters Section (y = -5686 boundary)
   ========================================================================== */

export default function CaseStudyShowcaseSection() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const { triggerTransition, isTransitioning, phase } = useRedSunTransition();

  // Spotlight hover state: 'dead-signal' | 'nova' | null
  const [hoveredProject, setHoveredProject] = useState<'dead-signal' | 'nova' | null>(null);

  // 3D Parallax Tilt with Framer Motion Springs (0% React re-render overhead on mouse movement)
  const leftTiltX = useMotionValue(0);
  const leftTiltY = useMotionValue(0);
  const leftRotateX = useSpring(leftTiltX, { stiffness: 400, damping: 28 });
  const leftRotateY = useSpring(leftTiltY, { stiffness: 400, damping: 28 });

  const rightTiltX = useMotionValue(0);
  const rightTiltY = useMotionValue(0);
  const rightRotateX = useSpring(rightTiltX, { stiffness: 400, damping: 28 });
  const rightRotateY = useSpring(rightTiltY, { stiffness: 400, damping: 28 });

  const handleLeftMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    leftTiltX.set(-(y * 18));
    leftTiltY.set(x * 18);
  };
  const handleLeftMouseLeave = () => {
    leftTiltX.set(0);
    leftTiltY.set(0);
    setHoveredProject(null);
  };

  const handleRightMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rightTiltX.set(-(y * 18));
    rightTiltY.set(x * 18);
  };
  const handleRightMouseLeave = () => {
    rightTiltX.set(0);
    rightTiltY.set(0);
    setHoveredProject(null);
  };

  // Route prefetching on mount eliminates chunk downloading delay during transitions
  useEffect(() => {
    router.prefetch('/case-study/dead-signal');
    router.prefetch('/case-study/album-design');
  }, [router]);

  /* Scroll-driven rotation for the 03 Center Star — matching Hero, About, and Posters */
  const centerStarRotate = useTransform(scrollY, (y) => (shouldReduceMotion ? 0 : y * 0.45));

  // 01 DEAD SIGNAL: Left-side origin animation
  const handleDeadSignalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerTransition('/case-study/dead-signal', '01 // DEAD SIGNAL', 'center');
  };

  // 02 NOVA: Right-side origin animation
  const handleNovaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerTransition('/case-study/album-design', '02 // HALO IN REVERSE', 'center');
  };

  const isDeadSignalActive = hoveredProject === 'dead-signal';
  const isNovaActive = hoveredProject === 'nova';
  const hasActiveHover = hoveredProject !== null;

  return (
    <section
      id="case-study"
      className="case-study-showcase-section"
      style={{ marginTop: '-2px', backgroundColor: '#1c1c1c' }}
      aria-label="03 Case Study Showcase"
    >
      <div id="case-study-showcase" style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', pointerEvents: 'none' }} aria-hidden="true" />
      <h2 className="sr-only">03 CASE STUDY SHOWCASE</h2>

      <Stage baseWidth={1920} baseHeight={1245} className="cs-stage-wrapper">
        {/* ── 1. Figma Master Base: 01/02 Stencils, Vector 14 & Grid (Desktop - 33) ── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img
          src="/images/case-study-desktop-33-bg.webp"
          alt="Case Study Warped Dome and Layout"
          className="cs-stage-base-art"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1920,
            height: 1245,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
          loading="lazy"
          decoding="async"
          animate={{
            opacity: 1,
          }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />

        {/* ── 2. The Red Sun Dome Layer (Slight Warm Shift Under Active Hover) ── */}
        <div
          style={{
            position: 'absolute',
            left: 36,
            top: -67,
            width: 1865,
            height: 1318,
            zIndex: 12,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src="/images/case-study-dome-figma.webp"
            alt="Case Study Red Sun Dome"
            loading="lazy"
            decoding="async"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              pointerEvents: 'none',
              userSelect: 'none',
              transformOrigin: '50% 100%',
            }}
            animate={
              isTransitioning && (phase === 'covering' || phase === 'covered')
                ? {
                    scale: 1.08,
                    filter: 'brightness(1.15)',
                    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                  }
                : hasActiveHover
                ? {
                    scale: 1.012,
                    filter: 'brightness(1.05)',
                    transition: { duration: 0.35, ease: 'easeOut' },
                  }
                : {
                    scale: 1,
                    filter: 'brightness(1)',
                    transition: { duration: 0.35, ease: 'easeOut' },
                  }
            }
          />
        </div>

        {/* ── 2B. Clean Interactive Sun Selection Zones (Vector Curve Precision) ── */}
        <svg
          viewBox="0 0 1920 1245"
          className="cs-sun-svg-overlay"
          aria-label="Interactive Red Sun Case Study Selectors"
        >
          {/* Left Sun Half: 01 Dead Signal Brand Identity */}
          <path
            d="M 959,434 C 770,436 560,500 400,612 C 240,725 120,895 36,1245 L 959,1245 Z"
            className="cs-sun-interactive-path cs-sun-zone-left"
            onClick={handleDeadSignalClick}
            onMouseEnter={() => setHoveredProject('dead-signal')}
            onMouseLeave={() => setHoveredProject(null)}
            role="button"
            tabIndex={0}
            aria-label="Select Case Study 01: Dead Signal Brand Identity"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerTransition('/case-study/dead-signal', '01 // DEAD SIGNAL', 'center');
              }
            }}
          />

          {/* Right Sun Half: 02 Nova Music Campaign */}
          <path
            d="M 959,434 C 1148,436 1358,500 1518,612 C 1678,725 1798,895 1884,1245 L 959,1245 Z"
            className="cs-sun-interactive-path cs-sun-zone-right"
            onClick={handleNovaClick}
            onMouseEnter={() => setHoveredProject('nova')}
            onMouseLeave={() => setHoveredProject(null)}
            role="button"
            tabIndex={0}
            aria-label="Select Case Study 02: Nova Music Campaign"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerTransition('/case-study/album-design', '02 // HALO IN REVERSE', 'center');
              }
            }}
          />
        </svg>

        {/* ── 3. Center Star of 03: Attached to hanging Vector 14 line, Rotates with Scroll (No Glow) ── */}
        <div
          style={{
            position: 'absolute',
            left: 920,
            top: 28,
            width: 84,
            height: 102,
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 15,
          }}
        >
          <motion.img
            src="/images/case-study-star-center.webp"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              rotate: centerStarRotate,
              transformOrigin: '50% 47%',
              display: 'block',
            }}
            animate={{
              opacity: 1,
            }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>

        {/* ── 4. Left Cluster: Perfectly Centered Star Behind Card + Solid Card + Symmetrical Title Link ── */}
        {/* Left 5-point Star: Perfectly Centered Behind Dead Signal Card (cx: 365, cy: 397.5) */}
        <div
          style={{
            position: 'absolute',
            left: 95,
            top: 233,
            width: 450,
            height: 342,
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 10,
          }}
        >
          <motion.img
            src="/images/case-study-star-left.webp"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transformOrigin: '60.1% 48.2%',
              display: 'block',
            }}
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : isDeadSignalActive
                ? {
                    rotate: 360,
                    scale: 1.08,
                    filter: 'brightness(1.25) drop-shadow(0 0 28px rgba(220, 36, 36, 0.5))',
                  }
                : {
                    rotate: 360,
                    scale: 1,
                    filter: 'brightness(1)',
                  }
            }
            transition={
              isDeadSignalActive
                ? {
                    rotate: { repeat: Infinity, duration: 3.8, ease: 'linear' },
                    scale: { type: 'spring', stiffness: 280, damping: 22 },
                    filter: { duration: 0.3 },
                  }
                : {
                    rotate: { repeat: Infinity, duration: 22, ease: 'linear' },
                    scale: { duration: 0.4, ease: 'easeOut' },
                    filter: { duration: 0.4 },
                  }
            }
          />
        </div>

        {/* Left Card: Dead Signal Brand Identity (3D Parallax Tilt on Cursor Move) */}
        <div
          style={{
            position: 'absolute',
            left: 175,
            top: 245,
            width: 380,
            height: 305,
            zIndex: 20,
            perspective: 1000,
          }}
          onMouseEnter={() => setHoveredProject('dead-signal')}
          onMouseMove={handleLeftMouseMove}
          onMouseLeave={handleLeftMouseLeave}
        >
          <Link
            href="/case-study/dead-signal"
            prefetch={true}
            onClick={handleDeadSignalClick}
            aria-label="View Dead Signal Brand Identity Case Study"
            style={{ display: 'block', width: '100%', height: '100%', outline: 'none' }}
          >
            <motion.div
              style={{
                width: '100%',
                height: '100%',
                cursor: 'pointer',
                position: 'relative',
                transformStyle: 'preserve-3d',
                rotateX: leftRotateX,
                rotateY: leftRotateY,
              }}
              animate={
                isDeadSignalActive
                  ? {
                      y: -10,
                      scale: 1.05,
                      filter: 'drop-shadow(0 25px 45px rgba(0, 0, 0, 0.85)) brightness(1.08)',
                    }
                  : {
                      y: 0,
                      scale: 1,
                      filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5)) brightness(1)',
                    }
              }
              transition={{
                scale: { type: 'spring', stiffness: 300, damping: 22 },
                y: { type: 'spring', stiffness: 300, damping: 22 },
                filter: { duration: 0.3 },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/case-study-card-01.webp"
                alt="Dead Signal Brand Identity"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </motion.div>
          </Link>
        </div>

        {/* BRAND IDENTITY: Mathematically Symmetrical Title Link with Editorial Brackets */}
        <Link
          href="/case-study/dead-signal"
          prefetch={true}
          onClick={handleDeadSignalClick}
          onMouseEnter={() => setHoveredProject('dead-signal')}
          onMouseLeave={() => setHoveredProject(null)}
          aria-label="Read Dead Signal Brand Identity Case Study"
          className="cs-symmetrical-title-link"
          style={{
            position: 'absolute',
            left: 572,
            top: 376,
            width: 308,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            zIndex: 25,
            cursor: 'pointer',
            outline: 'none',
            textDecoration: 'none',
          }}
        >
          {/* Left Editorial Bracket */}
          <motion.span
            style={{
              fontSize: '20px',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#e50914',
              lineHeight: 1,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            animate={{
              opacity: isDeadSignalActive ? 1 : 0,
              x: isDeadSignalActive ? 0 : 8,
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            [
          </motion.span>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src="/images/cs-title-brand-identity.png"
            alt="BRAND IDENTITY"
            style={{
              height: '100%',
              width: 'auto',
              maxWidth: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
            animate={
              isDeadSignalActive
                ? {
                    filter: 'brightness(1.25) drop-shadow(0 0 12px rgba(229, 9, 20, 0.45))',
                    scale: 1.04,
                  }
                : {
                    filter: 'brightness(1)',
                    scale: 1,
                  }
            }
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />

          {/* Right Editorial Bracket */}
          <motion.span
            style={{
              fontSize: '20px',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#e50914',
              lineHeight: 1,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            animate={{
              opacity: isDeadSignalActive ? 1 : 0,
              x: isDeadSignalActive ? 0 : -8,
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            ]
          </motion.span>
          <span className="sr-only">Brand Identity Case Study</span>
        </Link>

        {/* ── 5. Right Cluster: Perfectly Centered Star Behind Card + Solid Card + Symmetrical Title Link ── */}
        {/* Right 5-point Star: Perfectly Centered Behind Nova Card (cx: 1555, cy: 392.5) */}
        <div
          style={{
            position: 'absolute',
            left: 1345,
            top: 198,
            width: 415,
            height: 370,
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 10,
          }}
        >
          <motion.img
            src="/images/case-study-star-right.webp"
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transformOrigin: '50.5% 52.5%',
              display: 'block',
            }}
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : isNovaActive
                ? {
                    rotate: 360,
                    scale: 1.08,
                    filter: 'brightness(1.25) drop-shadow(0 0 28px rgba(70, 130, 240, 0.5))',
                  }
                : {
                    rotate: 360,
                    scale: 1,
                    filter: 'brightness(1)',
                  }
            }
            transition={
              isNovaActive
                ? {
                    rotate: { repeat: Infinity, duration: 3.8, ease: 'linear' },
                    scale: { type: 'spring', stiffness: 280, damping: 22 },
                    filter: { duration: 0.3 },
                  }
                : {
                    rotate: { repeat: Infinity, duration: 22, ease: 'linear' },
                    scale: { duration: 0.4, ease: 'easeOut' },
                    filter: { duration: 0.4 },
                  }
            }
          />
        </div>

        {/* Right Card: Nova Music Campaign (3D Parallax Tilt on Cursor Move) */}
        <div
          style={{
            position: 'absolute',
            left: 1365,
            top: 240,
            width: 380,
            height: 305,
            zIndex: 20,
            perspective: 1000,
          }}
          onMouseEnter={() => setHoveredProject('nova')}
          onMouseMove={handleRightMouseMove}
          onMouseLeave={handleRightMouseLeave}
        >
          <Link
            href="/case-study/album-design"
            prefetch={true}
            onClick={handleNovaClick}
            aria-label="View Nova Music Campaign Case Study"
            style={{ display: 'block', width: '100%', height: '100%', outline: 'none' }}
          >
            <motion.div
              style={{
                width: '100%',
                height: '100%',
                cursor: 'pointer',
                position: 'relative',
                transformStyle: 'preserve-3d',
                rotateX: rightRotateX,
                rotateY: rightRotateY,
              }}
              animate={
                isNovaActive
                  ? {
                      y: -10,
                      scale: 1.05,
                      filter: 'drop-shadow(0 25px 45px rgba(0, 0, 0, 0.85)) brightness(1.08)',
                    }
                  : {
                      y: 0,
                      scale: 1,
                      filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5)) brightness(1)',
                    }
              }
              transition={{
                scale: { type: 'spring', stiffness: 300, damping: 22 },
                y: { type: 'spring', stiffness: 300, damping: 22 },
                filter: { duration: 0.3 },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/case-study-card-02.webp"
                alt="Nova Music Campaign"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </motion.div>
          </Link>
        </div>

        {/* MUSIC CAMPAIGN: Mathematically Symmetrical Title Link with Editorial Brackets */}
        <Link
          href="/case-study/album-design"
          prefetch={true}
          onClick={handleNovaClick}
          onMouseEnter={() => setHoveredProject('nova')}
          onMouseLeave={() => setHoveredProject(null)}
          aria-label="Read Nova Music Campaign Case Study"
          className="cs-symmetrical-title-link"
          style={{
            position: 'absolute',
            left: 1040,
            top: 376,
            width: 312,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            zIndex: 25,
            cursor: 'pointer',
            outline: 'none',
            textDecoration: 'none',
          }}
        >
          {/* Left Editorial Bracket */}
          <motion.span
            style={{
              fontSize: '20px',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#e50914',
              lineHeight: 1,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            animate={{
              opacity: isNovaActive ? 1 : 0,
              x: isNovaActive ? 0 : 8,
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            [
          </motion.span>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src="/images/cs-title-music-campaign.png"
            alt="MUSIC CAMPAIGN"
            style={{
              height: '100%',
              width: 'auto',
              maxWidth: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
            animate={
              isNovaActive
                ? {
                    filter: 'brightness(1.25) drop-shadow(0 0 12px rgba(229, 9, 20, 0.45))',
                    scale: 1.04,
                  }
                : {
                    filter: 'brightness(1)',
                    scale: 1,
                  }
            }
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />

          {/* Right Editorial Bracket */}
          <motion.span
            style={{
              fontSize: '20px',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#e50914',
              lineHeight: 1,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            animate={{
              opacity: isNovaActive ? 1 : 0,
              x: isNovaActive ? 0 : -8,
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            ]
          </motion.span>
          <span className="sr-only">Music Campaign Case Study</span>
        </Link>
      </Stage>
    </section>
  );
}
