import React from 'react';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      <h2>404 - Page Not Found</h2>
      <p style={{ marginTop: '10px', color: '#888' }}>The requested resource could not be found.</p>
      <a href="/" style={{ marginTop: '20px', color: '#e50914', textDecoration: 'none' }}>
        Return Home
      </a>
    </div>
  );
}
