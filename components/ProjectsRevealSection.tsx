'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

interface FragmentDef {
  id: number;
  yRatio: number;
  xOffset: number;
  size: number;
  fallSpeed: number;
  xDrift: number;
  rotation: number;
}

const FRAGMENTS_P1: FragmentDef[] = [
  { id: 1, yRatio: 0.12, xOffset: -4, size: 3.5, fallSpeed: 95,  xDrift: -12, rotation: 32 },
  { id: 2, yRatio: 0.31, xOffset: 6,  size: 5.2, fallSpeed: 55,  xDrift: 15,  rotation: -22 },
  { id: 3, yRatio: 0.46, xOffset: -3, size: 3.0, fallSpeed: 130, xDrift: -8,  rotation: 45 },
  { id: 4, yRatio: 0.62, xOffset: 7,  size: 4.5, fallSpeed: 70,  xDrift: 18,  rotation: -35 },
  { id: 5, yRatio: 0.78, xOffset: -5, size: 3.8, fallSpeed: 105, xDrift: -14, rotation: 26 },
];

const FRAGMENTS_P2: FragmentDef[] = [
  { id: 6, yRatio: 0.15, xOffset: 4,  size: 3.4, fallSpeed: 85,  xDrift: 11,  rotation: -25 },
  { id: 7, yRatio: 0.33, xOffset: -5, size: 5.0, fallSpeed: 50,  xDrift: -13, rotation: 28 },
  { id: 8, yRatio: 0.52, xOffset: 3,  size: 3.0, fallSpeed: 120, xDrift: 9,   rotation: -38 },
  { id: 9, yRatio: 0.71, xOffset: -4, size: 4.2, fallSpeed: 75,  xDrift: -12, rotation: 22 },
];

// Authentic Brittle Fracture Nodes: non-periodic, varied vertical runs, sharp acute shear breaks
const BRITTLE_FRACTURE_NODES = [
  // [ny (0 to 1), dx (horizontal deviation in px)]
  [0.000,   0.0],
  [0.025,  -1.8],
  [0.055,   1.5],
  [0.088,  -2.6],
  [0.098,  11.2], // Sharp brittle shear jog
  [0.135,   9.4],
  [0.170,  12.0],
  [0.182,  -1.8], // Sharp return
  [0.225,  -4.5],
  [0.270,  -2.8],
  [0.308,  -6.2],
  [0.318,   9.0], // Sudden dogleg fracture
  [0.360,  10.5],
  [0.405,   7.8],
  [0.448,   9.2],
  [0.460, -11.0], // Major brittle fracture break
  [0.500, -12.8],
  [0.545,  -9.5],
  [0.585, -11.6],
  [0.598,   5.2], // Sharp angular kick
  [0.640,   7.0],
  [0.685,   4.5],
  [0.725,   7.2],
  [0.738,  -8.5], // Sharp brittle shear
  [0.785, -10.4],
  [0.830,  -7.8],
  [0.872,  -9.6],
  [0.885,   5.0], // Fracture step
  [0.930,   3.5],
  [0.965,   1.2],
  [1.000,   0.0],
];

function getFracturePoints(startX: number, startY: number, totalH: number, seedMultiplier: number = 1) {
  return BRITTLE_FRACTURE_NODES.map(([ny, dx]) => {
    const y = startY + ny * totalH;
    const x = startX + dx * seedMultiplier;
    return [x, y];
  });
}

function getPathString(points: number[][]) {
  return points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`, '');
}

function getPolygonString(points: number[][], side: 'left' | 'right', width: number, height: number) {
  if (side === 'left') {
    // Top-left -> Top at crack -> Down along jagged points -> Bottom-left
    const pts = ['0,0', ...points.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`), `0,${height}`];
    return pts.join(' ');
  } else {
    // Top-right -> Top at crack -> Down along jagged points -> Bottom-right
    const pts = [`${width},0`, ...points.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`), `${width},${height}`];
    return pts.join(' ');
  }
}

export default function ProjectsRevealSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stage1Ref = useRef<HTMLDivElement>(null);
  const stage2Ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const [crackX, setCrackX] = useState<number>(972);
  const [viewWidth, setViewWidth] = useState<number>(1920);
  const [viewHeight, setViewHeight] = useState<number>(1080);

  useEffect(() => {
    const updateGeometry = () => {
      const anchorEl = document.getElementById('last-middle-poster-anchor');
      const sectionEl = sectionRef.current;

      if (sectionEl) {
        const sRect = sectionEl.getBoundingClientRect();
        setViewWidth(sRect.width);
        setViewHeight(window.innerHeight || 1080);

        if (anchorEl) {
          const aRect = anchorEl.getBoundingClientRect();
          // Sub-pixel horizontal coordinate of the poster's exact bottom-center
          const realX = aRect.left + aRect.width / 2 - sRect.left;
          setCrackX(realX);
        } else {
          // Poster 008 center in 1920 base width: 824 + 148 = 972px (50.625%)
          setCrackX(sRect.width * (972 / 1920));
        }
      }
    };

    updateGeometry();
    window.addEventListener('resize', updateGeometry);
    window.addEventListener('scroll', updateGeometry, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && sectionRef.current) {
      ro = new ResizeObserver(updateGeometry);
      ro.observe(sectionRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateGeometry);
      window.removeEventListener('scroll', updateGeometry);
      if (ro) ro.disconnect();
    };
  }, []);

  // Responsive scroll tracking: active as soon as this section approaches viewport
  const { scrollYProgress: p1 } = useScroll({
    target: stage1Ref,
    offset: ['start end', 'end end'],
  });

  const { scrollYProgress: p2 } = useScroll({
    target: stage2Ref,
    offset: ['start end', 'end end'],
  });

  // Stage 1 Motion Transitions (Tight, responsive curve with zero dead black space):
  // 1. Crack extends rapidly from the top (connected directly to Poster 008's bottom exit)
  const crackProgress1 = useTransform(p1, [0.0, 0.32], [0, 1]);
  // 2. Wall panels tear apart along the JAGGED fracture seam (sliding wide open)
  const wallSeparation1 = useTransform(p1, [0.12, 0.72], [0, viewWidth * 0.44]);
  const wallRotate1 = useTransform(p1, [0.12, 0.72], [0, 3.5]);
  // 3. Deep crimson void glow
  const redGlowOpacity1 = useTransform(p1, [0.10, 0.50], [0, 0.95]);
  // 4. Project 01 Card EMERGES FROM INSIDE THE CRACK (3D expansion from deep void)
  const p1CardTranslateZ = useTransform(p1, [0.14, 0.65], [-350, 0]);
  const p1CardRotateX = useTransform(p1, [0.14, 0.65], [18, 0]);
  const p1CardRotateY = useTransform(p1, [0.14, 0.65], [-8, 0]);
  const p1CardScale = useTransform(p1, [0.14, 0.65], [0.35, 1.0]);
  const p1CardOpacity = useTransform(p1, [0.12, 0.42], [0.2, 1.0]);

  // Stage 2 Motion Transitions:
  const crackProgress2 = useTransform(p2, [0.0, 0.32], [0, 1]);
  const wallSeparation2 = useTransform(p2, [0.12, 0.72], [0, viewWidth * 0.44]);
  const wallRotate2 = useTransform(p2, [0.12, 0.72], [0, 3.5]);
  const redGlowOpacity2 = useTransform(p2, [0.10, 0.50], [0, 0.95]);
  const p2CardTranslateZ = useTransform(p2, [0.14, 0.65], [-350, 0]);
  const p2CardRotateX = useTransform(p2, [0.14, 0.65], [-18, 0]);
  const p2CardRotateY = useTransform(p2, [0.14, 0.65], [8, 0]);
  const p2CardScale = useTransform(p2, [0.14, 0.65], [0.35, 1.0]);
  const p2CardOpacity = useTransform(p2, [0.12, 0.42], [0.2, 1.0]);

  // Calculate jagged fracture points and clip polygons:
  const crackH = viewHeight;
  const pts1 = getFracturePoints(crackX, 0, crackH, 1);
  const pathD1 = getPathString(pts1);
  const polyLeft1 = getPolygonString(pts1, 'left', viewWidth, crackH);
  const polyRight1 = getPolygonString(pts1, 'right', viewWidth, crackH);

  // Stage 2 uses inverted fracture geometry for authentic variance
  const pts2 = getFracturePoints(crackX, 0, crackH, -0.9);
  const pathD2 = getPathString(pts2);
  const polyLeft2 = getPolygonString(pts2, 'left', viewWidth, crackH);
  const polyRight2 = getPolygonString(pts2, 'right', viewWidth, crackH);

  return (
    <section
      id="case-study"
      ref={sectionRef}
      className="projects-reveal-root"
      aria-label="Selected Projects Case Studies Showcase"
    >
      <h2 className="sr-only">03 SELECTED PROJECTS: CASE STUDIES</h2>

      {/* SVG Definitions for Jagged Crack ClipPaths & Glowing Filters */}
      <svg className="sr-only" aria-hidden="true">
        <defs>
          {/* Stage 1 Jagged Left ClipPath */}
          <clipPath id="crack-clip-left-1" clipPathUnits="userSpaceOnUse">
            <polygon points={polyLeft1} />
          </clipPath>
          {/* Stage 1 Jagged Right ClipPath */}
          <clipPath id="crack-clip-right-1" clipPathUnits="userSpaceOnUse">
            <polygon points={polyRight1} />
          </clipPath>

          {/* Stage 2 Jagged Left ClipPath */}
          <clipPath id="crack-clip-left-2" clipPathUnits="userSpaceOnUse">
            <polygon points={polyLeft2} />
          </clipPath>
          {/* Stage 2 Jagged Right ClipPath */}
          <clipPath id="crack-clip-right-2" clipPathUnits="userSpaceOnUse">
            <polygon points={polyRight2} />
          </clipPath>

          <filter id="fissure-stress-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#e50914" floodOpacity="0.88" />
            <feDropShadow dx="0" dy="0" stdDeviation="6.0" floodColor="#931414" floodOpacity="0.60" />
          </filter>
        </defs>
      </svg>

      {/* ============================================================
          STAGE 1: PROJECT 01 — DEAD SIGNAL
          Starts touching the bottom edge of Poster 008
          ============================================================ */}
      <div ref={stage1Ref} className="project-reveal-track">
        <div className="project-reveal-sticky-viewport">
          {/* Deep Crimson Ambient Backdrop Layer (Glows behind the cracked fissure) */}
          <motion.div
            className="project-reveal-crimson-backdrop"
            style={{
              opacity: shouldReduceMotion ? 0.8 : redGlowOpacity1,
            }}
          />

          {/* PROJECT 01 CARD: EMERGES OUT OF THE CRACK IN 3D */}
          <div className="project-reveal-card-perspective-stage">
            <motion.div
              className="project-reveal-emerging-card-wrap"
              style={{
                opacity: shouldReduceMotion ? 1 : p1CardOpacity,
                transformStyle: 'preserve-3d',
                transformPerspective: 1200,
                z: shouldReduceMotion ? 0 : p1CardTranslateZ,
                rotateX: shouldReduceMotion ? 0 : p1CardRotateX,
                rotateY: shouldReduceMotion ? 0 : p1CardRotateY,
                scale: shouldReduceMotion ? 1 : p1CardScale,
              }}
            >
              <Link
                href="/case-study/dead-signal"
                className="project-card-link"
                aria-label="Open Case Study 01: Dead Signal"
              >
                <div className="project-card-inner">
                  {/* Card Media Preview Frame */}
                  <div className="project-card-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/dead-signal-01-intro.webp"
                      alt="Dead Signal Brand Identity Case Study Preview"
                      loading="lazy"
                      className="project-card-img"
                    />
                    <div className="project-card-overlay-sheen" />
                    <span className="project-card-badge">PROJECT // 01</span>
                  </div>

                  {/* Editorial Metadata Bar */}
                  <div className="project-card-info">
                    <div className="project-card-header">
                      <span className="project-card-tag">CASE STUDY [01]</span>
                      <span className="project-card-year">2026</span>
                    </div>

                    <h3 className="project-card-title">DEAD SIGNAL</h3>
                    <p className="project-card-subtitle">
                      Visual Identity, Streetwear Apparel Systems &amp; Spatial Architecture
                    </p>

                    <div className="project-card-action">
                      <span className="project-card-cta">
                        EXPLORE FULL CASE STUDY [13 CHAPTERS] <span className="cta-arrow">➔</span>
                      </span>
                      <span className="project-card-note">CLICK TO READ</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* LEFT WALL PANEL (Clipped by JAGGED crack polygon, slides left) */}
          <motion.div
            className="project-wall-panel wall-left-clipped"
            style={{
              clipPath: 'url(#crack-clip-left-1)',
              x: shouldReduceMotion ? 0 : useTransform(wallSeparation1, (v) => -v),
              rotateY: shouldReduceMotion ? 0 : wallRotate1,
              transformOrigin: 'right center',
            }}
          />

          {/* RIGHT WALL PANEL (Clipped by JAGGED crack polygon, slides right) */}
          <motion.div
            className="project-wall-panel wall-right-clipped"
            style={{
              clipPath: 'url(#crack-clip-right-1)',
              x: shouldReduceMotion ? 0 : wallSeparation1,
              rotateY: shouldReduceMotion ? 0 : useTransform(wallRotate1, (v) => -v),
              transformOrigin: 'left center',
            }}
          />

          {/* ONE SINGLE REALISTIC CRACK SVG (Brittle Fracture Shading) */}
          <svg
            className="project-crack-svg"
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'visible',
              pointerEvents: 'none',
              zIndex: 35,
            }}
          >
            {/* Layer 1: Sub-surface Stress Glow */}
            <motion.path
              d={pathD1}
              fill="none"
              stroke="#8b0d13"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="miter"
              strokeMiterlimit="4"
              opacity="0.5"
              style={{
                pathLength: shouldReduceMotion ? 1 : crackProgress1,
              }}
            />

            {/* Layer 2: Glowing Crimson Stress Rim */}
            <motion.path
              d={pathD1}
              fill="none"
              stroke="#e50914"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="miter"
              strokeMiterlimit="4"
              filter="url(#fissure-stress-glow)"
              style={{
                pathLength: shouldReduceMotion ? 1 : crackProgress1,
              }}
            />

            {/* Layer 3: Razor-thin Dark Trench Core */}
            <motion.path
              d={pathD1}
              fill="none"
              stroke="#040404"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="miter"
              strokeMiterlimit="4"
              style={{
                pathLength: shouldReduceMotion ? 1 : crackProgress1,
              }}
            />

            {/* Layer 4: Micro Fracture Highlights */}
            <motion.path
              d={pathD1}
              fill="none"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="miter"
              strokeDasharray="2 16"
              style={{
                pathLength: shouldReduceMotion ? 1 : crackProgress1,
              }}
            />

            {/* Micro-Fragments falling downward */}
            {FRAGMENTS_P1.map((frag) => {
              const fragY = crackH * frag.yRatio;
              const fragX = crackX + frag.xOffset;
              return (
                <motion.polygon
                  key={`frag-1-${frag.id}`}
                  points={`${fragX},${fragY - frag.size} ${fragX + frag.size * 0.8},${fragY + frag.size * 0.5} ${fragX - frag.size * 0.8},${fragY + frag.size * 0.5}`}
                  fill="#151515"
                  stroke="#a31018"
                  strokeWidth="0.5"
                  style={{
                    opacity: useTransform(crackProgress1, (p) => (p > frag.yRatio ? 0.95 : 0)),
                    y: useTransform(crackProgress1, (p) =>
                      p > frag.yRatio ? (p - frag.yRatio) * frag.fallSpeed : 0
                    ),
                    x: useTransform(crackProgress1, (p) =>
                      p > frag.yRatio ? (p - frag.yRatio) * frag.xDrift : 0
                    ),
                    rotate: useTransform(crackProgress1, (p) =>
                      p > frag.yRatio ? (p - frag.yRatio) * frag.rotation : 0
                    ),
                  }}
                />
              );
            })}
          </svg>

          {/* Section Chapter Transition Cue */}
          <div className="project-reveal-chapter-tag">
            <span className="chapter-tag-num">03.1</span>
            <span className="chapter-tag-title">CASE STUDY // DEAD SIGNAL</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          STAGE 2: PROJECT 02 — HALO IN REVERSE / NOVA
          Sequential scroll-driven reveal with matching jagged cracked-wall system
          ============================================================ */}
      <div ref={stage2Ref} className="project-reveal-track">
        <div className="project-reveal-sticky-viewport">
          {/* Deep Crimson & Indigo Cosmic Glow Behind the Wall */}
          <motion.div
            className="project-reveal-crimson-backdrop cosmic-variant"
            style={{
              opacity: shouldReduceMotion ? 0.8 : redGlowOpacity2,
            }}
          />

          {/* PROJECT 02 CARD: EMERGES OUT OF THE CRACK IN 3D */}
          <div className="project-reveal-card-perspective-stage">
            <motion.div
              className="project-reveal-emerging-card-wrap"
              style={{
                opacity: shouldReduceMotion ? 1 : p2CardOpacity,
                transformStyle: 'preserve-3d',
                transformPerspective: 1200,
                z: shouldReduceMotion ? 0 : p2CardTranslateZ,
                rotateX: shouldReduceMotion ? 0 : p2CardRotateX,
                rotateY: shouldReduceMotion ? 0 : p2CardRotateY,
                scale: shouldReduceMotion ? 1 : p2CardScale,
              }}
            >
              <Link
                href="/case-study/album-design"
                className="project-card-link"
                aria-label="Open Case Study 02: Halo in Reverse / Nova Album Design"
              >
                <div className="project-card-inner">
                  {/* Card Media Preview Frame showing pristine vertical presentation */}
                  <div className="project-card-media is-album-presentation">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/album-design-presentation-full.webp"
                      alt="Halo in Reverse — Nova Studio Album Complete Visual Presentation"
                      loading="lazy"
                      className="project-card-img"
                    />
                    <div className="project-card-overlay-sheen" />
                    <span className="project-card-badge">PROJECT // 02</span>
                  </div>

                  {/* Editorial Metadata Bar */}
                  <div className="project-card-info">
                    <div className="project-card-header">
                      <span className="project-card-tag">CASE STUDY [02]</span>
                      <span className="project-card-year">2026</span>
                    </div>

                    <h3 className="project-card-title">HALO IN REVERSE</h3>
                    <p className="project-card-subtitle">
                      NOVA — Album Visual Identity, Translucent Purple Vinyl &amp; Packaging
                    </p>

                    <div className="project-card-action">
                      <span className="project-card-cta">
                        EXPLORE ALBUM CASE STUDY <span className="cta-arrow">➔</span>
                      </span>
                      <span className="project-card-note">CLICK TO READ</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* LEFT WALL PANEL (Clipped by JAGGED crack polygon) */}
          <motion.div
            className="project-wall-panel wall-left-clipped"
            style={{
              clipPath: 'url(#crack-clip-left-2)',
              x: shouldReduceMotion ? 0 : useTransform(wallSeparation2, (v) => -v),
              rotateY: shouldReduceMotion ? 0 : wallRotate2,
              transformOrigin: 'right center',
            }}
          />

          {/* RIGHT WALL PANEL (Clipped by JAGGED crack polygon) */}
          <motion.div
            className="project-wall-panel wall-right-clipped"
            style={{
              clipPath: 'url(#crack-clip-right-2)',
              x: shouldReduceMotion ? 0 : wallSeparation2,
              rotateY: shouldReduceMotion ? 0 : useTransform(wallRotate2, (v) => -v),
              transformOrigin: 'left center',
            }}
          />

          {/* ONE SINGLE CRACK SVG LAYER FOR PROJECT 02 */}
          <svg
            className="project-crack-svg"
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'visible',
              pointerEvents: 'none',
              zIndex: 35,
            }}
          >
            {/* Layer 1 */}
            <motion.path
              d={pathD2}
              fill="none"
              stroke="#8b0d13"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="miter"
              strokeMiterlimit="4"
              opacity="0.5"
              style={{
                pathLength: shouldReduceMotion ? 1 : crackProgress2,
              }}
            />

            {/* Layer 2 */}
            <motion.path
              d={pathD2}
              fill="none"
              stroke="#e50914"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="miter"
              strokeMiterlimit="4"
              filter="url(#fissure-stress-glow)"
              style={{
                pathLength: shouldReduceMotion ? 1 : crackProgress2,
              }}
            />

            {/* Layer 3 */}
            <motion.path
              d={pathD2}
              fill="none"
              stroke="#040404"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="miter"
              strokeMiterlimit="4"
              style={{
                pathLength: shouldReduceMotion ? 1 : crackProgress2,
              }}
            />

            {/* Layer 4 */}
            <motion.path
              d={pathD2}
              fill="none"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="miter"
              strokeDasharray="2 16"
              style={{
                pathLength: shouldReduceMotion ? 1 : crackProgress2,
              }}
            />

            {/* Fragments */}
            {FRAGMENTS_P2.map((frag) => {
              const fragY = crackH * frag.yRatio;
              const fragX = crackX + frag.xOffset;
              return (
                <motion.polygon
                  key={`frag-2-${frag.id}`}
                  points={`${fragX},${fragY - frag.size} ${fragX + frag.size * 0.8},${fragY + frag.size * 0.5} ${fragX - frag.size * 0.8},${fragY + frag.size * 0.5}`}
                  fill="#151515"
                  stroke="#a31018"
                  strokeWidth="0.5"
                  style={{
                    opacity: useTransform(crackProgress2, (p) => (p > frag.yRatio ? 0.95 : 0)),
                    y: useTransform(crackProgress2, (p) =>
                      p > frag.yRatio ? (p - frag.yRatio) * frag.fallSpeed : 0
                    ),
                    x: useTransform(crackProgress2, (p) =>
                      p > frag.yRatio ? (p - frag.yRatio) * frag.xDrift : 0
                    ),
                    rotate: useTransform(crackProgress2, (p) =>
                      p > frag.yRatio ? (p - frag.yRatio) * frag.rotation : 0
                    ),
                  }}
                />
              );
            })}
          </svg>

          {/* Section Chapter Transition Cue */}
          <div className="project-reveal-chapter-tag">
            <span className="chapter-tag-num">03.2</span>
            <span className="chapter-tag-title">CASE STUDY // HALO IN REVERSE</span>
          </div>
        </div>
      </div>
    </section>
  );
}
