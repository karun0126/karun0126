'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';
import Stage from './Stage';
import particlesData from '@/data/about-particles.json';

// Preload ink layer as early as possible
if (typeof window !== 'undefined') {
  const preloadImg = new Image();
  preloadImg.src = '/images/about-text-ink.png';
}

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inkImgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Scroll tracking for the rolling star
  const { scrollY } = useScroll();
  const rawRotate = useTransform(scrollY, (y) => (shouldReduceMotion ? 0 : y * 0.45));
  const rotate = useSpring(rawRotate, {
    stiffness: 140,
    damping: 24,
    mass: 0.15,
  });

  // Scroll tracking for ink particles reveal:
  // Starts a little earlier as user scrolls toward About ('start 105%')
  // Fully appears when the full page comes on screen ('start start')
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 105%', 'start start'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    mass: 0.08,
    restDelta: 0.001,
  });

  // Render particle ink reveal frame onto the 1400x1420 retina canvas
  const renderFrame = useCallback(
    (prog: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = 1400;
      const h = 1420;

      ctx.clearRect(0, 0, w, h);

      // If motion reduced or scrolled to full view (98%+), show exact sharp typography
      if (shouldReduceMotion || prog >= 0.98) {
        if (inkImgRef.current) {
          ctx.drawImage(inkImgRef.current, 0, 0, w, h);
        }
        return;
      }

      // When barely entering (<= 1%), canvas is clean
      if (prog <= 0.01) {
        return;
      }

      // Draw particle mask
      ctx.save();
      ctx.beginPath();

      const spreadWindow = 0.22;
      const count = particlesData.length;

      for (let i = 0; i < count; i++) {
        const pt = particlesData[i];
        const birth = pt[2];
        if (birth > prog) break; // Sorted by birth for maximum performance

        const progressSinceBirth = (prog - birth) / spreadWindow;
        const t = Math.min(1, Math.max(0, progressSinceBirth));
        // Dot starts as tiny speck (~1px) and spreads organically to maxR
        const r = 1.0 + (pt[3] - 1.0) * Math.sqrt(t);

        ctx.moveTo(pt[0] + r, pt[1]);
        ctx.arc(pt[0], pt[1], r, 0, Math.PI * 2);
      }

      ctx.fillStyle = '#000000';
      ctx.fill();

      // Composite with existing text so dots reveal the exact original text & colors
      if (inkImgRef.current) {
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(inkImgRef.current, 0, 0, w, h);
      }

      ctx.restore();

      // Subtle blend in final phase (0.88 - 0.98) to smoothly resolve into 100% sharp typography
      if (prog > 0.88 && inkImgRef.current) {
        ctx.save();
        ctx.globalAlpha = (prog - 0.88) / 0.10;
        ctx.drawImage(inkImgRef.current, 0, 0, w, h);
        ctx.restore();
      }
    },
    [shouldReduceMotion]
  );

  // Load ink image
  useEffect(() => {
    const img = new Image();
    img.src = '/images/about-text-ink.png';
    if (img.complete) {
      inkImgRef.current = img;
      setImgLoaded(true);
      renderFrame(smoothProgress.get());
    } else {
      img.onload = () => {
        inkImgRef.current = img;
        setImgLoaded(true);
        renderFrame(smoothProgress.get());
      };
    }
  }, [renderFrame, smoothProgress]);

  // Connect scroll updates to 60fps render
  useEffect(() => {
    if (!imgLoaded) return;

    let rafId: number | null = null;
    let latestProg = smoothProgress.get();

    // Initial render
    renderFrame(latestProg);

    const unsubscribe = smoothProgress.on('change', (val) => {
      latestProg = Math.min(1, Math.max(0, val));
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          renderFrame(latestProg);
        });
      }
    });

    return () => {
      unsubscribe();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [imgLoaded, smoothProgress, renderFrame]);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="slide-frame"
      aria-label="About Me Section"
    >
      <Stage baseHeight={1080}>
        {/* Clean Paper Base Layer with Torn Edge and Right-Side Collage */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="stage-img"
          src="/images/about-bg-clean.png"
          alt="About Me — collage with torn paper, vintage film strips, bio, tools and what I do"
          loading="eager"
        />

        {/* Dynamic Ink Density Particles Canvas revealing the exact text on scroll */}
        <canvas
          ref={canvasRef}
          width={1400}
          height={1420}
          className="about-ink-canvas"
          aria-hidden="true"
        />

        {/* Rolling Star attached right below the hanging white line */}
        <motion.img
          className="about-rolling-star"
          src="/images/about-star.png"
          alt=""
          aria-hidden="true"
          style={{ rotate }}
        />

        {/* Screen-reader accessible semantic content */}
        <div className="sr-only">
          <h2>01 ABOUT ME</h2>
          <p>
            I&apos;m Karun – a graphic designer and traditional artist.
            Creating since I was 14, I&apos;ve grown through both paper and pixels,
            blending traditional art with digital design. I create visuals that
            tell stories, evoke emotions, and leave a lasting impression.
          </p>

          <h3>Tools I Use</h3>
          <ul>
            <li>Adobe Photoshop</li>
            <li>Adobe Illustrator</li>
            <li>Figma</li>
            <li>Adobe After Effects</li>
            <li>Adobe Premiere Pro</li>
            <li>DaVinci Resolve</li>
          </ul>

          <h3>What I Do</h3>
          <ul>
            <li>Social Media Design</li>
            <li>Poster Design</li>
            <li>Banner Design</li>
            <li>Brand Identity</li>
            <li>Packaging Design</li>
            <li>Logo Design</li>
            <li>Visual Storytelling</li>
          </ul>

          <blockquote>
            Every image tells a story. Every story leaves a mark.
          </blockquote>
        </div>
      </Stage>
    </section>
  );
}
