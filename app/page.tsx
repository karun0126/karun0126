'use client';

import React, { useState } from 'react';
import ProgressBar from '@/components/ProgressBar';
import HudNav from '@/components/HudNav';
import BackToTop from '@/components/BackToTop';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import PostersSection, { POSTERS } from '@/components/PostersSection';
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

  const currentPosterIndex = POSTERS.findIndex((p) => p.id === lightbox.posterId);

  const handleNextPoster = () => {
    if (currentPosterIndex === -1) return;
    const nextIdx = (currentPosterIndex + 1) % POSTERS.length;
    const nextPoster = POSTERS[nextIdx];
    setLightbox({
      isOpen: true,
      imgSrc: nextPoster.highres,
      caption: nextPoster.title,
      posterId: nextPoster.id,
    });
  };

  const handlePrevPoster = () => {
    if (currentPosterIndex === -1) return;
    const prevIdx = (currentPosterIndex - 1 + POSTERS.length) % POSTERS.length;
    const prevPoster = POSTERS[prevIdx];
    setLightbox({
      isOpen: true,
      imgSrc: prevPoster.highres,
      caption: prevPoster.title,
      posterId: prevPoster.id,
    });
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

      {/* Artwork Inspector Lightbox Modal with Mobile Touch & Navigation */}
      <LightboxModal
        isOpen={lightbox.isOpen}
        imgSrc={lightbox.imgSrc}
        caption={lightbox.caption}
        posterId={lightbox.posterId}
        currentIndex={currentPosterIndex}
        totalCount={POSTERS.length}
        onNext={handleNextPoster}
        onPrev={handlePrevPoster}
        onClose={handleCloseLightbox}
      />

      {/* Site Footer */}
      <Footer />
    </>
  );
}
