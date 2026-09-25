'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'hero',       label: '00 Home'       },
  { id: 'about',      label: '01 About'      },
  { id: 'posters',    label: '02 Posters'    },
  { id: 'case-study', label: '03 Dead Signal' },
  { id: 'sketchbook', label: '04 Sketchbook' },
];

export default function HudNav() {
  const [activeId,  setActiveId]  = useState<string>('hero');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const isManualScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* Robust active section detection via viewport focal line */
  useEffect(() => {
    let ticking = false;

    const updateActiveSection = () => {
      // 1. If at/near top of page -> Hero
      if (window.scrollY < 100) {
        setActiveId('hero');
        return;
      }

      // 2. If near the bottom of the page -> last section (Sketchbook)
      const windowHeight = window.innerHeight;
      const scrollPosition = window.scrollY + windowHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (docHeight - scrollPosition < 80) {
        setActiveId(NAV_ITEMS[NAV_ITEMS.length - 1].id);
        return;
      }

      // 3. Focal line: 35% from the top of the viewport
      // Matches the user's natural viewing area
      const focalLine = windowHeight * 0.35;

      // Find which section currently encompasses the focal line
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= focalLine && rect.bottom > focalLine) {
          setActiveId(item.id);
          return;
        }
      }

      // 4. Fallback in case of rapid scrolling: pick section closest to focal line
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
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Run on mount to detect active section immediately
    updateActiveSection();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Cancel manual scroll lock if user wheels or touches manually
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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveId(id);
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

  /* Bubble follows hovered item, falls back to active */
  const bubbleTarget = hoveredId ?? activeId;

  return (
    /*
     * CENTERING STRATEGY — two-layer approach to avoid the glitch:
     *
     * Layer 1 (.hud-nav-shell): plain <div>, position:fixed, left:50%,
     *   transform:translateX(-50%). Never animated. Never re-rendered by FM.
     *   This is the permanent center anchor.
     *
     * Layer 2 (motion.nav .hud-nav): handles the ONE-TIME slide-in entry
     *   via `initial/animate` (translateY only, no X). Also handles
     *   whileHover scale. Because this element is NOT responsible for
     *   centering, its transforms never interfere with left:50% centering.
     */
    <div className="hud-nav-shell">
      <motion.nav
        className="hud-nav"
        aria-label="Main Navigation"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        whileHover={{
          scale: 1.045,
          transition: { type: 'spring', stiffness: 340, damping: 28 },
        }}
        onHoverEnd={() => setHoveredId(null)}
      >
        <span className="hud-logo">KRXN</span>

        {NAV_ITEMS.map((item) => {
          const isActive  = activeId   === item.id;
          const isBubble  = bubbleTarget === item.id;

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`hud-link${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={(e) => handleNavClick(e, item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {isBubble && (
                <motion.span
                  className="hud-bubble"
                  layoutId="hud-bubble"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 30,
                    mass: 0.8,
                  }}
                />
              )}
              <span className="hud-link-text">{item.label}</span>
            </a>
          );
        })}
      </motion.nav>
    </div>
  );
}
