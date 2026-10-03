'use client';

import React, { useState } from 'react';

export default function Footer() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText('karunpandey66@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <footer className="site-footer" id="contact">
      <div className="footer-glow-line" aria-hidden="true" />
      <div className="footer-inner">
        {/* Top bar: Status & Callout */}
        <div className="footer-header">
          <div className="footer-status-pill">
            <span className="footer-status-dot" />
            <span className="footer-status-text">AVAILABLE FOR WORK</span>
          </div>
          <p className="footer-lead">
            Let&apos;s build something visually unforgettable.
          </p>
        </div>

        {/* Primary Contact Cards / Action Buttons */}
        <div className="footer-actions">
          {/* Email Action with Copy feedback */}
          <div className="footer-action-item footer-action-email">
            <a
              href="mailto:karunpandey66@gmail.com"
              className="footer-action-btn"
              aria-label="Send email to karunpandey66@gmail.com"
            >
              <svg
                className="footer-action-icon"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span className="footer-action-text">karunpandey66@gmail.com</span>
            </a>
            <button
              type="button"
              className="footer-copy-btn"
              onClick={handleCopyEmail}
              aria-label="Copy email address"
              title="Copy to clipboard"
            >
              {copied ? (
                <span className="footer-copy-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </span>
              ) : (
                <span className="footer-copy-idle">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  Copy
                </span>
              )}
            </button>
          </div>

          {/* Behance Action */}
          <a
            href="https://www.behance.net/karunpandey1"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-action-btn footer-action-behance"
            aria-label="Karun Pandey on Behance"
          >
            <svg
              className="footer-action-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7.74 10.3c.73-.24 1.25-.8 1.25-1.63 0-1.34-1.04-2.17-2.69-2.17H1.5v9h5.12c1.78 0 2.94-.96 2.94-2.5 0-1.28-.73-2.22-1.82-2.7zm-3.66-2.3h2.15c.67 0 1.13.34 1.13.98 0 .63-.46.99-1.13.99H4.08V8zm2.34 6.01H4.08v-2.34h2.34c.76 0 1.25.37 1.25 1.17 0 .8-.49 1.17-1.25 1.17zm11.39-3.79c-1.85 0-3.32 1.34-3.46 3.19h6.84c-.16-1.85-1.53-3.19-3.38-3.19zm3.43 4.29c-.31 1.63-1.74 2.8-3.48 2.8-2.23 0-3.79-1.73-3.79-3.9 0-2.25 1.63-3.98 3.79-3.98 2.27 0 3.71 1.76 3.59 4.29h-5.06c.09 1.13.98 1.94 2.14 1.94 1.05 0 1.78-.54 1.97-1.15h.84zm-5.63-5.91h4.4v1.07h-4.4V8.6z" />
            </svg>
            <span className="footer-action-text">Behance</span>
            <svg
              className="footer-action-arrow"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </a>
        </div>

        {/* Bottom Sub-bar */}
        <div className="footer-bottom">
          <div className="footer-brand">
            <span className="footer-brand-name">KARUN PANDEY</span>
            <span className="footer-brand-sep">•</span>
            <span className="footer-brand-role">GRAPHIC DESIGN &amp; ART</span>
          </div>

          <div className="footer-meta">
            <span className="footer-copyright">
              &copy; {new Date().getFullYear()} Karun Pandey. All Rights Reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
