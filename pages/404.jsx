import React from 'react';
import Head from 'next/head';

const Custom404 = () => {
  return (
    <>
      <Head>
        <title>404: This page could not be found</title>
        <style>{`
          body { margin: 0; }
          @media (prefers-color-scheme: dark) {
            body { background: #000 !important; }
            .next-error-container { background: #000 !important; color: #fff !important; }
            .next-error-h1 { border-right-color: rgba(255, 255, 255, 0.3) !important; }
          }
        `}</style>
      </Head>
      <div
        className="next-error-container"
        style={{
          fontFamily:
            'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
          height: '100vh',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          color: '#000',
        }}
      >
        <div style={{ lineHeight: '48px' }}>
          <h1
            className="next-error-h1"
            style={{
              display: 'inline-block',
              margin: '0 20px 0 0',
              paddingRight: '23px',
              fontSize: '24px',
              fontWeight: 500,
              verticalAlign: 'top',
              borderRight: '1px solid rgba(0, 0, 0, 0.3)',
            }}
          >
            404
          </h1>
          <div style={{ display: 'inline-block' }}>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 400,
                lineHeight: '28px',
                margin: 0,
              }}
            >
              This page could not be found.
            </h2>
          </div>
        </div>
      </div>
    </>
  );
};

export default Custom404;
