'use client';

import React from 'react';

export default function Footer() {
  const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-logo">KARUN PANDEY</div>
        <div className="footer-quote">
          Every image tells a story. Every story leaves a mark.
        </div>
        <div className="footer-links">
          <a href="#hero" onClick={scrollToTop}>
            Back to Top
          </a>
          <a href="mailto:karunpandey@example.com">Email</a>
          <a href="https://behance.net" target="_blank" rel="noopener noreferrer">
            Behance
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </div>
        <div className="footer-copy">
          &copy; {new Date().getFullYear()} Karun Pandey. All Rights Reserved. Designed with purpose. Built to leave a SIGNAL.
        </div>
      </div>
    </footer>
  );
}
