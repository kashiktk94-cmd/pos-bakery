// @ts-nocheck
import React, { useState } from 'react';

import { usePOS } from './hooks/usePOS';
import ScannerInput from './components/ScannerInput';
import CartTable from './components/CartTable';
import CheckoutPanel from './components/CheckoutPanel';
import DailySalesReport from './components/DailySalesReport';
import AdminDashboard from './components/AdminDashboard';
// 🌟 NAYA: Khata file ko app mein bulaya gaya hai
import LedgerPanel from './components/LedgerPanel'; 

const ADMIN_PIN = "1234";

export default function App() {
  const { cart, totalAmount, finalAmount, discount, setDiscount, heldCart, handleScan, handleCheckout, handleHold, handleResume, receiptData, closeReceipt } = usePOS();
  
  const [isModeAdmin, setIsModeAdmin] = useState(false);
  const [showLedger, setShowLedger] = useState(false); // 🌟 Khata screen show karne ke liye

  const handleAdminToggle = () => {
    if (!isModeAdmin) {
      const pin = window.prompt("🔒 Admin Panel kholne ke liye PIN Code darj karein:");
      if (pin === ADMIN_PIN) {
        setIsModeAdmin(true);
        setShowLedger(false); 
      } else if (pin !== null) {
        alert("❌ Ghalat PIN code! Aap ko ijazat nahi hai.");
      }
    } else {
      setIsModeAdmin(false);
    }
  };

  const handleLedgerToggle = () => {
    setShowLedger(!showLedger);
    setIsModeAdmin(false); 
  };

  const getReceiptText = () => {
    if (!receiptData) return "";
    let text = `🏪 KASHIF BAKERY & MART\n`;
    text += `Date: ${receiptData.date}\n-----------------------\n`;
    receiptData.items.forEach(item => {
      text += `${item.product_name || item.name} (x${item.qty}) = Rs. ${item.price * item.qty}\n`;
    });
    text += `-----------------------\n`;
    if (receiptData.discount > 0) text += `Discount: -Rs. ${receiptData.discount}\n`;
    text += `Total Paid: Rs. ${receiptData.total}\n`;
    text += `Thank You For Shopping!\n`;
    return text;
  };

  const handleWhatsAppShare = () => {
    const text = getReceiptText();
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleCopyText = () => {
    const text = getReceiptText();
    navigator.clipboard.writeText(text).then(() => {
      alert("✅ Parchi copy ho gayi hai! Ab aap kisi ko bhi message mein paste kar sakte hain.");
    }).catch(() => {
      alert("⚠️ Copy karne mein masla hua.");
    });
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background-color: #f8fafc; }
        
        .main-container { padding: 15px; max-width: 900px; margin: 0 auto; font-family: 'Inter', sans-serif; }
        .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        
        @media screen { .print-only { display: none !important; } }
        
        @media print {
          .hide-on-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; margin: 0; padding: 0; }
          .receipt-overlay { position: static !important; background: white !important; padding: 0 !important; }
          .receipt-box { box-shadow: none !important; width: 100% !important; max-width: 100% !important; border: none !important; color: black !important; }
        }

        @media (max-width: 768px) {
          .main-container { padding: 10px; }
          .header-flex { flex-direction: column; gap: 15px; text-align: center; }
          .header-flex .buttons-group { width: 100%; display: flex; flex-direction: column; gap: 10px; }
          .header-flex button { width: 100%; padding: 15px; font-size: 16px; }
          table th, table td { padding: 8px 4px !important; font-size: 13px !important; }
          input { width: 100% !important; }
          .desktop-print-btn { display: none !important; }
        }
      `}</style>

      <div className="main-container hide-on-print">
        <div className="header-flex">
          <h1 style={{ margin: 0 }}>🏪 Bakery POS</h1>
          
          {/* 🌟 NAYA: Admin aur Khata ke 2 buttons */}
          <div className="buttons-group" style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleLedgerToggle} 
              style={{ backgroundColor: showLedger ? '#f59e0b' : '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {showLedger ? '⬅️ Back to POS' : '📓 Khata'}
            </button>

            <button 
              onClick={handleAdminToggle} 
              style={{ backgroundColor: isModeAdmin ? '#ef4444' : '#334155', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isModeAdmin ? '⬅️ Back to POS' : '⚙️ Admin'}
            </button>
          </div>
        </div>

        {/* 🌟 NAYA: Screen Change Logic (POS, Admin, ya Khata) */}
        {isModeAdmin ? (
          <AdminDashboard />
        ) : showLedger ? (
          <LedgerPanel />
        ) : (
          <>
            <DailySalesReport refreshTrigger={cart.length} />
            <ScannerInput onScan={handleScan} />
            <CartTable cart={cart} totalAmount={totalAmount} />
            
            <CheckoutPanel 
              totalAmount={totalAmount} 
              finalAmount={finalAmount}
              discount={discount}
              setDiscount={setDiscount}
              onCheckout={handleCheckout} 
              onHold={handleHold} 
              onResume={handleResume} 
              isHeld={heldCart !== null} 
            />
          </>
        )}
      </div>

      {/* E-RECEIPT POPUP (Parchi) */}
      {receiptData && (
        <div className="receipt-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          
          <div className="receipt-box" style={{ backgroundColor: '#fff', padding: '20px', width: '100%', maxWidth: '400px', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontFamily: 'monospace' }}>
            
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #ccc', paddingBottom: '10px', marginBottom: '15px' }}>
              <h2 style={{ margin: '0 0 5px 0' }}>Kashif Bakery</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{receiptData.date}</p>
            </div>
            
            <div style={{ marginBottom: '15px', minHeight: '100px' }}>
              {receiptData.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>{item.product_name || item.name} (x{item.qty})</span>
                  <span>Rs. {item.price * item.qty}</span>
                </div>
              ))}
            </div>
            
            <div style={{ borderTop: '2px dashed #ccc', paddingTop: '10px' }}>
              {receiptData.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                  <span>Discount</span>
                  <span>- Rs. {receiptData.discount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', marginTop: '10px' }}>
                <span>Total Paid</span>
                <span>Rs. {receiptData.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="print-only" style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px' }}>
              <p>Thank You For Shopping!</p>
              <p>System by wp_doctr</p>
            </div>

            <div className="hide-on-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '20px' }}>
              <button className="desktop-print-btn" onClick={() => window.print()} style={{ flex: '1 1 45%', backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>🖨️ Print</button>
              <button onClick={handleWhatsAppShare} style={{ flex: '1 1 45%', backgroundColor: '#25D366', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>💬 WhatsApp</button>
              <button onClick={handleCopyText} style={{ flex: '1 1 45%', backgroundColor: '#64748b', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>📋 Copy</button>
              <button onClick={closeReceipt} style={{ flex: '1 1 45%', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>❌ Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}