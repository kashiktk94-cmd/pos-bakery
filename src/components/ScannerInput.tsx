import React, { useState, useRef, useEffect } from 'react';

export default function ScannerInput({ onScan }) {
  const [code, setCode] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim()) {
      onScan(code.trim());
      setCode('');
    }
  };

  const styles = {
    box: { 
      backgroundColor: 'white', 
      padding: 'clamp(12px, 3vw, 20px)', // Screen ke hisab se padding khud adjust hogi
      borderRadius: '10px', 
      marginBottom: '20px', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      width: '100%',
      boxSizing: 'border-box'
    },
    title: { 
      marginTop: 0, 
      color: '#334155',
      fontSize: 'clamp(16px, 2.5vw, 20px)' // Font size responsive kar diya
    },
    input: { 
      width: '100%', 
      padding: 'clamp(10px, 2vw, 15px)', // Choti screen par input comfortable rahegi
      fontSize: 'clamp(16px, 2vw, 20px)', 
      borderRadius: '8px', 
      border: '2px solid #3b82f6', 
      outline: 'none',
      boxSizing: 'border-box'
    }
  };

  return (
    <div style={styles.box}>
      <h3 style={styles.title}>📟 Barcode Scanner</h3>
      <form onSubmit={handleSubmit}>
        <input 
          ref={inputRef}
          type="text" 
          value={code} 
          onChange={(e) => setCode(e.target.value)} 
          placeholder="Yahan click karein aur saman scan karein..." 
          style={styles.input}
          autoFocus
        />
      </form>
    </div>
  );
}