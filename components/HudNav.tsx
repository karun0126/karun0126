'use client';

import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NavItemDef {
  id: string;
  num: string;
  title: string;
  label: string;
  short: string;
  restLen: number;    // Slightly varied resting rope length
  restAngle: number;  // Natural resting angle in radians (subtle rotation)
  knot1Ratio: number; // Ratio down the cord for upper knot
  knot2Ratio: number; // Ratio down the cord for lower knot
}

const NAV_ITEMS: NavItemDef[] = [
  {
    id: 'hero',
    num: '00',
    title: 'Home',
    label: '00 Home',
    short: 'Home',
    restLen: 38,
    restAngle: 0,
    knot1Ratio: 0.35,
    knot2Ratio: 0.70,
  },
  {
    id: 'about',
    num: '01',
    title: 'About',
    label: '01 About',
    short: 'About',
    restLen: 46,
    restAngle: 0,
    knot1Ratio: 0.32,
    knot2Ratio: 0.67,
  },
  {
    id: 'posters',
    num: '02',
    title: 'Posters',
    label: '02 Posters',
    short: 'Posters',
    restLen: 40,
    restAngle: 0,
    knot1Ratio: 0.38,
    knot2Ratio: 0.72,
  },
  {
    id: 'case-study',
    num: '03',
    title: 'Case Study',
    label: '03 Case Study',
    short: 'Case Study',
    restLen: 48,
    restAngle: 0,
    knot1Ratio: 0.32,
    knot2Ratio: 0.68,
  },
  {
    id: 'sketchbook',
    num: '04',
    title: 'Sketchbook',
    label: '04 Sketchbook',
    short: 'Sketches',
    restLen: 42,
    restAngle: 0,
    knot1Ratio: 0.36,
    knot2Ratio: 0.70,
  },
];

interface PhysicsNode {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
}

interface ItemPhysics {
  id: string;
  anchorX: number;
  anchorY: number;
  restLength: number;
  restAngle: number;
  nodes: PhysicsNode[]; // 4 nodes: 0 (anchor), 1 (upper knot), 2 (lower knot), 3 (capsule top)
  seg0: number; // Anchor -> knot1
  seg1: number; // Knot1 -> knot2
  seg2: number; // Knot2 -> capsule
  angle: number;
  angularVelocity: number;
  swayFreq: number;
  swayPhase: number;
  swayAmp: number;
  capsuleWidth: number;
  capsuleHeight: number;
}

/**
 * Handmade Knots Vector Graphics
 */
function RopeKnotSVG({
  type,
  isActive,
}: {
  type: 'anchor' | 'intermediate' | 'capsule';
  isActive?: boolean;
}) {
  if (type === 'anchor') {
    // Knot looping around the mounting rail eyelet with tiny tail
    return (
      <g>
        <ellipse cx="0" cy="1" rx="4.8" ry="3.2" fill="rgba(0,0,0,0.6)" filter="blur(1px)" />
        {/* Rear loop */}
        <path
          d="M -4.2 -1.5 C -3.8 -3.8, 3.8 -2.8, 4.2 0.5 C 4.6 2.6, -3.2 3.6, -4.2 1.5 Z"
          fill="#63070d"
          stroke="#380205"
          strokeWidth="0.6"
        />
        {/* Front wrap loop */}
        <path
          d="M -3.5 -0.8 C -1.2 -2.5, 2.8 -1.5, 3.5 1.2 C 1.6 2.8, -1.8 2.2, -3.5 -0.8 Z"
          fill="#a31018"
          stroke="#e50914"
          strokeWidth="0.5"
        />
        {/* Fiber highlight ridge */}
        <path
          d="M -2.2 -0.8 Q 0.5 -1.6 2.4 0.8"
          fill="none"
          stroke="#ff545e"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        {/* Small hanging cord tail */}
        <path
          d="M 1.8 1.5 Q 3.8 4.2 2.8 6.5"
          fill="none"
          stroke="#a31018"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M 2.2 2 Q 4.0 4.4 3.1 6.5"
          fill="none"
          stroke="#ff545e"
          strokeWidth="0.6"
          strokeLinecap="round"
          opacity="0.8"
        />
      </g>
    );
  }

  if (type === 'capsule') {
    // Hangman/tag cinch knot sitting directly above the capsule eyelet with loop threading through
    return (
      <g>
        <ellipse cx="0" cy="-4" rx="4.8" ry="3.5" fill="rgba(0,0,0,0.6)" filter="blur(1px)" />
        {/* Cinch body */}
        <rect
          x="-4"
          y="-7.5"
          width="8"
          height="6.5"
          rx="2.8"
          fill="#63070d"
          stroke="#380205"
          strokeWidth="0.6"
        />
        {/* Wrap coils */}
        <line x1="-3.2" y1="-6.0" x2="3.2" y2="-6.0" stroke="#a31018" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="-3.5" y1="-4.2" x2="3.5" y2="-4.2" stroke="#c9141f" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="-3.2" y1="-2.4" x2="3.2" y2="-2.4" stroke="#a31018" strokeWidth="1.3" strokeLinecap="round" />
        {/* Highlight sheen */}
        <line x1="-2.0" y1="-6.0" x2="1.5" y2="-6.0" stroke="#ff545e" strokeWidth="0.75" strokeLinecap="round" />
        <line x1="-2.2" y1="-4.2" x2="1.6" y2="-4.2" stroke="#ff545e" strokeWidth="0.8" strokeLinecap="round" />
        {/* Loop threading cleanly through the capsule grommet hole at (0, 0) */}
        <path
          d="M -1.8 -1.2 Q 0 1.6 1.8 -1.2"
          fill="none"
          stroke="#e50914"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    );
  }

  // Intermediate handmade knot
  return (
    <g>
      <ellipse cx="0" cy="0.8" rx="4.4" ry="3" fill="rgba(0,0,0,0.55)" filter="blur(1px)" />
      {/* Base knot bulge */}
      <ellipse cx="0" cy="0" rx="3.8" ry="2.8" fill="#63070d" stroke="#380205" strokeWidth="0.5" />
      {/* Diagonal crossover strand */}
      <path
        d="M -3.0 1.8 C -1.0 -1.5, 1.0 -1.5, 3.0 -1.8"
        fill="none"
        stroke="#a31018"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M -1.8 1.5 C -0.5 -1.2, 0.8 -1.2, 2.0 -1.5"
        fill="none"
        stroke="#ff545e"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      {/* Reverse tuck */}
      <path
        d="M -2.4 -1.6 Q 0 0.8 2.4 1.6"
        fill="none"
        stroke="#c9141f"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.9"
      />
    </g>
  );
}

export default function HudNav() {
  const [activeId, setActiveId] = useState<string>('hero');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHangingMode, setIsHangingMode] = useState<boolean>(false);
  const isHangingModeRef = useRef<boolean>(false);
  const dropAnimRef = useRef<{
    isHanging: boolean;
    dropStartTime: number;
    retractStartTime: number;
  }>({
    isHanging: false,
    dropStartTime: 0,
    retractStartTime: 0,
  });

  const isManualScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Shell container and layout state
  const containerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [railWidth, setRailWidth] = useState<number>(640);
  const [containerHeight, setContainerHeight] = useState<number>(145);
  const [anchorCoords, setAnchorCoords] = useState<{ x: number; y: number }[]>([]);

  // DOM node references for 60fps direct updates without React re-render spikes
  const capsuleRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const ropePathRefs = useRef<{
    shadow: SVGPathElement | null;
    core: SVGPathElement | null;
    main: SVGPathElement | null;
    braid: SVGPathElement | null;
  }[]>([]);
  const knotRefs = useRef<{
    top: SVGGElement | null;
    knot1: SVGGElement | null;
    knot2: SVGGElement | null;
    btm: SVGGElement | null;
  }[]>([]);

  // Physics state ref (Verlet particles + springs + damping + sway)
  const itemsPhysicsRef = useRef<ItemPhysics[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPointerTimeRef = useRef<number>(performance.now());

  /* ─────────────────────────────────────────────────────────────
     1. Robust Active Section Detection via Viewport Focal Line
     ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    let ticking = false;

    const updateActiveSectionAndMode = () => {
      const scrollY = window.scrollY;

      // Mode detection with hysteresis
      // Trigger drop down when approaching Section 2 (About)
      const aboutEl = document.getElementById('about');
      let dropThreshold = 280;
      if (aboutEl) {
        dropThreshold = Math.min(aboutEl.offsetTop - window.innerHeight * 0.72, window.innerHeight * 0.38);
      }
      dropThreshold = Math.max(180, dropThreshold);

      if (scrollY > dropThreshold) {
        if (!isHangingModeRef.current) {
          isHangingModeRef.current = true;
          dropAnimRef.current.isHanging = true;
          dropAnimRef.current.dropStartTime = performance.now();
          dropAnimRef.current.retractStartTime = 0;
          setIsHangingMode(true);
        }
      } else if (scrollY < dropThreshold - 75) {
        if (isHangingModeRef.current) {
          isHangingModeRef.current = false;
          dropAnimRef.current.isHanging = false;
          dropAnimRef.current.retractStartTime = performance.now();
          dropAnimRef.current.dropStartTime = 0;
          setIsHangingMode(false);
        }
      }

      // Active Section Spy
      if (scrollY < 100) {
        setActiveId('hero');
        return;
      }

      const windowHeight = window.innerHeight;
      const scrollPosition = scrollY + windowHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (docHeight - scrollPosition < 80) {
        setActiveId(NAV_ITEMS[NAV_ITEMS.length - 1].id);
        return;
      }

      const focalLine = windowHeight * 0.35;

      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= focalLine && rect.bottom > focalLine) {
          setActiveId(item.id);
          return;
        }
      }

      let closestId = NAV_ITEMS[0].id;
      let minDistance = Infinity;
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - focalLine);
        if (dist < minDistance) {
          minDistance = dist;
          closestId = item.id;
        }
      }
      setActiveId(closestId);
    };

    const handleScroll = () => {
      if (isManualScrollRef.current) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveSectionAndMode();
          ticking = false;
        });
        ticking = true;
      }
    };

    updateActiveSectionAndMode();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    const handleUserInteraction = () => {
      if (isManualScrollRef.current) {
        isManualScrollRef.current = false;
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = null;
        }
      }
    };

    window.addEventListener('wheel', handleUserInteraction, { passive: true });
    window.addEventListener('touchmove', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      window.removeEventListener('wheel', handleUserInteraction);
      window.removeEventListener('touchmove', handleUserInteraction);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  // Close mobile drawer on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  /* ─────────────────────────────────────────────────────────────
     2. Layout Measurement & Physics System Initialization
     ───────────────────────────────────────────────────────────── */
  const initializePhysics = useCallback(() => {
    if (!containerRef.current) return;

    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const isTablet = windowWidth < 1024 && windowWidth >= 768;

    // Symmetrical, perfectly balanced anchor spacing architecture
    const spacing = isTablet ? 108 : 132;
    const margin = isTablet ? 40 : 61;
    const computedRailW = (NAV_ITEMS.length - 1) * spacing + 2 * margin; // 4 * 132 + 122 = 650px
    setRailWidth(computedRailW);

    const anchorY = 46; // Bottom mounting rail edge (rail height is 46px)

    // Measure capsule widths or provide comfortable defaults
    const widths: number[] = NAV_ITEMS.map((_, i) => {
      const el = capsuleRefs.current[i];
      return el && el.offsetWidth > 0 ? el.offsetWidth : (isTablet ? 96 : 116);
    });

    const newAnchors: { x: number; y: number }[] = [];
    const newItems: ItemPhysics[] = [];

    NAV_ITEMS.forEach((def, i) => {
      const capW = widths[i];
      const capH = isTablet ? 30 : 36;
      // Anchor grommet position: EXACTLY margin + i * spacing
      // Symmetrically spaced: Grommet 2 (02 POSTERS) is at the exact center (325px) right below KRXN!
      const anchorX = margin + i * spacing;

      newAnchors.push({ x: anchorX, y: anchorY });

      const restLen = isTablet ? Math.round(def.restLen * 0.8) : def.restLen;
      const seg0 = restLen * def.knot1Ratio;
      const seg1 = restLen * (def.knot2Ratio - def.knot1Ratio);
      const seg2 = restLen * (1 - def.knot2Ratio);

      // Create 4 nodes: anchor, knot1, knot2, capsule attachment
      const n0 = { x: anchorX, y: anchorY, oldX: anchorX, oldY: anchorY };
      const n1 = { x: anchorX, y: anchorY + seg0, oldX: anchorX, oldY: anchorY + seg0 };
      const n2 = { x: anchorX, y: anchorY + seg0 + seg1, oldX: anchorX, oldY: anchorY + seg0 + seg1 };
      const n3 = { x: anchorX, y: anchorY + restLen, oldX: anchorX, oldY: anchorY + restLen };

      newItems.push({
        id: def.id,
        anchorX,
        anchorY,
        restLength: restLen,
        restAngle: 0,
        nodes: [n0, n1, n2, n3],
        seg0,
        seg1,
        seg2,
        angle: 0,
        angularVelocity: 0,
        swayFreq: 0.6 + i * 0.1,
        swayPhase: i * 1.1,
        swayAmp: 0.05, // Subtle organic micro-movement, never distracting
        capsuleWidth: capW,
        capsuleHeight: capH,
      });
    });

    setAnchorCoords(newAnchors);
    itemsPhysicsRef.current = newItems;

    // Total container height accommodates longest rope + capsule + margin
    const maxRopeLen = Math.max(...newItems.map((item) => item.restLength));
    setContainerHeight(anchorY + maxRopeLen + 55);
  }, []);

  useLayoutEffect(() => {
    initializePhysics();
    // Initial mode detection
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const aboutEl = typeof document !== 'undefined' ? document.getElementById('about') : null;
    const dropThreshold = aboutEl ? Math.min(aboutEl.offsetTop - (window.innerHeight || 800) * 0.72, (window.innerHeight || 800) * 0.38) : 280;
    const initialHanging = scrollY > Math.max(180, dropThreshold);
    isHangingModeRef.current = initialHanging;
    dropAnimRef.current.isHanging = initialHanging;
    setIsHangingMode(initialHanging);

    // Pre-position capsules
    itemsPhysicsRef.current.forEach((item, i) => {
      const capEl = capsuleRefs.current[i];
      if (capEl) {
        capEl.style.transform = `translate3d(${item.nodes[3].x.toFixed(2)}px, ${item.nodes[3].y.toFixed(2)}px, 0) rotate(0deg) translate(-50%, 0)`;
        capEl.style.opacity = initialHanging ? '1' : '0';
        capEl.style.pointerEvents = initialHanging ? 'auto' : 'none';
      }
    });
    const handleResize = () => {
      initializePhysics();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initializePhysics]);

  /* ─────────────────────────────────────────────────────────────
     3. Performant 60FPS Verlet Rope Physics Simulation Loop
     ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = (now: number) => {
      const elapsedMs = now - lastTimeRef.current;
      lastTimeRef.current = now;
      const dt = Math.min(32, Math.max(8, elapsedMs)) / 16.666;
      const timeSec = now * 0.001;

      const damping = 0.90; // Higher damping to settle quickly
      const gravity = 0.48 * dt;
      const springRot = 0.16; // Restores upright orientation firmly
      const dampingRot = 0.82; // Stops oscillation rapidly

      itemsPhysicsRef.current.forEach((item, i) => {
        // Drop progress with elastic tension bounce
        let progress = 1.0;
        if (dropAnimRef.current.isHanging) {
          if (dropAnimRef.current.dropStartTime > 0) {
            const delay = [0.08, 0.04, 0.0, 0.04, 0.08][i];
            const t = (now - dropAnimRef.current.dropStartTime) / 1000 - delay;
            if (t < 0) {
              progress = 0;
            } else if (t <= 0.32) {
              const norm = t / 0.32;
              progress = norm * norm;
            } else {
              const tau = t - 0.32;
              if (tau > 0.92) {
                progress = 1.0;
              } else {
                const decay = Math.exp(-5.2 * tau);
                const bounce = Math.sin(16.0 * tau);
                progress = 1.0 + 0.22 * decay * bounce;
              }
            }
          } else {
            progress = 1.0;
          }
        } else {
          if (dropAnimRef.current.retractStartTime > 0) {
            const t = (now - dropAnimRef.current.retractStartTime) / 1000;
            if (t <= 0.28) {
              progress = Math.max(0, 1 - Math.pow(t / 0.28, 2.2));
            } else {
              progress = 0;
            }
          } else {
            progress = 0;
          }
        }

        const def = NAV_ITEMS[i];
        const currentRestLen = item.restLength * progress;

        // Fixed anchor
        item.nodes[0].x = item.anchorX;
        item.nodes[0].y = item.anchorY;

        // Nodes y position based on progress
        item.nodes[1].y = item.anchorY + currentRestLen * def.knot1Ratio;
        item.nodes[2].y = item.anchorY + currentRestLen * def.knot2Ratio;
        item.nodes[3].y = item.anchorY + currentRestLen;

        // Subtle horizontal sway when extended
        if (!prefersReducedMotion && progress > 0.4) {
          const idleForceX = Math.sin(timeSec * item.swayFreq + item.swayPhase) * item.swayAmp;
          const swayOffset = Math.sin(timeSec * item.swayFreq + item.swayPhase) * item.swayAmp * (item.restLength / 45);
          item.nodes[3].x = Math.max(item.anchorX - 7, Math.min(item.anchorX + 7, item.anchorX + swayOffset));
          item.nodes[2].x = Math.max(item.anchorX - 4.5, Math.min(item.anchorX + 4.5, item.anchorX + swayOffset * 0.65));
          item.nodes[1].x = Math.max(item.anchorX - 2.5, Math.min(item.anchorX + 2.5, item.anchorX + swayOffset * 0.35));

          // Capsule inertia & rotational spring
          const ropeAngle = Math.atan2(item.nodes[3].x - item.nodes[0].x, item.nodes[3].y - item.nodes[0].y);
          const targetAngle = ropeAngle * 0.4;
          const torque = (targetAngle - item.angle) * springRot;
          item.angularVelocity = (item.angularVelocity + torque) * dampingRot;
          item.angle += item.angularVelocity;
          item.angle = Math.max(-0.022, Math.min(0.022, item.angle));
        } else {
          item.nodes[1].x = item.anchorX;
          item.nodes[2].x = item.anchorX;
          item.nodes[3].x = item.anchorX;
          item.angle = 0;
        }

        // GPU DOM update for Capsule Tag
        const capEl = capsuleRefs.current[i];
        if (capEl) {
          const capY = item.nodes[3].y;
          const deg = (item.angle * 180) / Math.PI;
          const isVisible = progress > 0.05;
          capEl.style.opacity = isVisible ? Math.min(1, Math.max(0, progress * 3 - 0.15)).toFixed(3) : '0';
          capEl.style.pointerEvents = progress > 0.85 ? 'auto' : 'none';
          capEl.style.transform = `translate3d(${item.nodes[3].x.toFixed(2)}px, ${capY.toFixed(2)}px, 0) rotate(${deg.toFixed(2)}deg) translate(-50%, 0)`;
        }

        // Smooth Rope SVG Curve Update
        const p0 = item.nodes[0];
        const p1 = item.nodes[1];
        const p2 = item.nodes[2];
        const p3 = item.nodes[3];

        const mid12x = (p1.x + p2.x) * 0.5;
        const mid12y = (p1.y + p2.y) * 0.5;
        const pathD = `M ${p0.x.toFixed(1)},${p0.y.toFixed(1)} Q ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${mid12x.toFixed(1)},${mid12y.toFixed(1)} Q ${p2.x.toFixed(1)},${p2.y.toFixed(1)} ${p3.x.toFixed(1)},${p3.y.toFixed(1)}`;

        const ropeOpacity = progress > 0.05 ? Math.min(1, Math.max(0, progress * 3)).toFixed(3) : '0';
        const ropePaths = ropePathRefs.current[i];
        if (ropePaths) {
          if (ropePaths.shadow) {
            ropePaths.shadow.setAttribute('d', pathD);
            ropePaths.shadow.style.opacity = ropeOpacity;
          }
          if (ropePaths.core) {
            ropePaths.core.setAttribute('d', pathD);
            ropePaths.core.style.opacity = ropeOpacity;
          }
          if (ropePaths.main) {
            ropePaths.main.setAttribute('d', pathD);
            ropePaths.main.style.opacity = ropeOpacity;
          }
          if (ropePaths.braid) {
            ropePaths.braid.setAttribute('d', pathD);
            ropePaths.braid.style.opacity = ropeOpacity;
          }
        }

        // Tangent Orientations for Knots
        const knotG = knotRefs.current[i];
        if (knotG) {
          const angTop = (Math.atan2(p1.y - p0.y, p1.x - p0.x) - Math.PI / 2) * (180 / Math.PI);
          if (knotG.top) {
            knotG.top.setAttribute('transform', `translate(${p0.x.toFixed(2)}, ${p0.y.toFixed(2)}) rotate(${angTop.toFixed(2)})`);
            knotG.top.style.opacity = ropeOpacity;
          }
          const ang1 = (Math.atan2(p2.y - p0.y, p2.x - p0.x) - Math.PI / 2) * (180 / Math.PI);
          if (knotG.knot1) {
            knotG.knot1.setAttribute('transform', `translate(${p1.x.toFixed(2)}, ${p1.y.toFixed(2)}) rotate(${ang1.toFixed(2)})`);
            knotG.knot1.style.opacity = ropeOpacity;
          }
          const ang2 = (Math.atan2(p3.y - p1.y, p3.x - p1.x) - Math.PI / 2) * (180 / Math.PI);
          if (knotG.knot2) {
            knotG.knot2.setAttribute('transform', `translate(${p2.x.toFixed(2)}, ${p2.y.toFixed(2)}) rotate(${ang2.toFixed(2)})`);
            knotG.knot2.style.opacity = ropeOpacity;
          }
          const angBtm = (Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.PI / 2) * (180 / Math.PI);
          if (knotG.btm) {
            knotG.btm.setAttribute('transform', `translate(${p3.x.toFixed(2)}, ${p3.y.toFixed(2)}) rotate(${angBtm.toFixed(2)})`);
            knotG.btm.style.opacity = ropeOpacity;
          }
        }
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  /* ─────────────────────────────────────────────────────────────
     4. Interactive Disturbances: Pointer Swipe & Touch Physics
     ───────────────────────────────────────────────────────────── */
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    const now = performance.now();
    const dt = Math.max(now - lastPointerTimeRef.current, 8);
    const vx = ((localX - lastPointerPosRef.current.x) / dt) * 16.666;
    const vy = ((localY - lastPointerPosRef.current.y) / dt) * 16.666;

    lastPointerPosRef.current = { x: localX, y: localY };
    lastPointerTimeRef.current = now;

    // Apply gentle physical impulse to ropes/capsules near the pointer
    itemsPhysicsRef.current.forEach((item) => {
      const capCenter = {
        x: item.nodes[3].x,
        y: item.nodes[3].y + item.capsuleHeight / 2,
      };
      const dist = Math.hypot(localX - capCenter.x, localY - capCenter.y);

      if (dist < 45) {
        const falloff = Math.max(0, 1 - dist / 45);
        const impulseX = Math.max(-2.2, Math.min(2.2, vx * 0.02 * falloff));
        const impulseY = Math.max(-1.0, Math.min(1.0, vy * 0.01 * falloff));

        item.nodes[3].x += impulseX;
        item.nodes[3].y += impulseY;
        item.nodes[2].x += impulseX * 0.35;
        item.nodes[1].x += impulseX * 0.15;

        item.angularVelocity += Math.max(-0.005, Math.min(0.005, vx * 0.0003 * falloff));
      }
    });
  };

  /* ─────────────────────────────────────────────────────────────
     5. Hover Reaction: Subtle Stretch & Gentle Recoil
     ───────────────────────────────────────────────────────────── */
  const handleCapsuleMouseEnter = (idx: number, id: string) => {
    setHoveredId(id);
    const item = itemsPhysicsRef.current[idx];
    if (!item) return;

    const rotDir = idx % 2 === 0 ? 0.002 : -0.002;
    item.angularVelocity += rotDir;
  };

  const handleCapsuleMouseLeave = (idx: number) => {
    setHoveredId(null);
    const item = itemsPhysicsRef.current[idx];
    if (!item) return;

    item.angularVelocity += (idx % 2 === 0 ? -0.002 : 0.002);
  };

  /* ─────────────────────────────────────────────────────────────
     6. Click Reaction: Smooth Navigation Without Displacement
     ───────────────────────────────────────────────────────────── */
  const handleCapsuleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
    idx: number
  ) => {
    e.preventDefault();
    // Rock-solid click: zero physical displacement or jerk
    handleNavClick(e, id);
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    setActiveId(id);
    setIsMobileMenuOpen(false);
    isManualScrollRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isManualScrollRef.current = false;
    }, 850);
  };

  /* ─────────────────────────────────────────────────────────────
     7. Accessibility: Keyboard Focus Feedback
     ───────────────────────────────────────────────────────────── */
  const handleCapsuleFocus = (idx: number, id: string) => {
    setActiveId(id);
    const item = itemsPhysicsRef.current[idx];
    if (item) {
      item.nodes[3].y -= 1.0;
      item.angularVelocity += (idx % 2 === 0 ? 0.004 : -0.004);
    }
  };

  const currentActiveItem = NAV_ITEMS.find((item) => item.id === activeId);

  return (
    <>
      {/* ── DESKTOP SUSPENDED KNOTTED ROPE NAVIGATION (>= 768px) ── */}
      <div
        ref={containerRef}
        className={`hud-nav-shell hud-desktop-nav ${isHangingMode ? 'is-hanging-mode' : 'is-simple-mode'}`}
        style={{
          width: `${railWidth}px`,
          height: isHangingMode ? `${containerHeight}px` : '46px',
          transition: 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onPointerMove={handlePointerMove}
      >
        {/* Main Mounting Rail Container */}
        <motion.nav
          ref={railRef}
          className={`hud-nav hud-mounting-rail ${isHangingMode ? 'is-hanging' : 'is-simple'}`}
          aria-label="Main Navigation"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          {/* Animated Brand Logo: Left in Simple Mode, Centered in Hanging Mode */}
          <motion.a
            href="#hero"
            className="hud-rail-brand"
            onClick={(e) => handleNavClick(e, 'hero')}
            aria-label="KRXN — Return to Home section"
            title="KRXN"
            animate={{
              left: isHangingMode ? '50%' : '24px',
              x: isHangingMode ? '-50%' : '0%',
            }}
            transition={{
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            KRXN
          </motion.a>

          {/* Simple Mode: Horizontal Nav Links across the rail */}
          <motion.div
            className="hud-simple-track"
            animate={{
              opacity: isHangingMode ? 0 : 1,
              scale: isHangingMode ? 0.94 : 1,
              filter: isHangingMode ? 'blur(3px)' : 'blur(0px)',
              pointerEvents: isHangingMode ? 'none' : 'auto',
            }}
            transition={{
              duration: 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <span className="hud-simple-sep" />
            <div className="hud-simple-nav-links">
              {NAV_ITEMS.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`hud-simple-item ${isActive ? 'is-active' : ''}`}
                    onClick={(e) => handleNavClick(e, item.id)}
                  >
                    {isActive && (
                      <motion.span
                        className="hud-simple-pill-indicator"
                        layoutId="hud-simple-active-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="hud-simple-num">{item.num}</span>
                    <span className="hud-simple-text">{item.title}</span>
                  </a>
                );
              })}
            </div>
          </motion.div>

          {/* Hanging Mode: Precision Mounting Grommets along bottom rail edge */}
          <motion.div
            className="hud-rail-anchor-track"
            animate={{
              opacity: isHangingMode ? 1 : 0,
              scaleY: isHangingMode ? 1 : 0.4,
            }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {anchorCoords.map((pt, i) => {
              const item = NAV_ITEMS[i];
              const isActive = activeId === item?.id;
              const isHovered = hoveredId === item?.id;

              return (
                <div
                  key={item ? item.id : i}
                  className={`hud-rail-anchor ${isActive ? 'is-active' : ''} ${isHovered ? 'is-hovered' : ''}`}
                  style={{ left: `${pt.x}px` }}
                >
                  <span className="hud-anchor-grommet">
                    <span className="hud-anchor-hole" />
                  </span>
                </div>
              );
            })}
          </motion.div>
        </motion.nav>

        {/* Suspended Red Cords & Hanging Navigation Capsules Layer */}
        <motion.div
          className="hud-hanging-elements-layer"
          animate={{
            opacity: isHangingMode ? 1 : 0,
            pointerEvents: isHangingMode ? 'auto' : 'none',
          }}
          transition={{ duration: 0.3 }}
        >
          {/* SVG Canvas for Physical Red Cords & Tied Knots */}
          <svg
            className="hud-rope-svg"
            width={railWidth}
            height={containerHeight}
            viewBox={`0 0 ${railWidth} ${containerHeight}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${railWidth}px`,
              height: `${containerHeight}px`,
              pointerEvents: 'none',
              overflow: 'visible',
              zIndex: 4,
            }}
          >
            <defs>
              {/* Deep Crimson Cord Gradient */}
              <linearGradient id="hud-rope-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#480509" />
                <stop offset="28%" stopColor="#870e15" />
                <stop offset="60%" stopColor="#e50914" />
                <stop offset="85%" stopColor="#b8121a" />
                <stop offset="100%" stopColor="#3d0306" />
              </linearGradient>

              {/* Rope Shadow Filter */}
              <filter id="hud-rope-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="rgba(0,0,0,0.65)" />
              </filter>

              {/* Active Cord Crimson Glow */}
              <filter id="hud-rope-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="rgba(229, 9, 20, 0.8)" />
              </filter>
            </defs>

            {/* Render each knotted cord */}
            {NAV_ITEMS.map((item, i) => {
              const isActive = activeId === item.id;
              const isHovered = hoveredId === item.id;

              return (
                <g
                  key={item.id}
                  className={`hud-rope-group ${isActive ? 'is-active' : ''} ${isHovered ? 'is-hovered' : ''}`}
                  filter={isActive ? 'url(#hud-rope-glow)' : undefined}
                >
                  {/* Layer 1: Ambient Drop Shadow */}
                  <path
                    ref={(el) => {
                      if (!ropePathRefs.current[i]) ropePathRefs.current[i] = {} as any;
                      ropePathRefs.current[i].shadow = el;
                    }}
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.5)"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    filter="url(#hud-rope-shadow)"
                  />

                  {/* Layer 2: Deep Core Dark Cord */}
                  <path
                    ref={(el) => {
                      if (!ropePathRefs.current[i]) ropePathRefs.current[i] = {} as any;
                      ropePathRefs.current[i].core = el;
                    }}
                    fill="none"
                    stroke="#3d0306"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />

                  {/* Layer 3: Main Rich Crimson Body */}
                  <path
                    ref={(el) => {
                      if (!ropePathRefs.current[i]) ropePathRefs.current[i] = {} as any;
                      ropePathRefs.current[i].main = el;
                    }}
                    fill="none"
                    stroke="url(#hud-rope-grad)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  {/* Layer 4: Braided Fiber Highlight Thread */}
                  <path
                    ref={(el) => {
                      if (!ropePathRefs.current[i]) ropePathRefs.current[i] = {} as any;
                      ropePathRefs.current[i].braid = el;
                    }}
                    fill="none"
                    stroke="#ff545e"
                    strokeWidth="0.9"
                    strokeDasharray="2.5 3.5"
                    strokeLinecap="round"
                    opacity={isActive || isHovered ? 0.95 : 0.72}
                  />

                  {/* Tied Knots Graphics */}
                  {/* Knot 0: Anchor eyelet hitch knot */}
                  <g
                    ref={(el) => {
                      if (!knotRefs.current[i]) knotRefs.current[i] = {} as any;
                      knotRefs.current[i].top = el;
                    }}
                  >
                    <RopeKnotSVG type="anchor" isActive={isActive} />
                  </g>

                  {/* Knot 1: Upper handmade cinch knot */}
                  <g
                    ref={(el) => {
                      if (!knotRefs.current[i]) knotRefs.current[i] = {} as any;
                      knotRefs.current[i].knot1 = el;
                    }}
                  >
                    <RopeKnotSVG type="intermediate" isActive={isActive} />
                  </g>

                  {/* Knot 2: Lower handmade cinch knot */}
                  <g
                    ref={(el) => {
                      if (!knotRefs.current[i]) knotRefs.current[i] = {} as any;
                      knotRefs.current[i].knot2 = el;
                    }}
                  >
                    <RopeKnotSVG type="intermediate" isActive={isActive} />
                  </g>

                  {/* Knot 3: Capsule connection knot */}
                  <g
                    ref={(el) => {
                      if (!knotRefs.current[i]) knotRefs.current[i] = {} as any;
                      knotRefs.current[i].btm = el;
                    }}
                  >
                    <RopeKnotSVG type="capsule" isActive={isActive} />
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Suspended Navigation Capsules / Tags */}
          <div className="hud-capsules-container">
            {NAV_ITEMS.map((item, i) => {
              const isActive = activeId === item.id;
              const isHovered = hoveredId === item.id;

              return (
                <a
                  key={item.id}
                  ref={(el) => {
                    capsuleRefs.current[i] = el;
                  }}
                  href={`#${item.id}`}
                  id={`hud-capsule-${item.id}`}
                  className={`hud-capsule ${isActive ? 'is-active' : ''} ${isHovered ? 'is-hovered' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={(e) => handleCapsuleClick(e, item.id, i)}
                  onMouseEnter={() => handleCapsuleMouseEnter(i, item.id)}
                  onMouseLeave={() => handleCapsuleMouseLeave(i)}
                  onFocus={() => handleCapsuleFocus(i, item.id)}
                >
                  {/* Physical Attachment Eyelet Grommet at top center */}
                  <span className="hud-capsule-grommet">
                    <span className="hud-capsule-grommet-outer" />
                    <span className="hud-capsule-grommet-hole" />
                  </span>

                  <span className="hud-capsule-num">{item.num}</span>
                  <span className="hud-capsule-title">{item.title}</span>

                  {isActive && <span className="hud-capsule-active-dot" />}
                </a>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── MOBILE HUD HEADER (< 768px) ── */}
      <div className="hud-mobile-shell">
        <header className="hud-mobile-bar">
          <a
            href="#hero"
            className="hud-mobile-logo"
            onClick={(e) => handleNavClick(e, 'hero')}
            aria-label="Karun Pandey — Home"
          >
            KRXN
          </a>

          <div className="hud-mobile-active-pill" aria-live="polite">
            <span className="hud-mobile-pulse-dot" />
            <span className="hud-mobile-active-label">
              {currentActiveItem?.label || '00 Home'}
            </span>
          </div>

          <button
            type="button"
            className={`hud-mobile-menu-btn ${isMobileMenuOpen ? 'is-open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="7" y1="12" x2="21" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </svg>
            )}
          </button>
        </header>
      </div>

      {/* ── MOBILE NAVIGATION DRAWER OVERLAY ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="hud-mobile-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.nav
              className="hud-mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Menu"
              initial={{ y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="hud-mobile-drawer-header">
                <span className="hud-mobile-drawer-title">PORTFOLIO INDEX</span>
                <span className="hud-mobile-drawer-status">KRXN</span>
              </div>

              <div className="hud-mobile-nav-links">
                {NAV_ITEMS.map((item, idx) => {
                  const isActive = activeId === item.id;
                  return (
                    <motion.a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`hud-mobile-link ${isActive ? 'is-active' : ''}`}
                      onClick={(e) => handleNavClick(e, item.id)}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + idx * 0.05, duration: 0.3 }}
                      whileTap={{ scale: 0.97, x: 4 }}
                    >
                      {/* Suspended Red Cord Graphic Accent on Mobile */}
                      <span className="hud-mobile-rope-hang" aria-hidden="true">
                        <span className="hud-mobile-knot-pip" />
                        <span className="hud-mobile-cord-line" />
                        <span className="hud-mobile-knot-pip" />
                      </span>

                      <span className="hud-mobile-link-num">{item.num}</span>
                      <span className="hud-mobile-link-title">
                        {item.title}
                      </span>
                      {isActive && <span className="hud-mobile-active-tag">CURRENT</span>}
                    </motion.a>
                  );
                })}
              </div>

              <div className="hud-mobile-drawer-footer">
                <div className="hud-mobile-footer-links">
                  <a href="mailto:karunpandey@example.com" className="hud-mobile-footer-link">EMAIL</a>
                  <span className="hud-mobile-footer-dot">•</span>
                  <a href="https://behance.net" target="_blank" rel="noopener noreferrer" className="hud-mobile-footer-link">BEHANCE</a>
                  <span className="hud-mobile-footer-dot">•</span>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hud-mobile-footer-link">INSTAGRAM</a>
                </div>
                <div className="hud-mobile-footer-quote">
                  Every image tells a story. Every story leaves a mark.
                </div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
