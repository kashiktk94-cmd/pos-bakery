import React, { useState, useRef } from 'react';

// 🌟 NAYA: Yahan humne 'cart' ko bhi import kar liya hai
export default function ScannerInput({ onScan, dbProducts = [], cart = [] }) {
  const [inputVal, setInputVal] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1); 
  const inputRef = useRef(null);

  // 🪄 THE MASTER TRICK: Live Stock Calculator
  const getLiveStock = (product) => {
    // Check karein ke tokri mein is item ke kitne piece hain
    const cartItem = cart.find(c => c.id === product.id);
    const inCartQty = cartItem ? cartItem.qty : 0;
    // Asal stock mein se tokri wala stock minus kar dein
    return product.quantity - inCartQty;
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setInputVal(val);
    setSelectedIndex(-1); 
    
    if (val.trim().length > 0) {
      const safeProducts = Array.isArray(dbProducts) ? dbProducts : [];
      const filtered = safeProducts.filter(p => {
        const itemName = String(p.product_name || p.name || "").toLowerCase(); 
        const barcodeStr = p.barcode ? String(p.barcode) : ""; 
        return itemName.includes(val.toLowerCase()) || barcodeStr.includes(val);
      });
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault(); 
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
      return;
    }
    
    if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex].id);
        return;
      }

      const safeProducts = Array.isArray(dbProducts) ? dbProducts : [];
      const exactMatch = safeProducts.find(p => p.barcode && String(p.barcode) === inputVal.trim());
      
      if (exactMatch) {
        handleSelect(exactMatch.id);
      } else if (suggestions.length === 1) {
        handleSelect(suggestions[0].id);
      }
    }
  };

  const handleSelect = (id) => {
    onScan(id);
    setInputVal(''); 
    setSuggestions([]); 
    setSelectedIndex(-1);
    inputRef.current?.focus(); 
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px' }}>
        Barcode Scan Karein YA Naam Likhein:
      </label>
      <input
        ref={inputRef}
        type="text"
        placeholder="Maslan: cake, fans, ya Barcode..."
        value={inputVal}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        style={{ width: '100%', padding: '16px', fontSize: '18px', borderRadius: '12px', border: '2px solid #3b82f6', outline: 'none', fontWeight: 'bold', background: 'var(--card-bg)', color: 'var(--text-main)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}
        autoFocus
      />
      
      {suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card-bg)', border: '1px solid #3b82f6', borderRadius: '12px', maxHeight: '250px', overflowY: 'auto', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', marginTop: '8px', overflow: 'hidden' }}>
          {suggestions.map((s, index) => {
            const isSelected = index === selectedIndex;
            const liveStock = getLiveStock(s); // Live stock function call
            const isOutOfStock = liveStock <= 0;

            return (
              <div 
                key={s.id} 
                onClick={() => handleSelect(s.id)}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{ 
                  padding: '12px 15px', 
                  borderBottom: '1px solid var(--border-color)', 
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontWeight: 'bold', 
                  color: isSelected ? '#fff' : (isOutOfStock ? '#ef4444' : 'var(--text-main)'),
                  background: isSelected && !isOutOfStock ? '#3b82f6' : (isOutOfStock && isSelected ? '#7f1d1d' : 'transparent'), 
                  transition: 'background 0.1s ease',
                  opacity: isOutOfStock ? 0.7 : 1
                }}
              >
                <span>
                  {s.product_name || s.name || "Unknown Item"} 
                  <span style={{fontSize:'11px', color: isSelected ? '#e0e7ff' : (isOutOfStock ? '#ef4444' : '#64748b'), marginLeft:'8px'}}>
                    {/* YAHAN AB "LIVE STOCK" SHOW HOGA */}
                    ({isOutOfStock ? '⚠️ Out of Stock' : `Live Stock: ${liveStock}`})
                  </span>
                </span>
                <span style={{ color: isSelected ? '#fff' : '#10b981', fontWeight: '900' }}>
                  Rs. {s.price}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}