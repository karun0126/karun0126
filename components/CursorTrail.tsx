'use client';

import React, { useEffect, useRef } from 'react';
import lumData from '@/lum-bits.json';

interface Point {
  x: number;
  y: number;
}

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Only enable on desktop/laptops with a mouse or trackpad
    if (typeof window === 'undefined') return;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isFinePointer || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Physics Nodes
    // 16 snappy, critically-damped nodes guarantee zero delay and zero rubber-banding
    const NUM_NODES = 16;
    const nodes: Point[] = Array.from({ length: NUM_NODES }, () => ({ x: -100, y: -100 }));
    let mouse: Point = { x: -100, y: -100 };
    let hasMoved = false;
    let isMouseInWindow = false;
    let rafId: number | null = null;

    // Dynamic color adaptation:
    // 0.0 = greyish-black ink (on light cream paper), 1.0 = crimson red (on black/dark colors)
    let currentRedMix = 1.0;

    const { aboutBits, heroBits, postersBits } = lumData;

    // High-precision background luminance detection under cursor
    const isDarkAt = (clientX: number, clientY: number): boolean => {
      // 1. Check if a dark modal or lightbox is open
      if (document.querySelector('.lightbox-backdrop, [role="dialog"], .modal-open')) {
        return true;
      }

      // 2. Check DOM elements directly under pointer (e.g. HUD nav, dark buttons)
      const el = document.elementFromPoint(clientX, clientY);
      if (el) {
        if (el.closest('.hud-nav, .back-to-top, .hero-hand-group, #lightbox-modal')) {
          return true;
        }
      }

      // 3. Section checks
      const caseStudy = document.getElementById('case-study');
      if (caseStudy) {
        const rect = caseStudy.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) return true;
      }

      const sketchbook = document.getElementById('sketchbook');
      if (sketchbook) {
        const rect = sketchbook.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) return true;
      }

      const footer = document.querySelector('footer');
      if (footer) {
        const rect = footer.getBoundingClientRect();
        if (clientY >= rect.top) return true;
      }

      // 4. Detailed bitmask lookup for collage sections
      const about = document.getElementById('about');
      if (about) {
        const rect = about.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) {
          const u = Math.max(0, Math.min(31, Math.floor(((clientX - rect.left) / rect.width) * 32)));
          const v = Math.max(0, Math.min(17, Math.floor(((clientY - rect.top) / rect.height) * 18)));
          return aboutBits[v * 32 + u] === '1';
        }
      }

      const posters = document.getElementById('posters');
      if (posters) {
        const rect = posters.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) {
          const u = Math.max(0, Math.min(31, Math.floor(((clientX - rect.left) / rect.width) * 32)));
          const v = Math.max(0, Math.min(35, Math.floor(((clientY - rect.top) / rect.height) * 36)));
          return postersBits[v * 32 + u] === '1';
        }
      }

      const hero = document.getElementById('hero');
      if (hero) {
        const rect = hero.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) {
          const u = Math.max(0, Math.min(31, Math.floor(((clientX - rect.left) / rect.width) * 32)));
          const v = Math.max(0, Math.min(17, Math.floor(((clientY - rect.top) / rect.height) * 18)));
          return heroBits[v * 32 + u] === '1';
        }
      }

      return true;
    };

    // Chaikin corner-cutting smoothing algorithm:
    // Transforms any polygonal sequence into a mathematical, continuous C1 curve
    const chaikinSmooth = (pts: Point[]): Point[] => {
      if (pts.length < 3) return pts;
      const res: Point[] = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        res.push({
          x: 0.75 * p0.x + 0.25 * p1.x,
          y: 0.75 * p0.y + 0.25 * p1.y,
        });
        res.push({
          x: 0.25 * p0.x + 0.75 * p1.x,
          y: 0.25 * p0.y + 0.75 * p1.y,
        });
      }
      res.push(pts[pts.length - 1]);
      return res;
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      if (!hasMoved) {
        hasMoved = true;
        isMouseInWindow = true;
        for (let i = 0; i < NUM_NODES; i++) {
          nodes[i].x = mouse.x;
          nodes[i].y = mouse.y;
        }
      } else {
        isMouseInWindow = true;
        // ZERO DELAY: Lock the head of the tail directly to the cursor position!
        nodes[0].x = mouse.x;
        nodes[0].y = mouse.y;
      }

      if (rafId === null) {
        rafId = requestAnimationFrame(render);
      }
    };

    const onMouseLeave = () => {
      isMouseInWindow = false;
    };

    const onMouseEnter = (e: MouseEvent) => {
      isMouseInWindow = true;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!hasMoved) {
        hasMoved = true;
        for (let i = 0; i < NUM_NODES; i++) {
          nodes[i].x = mouse.x;
          nodes[i].y = mouse.y;
        }
      } else {
        nodes[0].x = mouse.x;
        nodes[0].y = mouse.y;
      }
      if (rafId === null) {
        rafId = requestAnimationFrame(render);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (!hasMoved) {
        rafId = null;
        return;
      }

      // ZERO DELAY: Node 0 stays pinned directly to cursor pointer
      nodes[0].x = mouse.x;
      nodes[0].y = mouse.y;

      // Trailing nodes follow with responsive progressive lerp (0.72 down to 0.54)
      let totalDist = 0;
      for (let i = 1; i < NUM_NODES; i++) {
        const ease = 0.72 - (i / NUM_NODES) * 0.18;
        const dx = nodes[i - 1].x - nodes[i].x;
        const dy = nodes[i - 1].y - nodes[i].y;
        nodes[i].x += dx * ease;
        nodes[i].y += dy * ease;
        totalDist += Math.hypot(dx, dy);
      }

      // Detect background color under cursor:
      // Red on black/dark void, Greyish-Black on cream paper
      const targetRed = isDarkAt(mouse.x, mouse.y) ? 1.0 : 0.0;
      currentRedMix += (targetRed - currentRedMix) * 0.18;

      // If trail has fully gathered at cursor, shut down render loop to save CPU
      if (totalDist < 0.5) {
        rafId = null;
        return;
      }

      // Apply Chaikin smoothing to ensure 100% rounded curves with zero sharp edges
      const smoothed = chaikinSmooth(nodes);

      // Calculate arc-length distances along smoothed spline
      const dists: number[] = [0];
      for (let i = 1; i < smoothed.length; i++) {
        const d = Math.hypot(
          smoothed[i].x - smoothed[i - 1].x,
          smoothed[i].y - smoothed[i - 1].y
        );
        dists.push(dists[i - 1] + d);
      }
      const totalLen = dists[dists.length - 1];

      if (totalLen >= 1.0) {
        // Slender, refined brush stroke radius (reduced width per user request)
        const BASE_RADIUS = 2.8; 
        const step = 1.4;        // Dense sampling step in pixels for silky continuity
        let currIdx = 0;

        // Sample points along the spline
        const samples: { x: number; y: number; r: number }[] = [];

        for (let d = 0; d <= totalLen; d += step) {
          while (currIdx < dists.length - 1 && dists[currIdx + 1] < d) {
            currIdx++;
          }
          const segStart = dists[currIdx];
          const segEnd = dists[currIdx + 1];
          const segT = (d - segStart) / (segEnd - segStart || 1);
          const x = smoothed[currIdx].x + (smoothed[currIdx + 1].x - smoothed[currIdx].x) * segT;
          const y = smoothed[currIdx].y + (smoothed[currIdx + 1].y - smoothed[currIdx].y) * segT;

          const t = d / totalLen; // 0 at cursor, 1 at tail tip
          // Taper radius smoothly from 2.8px down to 0.28px
          const r = Math.max(0.28, BASE_RADIUS * Math.pow(1 - t, 1.25));

          samples.push({ x, y, r });
        }

        // Color interpolation:
        // redMix = 0.0 -> Greyish Black (35, 35, 35) on cream paper
        // redMix = 1.0 -> Signature Crimson Red (230, 20, 25) on black colors
        const rVal = Math.round(35 + 195 * currentRedMix);
        const gVal = Math.round(35 - 15 * currentRedMix);
        const bVal = Math.round(35 - 10 * currentRedMix);

        // Pass 1: Subtle aura/shadow
        // On black: delicate crimson glow. On paper: subtle soft ink definition.
        if (currentRedMix > 0.1) {
          ctx.fillStyle = `rgba(230, 20, 25, ${(0.22 * currentRedMix).toFixed(2)})`;
          ctx.beginPath();
          for (let i = 0; i < samples.length; i++) {
            const s = samples[i];
            const shadowRRadius = s.r + 1.2;
            ctx.moveTo(s.x + shadowRRadius, s.y + 0.8);
            ctx.arc(s.x, s.y + 0.8, shadowRRadius, 0, Math.PI * 2);
          }
          ctx.fill();
        }

        // Pass 2: Main Tapered Stroke
        // Grouped by opacity levels to create a buttery smooth gradient without bead artifacts
        const opacityGroups = [
          { minT: 0.0, maxT: 0.55, alpha: 0.98 },
          { minT: 0.55, maxT: 0.75, alpha: 0.80 },
          { minT: 0.75, maxT: 0.90, alpha: 0.50 },
          { minT: 0.90, maxT: 1.01, alpha: 0.22 },
        ];

        for (const group of opacityGroups) {
          ctx.fillStyle = `rgba(${rVal}, ${gVal}, ${bVal}, ${group.alpha})`;
          ctx.beginPath();
          const startIdx = Math.floor(group.minT * (samples.length - 1));
          const endIdx = Math.min(samples.length - 1, Math.floor(group.maxT * (samples.length - 1)));

          for (let i = startIdx; i <= endIdx; i++) {
            const s = samples[i];
            ctx.moveTo(s.x + s.r, s.y);
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          }
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(render);
    };

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="cursor-canvas"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    />
  );
}
