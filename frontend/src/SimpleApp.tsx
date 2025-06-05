import React from 'react';

const SimpleApp: React.FC = () => {
  console.log('🎉 SimpleApp component is rendering!');
  console.log('Environment variables:', {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    NODE_ENV: import.meta.env.NODE_ENV
  });

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#1f2937', marginBottom: '1rem' }}>
          🎉 SwiftNotes Frontend is Working!
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          This confirms that React, TypeScript, and Vite are all functioning correctly.
        </p>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: '#059669', fontSize: '14px' }}>✅ React is working</p>
          <p style={{ color: '#059669', fontSize: '14px' }}>✅ TypeScript is working</p>
          <p style={{ color: '#059669', fontSize: '14px' }}>✅ Vite dev server is working</p>
          <p style={{ color: '#059669', fontSize: '14px' }}>✅ Hot module replacement is working</p>
        </div>
        <button 
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={() => alert('Button clicked! JavaScript is working!')}
        >
          Test Button
        </button>
      </div>
    </div>
  );
};

export default SimpleApp;
