'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Stage from './Stage';

export default function SketchbookSection() {
  return (
    <motion.section
      id="sketchbook"
      className="sketchbook-section"
      aria-label="Original Sketches and Sketchbook"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2 className="sr-only">04 SKETCHBOOK & ORIGINAL ARTWORKS</h2>

      <div className="sketchbook-full-frame">
        <Stage baseHeight={6398}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="stage-img"
            src="/images/sketchbook-full.jpg"
            alt="Original Sketches — Complete Hand-drawn Artworks, Studies and Sketchbook Collection by Karun"
            loading="eager"
          />
        </Stage>
      </div>
    </motion.section>
  );
}
