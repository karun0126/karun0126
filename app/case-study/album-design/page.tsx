'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import Stage from '@/components/Stage';
import ProgressBar from '@/components/ProgressBar';
import BackToTop from '@/components/BackToTop';
import Footer from '@/components/Footer';
import { useRedSunTransition } from '@/components/RedSunTransition';

export default function AlbumDesignCaseStudyPage() {
  const shouldReduceMotion = useReducedMotion();
  const { triggerTransition } = useRedSunTransition();

  const handleBackToPortfolio = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerTransition('/#case-study', '03 // CASE STUDY SHOWCASE', 'right');
  };

  const handlePrevProject = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerTransition('/case-study/dead-signal', '01 // DEAD SIGNAL', 'left');
  };

  return (
    <>
      <ProgressBar />
      <BackToTop />

      {/* Floating Header Navigation (Full-Size Case Study Shell) */}
      <header className="case-study-nav-bar">
        <div className="case-study-nav-inner">
          <Link
            href="/#case-study"
            onClick={handleBackToPortfolio}
            className="case-study-back-btn"
          >
            <span className="back-arrow">←</span>
            <span>BACK TO PORTFOLIO</span>
          </Link>

          <div className="case-study-nav-title">
            <span className="case-study-badge">02 // ALBUM DESIGN</span>
            <span className="case-study-name">HALO IN REVERSE</span>
          </div>

          <Link
            href="/case-study/dead-signal"
            onClick={handlePrevProject}
            className="case-study-next-btn"
          >
            <span>PREV PROJECT</span>
            <span className="next-arrow">←</span>
          </Link>
        </div>
      </header>

      {/* Main Full-Size Case Study Chapters (Edge-to-Edge like Branding) */}
      <main className="case-study-page-main">
        <section
          className="case-study-chapter"
          aria-label="Halo in Reverse — Nova Studio Album Complete Visual Identity Case Study"
        >
          <h1 className="sr-only">HALO IN REVERSE — NOVA ALBUM DESIGN CASE STUDY</h1>

          {/* CHAPTER 1: Desktop - 4 (Hero Ripples Presentation) */}
          <div className="cs-frame cs-frame-nova-1024">
            <Stage baseWidth={1440} baseHeight={1024}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="stage-img"
                src="/images/nova-desktop-4.webp"
                alt="Halo in Reverse — Nova Studio Album Visual Presentation"
                loading="eager"
                decoding="async"
              />
            </Stage>
          </div>

          {/* CHAPTER 2: Desktop - 5 (Jewel Case with Rotating CD Behind the Cassette) */}
          <div className="cs-frame cs-frame-nova-1024">
            <Stage
              baseWidth={1440}
              baseHeight={1024}
              style={{ background: '#141414' }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '1440px',
                  height: '1024px',
                  background: '#141414',
                  overflow: 'hidden',
                }}
              >
                {/* 1. Rotating CD Disc (Placed BEHIND the cassette, exactly as in Figma) */}
                <div
                  style={{
                    position: 'absolute',
                    left: '723.92px',
                    top: '512px',
                    transform: 'translate(-50%, -50%)',
                    width: '531.23px',
                    height: '531.23px',
                    zIndex: 1,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <motion.img
                    src="/images/nova-cd-disc-hq.webp"
                    alt="Halo in Reverse Nova Rotating Compact Disc"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transformOrigin: '50% 50%',
                      willChange: 'transform',
                      display: 'block',
                    }}
                    animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 18,
                      ease: 'linear',
                    }}
                  />
                </div>

                {/* 2. Clear Plastic Cassette Jewel Box (Placed IN FRONT with Screen blend mode) */}
                <div
                  style={{
                    position: 'absolute',
                    left: '720.19px',
                    top: '512px',
                    transform: 'translate(-50%, -50%)',
                    width: '544.38px',
                    height: '654px',
                    zIndex: 2,
                    pointerEvents: 'none',
                    mixBlendMode: 'screen',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/nova-cassette-case.webp"
                    alt="Halo in Reverse Nova Clear Cassette Jewel Case"
                    loading="eager"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>
              </div>
            </Stage>
          </div>

          {/* CHAPTER 3: Desktop - 6 (Story & Music Player Showcase) */}
          <div className="cs-frame cs-frame-nova-1024">
            <Stage baseWidth={1440} baseHeight={1024}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="stage-img"
                src="/images/nova-desktop-6.webp"
                alt="Nova Album Track Showcase and Music Player Interface"
                loading="lazy"
                decoding="async"
              />
            </Stage>
          </div>

          {/* CHAPTER 4: Desktop - 7 (Translucent Vinyl & Back Cover Tracklist) */}
          <div className="cs-frame cs-frame-nova-1024">
            <Stage baseWidth={1440} baseHeight={1024}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="stage-img"
                src="/images/nova-desktop-7.webp"
                alt="Halo in Reverse Nova Translucent Purple Vinyl and Complete Tracklist Back Cover"
                loading="lazy"
                decoding="async"
              />
            </Stage>
          </div>
        </section>

        {/* Next Project Teaser Card */}
        <section className="case-study-next-project-teaser">
          <div className="next-teaser-inner">
            <span className="next-teaser-label">NEXT CASE STUDY // 01</span>
            <h2 className="next-teaser-title">DEAD SIGNAL</h2>
            <p className="next-teaser-subtitle">
              Visual Identity, Streetwear Apparel Systems &amp; Spatial Mockup Architecture
            </p>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/case-study/dead-signal"
                onClick={handlePrevProject}
                className="next-teaser-btn"
              >
                <span>EXPLORE DEAD SIGNAL</span>
                <span className="btn-arrow">➔</span>
              </Link>

              <Link
                href="/#case-study"
                onClick={handleBackToPortfolio}
                className="next-teaser-btn"
                style={{ borderColor: 'rgba(255,255,255,0.2)' }}
              >
                <span>BACK TO PORTFOLIO</span>
                <span className="btn-arrow">↑</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
