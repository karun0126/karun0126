'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Stage from '@/components/Stage';
import ProgressBar from '@/components/ProgressBar';
import BackToTop from '@/components/BackToTop';
import Footer from '@/components/Footer';
import { useRedSunTransition } from '@/components/RedSunTransition';

interface Chapter {
  id: string;
  height: number;
  frameClass: string;
  imgSrc: string;
  alt: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 'intro',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-01-intro.webp',
    alt: 'Dead Signal Brand Introduction',
  },
  {
    id: 'philosophy',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-02-philosophy.webp',
    alt: 'Dead Signal Brand Philosophy and Visual Identity',
  },
  {
    id: 'values',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-03-values.webp',
    alt: 'Dead Signal Core Values and Mission',
  },
  {
    id: 'personality',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-04-personality.webp',
    alt: 'Dead Signal Brand Personality — Bold, Mysterious, Cinematic',
  },
  {
    id: 'lookbook',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-05-lookbook.webp',
    alt: 'Dead Signal Streetwear and Apparel Lookbook',
  },
  {
    id: 'showcase1',
    height: 1080,
    frameClass: 'cs-frame-1080',
    imgSrc: '/images/dead-signal-06-showcase1.webp',
    alt: 'Dead Signal Visual Showcase',
  },
  {
    id: 'showcase2',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-07-showcase2.webp',
    alt: 'Dead Signal Visual Showcase II',
  },
  {
    id: 'mascot-newm',
    height: 2730,
    frameClass: 'cs-frame-2730',
    imgSrc: '/images/dead-signal-08-mascot-newm.webp',
    alt: 'Introducing NEWM — The little face behind every fresh idea. Curious. Creative. New.',
  },
  {
    id: 'mascot-shy',
    height: 2730,
    frameClass: 'cs-frame-2730',
    imgSrc: '/images/dead-signal-09-mascot-shy.webp',
    alt: "NEWM Mascot Story — he's Shyy and hurry uppp!",
  },
  {
    id: 'color-theory',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-10-color-theory.webp',
    alt: 'Dead Signal Color Theory — A restrained palette built on contrast, hierarchy and emotion',
  },
  {
    id: 'color-system',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-11-color-system.webp',
    alt: 'Dead Signal Color System — Depth, Clarity, Danger, Energy',
  },
  {
    id: 'typography',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-12-typography.webp',
    alt: 'Dead Signal Typography — Libre Bodoni Typeface and Brand Manifesto',
  },
  {
    id: 'frame87',
    height: 15019,
    frameClass: 'cs-frame-15019',
    imgSrc: '/images/frame87-full.webp',
    alt: 'Dead Signal Complete Mockup, Apparel, Packaging and Footwear Collection',
  },
];

export default function DeadSignalCaseStudyPage() {
  const { triggerTransition } = useRedSunTransition();

  const handleBackToPortfolio = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerTransition('/#case-study', '03 // CASE STUDY SHOWCASE', 'left');
  };

  const handleNextProject = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerTransition('/case-study/album-design', '02 // HALO IN REVERSE', 'right');
  };

  return (
    <>
      <ProgressBar />
      <BackToTop />

      {/* Floating Header Navigation */}
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
            <span className="case-study-badge">01 // BRAND IDENTITY</span>
            <span className="case-study-name">DEAD SIGNAL</span>
          </div>

          <Link
            href="/case-study/album-design"
            onClick={handleNextProject}
            className="case-study-next-btn"
          >
            <span>NEXT PROJECT</span>
            <span className="next-arrow">→</span>
          </Link>
        </div>
      </header>

      {/* Main Case Study Content */}
      <main className="case-study-page-main">
        <section className="case-study-chapter" aria-label="Dead Signal Brand Identity Case Study">
          <h1 className="sr-only">DEAD SIGNAL — BRAND IDENTITY CASE STUDY</h1>

          {CHAPTERS.map((chapter) => (
            <div key={chapter.id} className={`cs-frame ${chapter.frameClass}`}>
              <Stage baseHeight={chapter.height}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="stage-img"
                  src={chapter.imgSrc}
                  alt={chapter.alt}
                  loading={chapter.id === 'intro' ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </Stage>
            </div>
          ))}
        </section>

        {/* Next Project Teaser Card */}
        <section className="case-study-next-project-teaser">
          <div className="next-teaser-inner">
            <span className="next-teaser-label">NEXT CASE STUDY // 02</span>
            <h2 className="next-teaser-title">HALO IN REVERSE</h2>
            <p className="next-teaser-subtitle">
              NOVA — Studio Album Visual Identity, Translucent Purple Vinyl &amp; Packaging
            </p>

            <Link
              href="/case-study/album-design"
              onClick={handleNextProject}
              className="next-teaser-btn"
            >
              <span>EXPLORE ALBUM DESIGN</span>
              <span className="btn-arrow">➔</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
