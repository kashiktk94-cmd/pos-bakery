import React, { useState } from 'react';

export default function CheckoutPanel({ totalAmount, finalAmount, discount, setDiscount, onCheckout, onCreditCheckout, onHold, onResume, isHeld, customers }) {
  const isCartEmpty = totalAmount <= 0;
  const [showUdhaarModal, setShowUdhaarModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const handleUdhaarSubmit = () => {
    if (!selectedCustomerId) return alert("⚠️ Bara-e-meharbani customer select karein!");
    const customer = customers.find(c => c.id.toString() === selectedCustomerId);
    onCreditCheckout(customer);
    setShowUdhaarModal(false);
    setSelectedCustomerId('');
  };

  return (
    <div style={{ position: 'relative', marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
        <span style={{ fontSize: '18px', color: '#64748b', fontWeight: 'bold' }}>Total Bill:</span>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>Rs. {totalAmount.toLocaleString()}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
        <span style={{ fontSize: '16px', color: '#ef4444', fontWeight: 'bold' }}>Discount (Rs):</span>
        <input type="number" placeholder="0" value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} style={{ width: '100px', padding: '8px 12px', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '16px', textAlign: 'right', fontWeight: 'bold', color: '#000' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderTop: '2px dashed #e2e8f0', paddingTop: '15px' }}>
        <span style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>Payable:</span>
        <span style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>Rs. {finalAmount.toLocaleString()}</span>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
        {!isHeld ? (
          <button onClick={onHold} disabled={isCartEmpty} style={{ flex: '1 1 45%', padding: '12px', backgroundColor: isCartEmpty ? '#e2e8f0' : '#f59e0b', color: isCartEmpty ? '#94a3b8' : 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isCartEmpty ? 'not-allowed' : 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>⏸️ Hold</button>
        ) : (
          <button onClick={onResume} style={{ flex: '1 1 45%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>▶️ Resume</button>
        )}
        <button onClick={() => setShowUdhaarModal(true)} disabled={isCartEmpty} style={{ flex: '1 1 45%', padding: '12px', backgroundColor: isCartEmpty ? '#e2e8f0' : '#ef4444', color: isCartEmpty ? '#94a3b8' : 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isCartEmpty ? 'not-allowed' : 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>📓 Udhaar Khata</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => onCheckout('Cash')} disabled={isCartEmpty} style={{ flex: '1 1 100%', padding: '15px', backgroundColor: isCartEmpty ? '#e2e8f0' : '#10b981', color: isCartEmpty ? '#94a3b8' : 'white', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: isCartEmpty ? 'not-allowed' : 'pointer', fontSize: '18px', transition: 'all 0.2s' }}>
          💵 Cash Pay & Print
        </button>
        <button onClick={() => onCheckout('Mobile Wallet')} disabled={isCartEmpty} style={{ flex: '1 1 45%', padding: '12px', backgroundColor: isCartEmpty ? '#e2e8f0' : '#8b5cf6', color: isCartEmpty ? '#94a3b8' : 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isCartEmpty ? 'not-allowed' : 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>
          📱 JazzCash / EasyPaisa
        </button>
        <button onClick={() => onCheckout('Card')} disabled={isCartEmpty} style={{ flex: '1 1 45%', padding: '12px', backgroundColor: isCartEmpty ? '#e2e8f0' : '#3b82f6', color: isCartEmpty ? '#94a3b8' : 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isCartEmpty ? 'not-allowed' : 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>
          💳 Bank Card
        </button>
      </div>

      {showUdhaarModal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.95)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: '12px', zIndex: 10, border: '2px solid #ef4444', padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>📓 Kis Ke Khate Mein Likhna Hai?</h3>
          <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '16px', color: '#000', fontWeight: 'bold' }}>
            <option value="">-- Customer Select Karein --</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} (Pichla Baqaya: Rs. {c.balance})</option>)}
          </select>
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button onClick={handleUdhaarSubmit} style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px' }}>✅ Khate Mein Likhain</button>
            <button onClick={() => setShowUdhaarModal(false)} style={{ flex: 1, padding: '12px', background: '#64748b', color: 'white', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px' }}>❌ Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}