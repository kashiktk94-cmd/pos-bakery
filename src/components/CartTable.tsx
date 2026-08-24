import React from 'react';

export default function CartTable({ cart, totalAmount }) {
  const styles = {
    box: { 
      backgroundColor: 'white', 
      padding: 'clamp(10px, 3vw, 15px)', // Screen ke hisaab se padding adjust hogi
      borderRadius: '10px', 
      marginBottom: '20px', 
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
    },
    title: { marginTop: 0, color: '#334155', textAlign: 'center' },
    tableWrapper: { overflowX: 'auto' }, // 🌟 NAYA: Mobile par horizontal scroll ke liye
    table: { width: '100%', minWidth: '400px', borderCollapse: 'collapse' }, // minWidth table ko pichakne nahi dega
    th: { textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0', color: '#475569' },
    td: { padding: '10px', borderBottom: '1px solid #e2e8f0', color: '#1e293b' },
    total: { textAlign: 'right', marginTop: '15px', color: '#10b981', fontSize: 'clamp(18px, 4vw, 22px)' }
  };

  return (
    <div style={styles.box} className="hide-on-print">
      <h3 style={styles.title}>🛒 Current Sale (Voucher)</h3>
      
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Product</th>
              <th style={styles.th}>Qty</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {cart.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Koi saman scan nahi hua...</td></tr>
            ) : (
              cart.map(item => (
                <tr key={item.id}>
                  <td style={styles.td}>{item.product_name || item.name}</td>
                  <td style={styles.td}>{item.qty}</td>
                  <td style={styles.td}>Rs. {item.price}</td>
                  <td style={styles.td}>Rs. {item.price * item.qty}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <h2 style={styles.total}>Total Bill: Rs. {totalAmount.toLocaleString()}</h2>
    </div>
  );
}