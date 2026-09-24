'use client';

import React, { useEffect, useState } from 'react';
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

  /* Active section detection via IntersectionObserver */
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
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
