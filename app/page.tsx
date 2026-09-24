'use client';

import React, { useState } from 'react';
import ProgressBar from '@/components/ProgressBar';
import HudNav from '@/components/HudNav';
import BackToTop from '@/components/BackToTop';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import PostersSection from '@/components/PostersSection';
import CaseStudySection from '@/components/CaseStudySection';
import SketchbookSection from '@/components/SketchbookSection';
import LightboxModal from '@/components/LightboxModal';
import Footer from '@/components/Footer';

export default function Home() {
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    imgSrc: string;
    caption: string;
    posterId?: string;
  }>({
    isOpen: false,
    imgSrc: '',
    caption: '',
    posterId: undefined,
  });

  const handleOpenLightbox = (imgSrc: string, caption: string, posterId: string) => {
    setLightbox({
      isOpen: true,
      imgSrc,
      caption,
      posterId,
    });
  };

  const handleCloseLightbox = () => {
    setLightbox((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  return (
    <>
      {/* Top Reading Progress Bar */}
      <ProgressBar />

      {/* Floating HUD Navigation */}
      <HudNav />

      {/* Floating Back to Top Button */}
      <BackToTop />

      {/* Main Portfolio Sections */}
      <main id="main-content">
        {/* 00: Hero */}
        <HeroSection />

        {/* 01: About Me */}
        <AboutSection />

        {/* 02: Poster Showcase */}
        <PostersSection
          onSelectPoster={handleOpenLightbox}
          isModalOpen={lightbox.isOpen}
        />

        {/* 03: Dead Signal Case Study */}
        <CaseStudySection />

        {/* 04: Sketchbook & Original Works */}
        <SketchbookSection />
      </main>

      {/* Artwork Inspector Lightbox Modal */}
      <LightboxModal
        isOpen={lightbox.isOpen}
        imgSrc={lightbox.imgSrc}
        caption={lightbox.caption}
        onClose={handleCloseLightbox}
      />

      {/* Site Footer */}
      <Footer />
    </>
  );
}
