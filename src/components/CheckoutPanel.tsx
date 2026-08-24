import React from 'react';

export default function CheckoutPanel({ totalAmount, finalAmount, discount, setDiscount, onCheckout, onHold, onResume, isHeld }) {
  const styles = {
    panel: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '10px', color: 'white', textAlign: 'center' },
    title: { margin: '0 0 10px 0', color: '#94a3b8' },
    amount: { fontSize: '36px', margin: '0 0 20px 0', color: '#10b981' },
    discountRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '15px' },
    input: { padding: '8px', fontSize: '16px', borderRadius: '5px', border: 'none', width: '100px', textAlign: 'center' },
    payBtn: { backgroundColor: '#10b981', color: 'white', width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px' },
    actionRow: { display: 'flex', gap: '10px' },
    holdBtn: { backgroundColor: '#f59e0b', color: 'white', flex: 1, padding: '10px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    resumeBtn: { backgroundColor: '#3b82f6', color: 'white', flex: 1, padding: '10px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }
  };

  return (
    <div className="hide-on-print" style={styles.panel}>
      <h4 style={styles.title}>Subtotal: Rs. {totalAmount.toLocaleString()}</h4>
      
      {/* 🌟 NAYA: Discount ka Input Box */}
      <div style={styles.discountRow}>
        <label>Discount (Rs): </label>
        <input 
          type="number" 
          min="0" 
          value={discount === 0 ? '' : discount} 
          onChange={(e) => setDiscount(Number(e.target.value))} 
          placeholder="0" 
          style={styles.input} 
        />
      </div>

      <h2 style={styles.amount}>Payable: Rs. {finalAmount.toLocaleString()}</h2>
      
      <button onClick={onCheckout} style={styles.payBtn}>💵 Pay & Print</button>

      <div style={styles.actionRow}>
        <button onClick={onHold} style={styles.holdBtn}>⏸️ Hold</button>
        {isHeld && <button onClick={onResume} style={styles.resumeBtn}>▶️ Resume</button>}
      </div>
    </div>
  );
}