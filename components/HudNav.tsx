'use client';

import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NavItemDef {
  id: string;
  num: string;
  title: string;
  label: string;
  short: string;
  restLen: number;    // Resting rope length in pixels
  restAngle: number;  // Natural resting angle in radians
  knot1Ratio: number; // Ratio down the cord for upper knot
  knot2Ratio: number; // Ratio down the cord for lower knot
}

export const NAV_ITEMS: NavItemDef[] = [
  {
    id: 'hero',
    num: '00',
    title: 'Home',
    label: '00 Home',
    short: 'Home',
    restLen: 18,
    restAngle: 0,
    knot1Ratio: 0.38,
    knot2Ratio: 0.72,
  },
  {
    id: 'about',
    num: '01',
    title: 'About',
    label: '01 About',
    short: 'About',
    restLen: 34,
    restAngle: 0,
    knot1Ratio: 0.34,
    knot2Ratio: 0.68,
  },
  {
    id: 'posters',
    num: '02',
    title: 'Posters',
    label: '02 Posters',
    short: 'Posters',
    restLen: 20,
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
    restLen: 38,
    restAngle: 0,
    knot1Ratio: 0.34,
    knot2Ratio: 0.68,
  },
  {
    id: 'sketchbook',
    num: '04',
    title: 'Sketchbook',
    label: '04 Sketchbook',
    short: 'Sketches',
    restLen: 18,
    restAngle: 0,
    knot1Ratio: 0.38,
    knot2Ratio: 0.72,
  },
];

const DEFAULT_MARGIN = 50;
const DEFAULT_SPACING = 145;
const DEFAULT_ANCHOR_Y = 46;
export const DEFAULT_RAIL_WIDTH = (NAV_ITEMS.length - 1) * DEFAULT_SPACING + 2 * DEFAULT_MARGIN; // 680px
export const DEFAULT_CONTAINER_HEIGHT = DEFAULT_ANCHOR_Y + 38 + 48; // 132px

export const INITIAL_GEOMETRY = NAV_ITEMS.map((def, i) => {
  const anchorX = DEFAULT_MARGIN + i * DEFAULT_SPACING;
  const anchorY = DEFAULT_ANCHOR_Y;
  const restLen = def.restLen;
  const p1y = anchorY + restLen * def.knot1Ratio;
  const p2y = anchorY + restLen * def.knot2Ratio;
  const p3y = anchorY + restLen;
  const cp1y = anchorY + (p1y - anchorY) * 1.05;
  const cp2y = p3y - (p3y - p2y) * 1.05;
  const pathD = `M ${anchorX.toFixed(2)},${anchorY.toFixed(2)} C ${anchorX.toFixed(2)},${cp1y.toFixed(2)} ${anchorX.toFixed(2)},${cp2y.toFixed(2)} ${anchorX.toFixed(2)},${p3y.toFixed(2)}`;

  return {
    anchorX,
    anchorY,
    restLen,
    p1y,
    p2y,
    p3y,
    pathD,
    knotTopTransform: `translate(${anchorX.toFixed(2)}, ${anchorY.toFixed(2)})`,
    knot1Transform: `translate(${anchorX.toFixed(2)}, ${p1y.toFixed(2)})`,
    knot2Transform: `translate(${anchorX.toFixed(2)}, ${p2y.toFixed(2)})`,
    knotBtmTransform: `translate(${anchorX.toFixed(2)}, ${p3y.toFixed(2)})`,
    capsuleTransform: `translate3d(${anchorX.toFixed(2)}px, ${p3y.toFixed(2)}px, 0) translate(-50%, 0)`,
  };
});

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
  nodes: PhysicsNode[];
  seg0: number;
  seg1: number;
  seg2: number;
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
    return (
      <g>
        <ellipse cx="0" cy="1" rx="4.8" ry="3.2" fill="rgba(0,0,0,0.6)" filter="blur(1px)" />
        <path
          d="M -4.2 -1.5 C -3.8 -3.8, 3.8 -2.8, 4.2 0.5 C 4.6 2.6, -3.2 3.6, -4.2 1.5 Z"
          fill="#63070d"
          stroke="#380205"
          strokeWidth="0.6"
        />
        <path
          d="M -3.5 -0.8 C -1.2 -2.5, 2.8 -1.5, 3.5 1.2 C 1.6 2.8, -1.8 2.2, -3.5 -0.8 Z"
          fill="#a31018"
          stroke="#e50914"
          strokeWidth="0.5"
        />
        <path
          d="M -2.2 -0.8 Q 0.5 -1.6 2.4 0.8"
          fill="none"
          stroke="#ff545e"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
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
    return (
      <g>
        <ellipse cx="0" cy="-4" rx="4.8" ry="3.5" fill="rgba(0,0,0,0.6)" filter="blur(1px)" />
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
        <line x1="-3.2" y1="-6.0" x2="3.2" y2="-6.0" stroke="#a31018" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="-3.5" y1="-4.2" x2="3.5" y2="-4.2" stroke="#c9141f" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="-3.2" y1="-2.4" x2="3.2" y2="-2.4" stroke="#a31018" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="-2.0" y1="-6.0" x2="1.5" y2="-6.0" stroke="#ff545e" strokeWidth="0.75" strokeLinecap="round" />
        <line x1="-2.2" y1="-4.2" x2="1.6" y2="-4.2" stroke="#ff545e" strokeWidth="0.8" strokeLinecap="round" />
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

  return (
    <g>
      <ellipse cx="0" cy="0.8" rx="4.4" ry="3" fill="rgba(0,0,0,0.55)" filter="blur(1px)" />
      <ellipse cx="0" cy="0" rx="3.8" ry="2.8" fill="#63070d" stroke="#380205" strokeWidth="0.5" />
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
  const [railWidth, setRailWidth] = useState<number>(DEFAULT_RAIL_WIDTH);
  const [containerHeight, setContainerHeight] = useState<number>(DEFAULT_CONTAINER_HEIGHT);
  const [anchorCoords, setAnchorCoords] = useState<{ x: number; y: number }[]>(
    INITIAL_GEOMETRY.map((g) => ({ x: g.anchorX, y: g.anchorY }))
  );

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

  // Physics state ref (particles + springs + damping)
  const itemsPhysicsRef = useRef<ItemPhysics[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  /* ─────────────────────────────────────────────────────────────
     1. High-Performance Animation Loop (Runs ONLY when animating)
     ───────────────────────────────────────────────────────────── */
  const wakeLoop = useCallback(() => {
    if (animFrameRef.current !== null) return;
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsedMs = now - lastTimeRef.current;
      lastTimeRef.current = now;
      const dt = Math.min(32, Math.max(8, elapsedMs)) / 16.666;

      const isHanging = dropAnimRef.current.isHanging;
      const dropElapsed = isHanging && dropAnimRef.current.dropStartTime > 0 ? (now - dropAnimRef.current.dropStartTime) / 1000 : 999;
      const retractElapsed = !isHanging && dropAnimRef.current.retractStartTime > 0 ? (now - dropAnimRef.current.retractStartTime) / 1000 : 999;

      let anyMotion = false;

      itemsPhysicsRef.current.forEach((item, i) => {
        // Physical Drop & Retract Harmonic Progress
        let progress = 0;
        if (isHanging) {
          if (dropAnimRef.current.dropStartTime === 0) {
            // Already settled hanging
            progress = 1.0;
          } else {
            // Micro-wave stagger: 0ms (center Posters), 18ms (About/CaseStudy), 36ms (Home/Sketchbook)
            const delay = Math.abs(i - 2) * 0.018;
            const t = dropElapsed - delay;
            if (t <= 0) {
              progress = 0;
              anyMotion = true;
            } else if (t >= 0.82) {
              progress = 1.0;
            } else {
              anyMotion = true;
              // 2nd-order damped harmonic spring-mass response:
              // wn = 10.8 rad/s, zeta = 0.68
              // Stretches smoothly by 5.5% under tension, rebounds once softly, settles plumb
              const wn = 10.8;
              const zeta = 0.68;
              const wd = wn * Math.sqrt(1 - zeta * zeta);
              const envelope = Math.exp(-zeta * wn * t);
              const decayTerm = envelope * (Math.cos(wd * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t));
              progress = Math.max(0, 1.0 - decayTerm);
            }
          }
        } else {
          if (dropAnimRef.current.retractStartTime === 0) {
            progress = 0;
          } else {
            const t = retractElapsed;
            if (t <= 0.28) {
              anyMotion = true;
              progress = Math.max(0, 1 - Math.pow(t / 0.28, 2.0));
            } else {
              progress = 0;
            }
          }
        }

        // True pendulum rope oscillation physics
        const def = NAV_ITEMS[i];
        const L_eff = Math.max(16, item.restLength);
        const gEff = 1500;
        const naturalOmega = Math.sqrt(gEff / L_eff);

        const restoringTorque = -(naturalOmega * naturalOmega) * Math.sin(item.angle);
        const frameDamping = Math.pow(0.965, dt);

        item.angularVelocity += restoringTorque * (dt / 60);
        item.angularVelocity *= frameDamping;
        item.angle += item.angularVelocity * (dt / 60);

        const maxAngle = 0.16;
        if (Math.abs(item.angle) > maxAngle) {
          const sign = Math.sign(item.angle);
          const excess = Math.abs(item.angle) - maxAngle;
          item.angle = sign * (maxAngle + Math.tanh(excess * 2.5) * 0.02);
          item.angularVelocity *= 0.84;
        }

        if (Math.abs(item.angle) < 0.0003 && Math.abs(item.angularVelocity) < 0.0008) {
          item.angle = 0;
          item.angularVelocity = 0;
        } else {
          anyMotion = true;
        }

        const theta = item.angle;
        const currentRestLen = item.restLength * progress;

        const p0 = { x: item.anchorX, y: item.anchorY };
        const th1 = theta * 0.38;
        const len1 = currentRestLen * def.knot1Ratio;
        const p1 = {
          x: item.anchorX + Math.sin(th1) * len1,
          y: item.anchorY + Math.cos(th1) * len1,
        };

        const th2 = theta * 0.74;
        const len2 = currentRestLen * def.knot2Ratio;
        const p2 = {
          x: item.anchorX + Math.sin(th2) * len2,
          y: item.anchorY + Math.cos(th2) * len2,
        };

        const th3 = theta;
        const p3 = {
          x: item.anchorX + Math.sin(th3) * currentRestLen,
          y: item.anchorY + Math.cos(th3) * currentRestLen,
        };

        item.nodes[0].x = p0.x;
        item.nodes[0].y = p0.y;
        item.nodes[1].x = p1.x;
        item.nodes[1].y = p1.y;
        item.nodes[2].x = p2.x;
        item.nodes[2].y = p2.y;
        item.nodes[3].x = p3.x;
        item.nodes[3].y = p3.y;

        // GPU DOM update for Capsule Tag
        const capEl = capsuleRefs.current[i];
        if (capEl) {
          const deg = (theta * 180) / Math.PI;
          const isVisible = progress > 0.05;
          capEl.style.opacity = isVisible ? Math.min(1, Math.max(0, progress * 3 - 0.15)).toFixed(3) : '0';
          capEl.style.pointerEvents = progress > 0.85 ? 'auto' : 'none';
          capEl.style.transform = `translate3d(${p3.x.toFixed(2)}px, ${p3.y.toFixed(2)}px, 0) rotate(${deg.toFixed(2)}deg) translate(-50%, 0)`;
        }

        // Continuous smooth cubic Bezier rope path
        const cp1x = p0.x + (p1.x - p0.x) * 1.05;
        const cp1y = p0.y + (p1.y - p0.y) * 1.05;
        const cp2x = p3.x - (p3.x - p2.x) * 1.05;
        const cp2y = p3.y - (p3.y - p2.y) * 1.05;
        const pathD = `M ${p0.x.toFixed(2)},${p0.y.toFixed(2)} C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p3.x.toFixed(2)},${p3.y.toFixed(2)}`;

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

        // Tangents for Knots
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
          const angBtm = (theta * 180) / Math.PI;
          if (knotG.btm) {
            knotG.btm.setAttribute('transform', `translate(${p3.x.toFixed(2)}, ${p3.y.toFixed(2)}) rotate(${angBtm.toFixed(2)})`);
            knotG.btm.style.opacity = ropeOpacity;
          }
        }
      });

      // If animation has fully settled, shut down RAF loop to consume 0% idle CPU
      if (!anyMotion) {
        animFrameRef.current = null;
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  /* ─────────────────────────────────────────────────────────────
     2. Mode Switching (Simple on Hero -> Drops on Page 2+) & Spy
     ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    let ticking = false;

    const updateActiveSectionAndMode = () => {
      const scrollY = window.scrollY;

      // Threshold: Scroll away from Hero toward About
      const windowHeight = window.innerHeight;
      const dropThreshold = Math.max(180, windowHeight * 0.38);

      if (scrollY > dropThreshold) {
        if (!isHangingModeRef.current) {
          isHangingModeRef.current = true;
          dropAnimRef.current.isHanging = true;
          dropAnimRef.current.dropStartTime = performance.now();
          dropAnimRef.current.retractStartTime = 0;
          setIsHangingMode(true);
          wakeLoop();
        }
      } else if (scrollY < dropThreshold - 70) {
        if (isHangingModeRef.current) {
          isHangingModeRef.current = false;
          dropAnimRef.current.isHanging = false;
          dropAnimRef.current.retractStartTime = performance.now();
          dropAnimRef.current.dropStartTime = 0;
          setIsHangingMode(false);
          wakeLoop();
        }
      }

      // Active Section Spy
      if (scrollY < 120) {
        setActiveId('hero');
        return;
      }

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
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [wakeLoop]);

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
     3. Physics System Initialization
     ───────────────────────────────────────────────────────────── */
  const initializePhysics = useCallback(() => {
    if (!containerRef.current) return;

    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const isTablet = windowWidth < 1024 && windowWidth >= 768;

    const spacing = isTablet ? 115 : DEFAULT_SPACING;
    const margin = isTablet ? 45 : DEFAULT_MARGIN;
    const computedRailW = (NAV_ITEMS.length - 1) * spacing + 2 * margin;
    setRailWidth(computedRailW);

    const anchorY = DEFAULT_ANCHOR_Y;

    const widths: number[] = NAV_ITEMS.map((_, i) => {
      const el = capsuleRefs.current[i];
      return el && el.offsetWidth > 0 ? el.offsetWidth : (isTablet ? 96 : 116);
    });

    const newAnchors: { x: number; y: number }[] = [];
    const newItems: ItemPhysics[] = [];

    NAV_ITEMS.forEach((def, i) => {
      const capW = widths[i];
      const capH = isTablet ? 30 : 36;
      const anchorX = margin + i * spacing;

      newAnchors.push({ x: anchorX, y: anchorY });

      const restLen = isTablet ? Math.round(def.restLen * 0.85) : def.restLen;
      const seg0 = restLen * def.knot1Ratio;
      const seg1 = restLen * (def.knot2Ratio - def.knot1Ratio);
      const seg2 = restLen * (1 - def.knot2Ratio);

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
        swayFreq: 0,
        swayPhase: 0,
        swayAmp: 0,
        capsuleWidth: capW,
        capsuleHeight: capH,
      });
    });

    setAnchorCoords(newAnchors);
    itemsPhysicsRef.current = newItems;

    const maxRopeLen = Math.max(...newItems.map((item) => item.restLength));
    setContainerHeight(anchorY + maxRopeLen + 48);
  }, []);

  useLayoutEffect(() => {
    initializePhysics();

    // Check initial scroll position
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const dropThreshold = Math.max(180, windowHeight * 0.38);

    const initialHanging = scrollY > dropThreshold;
    isHangingModeRef.current = initialHanging;
    dropAnimRef.current.isHanging = initialHanging;
    setIsHangingMode(initialHanging);

    // Pre-position capsules cleanly
    itemsPhysicsRef.current.forEach((item, i) => {
      const capEl = capsuleRefs.current[i];
      if (capEl) {
        const yPos = item.anchorY + (initialHanging ? item.restLength : 0);
        capEl.style.transform = `translate3d(${item.anchorX.toFixed(2)}px, ${yPos.toFixed(2)}px, 0) translate(-50%, 0)`;
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
     4. Real-Life Rope Pendulum Hover Handlers
     ───────────────────────────────────────────────────────────── */
  const handleCapsuleMouseEnter = (
    idx: number,
    id: string,
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    setHoveredId(id);
    const item = itemsPhysicsRef.current[idx];
    if (!item) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const cursorRelativeX = e.clientX - (rect.left + rect.width / 2);
    const dir = cursorRelativeX < 0 ? 1 : -1;
    const impulse = dir * 1.35;
    item.angularVelocity = Math.max(-1.9, Math.min(1.9, item.angularVelocity * 0.3 + impulse));
    wakeLoop();
  };

  const handleCapsuleMouseMove = (
    idx: number,
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    const item = itemsPhysicsRef.current[idx];
    if (!item) return;
    if (Math.abs(e.movementX) > 1) {
      const sweep = Math.max(-0.25, Math.min(0.25, e.movementX * 0.03));
      item.angularVelocity += sweep;
      wakeLoop();
    }
  };

  const handleCapsuleMouseLeave = () => {
    setHoveredId(null);
  };

  const handleCapsuleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
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

  const handleCapsuleFocus = (id: string) => {
    setActiveId(id);
  };

  const currentActiveItem = NAV_ITEMS.find((item) => item.id === activeId);

  return (
    <>
      {/* ── DESKTOP DUAL-MODE NAVIGATION (>= 768px) ── */}
      <div
        ref={containerRef}
        className={`hud-nav-shell hud-desktop-nav ${isHangingMode ? 'is-hanging-mode' : 'is-simple-mode'}`}
        style={{
          width: `${railWidth}px`,
          height: isHangingMode ? `${containerHeight}px` : '46px',
          transition: 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <motion.div
          className="hud-nav-assembly"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          {/* Main Mounting Rail Container */}
          <nav
            ref={railRef}
            className="hud-nav hud-mounting-rail"
            aria-label="Main Navigation"
          >
            {/* Centered Brand Logo: Visible ONLY in Hanging Mode */}
            <a
              href="#hero"
              className="hud-rail-brand"
              onClick={(e) => handleNavClick(e, 'hero')}
              aria-label="KRXN — Return to Home section"
              title="KRXN — Return to Home"
              style={{
                opacity: isHangingMode ? 1 : 0,
                transform: `translate(-50%, -50%) scale(${isHangingMode ? 1 : 0.88})`,
                pointerEvents: isHangingMode ? 'auto' : 'none',
              }}
            >
              KRXN
            </a>

            {/* Simple Track: Horizontal Nav Links Visible ONLY on Page 1 (Hero) */}
            <div
              className="hud-simple-track"
              style={{
                opacity: isHangingMode ? 0 : 1,
                transform: `scale(${isHangingMode ? 0.94 : 1})`,
                pointerEvents: isHangingMode ? 'none' : 'auto',
              }}
            >
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
                      <span className="hud-simple-num">{item.num}</span>
                      <span className="hud-simple-text">{item.title}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Precision Mounting Grommets along bottom rail edge */}
            <div
              className="hud-rail-anchor-track"
              style={{
                opacity: isHangingMode ? 1 : 0,
                transition: 'opacity 0.3s ease',
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
            </div>
          </nav>

          {/* Suspended Red Cords & Hanging Navigation Capsules Layer */}
          <div
            className="hud-hanging-elements-layer"
            style={{
              opacity: isHangingMode ? 1 : 0,
              pointerEvents: isHangingMode ? 'auto' : 'none',
              transition: 'opacity 0.25s ease',
            }}
          >
            {/* SVG Canvas for Physical Red Cords & Tied Knots */}
            <svg
              className="hud-rope-svg"
              width={railWidth}
              height={containerHeight}
              viewBox={`0 0 ${railWidth} ${containerHeight}`}
            >
              <defs>
                <linearGradient id="hud-rope-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#480509" />
                  <stop offset="28%" stopColor="#870e15" />
                  <stop offset="60%" stopColor="#e50914" />
                  <stop offset="85%" stopColor="#b8121a" />
                  <stop offset="100%" stopColor="#3d0306" />
                </linearGradient>

                <filter id="hud-rope-shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="rgba(0,0,0,0.65)" />
                </filter>

                <filter id="hud-rope-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="rgba(229, 9, 20, 0.8)" />
                </filter>
              </defs>

              {/* Render each knotted cord */}
              {NAV_ITEMS.map((item, i) => {
                const isActive = activeId === item.id;
                const isHovered = hoveredId === item.id;
                const init = INITIAL_GEOMETRY[i];

                return (
                  <g
                    key={item.id}
                    className={`hud-rope-group ${isActive ? 'is-active' : ''} ${isHovered ? 'is-hovered' : ''}`}
                    filter={isActive ? 'url(#hud-rope-glow)' : undefined}
                  >
                    <path
                      ref={(el) => {
                        if (!ropePathRefs.current[i]) ropePathRefs.current[i] = {} as any;
                        ropePathRefs.current[i].shadow = el;
                      }}
                      d={init.pathD}
                      fill="none"
                      stroke="rgba(0, 0, 0, 0.5)"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      filter="url(#hud-rope-shadow)"
                      style={{ opacity: 0 }}
                    />

                    <path
                      ref={(el) => {
                        if (!ropePathRefs.current[i]) ropePathRefs.current[i] = {} as any;
                        ropePathRefs.current[i].core = el;
                      }}
                      d={init.pathD}
                      fill="none"
                      stroke="#3d0306"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      style={{ opacity: 0 }}
                    />

                    <path
                      ref={(el) => {
                        if (!ropePathRefs.current[i]) ropePathRefs.current[i] = {} as any;
                        ropePathRefs.current[i].main = el;
                      }}
                      d={init.pathD}
                      fill="none"
                      stroke="url(#hud-rope-grad)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      style={{ opacity: 0 }}
                    />

                    <path
                      ref={(el) => {
                        if (!ropePathRefs.current[i]) ropePathRefs.current[i] = {} as any;
                        ropePathRefs.current[i].braid = el;
                      }}
                      d={init.pathD}
                      fill="none"
                      stroke="#ff545e"
                      strokeWidth="0.9"
                      strokeDasharray="2.5 3.5"
                      strokeLinecap="round"
                      opacity={isActive || isHovered ? 0.95 : 0.72}
                      style={{ opacity: 0 }}
                    />

                    {/* Tied Knots */}
                    <g
                      ref={(el) => {
                        if (!knotRefs.current[i]) knotRefs.current[i] = {} as any;
                        knotRefs.current[i].top = el;
                      }}
                      transform={init.knotTopTransform}
                      style={{ opacity: 0 }}
                    >
                      <RopeKnotSVG type="anchor" isActive={isActive} />
                    </g>

                    <g
                      ref={(el) => {
                        if (!knotRefs.current[i]) knotRefs.current[i] = {} as any;
                        knotRefs.current[i].knot1 = el;
                      }}
                      transform={init.knot1Transform}
                      style={{ opacity: 0 }}
                    >
                      <RopeKnotSVG type="intermediate" isActive={isActive} />
                    </g>

                    <g
                      ref={(el) => {
                        if (!knotRefs.current[i]) knotRefs.current[i] = {} as any;
                        knotRefs.current[i].knot2 = el;
                      }}
                      transform={init.knot2Transform}
                      style={{ opacity: 0 }}
                    >
                      <RopeKnotSVG type="intermediate" isActive={isActive} />
                    </g>

                    <g
                      ref={(el) => {
                        if (!knotRefs.current[i]) knotRefs.current[i] = {} as any;
                        knotRefs.current[i].btm = el;
                      }}
                      transform={init.knotBtmTransform}
                      style={{ opacity: 0 }}
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
                const init = INITIAL_GEOMETRY[i];

                return (
                  <a
                    key={item.id}
                    ref={(el) => {
                      capsuleRefs.current[i] = el;
                    }}
                    href={`#${item.id}`}
                    id={`hud-capsule-${item.id}`}
                    className={`hud-capsule ${isActive ? 'is-active' : ''} ${isHovered ? 'is-hovered' : ''}`}
                    style={{
                      transform: init.capsuleTransform,
                      opacity: 0,
                      pointerEvents: 'none',
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(e) => handleCapsuleClick(e, item.id)}
                    onMouseEnter={(e) => handleCapsuleMouseEnter(i, item.id, e)}
                    onMouseMove={(e) => handleCapsuleMouseMove(i, e)}
                    onMouseLeave={handleCapsuleMouseLeave}
                    onFocus={() => handleCapsuleFocus(item.id)}
                  >
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
                  <a href="mailto:karunpandey66@gmail.com" className="hud-mobile-footer-link">EMAIL</a>
                  <span className="hud-mobile-footer-dot">•</span>
                  <a href="https://www.behance.net/karunpandey1" target="_blank" rel="noopener noreferrer" className="hud-mobile-footer-link">BEHANCE</a>
                </div>
                <div className="hud-mobile-footer-quote">
                  KARUN PANDEY • PORTFOLIO
                </div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
