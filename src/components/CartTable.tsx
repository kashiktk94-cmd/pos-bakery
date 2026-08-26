import React from 'react';

export default function CartTable({ cart, totalAmount, updateQuantity, removeItem }) {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 5px' }}>Item Ka Naam</th>
            <th style={{ padding: '12px 5px', textAlign: 'center' }}>Tadaad (Qty)</th>
            <th style={{ padding: '12px 5px', textAlign: 'right' }}>Price</th>
            <th style={{ padding: '12px 5px', textAlign: 'center' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #f8fafc', transition: 'background-color 0.2s' }}>
              <td style={{ padding: '12px 5px', fontWeight: 'bold', color: '#0f172a' }}>{item.product_name || item.name}</td>
              
              <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                {/* 🌟 NAYA: Quantity change karne ke + aur - buttons */}
                <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                  <button 
                    onClick={() => updateQuantity(item.id, item.qty - 1)} 
                    style={{ padding: '6px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#475569' }}>
                    -
                  </button>
                  <span style={{ fontWeight: 'bold', fontSize: '15px', minWidth: '24px', textAlign: 'center', color: '#0f172a' }}>
                    {item.qty}
                  </span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.qty + 1)} 
                    style={{ padding: '6px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#475569' }}>
                    +
                  </button>
                </div>
              </td>
              
              <td style={{ padding: '12px 5px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                Rs. {(item.price * item.qty).toLocaleString()}
              </td>
              
              <td style={{ padding: '12px 5px', textAlign: 'center' }}>
                {/* 🌟 NAYA: Item ko delete karne ka button */}
                <button 
                  onClick={() => removeItem(item.id)} 
                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '6px 10px', borderRadius: '6px' }} 
                  title="Tokri se nikal dein">
                  🗑️
                </button>
              </td>
            </tr>
          ))}
          {cart.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                🛒 Tokri khali hai. Scanner ya Quick Buttons istemal karein.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}