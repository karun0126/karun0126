'use client';

import React, { useEffect, useRef } from 'react';

interface ShockwaveRipple {
  el: SVGCircleElement;
  startT: number;
  duration: number;
  startR: number;
  maxR: number;
  initialStroke: number;
}

export default function CursorTrail() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const shockwaveRef = useRef<HTMLDivElement | null>(null);
  const ringsGroupRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    // Only enable on desktop/laptop devices with a fine pointer (mouse or trackpad)
    if (typeof window === 'undefined') return;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isFinePointer || prefersReducedMotion) return;

    const dotEl = dotRef.current;
    const shockwaveEl = shockwaveRef.current;
    const ringsGroupEl = ringsGroupRef.current;
    if (!dotEl || !shockwaveEl || !ringsGroupEl) return;

    // Radius configurations:
    // Base radius: 18px (36px diameter)
    // On hover: 13px (26px diameter) — focused surgical size
    const BASE_RADIUS = 18;
    const BASE_SCALE = 1.0;
    const HOVER_SCALE = 13 / 18; // ~0.722
    const CLICK_SCALE_FACTOR = 0.82;

    let mouse = { x: -200, y: -200 };
    let currentScale = BASE_SCALE;
    let targetScale = BASE_SCALE;

    let hasMoved = false;
    let isMouseInWindow = false;
    let isMouseDown = false;
    let isInteractiveHover = false;
    let rafId: number | null = null;

    // Array to manage active expanding shockwave rings
    const ripples: ShockwaveRipple[] = [];

    let lastHoverTarget: EventTarget | null = null;

    const INTERACTIVE_SELECTOR =
      'a, button, [role="button"], input, textarea, select, label, .hud-capsule, .hud-simple-item, .poster-hotspot, .poster-pendulum-outer, .lightbox-trigger, .interactive, [data-cursor-hover], [data-interactive]';

    const updateHoverTarget = (rawTarget: EventTarget | null) => {
      if (rawTarget === lastHoverTarget) return;
      lastHoverTarget = rawTarget;

      const target = rawTarget instanceof Element ? rawTarget : null;
      if (!target) {
        isInteractiveHover = false;
        targetScale = BASE_SCALE;
        return;
      }

      // Fast check for common interactive tags
      const tag = target.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || tag === 'LABEL') {
        isInteractiveHover = true;
        targetScale = isMouseDown ? HOVER_SCALE * CLICK_SCALE_FACTOR : HOVER_SCALE;
        return;
      }

      // Fast selector search without expensive wildcard style attributes
      const isClickable = typeof target.closest === 'function' && Boolean(target.closest(INTERACTIVE_SELECTOR));
      isInteractiveHover = isClickable;
      targetScale = isInteractiveHover ? HOVER_SCALE : BASE_SCALE;
      if (isMouseDown) targetScale *= CLICK_SCALE_FACTOR;
    };

    const wakeRender = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(render);
      }
    };

    /**
     * Spawns a fast expanding inverted shockwave ring that starts fatter and tapers smaller as it expands
     */
    const triggerShockwave = (x: number, y: number) => {
      // Calculate max radius needed to reach the furthest corner of the viewport
      const maxR = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      ) + 60;

      const ringEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ringEl.setAttribute('cx', x.toFixed(1));
      ringEl.setAttribute('cy', y.toFixed(1));
      ringEl.setAttribute('fill', 'none');
      ringEl.setAttribute('stroke', '#ffffff');

      // Sleek, refined initial stroke width at start (reduced from 48px to 34px)
      const INITIAL_STROKE = 34;
      // Start radius hugs the outside perimeter of the current cursor dot
      const currentRadius = BASE_RADIUS * currentScale;
      const startR = currentRadius + INITIAL_STROKE / 2;

      ringEl.setAttribute('stroke-width', INITIAL_STROKE.toString());
      ringEl.setAttribute('r', startR.toFixed(1));
      ringEl.setAttribute('stroke-opacity', '1');
      ringsGroupEl.appendChild(ringEl);

      ripples.push({
        el: ringEl,
        startT: performance.now(),
        duration: 520, // Snappy & fast expansion across the entire screen
        startR,
        maxR,
        initialStroke: INITIAL_STROKE,
      });

      // Enable the fullscreen shockwave overlay only while ripples are active
      shockwaveEl.style.display = 'block';

      wakeRender();
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      if (!hasMoved) {
        hasMoved = true;
        isMouseInWindow = true;
        dotEl.style.opacity = '1';
      }

      // Zero-latency hardware transform tracking
      dotEl.style.transform = `translate3d(${(mouse.x - BASE_RADIUS).toFixed(1)}px, ${(mouse.y - BASE_RADIUS).toFixed(1)}px, 0) scale(${currentScale.toFixed(3)})`;

      updateHoverTarget(e.target);
      wakeRender();
    };

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      updateHoverTarget(e.target);
      triggerShockwave(e.clientX, e.clientY);
      wakeRender();
    };

    const onMouseUp = (e: MouseEvent) => {
      isMouseDown = false;
      updateHoverTarget(e.target);
      wakeRender();
    };

    const onMouseLeave = () => {
      isMouseInWindow = false;
      dotEl.style.opacity = '0';
    };

    const onMouseEnter = (e: MouseEvent) => {
      isMouseInWindow = true;
      dotEl.style.opacity = '1';
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      hasMoved = true;
      dotEl.style.transform = `translate3d(${(mouse.x - BASE_RADIUS).toFixed(1)}px, ${(mouse.y - BASE_RADIUS).toFixed(1)}px, 0) scale(${currentScale.toFixed(3)})`;
      updateHoverTarget(e.target);
      wakeRender();
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    const render = () => {
      // Pause/hide during full-screen page transitions
      if (document.body.classList.contains('is-transitioning')) {
        dotEl.style.opacity = '0';
        if (shockwaveEl.style.display !== 'none') {
          shockwaveEl.style.display = 'none';
        }
        rafId = requestAnimationFrame(render);
        return;
      } else if (isMouseInWindow && hasMoved) {
        dotEl.style.opacity = '1';
      }

      if (!hasMoved) {
        rafId = null;
        return;
      }

      // Smooth scale interpolation for hover focus and click squish
      currentScale += (targetScale - currentScale) * 0.25;
      dotEl.style.transform = `translate3d(${(mouse.x - BASE_RADIUS).toFixed(1)}px, ${(mouse.y - BASE_RADIUS).toFixed(1)}px, 0) scale(${currentScale.toFixed(3)})`;

      // Animate active shockwave rings
      const now = performance.now();
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        const elapsed = now - rip.startT;
        const progress = Math.min(1, elapsed / rip.duration);

        // Explosive outward burst easing: fast departure, decelerating smoothly
        const ease = 1 - Math.pow(1 - progress, 2.2);
        const r = rip.startR + ease * (rip.maxR - rip.startR);

        // Stroke width starts refined and progressively narrows down as it expands
        const strokeW = Math.max(2.5, rip.initialStroke * Math.pow(1 - progress, 1.35));

        // Smooth fade out near the outer bounds of the screen
        const opacity = progress > 0.8 ? (1 - progress) / 0.2 : 1.0;

        rip.el.setAttribute('r', r.toFixed(1));
        rip.el.setAttribute('stroke-width', strokeW.toFixed(1));
        rip.el.setAttribute('stroke-opacity', opacity.toFixed(2));

        if (progress >= 1) {
          rip.el.remove();
          ripples.splice(i, 1);
        }
      }

      // Turn off fullscreen shockwave overlay when no ripples are active (eliminates GPU load completely)
      if (ripples.length === 0) {
        shockwaveEl.style.display = 'none';
      }

      // Auto-sleep RAF when stationary and no ripples active
      if (ripples.length === 0 && Math.abs(currentScale - targetScale) < 0.005) {
        currentScale = targetScale;
        dotEl.style.transform = `translate3d(${(mouse.x - BASE_RADIUS).toFixed(1)}px, ${(mouse.y - BASE_RADIUS).toFixed(1)}px, 0) scale(${currentScale.toFixed(3)})`;
        rafId = null;
        return;
      }

      rafId = requestAnimationFrame(render);
    };

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (rafId !== null) cancelAnimationFrame(rafId);
      for (const rip of ripples) {
        rip.el.remove();
      }
      ripples.length = 0;
    };
  }, []);

  return (
    <>
      {/* 1. Resting Inverted Circle: Lightweight 36px hardware-accelerated GPU layer with zero overhead */}
      <div
        ref={dotRef}
        id="cursor-dot-bw"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backdropFilter: 'invert(1) grayscale(1)',
          WebkitBackdropFilter: 'invert(1) grayscale(1)',
          zIndex: 99999,
          pointerEvents: 'none',
          opacity: 0,
          transformOrigin: 'center center',
          transform: 'translate3d(-100px, -100px, 0)',
          willChange: 'transform',
          contain: 'layout paint size',
          transition: 'opacity 0.22s ease-out',
        }}
      />

      {/* 2. SVG Mask for Shockwave Rings */}
      <svg
        id="cursor-shockwave-svg-defs"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <defs>
          <mask id="cursor-shockwave-mask">
            <g ref={ringsGroupRef} />
          </mask>
        </defs>
      </svg>

      {/* 3. Fullscreen Shockwave Overlay: ONLY displayed when ripples are actively expanding */}
      <div
        ref={shockwaveRef}
        id="cursor-shockwave-bw"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backdropFilter: 'invert(1) grayscale(1)',
          WebkitBackdropFilter: 'invert(1) grayscale(1)',
          mask: 'url(#cursor-shockwave-mask)',
          WebkitMask: 'url(#cursor-shockwave-mask)',
          zIndex: 99998,
          pointerEvents: 'none',
          display: 'none',
        }}
      />
    </>
  );
}
