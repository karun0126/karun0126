'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';
import Stage from './Stage';

/* ============================================================
   PENDULUM PHYSICS CARD
   Self-contained component — drives a damped-oscillation
   rotation around the top-tape anchor (transform-origin 50% 0%)
   via requestAnimationFrame. Zero cost when idle.
   ============================================================ */
interface PendulumCardProps {
  positionClass: string;
  disabled: boolean;
  children: React.ReactNode;
}

function PendulumCard({ positionClass, disabled, children }: PendulumCardProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  /* Physics state kept in a ref so RAF closure always has latest values */
  const state = useRef({
    angle: 0,       // current rotation in degrees
    velocity: 0,   // angular velocity deg/frame
    hovered: false,
    rafId: 0,
    settling: false,
  });

  const stopRaf = useCallback(() => {
    if (state.current.rafId) {
      cancelAnimationFrame(state.current.rafId);
      state.current.rafId = 0;
    }
  }, []);

  const applyRotation = useCallback((deg: number) => {
    if (innerRef.current) {
      innerRef.current.style.transform = `rotate(${deg}deg)`;
    }
  }, []);

  const tick = useCallback(() => {
    const s = state.current;

    /* Damped spring toward 0 */
    const stiffness = s.hovered ? 0.018 : 0.032; // weaker spring while hovered = more swing
    const damping   = s.hovered ? 0.88  : 0.80;  // more damping when settling after leave

    const force = -stiffness * s.angle;
    s.velocity = s.velocity * damping + force;
    s.angle += s.velocity;

    /* Clamp to ±1.5deg hard limit */
    s.angle = Math.max(-1.5, Math.min(1.5, s.angle));

    applyRotation(s.angle);

    /* Stop when motion is negligible and not hovered */
    if (!s.hovered && Math.abs(s.angle) < 0.005 && Math.abs(s.velocity) < 0.005) {
      s.angle = 0;
      s.velocity = 0;
      applyRotation(0);
      stopRaf();
      return;
    }

    s.rafId = requestAnimationFrame(tick);
  }, [applyRotation, stopRaf]);

  const startRaf = useCallback(() => {
    stopRaf();
    state.current.rafId = requestAnimationFrame(tick);
  }, [stopRaf, tick]);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    const s = state.current;
    s.hovered = true;
    /* Initial impulse — gives the photograph a gentle nudge to the left */
    s.velocity = -0.38;
    startRaf();
  }, [disabled, startRaf]);

  const handleMouseLeave = useCallback(() => {
    const s = state.current;
    s.hovered = false;
    /* RAF continues and settles to 0 naturally via damping */
    startRaf();
  }, [startRaf]);

  /* Clean up RAF on unmount */
  useEffect(() => () => stopRaf(), [stopRaf]);

  /* If the card becomes disabled mid-hover (click fired), snap to 0 */
  useEffect(() => {
    if (disabled) {
      state.current.hovered = false;
      state.current.velocity = 0;
      state.current.angle = 0;
      stopRaf();
      applyRotation(0);
    }
  }, [disabled, stopRaf, applyRotation]);

  return (
    <div
      className={`poster-pendulum-outer ${positionClass}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={innerRef}
        className="poster-pendulum-inner"
      >
        {children}
      </div>
    </div>
  );
}

interface PosterItem {
  id: string;
  className: string;
  highres: string;
  title: string;
  tag: string;
  ariaLabel: string;
}

const POSTER_TILTS: Record<string, number> = {
  sinners: -8.5,
  concept: 6.5,
  cowboybebop: 9.0,
  '001': -9.0,
  '002': -6.0,
  '003': 8.5,
  '004': -8.0,
  '005': 6.8,
  '006': 9.5,
};

/* Pixel coordinates of each Polaroid card in the baked stage image (1920×2160).
   Used to clip-show the exact card region inside the rotating hotspot so the
   actual visual card (frame, tape, shadow) moves — not just an invisible box. */
const POSTER_CARD_BG: Record<string, { x: number; y: number }> = {
  sinners:     { x: 381,  y: 393  },
  concept:     { x: 821,  y: 392  },
  cowboybebop: { x: 1244, y: 391  },
  '001':       { x: 381,  y: 951  },
  '002':       { x: 821,  y: 950  },
  '003':       { x: 1242, y: 950  },
  '004':       { x: 380,  y: 1504 },
  '005':       { x: 824,  y: 1505 },
  '006':       { x: 1247, y: 1504 },
};

type AnimationPhase = 'idle' | 'falling' | 'modal-open' | 'returning';

interface AnimatingPosterState {
  id: string;
  title: string;
  highres: string;
  rect: { left: number; top: number; width: number; height: number };
  tilt: number;
}

const POSTERS: PosterItem[] = [
  {
    id: 'sinners',
    className: 'hotspot-top-sinners',
    highres: '/images/poster-top-sinners-hd.jpg',
    title: '001 — SINNERS',
    tag: 'Click to Inspect [001]',
    ariaLabel: 'View poster 001 Sinners',
  },
  {
    id: 'concept',
    className: 'hotspot-top-concept',
    highres: '/images/poster-top-eightysix-hd.jpg',
    title: '002 — EIGHTY SIX',
    tag: 'Click to Inspect [002]',
    ariaLabel: 'View poster 002 Eighty Six',
  },
  {
    id: 'cowboybebop',
    className: 'hotspot-top-cowboybebop',
    highres: '/images/poster-top-cowboybebop-hd.jpg',
    title: '003 — COWBOY BEBOP',
    tag: 'Click to Inspect [003]',
    ariaLabel: 'View poster 003 Cowboy Bebop',
  },
  {
    id: '001',
    className: 'hotspot-001',
    highres: '/images/poster-001-martysupreme-hd.jpg',
    title: '004 — MARTY SUPREME',
    tag: 'Click to Inspect [004]',
    ariaLabel: 'View poster 004 Marty Supreme',
  },
  {
    id: '002',
    className: 'hotspot-002',
    highres: '/images/poster-002-love-through-a-prism-hd.jpg',
    title: '005 — LOVE THROUGH A PRISM',
    tag: 'Click to Inspect [005]',
    ariaLabel: 'View poster 005 Love Through A Prism',
  },
  {
    id: '003',
    className: 'hotspot-003',
    highres: '/images/poster-003-bloodhound-hd.jpg',
    title: '006 — BLOODHOUND',
    tag: 'Click to Inspect [006]',
    ariaLabel: 'View poster 006 Bloodhound',
  },
  {
    id: '004',
    className: 'hotspot-004',
    highres: '/images/poster-004-truedetective-hd.jpg',
    title: '007 — TRUE DETECTIVE',
    tag: 'Click to Inspect [007]',
    ariaLabel: 'View poster 007 True Detective',
  },
  {
    id: '005',
    className: 'hotspot-005',
    highres: '/images/poster-005-thelastofus-hd.jpg',
    title: '008 — THE LAST OF US',
    tag: 'Click to Inspect [008]',
    ariaLabel: 'View poster 008 The Last of Us',
  },
  {
    id: '006',
    className: 'hotspot-006',
    highres: '/images/poster-006-18x2-hd.jpg',
    title: '009 — 18 x 2',
    tag: 'Click to Inspect [009]',
    ariaLabel: 'View poster 009 18x2',
  },
];

interface PostersSectionProps {
  onSelectPoster: (src: string, caption: string, posterId: string) => void;
  isModalOpen?: boolean;
  onReturnComplete?: () => void;
}

export default function PostersSection({
  onSelectPoster,
  isModalOpen = false,
  onReturnComplete,
}: PostersSectionProps) {
  const [mounted, setMounted] = useState(false);
  const [activePoster, setActivePoster] = useState<AnimatingPosterState | null>(null);
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [justReturnedId, setJustReturnedId] = useState<string | null>(null);
  const hotspotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sectionRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  /* Same scroll-driven star rotation as AboutSection */
  const { scrollY } = useScroll();
  const rawRotate = useTransform(scrollY, (y) => (shouldReduceMotion ? 0 : y * 0.45));
  const starRotate = useSpring(rawRotate, { stiffness: 140, damping: 24, mass: 0.15 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Measure exact resting bounding rect without hover effects
  const getRestingRect = (el: HTMLElement) => {
    const prevTransform = el.style.transform;
    const prevTransition = el.style.transition;
    el.style.transform = 'none';
    el.style.transition = 'none';
    const rect = el.getBoundingClientRect();
    el.style.transform = prevTransform;
    el.style.transition = prevTransition;
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  };

  const handlePosterClick = (poster: PosterItem) => {
    if (phase !== 'idle' || activePoster) return;

    const el = hotspotRefs.current[poster.id];
    if (!el) return;

    const rect = getRestingRect(el);
    const tilt = POSTER_TILTS[poster.id] ?? 8.0;

    setActivePoster({
      id: poster.id,
      title: poster.title,
      highres: poster.highres,
      rect,
      tilt,
    });
    setPhase('falling');
  };

  // Watch for modal close to start upward return animation
  useEffect(() => {
    if (!isModalOpen && phase === 'modal-open' && activePoster) {
      // Re-measure latest hotspot position to handle any resize or scroll seamlessly
      const el = hotspotRefs.current[activePoster.id];
      if (el) {
        const latestRect = getRestingRect(el);
        setActivePoster((prev) => (prev ? { ...prev, rect: latestRect } : null));
      }
      setPhase('returning');
    }
  }, [isModalOpen, phase, activePoster]);

  // Lock scroll during animations to keep coordinates perfectly aligned
  useEffect(() => {
    if (phase !== 'idle') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [phase]);

  return (
    <section
      id="posters"
      ref={sectionRef}
      className="slide-frame"
      aria-label="Poster Designs Showcase"
    >
      <Stage baseHeight={2160}>
        <h2
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
          02 POSTER DESIGNS
        </h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="stage-img"
          src="/images/posters-slice.jpg"
          alt="Poster Designs — Curated series of 6 cinematic posters"
          loading="eager"
        />

        {/* Rotating star overlay — plain div handles stage positioning,
            motion.img inside handles ONLY the rotation. This prevents any
            Framer Motion transform interference with position:absolute. */}
        <div className="posters-rolling-star">
          <motion.img
            src="/images/about-star.png"
            alt=""
            aria-hidden="true"
            style={{
              rotate: starRotate,
              width: '100%',
              height: '100%',
              display: 'block',
              transformOrigin: 'center center',
            }}
          />
        </div>

        {/* Interactive Click Hotspots for Modal Zoom & Animation */}
        {POSTERS.map((poster) => {
          const isThisDetached = activePoster?.id === poster.id;
          /* Pendulum is disabled when the card is detached, animating, or settling */
          const pendulumDisabled = isThisDetached || phase !== 'idle' || justReturnedId === poster.id;
          /* Baked image clip coords — shows the actual card visual inside the rotating element */
          const cardBg = POSTER_CARD_BG[poster.id];
          return (
            <PendulumCard
              key={poster.id}
              positionClass={poster.className}
              disabled={pendulumDisabled}
            >
              <div
                ref={(el) => {
                  hotspotRefs.current[poster.id] = el;
                }}
                className={`poster-hotspot ${
                  isThisDetached ? 'is-detached' : ''
                } ${phase !== 'idle' ? 'is-animating' : ''} ${
                  justReturnedId === poster.id ? 'is-settling' : ''
                }`}
                role="button"
                tabIndex={phase === 'idle' ? 0 : -1}
                aria-label={poster.ariaLabel}
                onClick={() => handlePosterClick(poster)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePosterClick(poster);
                  }
                }}
              >
                {/* Card visual: clips the baked stage image so the real Polaroid
                    (frame + tape + shadow) lives inside the rotating element.
                    Hidden when detached — the flying clone takes over visually. */}
                {!isThisDetached && cardBg && (
                  <div
                    className="poster-card-visual"
                    aria-hidden="true"
                    style={{
                      backgroundPosition: `-${cardBg.x}px -${cardBg.y}px`,
                    }}
                  />
                )}

                {isThisDetached ? (
                  <div className="poster-recessed-slot" aria-hidden="true">
                    <span className="recessed-label">DETACHED</span>
                  </div>
                ) : (
                  <span className="hover-tag">{poster.tag}</span>
                )}
              </div>
            </PendulumCard>
          );
        })}
      </Stage>

      {/* Detached Flying Poster Portal Layer */}
      {mounted &&
        activePoster &&
        createPortal(
          <motion.div
            key={`flying-poster-${activePoster.id}`}
            className="poster-flying-clone"
            style={{
              left: activePoster.rect.left,
              top: activePoster.rect.top,
              width: activePoster.rect.width,
              height: activePoster.rect.height,
              transformOrigin: '50% 50%',
            }}
            initial={{
              y: 0,
              x: 0,
              rotate: 0,
              rotateX: 0,
              scale: 1,
            }}
            animate={
              phase === 'falling' || phase === 'modal-open'
                ? {
                    y:
                      typeof window !== 'undefined'
                        ? window.innerHeight - activePoster.rect.top + 90
                        : 1200,
                    x: activePoster.tilt * 3.5,
                    rotate: activePoster.tilt,
                    rotateX: 7,
                    scale: 1.02,
                  }
                : phase === 'returning'
                ? {
                    y: 0,
                    x: 0,
                    rotate: 0,
                    rotateX: 0,
                    scale: 1,
                  }
                : undefined
            }
            transition={
              phase === 'falling'
                ? {
                    duration: 0.75, // 750ms: cinematic gravity acceleration within 600-900ms
                    ease: [0.4, 0, 0.75, 0.1],
                  }
                : {
                    duration: 0.8, // 800ms: cinematic smooth return within 700-900ms
                    ease: [0.16, 1, 0.3, 1], // gentle deceleration into resting position, no overshoot
                  }
            }
            onAnimationComplete={() => {
              if (phase === 'falling') {
                setPhase('modal-open');
                onSelectPoster(
                  activePoster.highres,
                  activePoster.title,
                  activePoster.id
                );
              } else if (phase === 'returning') {
                const returnedId = activePoster.id;
                setJustReturnedId(returnedId);
                setPhase('idle');
                setActivePoster(null);
                onReturnComplete?.();
                setTimeout(() => {
                  setJustReturnedId((curr) => (curr === returnedId ? null : curr));
                }, 350);
              }
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activePoster.highres} alt={activePoster.title} />
          </motion.div>,
          document.body
        )}
    </section>
  );
}
