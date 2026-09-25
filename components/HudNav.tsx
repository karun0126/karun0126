'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'hero',       label: '00 Home',       short: 'Home'       },
  { id: 'about',      label: '01 About',      short: 'About'      },
  { id: 'posters',    label: '02 Posters',    short: 'Posters'    },
  { id: 'case-study', label: '03 Dead Signal', short: 'Signal'     },
  { id: 'sketchbook', label: '04 Sketchbook', short: 'Sketches'   },
];

export default function HudNav() {
  const [activeId,  setActiveId]  = useState<string>('hero');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    updateActiveSection();

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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
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

  const bubbleTarget = hoveredId ?? activeId;
  const currentActiveItem = NAV_ITEMS.find((item) => item.id === activeId);

  return (
    <>
      {/* ── DESKTOP FLOATING HUD NAVIGATION (>= 768px) ── */}
      <div className="hud-nav-shell hud-desktop-nav">
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
                <span className="hud-mobile-drawer-status">KRXN // 2026</span>
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
                    >
                      <span className="hud-mobile-link-num">0{idx}</span>
                      <span className="hud-mobile-link-title">
                        {item.label.replace(/^0\d\s+/, '')}
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
