import React from 'react';

export default function CartTable({ cart, totalAmount, updateQuantity, removeItem }) {
  return (
    <div style={{ backgroundColor: 'transparent', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', width: '100%' }}>
      <style>{`
        .compact-table { width: 100%; border-collapse: collapse; }
        .compact-table th { padding: 10px 4px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; border-bottom: 2px solid var(--border-color); text-align: left; }
        .compact-table td { padding: 10px 4px; font-size: 13px; font-weight: bold; color: var(--text-main); border-bottom: 1px solid rgba(148, 163, 184, 0.1); }
        .qty-btn { padding: 4px 8px; background: transparent; border: none; font-weight: bold; font-size: 14px; cursor: pointer; color: var(--text-main); }
        .qty-val { font-weight: bold; font-size: 13px; min-width: 18px; text-align: center; display: inline-block; color: var(--text-main); }
        .del-btn { background: #fee2e2; color: #ef4444; border: none; cursor: pointer; fontSize: 12px; padding: 5px 8px; borderRadius: 6px; }
        
        /* 📱 ULTRA COMPACT MOBILE VIEW (NO SCROLL) */
        @media (max-width: 600px) {
          .compact-table th { padding: 6px 2px !important; font-size: 9px !important; }
          .compact-table td { padding: 6px 2px !important; font-size: 10px !important; white-space: normal !important; word-wrap: break-word; }
          .qty-btn { padding: 2px 4px !important; font-size: 11px !important; }
          .qty-val { font-size: 10px !important; min-width: 12px !important; }
          .del-btn { padding: 3px 5px !important; font-size: 9px !important; }
          .item-name-cell { max-width: 80px; } /* Prevent long names from stretching */
        }
      `}</style>
      
      <table className="compact-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style={{textAlign: 'center'}}>Qty</th>
            <th style={{textAlign: 'right'}}>Price</th>
            <th style={{textAlign: 'center'}}>Del</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => (
            <tr key={index}>
              <td className="item-name-cell">{item.product_name || item.name}</td>
              <td style={{textAlign: 'center'}}>
                <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
                  <button onClick={() => updateQuantity(item.id, item.qty - 1)} className="qty-btn">-</button>
                  <span className="qty-val">{item.qty}</span>
                  <button onClick={() => updateQuantity(item.id, item.qty + 1)} className="qty-btn">+</button>
                </div>
              </td>
              <td style={{textAlign: 'right', color: '#10b981'}}>Rs. {(item.price * item.qty).toLocaleString()}</td>
              <td style={{textAlign: 'center'}}>
                <button onClick={() => removeItem(item.id)} className="del-btn">🗑️</button>
              </td>
            </tr>
          ))}
          {cart.length === 0 && (
            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '11px' }}>🛒 Tokri khali hai.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}