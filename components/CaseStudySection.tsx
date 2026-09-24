'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Stage from './Stage';

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
    imgSrc: '/images/dead-signal-01-intro.jpg',
    alt: 'Dead Signal Brand Introduction',
  },
  {
    id: 'philosophy',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-02-philosophy.jpg',
    alt: 'Dead Signal Brand Philosophy and Visual Identity',
  },
  {
    id: 'values',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-03-values.jpg',
    alt: 'Dead Signal Core Values and Mission',
  },
  {
    id: 'personality',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-04-personality.jpg',
    alt: 'Dead Signal Brand Personality — Bold, Mysterious, Cinematic',
  },
  {
    id: 'lookbook',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-05-lookbook.jpg',
    alt: 'Dead Signal Streetwear and Apparel Lookbook',
  },
  {
    id: 'showcase1',
    height: 1080,
    frameClass: 'cs-frame-1080',
    imgSrc: '/images/dead-signal-06-showcase1.jpg',
    alt: 'Dead Signal Visual Showcase',
  },
  {
    id: 'showcase2',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-07-showcase2.jpg',
    alt: 'Dead Signal Visual Showcase II',
  },
  {
    id: 'mascot-newm',
    height: 2730,
    frameClass: 'cs-frame-2730',
    imgSrc: '/images/dead-signal-08-mascot-newm.jpg',
    alt: 'Introducing NEWM — The little face behind every fresh idea. Curious. Creative. New.',
  },
  {
    id: 'mascot-shy',
    height: 2730,
    frameClass: 'cs-frame-2730',
    imgSrc: '/images/dead-signal-09-mascot-shy.jpg',
    alt: 'NEWM Mascot Story — he\'s Shyy and hurry uppp!',
  },
  {
    id: 'color-theory',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-10-color-theory.jpg',
    alt: 'Dead Signal Color Theory — A restrained palette built on contrast, hierarchy and emotion',
  },
  {
    id: 'color-system',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-11-color-system.jpg',
    alt: 'Dead Signal Color System — Depth, Clarity, Danger, Energy',
  },
  {
    id: 'typography',
    height: 1365,
    frameClass: 'cs-frame-1365',
    imgSrc: '/images/dead-signal-12-typography.jpg',
    alt: 'Dead Signal Typography — Libre Bodoni Typeface and Brand Manifesto',
  },
  {
    id: 'frame87',
    height: 15019,
    frameClass: 'cs-frame-15019',
    imgSrc: '/images/frame87-full.jpg',
    alt: 'Dead Signal Complete Mockup, Apparel, Packaging and Footwear Collection',
  },
];

export default function CaseStudySection() {
  return (
    <motion.section
      id="case-study"
      className="case-study-chapter"
      aria-label="Dead Signal Brand Identity Case Study"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2 className="sr-only">03 CASE STUDY: DEAD SIGNAL</h2>

      {CHAPTERS.map((chapter) => (
        <motion.div
          key={chapter.id}
          className={`cs-frame ${chapter.frameClass}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Stage baseHeight={chapter.height}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="stage-img"
              src={chapter.imgSrc}
              alt={chapter.alt}
              loading="lazy"
            />
          </Stage>
        </motion.div>
      ))}
    </motion.section>
  );
}
