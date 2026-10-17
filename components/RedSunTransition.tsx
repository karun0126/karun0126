'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export type TransitionDirection = 'left' | 'right' | 'center';

interface RedSunTransitionContextType {
  triggerTransition: (
    url: string,
    title?: string,
    direction?: TransitionDirection
  ) => void;
  isTransitioning: boolean;
  phase: 'idle' | 'covering' | 'covered' | 'going';
  direction: TransitionDirection;
}

const RedSunTransitionContext = createContext<RedSunTransitionContextType>({
  triggerTransition: () => {},
  isTransitioning: false,
  phase: 'idle',
  direction: 'center',
});

export function useRedSunTransition() {
  return useContext(RedSunTransitionContext);
}

// Critical above-the-fold hero assets preloaded for instant paint
const CRITICAL_ROUTE_ASSETS: Record<string, string[]> = {
  '/case-study/dead-signal': ['/images/dead-signal-01-intro.webp'],
  '/case-study/album-design': ['/images/nova-desktop-4.webp'],
  '/': ['/images/hero-clean-bg.jpg', '/images/case-study-desktop-33-bg.webp'],
};

function preloadImages(urls: string[]): Promise<void> {
  if (typeof window === 'undefined' || urls.length === 0) return Promise.resolve();
  return Promise.all(
    urls.map((src) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
        if (img.complete) resolve();
      });
    })
  ).then(() => {});
}

function waitForMountedPageImages(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }

    const checkDom = () => {
      const allImgs = Array.from(
        document.querySelectorAll<HTMLImageElement>(
          'main img, .stage-img, img[loading="eager"]'
        )
      );

      // Only check eager hero images to prevent stalling on deferred lazy images
      const eagerImgs = allImgs.filter((img) => img.loading !== 'lazy');
      const critical = eagerImgs.length > 0 ? eagerImgs : allImgs.slice(0, 1);

      if (critical.length === 0) {
        resolve();
        return;
      }

      const allDone = critical.every((img) => img.complete && img.naturalWidth > 0);
      if (allDone) {
        resolve();
        return;
      }

      let remaining = critical.filter((img) => !img.complete || img.naturalWidth === 0).length;
      if (remaining === 0) {
        resolve();
        return;
      }

      critical.forEach((img) => {
        if (!img.complete || img.naturalWidth === 0) {
          const onFinish = () => {
            remaining--;
            if (remaining <= 0) resolve();
          };
          img.addEventListener('load', onFinish, { once: true });
          img.addEventListener('error', onFinish, { once: true });
        }
      });

      setTimeout(resolve, 1500);
    };

    setTimeout(checkDom, 60);
  });
}

export function RedSunTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [phase, setPhase] = useState<'idle' | 'covering' | 'covered' | 'going'>('idle');
  const [direction, setDirection] = useState<TransitionDirection>('center');
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>('DEAD SIGNAL');
  const [projectSubtitle, setProjectSubtitle] = useState<string>('BRAND IDENTITY SYSTEM');
  const [projectCode, setProjectCode] = useState<string>('01');

  const navTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Complete transition: blooms outward and resets
  const completeTransition = useCallback((urlToNavigate: string) => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);

    // Scroll to anchor section if applicable (e.g. /#case-study)
    if (urlToNavigate.includes('#')) {
      const hash = urlToNavigate.split('#')[1];
      if (hash) {
        setTimeout(() => {
          const el =
            document.getElementById(hash) ||
            document.getElementById('case-study-showcase') ||
            document.getElementById('case-study');
          if (el) el.scrollIntoView({ behavior: 'instant' });
        }, 30);
      }
    }

    // Smooth, cinematic outward iris bloom reveal
    setTimeout(() => {
      setPhase('going');
      setTimeout(() => {
        setPhase('idle');
        setTargetUrl(null);
        if (typeof document !== 'undefined') {
          document.body.classList.remove('is-transitioning');
        }
      }, 750);
    }, 100);
  }, []);

  // Trigger high-performance Red Sun Iris transition
  const triggerTransition = useCallback(
    (url: string, title = 'CASE STUDY', explicitDirection?: TransitionDirection) => {
      if (phase === 'covering' || phase === 'covered') return;

      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);

      let dir: TransitionDirection = explicitDirection || 'center';
      let code = '01';
      let mainTitle = 'DEAD SIGNAL';
      let sub = 'BRAND IDENTITY & STREETWEAR SYSTEMS';

      if (url.includes('dead-signal') || title.includes('DEAD SIGNAL') || title.includes('01')) {
        code = '01';
        mainTitle = 'DEAD SIGNAL';
        sub = 'BRAND IDENTITY & STREETWEAR SYSTEMS';
      } else if (
        url.includes('album-design') ||
        title.includes('NOVA') ||
        title.includes('HALO') ||
        title.includes('02')
      ) {
        code = '02';
        mainTitle = 'HALO IN REVERSE';
        sub = 'STUDIO ALBUM VISUAL IDENTITY & PACKAGING';
      } else {
        code = '03';
        mainTitle = 'PORTFOLIO ARCHIVE';
        sub = 'SELECTED WORKS & CASE STUDIES';
      }

      setDirection(dir);
      setProjectCode(code);
      setProjectTitle(mainTitle);
      setProjectSubtitle(sub);
      setTargetUrl(url);
      setPhase('covering');

      if (typeof document !== 'undefined') {
        document.body.classList.add('is-transitioning');
      }

      startTimeRef.current = Date.now();

      // 1. Preload critical destination hero image
      const cleanUrl = url.split('#')[0] || '/';
      const criticalList = CRITICAL_ROUTE_ASSETS[cleanUrl] || [];
      preloadImages(criticalList);

      // 2. When red iris expands smoothly over the viewport (~650ms), navigate route
      navTimerRef.current = setTimeout(() => {
        setPhase('covered');
        if (url.startsWith('/#')) {
          router.push('/');
        } else {
          router.push(url);
        }
      }, 650);

      // 3. Fallback timer (5s max) prevents any freeze
      fallbackTimerRef.current = setTimeout(() => {
        completeTransition(url);
      }, 5000);
    },
    [phase, router, completeTransition]
  );

  // When pathname arrives at target URL, wait for ready state then bloom reveal
  useEffect(() => {
    if ((phase === 'covering' || phase === 'covered') && targetUrl) {
      const targetPath = targetUrl.split('#')[0] || '/';
      const isAtDestination =
        pathname === targetPath || (targetPath !== '/' && pathname.startsWith(targetPath));

      if (isAtDestination) {
        const cleanUrl = targetUrl.split('#')[0] || '/';
        const criticalList = CRITICAL_ROUTE_ASSETS[cleanUrl] || [];

        Promise.all([
          preloadImages(criticalList),
          waitForMountedPageImages(),
        ]).then(() => {
          const elapsed = Date.now() - startTimeRef.current;
          // Smooth, cinematic presentation: ~1200ms total duration
          const minPresentationTime = 1200;
          const remainingWait = Math.max(0, minPresentationTime - elapsed);

          setTimeout(() => {
            completeTransition(targetUrl);
          }, remainingWait);
        });
      }
    }
  }, [pathname, phase, targetUrl, completeTransition]);

  // Cleanup timers & remove body class on unmount
  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (typeof document !== 'undefined') {
        document.body.classList.remove('is-transitioning');
      }
    };
  }, []);

  const isTransitioning = phase !== 'idle';

  return (
    <RedSunTransitionContext.Provider
      value={{ triggerTransition, isTransitioning, phase, direction }}
    >
      {children}

      {/* ── Expanding Red Sun Iris Transition (Concentric Shockwaves & Kinetic Reveal) ── */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              pointerEvents: phase === 'going' ? 'none' : 'all',
              overflow: 'hidden',
              backgroundColor: 'transparent',
              isolation: 'isolate',
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
          >
            {/* ── 1. TRIPLE CONCENTRIC ECLIPSE SHOCKWAVE RINGS (Erupting Upward from Bottom Dome) ── */}
            {(phase === 'covering' || phase === 'covered') && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: 0,
                  transform: 'translate(-50%, 50%)',
                  width: 'max(150vw, 150vh)',
                  height: 'max(150vw, 150vh)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  overflow: 'visible',
                  zIndex: 8,
                }}
              >
                {/* Shockwave Ring 1 */}
                <motion.div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '2.5px solid rgba(255, 80, 80, 0.9)',
                    boxShadow: '0 0 60px rgba(229, 9, 20, 0.7), inset 0 0 40px rgba(229, 9, 20, 0.4)',
                  }}
                  initial={{ scale: 0.42, opacity: 0.95 }}
                  animate={{
                    scale: [0.42, 2.4],
                    opacity: [0.95, 0],
                  }}
                  transition={{
                    duration: 0.88,
                    ease: [0.2, 0.7, 0.3, 1],
                  }}
                />

                {/* Shockwave Ring 2 (Staggered by 100ms) */}
                <motion.div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '2px solid rgba(255, 140, 120, 0.8)',
                    boxShadow: '0 0 50px rgba(255, 80, 80, 0.5)',
                  }}
                  initial={{ scale: 0.4, opacity: 0.9 }}
                  animate={{
                    scale: [0.4, 2.2],
                    opacity: [0.9, 0],
                  }}
                  transition={{
                    delay: 0.1,
                    duration: 0.85,
                    ease: [0.2, 0.7, 0.3, 1],
                  }}
                />

                {/* Shockwave Ring 3 (Staggered by 200ms) */}
                <motion.div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '1.5px solid rgba(255, 200, 180, 0.7)',
                    boxShadow: '0 0 40px rgba(255, 100, 100, 0.4)',
                  }}
                  initial={{ scale: 0.38, opacity: 0.85 }}
                  animate={{
                    scale: [0.38, 2.0],
                    opacity: [0.85, 0],
                  }}
                  transition={{
                    delay: 0.2,
                    duration: 0.82,
                    ease: [0.2, 0.7, 0.3, 1],
                  }}
                />
              </div>
            )}

            {/* ── 2. THE RED SUN CIRCULAR IRIS (Swells from Bottom Dome with Aperture Spin) ── */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 0,
                transform: 'translate(-50%, 50%)',
                width: 'max(150vw, 150vh)',
                height: 'max(150vw, 150vh)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                overflow: 'visible',
                zIndex: 10,
              }}
            >
              <motion.div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle at 50% 50%, #ff2b2b 0%, #e50914 45%, #b50d12 75%, #850707 92%, #550404 100%)',
                  border: '2px solid rgba(255, 120, 120, 0.85)',
                  boxShadow:
                    '0 0 70px rgba(229, 9, 20, 0.9), 0 0 150px rgba(255, 50, 50, 0.6), inset 0 0 60px rgba(255, 90, 90, 0.35)',
                  transformOrigin: '50% 50%',
                  willChange: 'transform, opacity',
                }}
                initial={{
                  scale: 0.42,
                  rotate: -12,
                  opacity: 1,
                }}
                animate={
                  phase === 'covering'
                    ? {
                        scale: 1.85,
                        rotate: 0,
                        opacity: 1,
                        transition: {
                          duration: 0.85,
                          ease: [0.2, 0.7, 0.3, 1],
                        },
                      }
                    : phase === 'covered'
                    ? {
                        scale: 1.85,
                        rotate: 0,
                        opacity: 1,
                      }
                    : {
                        // Smooth, luxurious bloom outward past screen edges into destination
                        scale: 3.6,
                        rotate: 6,
                        opacity: 0,
                        transition: {
                          duration: 0.75,
                          ease: [0.33, 1, 0.68, 1],
                        },
                      }
                }
              />
            </div>

            {/* ── 3. DUAL-RING DISSIPATION SHOCKWAVES ON REVEAL (phase === 'going') ── */}
            {phase === 'going' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  overflow: 'hidden',
                  zIndex: 12,
                }}
              >
                {/* Dissipation Wave A */}
                <motion.div
                  style={{
                    position: 'absolute',
                    width: 'max(140vw, 140vh)',
                    height: 'max(140vw, 140vh)',
                    borderRadius: '50%',
                    border: '3px solid rgba(255, 60, 60, 0.9)',
                    boxShadow: '0 0 60px rgba(229, 9, 20, 0.6)',
                    transformOrigin: '50% 50%',
                  }}
                  initial={{ scale: 0.8, opacity: 1 }}
                  animate={{ scale: 3.8, opacity: 0 }}
                  transition={{ duration: 0.75, ease: [0.33, 1, 0.68, 1] }}
                />

                {/* Dissipation Wave B (Slight delay) */}
                <motion.div
                  style={{
                    position: 'absolute',
                    width: 'max(140vw, 140vh)',
                    height: 'max(140vw, 140vh)',
                    borderRadius: '50%',
                    border: '1.5px solid rgba(255, 150, 150, 0.7)',
                    transformOrigin: '50% 50%',
                  }}
                  initial={{ scale: 0.6, opacity: 0.85 }}
                  animate={{ scale: 4.2, opacity: 0 }}
                  transition={{ delay: 0.08, duration: 0.75, ease: [0.33, 1, 0.68, 1] }}
                />
              </div>
            )}

            {/* ── 4. Subtle Cinematic Grid & Texture Overlay ── */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
                pointerEvents: 'none',
                zIndex: 15,
              }}
              initial={{ opacity: 0 }}
              animate={
                phase === 'covering' || phase === 'covered'
                  ? { opacity: 0.45, transition: { duration: 0.4 } }
                  : { opacity: 0, transition: { duration: 0.4 } }
              }
            />

            {/* ── 5. Symmetrical Ghosted Stencil Watermark (Centered in Background) ── */}
            <motion.div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                height: 'min(45vh, 420px)',
                width: 'auto',
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 18,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                phase === 'covering' || phase === 'covered'
                  ? {
                      opacity: 0.08,
                      scale: 1,
                      transition: { delay: 0.2, duration: 0.45 },
                    }
                  : {
                      opacity: 0,
                      scale: 1.15,
                      transition: { duration: 0.35 },
                    }
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  projectCode === '01'
                    ? '/images/stencil-01-hd.png'
                    : projectCode === '02'
                    ? '/images/stencil-02-hd.png'
                    : '/images/case-study-star-center.png'
                }
                alt=""
                style={{
                  height: '100%',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'brightness(3)',
                }}
              />
            </motion.div>

            {/* ── 6. 100% SYMMETRICAL EDITORIAL MONOLITH TYPOGRAPHY WITH SMOOTH REVEAL ── */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '24px',
                color: '#ffffff',
                pointerEvents: 'none',
                zIndex: 25,
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '16px',
                  maxWidth: '850px',
                  width: '100%',
                }}
              >
                {/* 1. Kinetic Telemetry Tag with Pulsing Red LED */}
                <motion.div
                  initial={{ opacity: 0, y: -16, scale: 0.92 }}
                  animate={
                    phase === 'covering' || phase === 'covered'
                      ? {
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: { delay: 0.18, duration: 0.42, ease: 'easeOut' },
                        }
                      : {
                          opacity: 0,
                          y: -20,
                          scale: 0.92,
                          transition: { duration: 0.3 },
                        }
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 18px',
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.65)',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <motion.span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#e50914',
                    }}
                    animate={{
                      scale: [1, 1.45, 1],
                      opacity: [1, 0.6, 1],
                    }}
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <span>
                    {projectCode === '01'
                      ? '01 // DEAD SIGNAL'
                      : projectCode === '02'
                      ? '02 // HALO IN REVERSE'
                      : '03 // PORTFOLIO ARCHIVE'}
                  </span>
                </motion.div>

                {/* 2. Bold, Symmetrical Kinetic Headline with Masked Slide-Up */}
                <div style={{ overflow: 'hidden', padding: '4px 0' }}>
                  <motion.h2
                    initial={{ y: '105%', opacity: 0, letterSpacing: '-0.04em' }}
                    animate={
                      phase === 'covering' || phase === 'covered'
                        ? {
                            y: '0%',
                            opacity: 1,
                            letterSpacing: '-0.02em',
                            transition: {
                              delay: 0.15,
                              duration: 0.38,
                              ease: [0.16, 1, 0.3, 1],
                            },
                          }
                        : {
                            y: '-90%',
                            opacity: 0,
                            letterSpacing: '0.04em',
                            transition: { duration: 0.28, ease: 'easeIn' },
                          }
                    }
                    style={{
                      margin: 0,
                      fontSize: 'clamp(38px, 6vw, 76px)',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      color: '#ffffff',
                      lineHeight: 1.0,
                      textAlign: 'center',
                      textShadow: 'none',
                    }}
                  >
                    {projectTitle}
                  </motion.h2>
                </div>

                {/* 3. Symmetrical Editorial Subtitle with Kinetic Tracking Expansion */}
                <motion.p
                  initial={{ opacity: 0, y: 14, letterSpacing: '0.14em' }}
                  animate={
                    phase === 'covering' || phase === 'covered'
                      ? {
                          opacity: 0.92,
                          y: 0,
                          letterSpacing: '0.24em',
                          transition: {
                            delay: 0.22,
                            duration: 0.36,
                            ease: 'easeOut',
                          },
                        }
                      : {
                          opacity: 0,
                          y: -14,
                          transition: { duration: 0.25 },
                        }
                  }
                  style={{
                    margin: 0,
                    fontSize: 'clamp(11px, 1.1vw, 13px)',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.88)',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  {projectSubtitle}
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </RedSunTransitionContext.Provider>
  );
}
