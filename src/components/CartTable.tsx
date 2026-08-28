import React from 'react';

export default function CartTable({ cart, totalAmount, updateQuantity, removeItem }) {
  return (
    <div style={{ backgroundColor: 'transparent', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '320px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '10px 5px' }}>Item</th>
            <th style={{ padding: '10px 5px', textAlign: 'center' }}>Qty</th>
            <th style={{ padding: '10px 5px', textAlign: 'right' }}>Price</th>
            <th style={{ padding: '10px 5px', textAlign: 'center' }}>Del</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)', transition: 'background-color 0.2s' }}>
              <td style={{ padding: '10px 5px', fontWeight: 'bold', color: 'var(--text-main)', fontSize: '13px', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.product_name || item.name}
              </td>
              
              <td style={{ padding: '10px 2px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                  <button onClick={() => updateQuantity(item.id, item.qty - 1)} style={{ padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: 'var(--text-main)' }}>-</button>
                  <span style={{ fontWeight: 'bold', fontSize: '13px', minWidth: '18px', textAlign: 'center', color: 'var(--text-main)' }}>{item.qty}</span>
                  <button onClick={() => updateQuantity(item.id, item.qty + 1)} style={{ padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: 'var(--text-main)' }}>+</button>
                </div>
              </td>
              
              <td style={{ padding: '10px 5px', textAlign: 'right', fontWeight: 'bold', color: '#10b981', fontSize: '13px' }}>
                Rs. {(item.price * item.qty).toLocaleString()}
              </td>
              
              <td style={{ padding: '10px 5px', textAlign: 'center' }}>
                <button onClick={() => removeItem(item.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '5px 8px', borderRadius: '6px' }} title="Remove">🗑️</button>
              </td>
            </tr>
          ))}
          {cart.length === 0 && (
            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>🛒 Tokri khali hai.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}