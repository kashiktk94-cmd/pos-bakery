// @ts-nocheck
import React, { useState } from 'react';

import { usePOS } from './hooks/usePOS';
import ScannerInput from './components/ScannerInput';
import CartTable from './components/CartTable';
import CheckoutPanel from './components/CheckoutPanel';
import DailySalesReport from './components/DailySalesReport';
import AdminDashboard from './components/AdminDashboard';
import LedgerPanel from './components/LedgerPanel'; 

// 🌟 NAYA: 2 Alag PIN Codes
const ADMIN_PIN = "1234";
const CASHIER_PIN = "1111";

export default function App() {
  const { cart, totalAmount, finalAmount, discount, setDiscount, heldCart, handleScan, handleCheckout, handleCreditCheckout, handleHold, handleResume, receiptData, closeReceipt, dbProducts, customers, updateQuantity, removeItem, refreshData } = usePOS();
  
  // 🌟 NAYA: Login System States
  const [userRole, setUserRole] = useState(null); // 'null' (lock screen), 'cashier', ya 'admin'
  const [loginPin, setLoginPin] = useState('');

  const [isModeAdmin, setIsModeAdmin] = useState(false);
  const [showLedger, setShowLedger] = useState(false); 

  // 🌟 NAYA: Login Handle Karna
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginPin === ADMIN_PIN) {
      setUserRole('admin');
    } else if (loginPin === CASHIER_PIN) {
      setUserRole('cashier');
    } else {
      alert("❌ Ghalat PIN Code! Dobara koshish karein.");
    }
    setLoginPin('');
  };

  const handleLogout = () => {
    if(window.confirm("⚠️ Kya aap system ko dobara lock karna chahte hain?")) {
      setUserRole(null);
      setIsModeAdmin(false);
      setShowLedger(false);
    }
  };

  // 🌟 THEEK KIYA GAYA: Agar Cashier Admin dabaye toh us se Malik ka PIN mango
  const handleAdminToggle = () => {
    if (!isModeAdmin) {
      if (userRole === 'cashier') {
        const pin = window.prompt("🔒 Malik (Admin) ka PIN Code darj karein:");
        if (pin === ADMIN_PIN) {
          setIsModeAdmin(true);
          setShowLedger(false); 
        } else if (pin !== null) {
          alert("❌ Ghalat PIN code! Aap ko ijazat nahi hai.");
        }
      } else {
        // Malik pehle hi logged in hai, direct khol do
        setIsModeAdmin(true);
        setShowLedger(false);
      }
    } else {
      setIsModeAdmin(false);
      refreshData();
    }
  };

  // 🌟 THEEK KIYA GAYA: Khata bhi sensitive hai, us par bhi lock lagao
  const handleLedgerToggle = () => {
    if (!showLedger) {
      if (userRole === 'cashier') {
        const pin = window.prompt("🔒 Khata dekhne ke liye Malik ka PIN Code darj karein:");
        if (pin === ADMIN_PIN) {
          setShowLedger(true);
          setIsModeAdmin(false); 
        } else if (pin !== null) {
          alert("❌ Ghalat PIN code!");
        }
      } else {
        setShowLedger(true);
        setIsModeAdmin(false);
      }
    } else {
      refreshData();
      setShowLedger(false);
    }
  };

  const getReceiptText = () => {
    if (!receiptData) return "";
    let text = `🏪 KASHIF BAKERY & MART\n`;
    if (receiptData.isUdhaar) text += `*** UNPAID / UDHAAR: ${receiptData.customerName} ***\n`;
    text += `Date: ${receiptData.date}\n-----------------------\n`;
    receiptData.items.forEach(item => {
      text += `${item.product_name || item.name} (x${item.qty}) = Rs. ${item.price * item.qty}\n`;
    });
    text += `-----------------------\n`;
    if (receiptData.discount > 0) text += `Discount: -Rs. ${receiptData.discount}\n`;
    text += `Total: Rs. ${receiptData.total.toLocaleString()}\n`;
    text += `Cashier: ${userRole === 'admin' ? 'Malik' : 'Counter'}\n`; // Parchi par likha aayega kis ne bill kata
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
      alert("✅ Parchi copy ho gayi hai!");
    }).catch(() => { alert("⚠️ Copy karne mein masla hua."); });
  };

  // ==========================================
  // 🌟 NAYA: LOCK SCREEN (Jab tak login na ho)
  // ==========================================
  if (!userRole) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', textAlign: 'center', width: '90%', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '40px', margin: '0 0 10px 0' }}>🏪</h1>
          <h2 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>Kashif Bakery & Mart</h2>
          <p style={{ color: '#64748b', marginBottom: '30px', fontWeight: 'bold' }}>Point of Sale System</p>
          
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="PIN Code"
              value={loginPin} 
              onChange={e => setLoginPin(e.target.value)} 
              style={{ width: '100%', padding: '15px', fontSize: '24px', textAlign: 'center', letterSpacing: '8px', borderRadius: '12px', border: '2px solid #cbd5e1', marginBottom: '20px', outline: 'none' }} 
              autoFocus 
            />
            <button type="submit" style={{ width: '100%', padding: '15px', fontSize: '18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)' }}>
              🔓 System Kholain
            </button>
          </form>

          <div style={{ marginTop: '25px', fontSize: '13px', color: '#94a3b8', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
            <strong>Hints:</strong><br/>
            Malik (Admin) PIN: 1234<br/>
            Larka (Cashier) PIN: 1111
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN POS APPLICATION (Login hone ke baad)
  // ==========================================
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background-color: #f8fafc; }
        
        .main-container { padding: 15px; max-width: 900px; margin: 0 auto; font-family: 'Inter', sans-serif; }
        .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
        
        @media screen { .print-only { display: none !important; } }
        
        @media print {
          @page { margin: 0; }
          body { background: white; margin: 0; padding: 0; color: #000; }
          .hide-on-print { display: none !important; }
          .print-only { display: block !important; }
          .receipt-overlay { position: static !important; background: white !important; padding: 0 !important; display: block !important; }
          .receipt-box { box-shadow: none !important; width: 80mm !important; max-width: 100% !important; margin: 0 auto !important; padding: 5px !important; border: none !important; color: black !important; }
          .receipt-box h2 { font-size: 16px !important; margin: 0 0 5px 0 !important; }
          .receipt-box p, .receipt-box span, .receipt-box div { font-size: 12px !important; }
          .receipt-box .total-amount { font-size: 16px !important; font-weight: bold !important; }
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

        .quick-scroll::-webkit-scrollbar { height: 8px; }
        .quick-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .quick-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        
        .quick-btn {
          min-width: 120px; padding: 15px 10px; background-color: #fff; border: 2px solid #e2e8f0; 
          border-radius: 12px; cursor: pointer; display: flex; flex-direction: column; 
          align-items: center; gap: 8px; flex-shrink: 0; transition: all 0.2s ease;
        }
        .quick-btn:hover { border-color: #3b82f6; background-color: #f8fafc; transform: translateY(-2px); }
      `}</style>

      <div className="main-container hide-on-print">
        
        {/* 🌟 NAYA: User Info Banner */}
        <div style={{ backgroundColor: '#1e293b', color: 'white', padding: '8px 15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: 'bold' }}>
          <span>Log in as: {userRole === 'admin' ? '👑 Malik (Admin)' : '👦 Cashier (Counter)'}</span>
          <button onClick={handleLogout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🔒 Lock System</button>
        </div>

        <div className="header-flex">
          <h1 style={{ margin: 0 }}>🏪 Bakery POS</h1>
          
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

        {isModeAdmin ? (
          <AdminDashboard />
        ) : showLedger ? (
          <LedgerPanel />
        ) : (
          <>
            <DailySalesReport refreshTrigger={cart.length} />
            <ScannerInput onScan={handleScan} />

            <div style={{ marginBottom: '20px', backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#475569', textTransform: 'uppercase' }}>
                🛒 Quick Items (Touch kar ke add karein)
              </h3>
              <div className="quick-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
                {dbProducts.map(product => (
                  <button key={product.id} onClick={() => handleScan(product.id)} className="quick-btn">
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.product_name || product.name}
                    </span>
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '900', backgroundColor: '#ecfdf5', padding: '4px 10px', borderRadius: '12px' }}>
                      Rs. {product.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <CartTable cart={cart} totalAmount={totalAmount} updateQuantity={updateQuantity} removeItem={removeItem} />
            
            <CheckoutPanel 
              totalAmount={totalAmount} finalAmount={finalAmount} discount={discount} setDiscount={setDiscount}
              onCheckout={handleCheckout} onCreditCheckout={handleCreditCheckout} customers={customers}
              onHold={handleHold} onResume={handleResume} isHeld={heldCart !== null} 
            />
          </>
        )}
      </div>

      {/* E-RECEIPT POPUP */}
      {receiptData && (
        <div className="receipt-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          
          <div className="receipt-box" style={{ backgroundColor: '#fff', padding: '20px', width: '100%', maxWidth: '400px', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontFamily: 'monospace' }}>
            
            {receiptData.isUdhaar && (
              <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', textAlign: 'center', padding: '8px', fontWeight: 'bold', borderRadius: '6px', marginBottom: '15px', border: '2px dashed #ef4444' }}>
                🛑 UNPAID / UDHAAR <br/> Khata: {receiptData.customerName}
              </div>
            )}

            <div style={{ textAlign: 'center', borderBottom: '2px dashed #ccc', paddingBottom: '10px', marginBottom: '15px' }}>
              <h2>Kashif Bakery</h2>
              <p style={{ margin: 0, color: '#666' }}>{receiptData.date}</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '10px', color: '#000' }}>Cashier: {userRole === 'admin' ? 'Malik' : 'Counter'}</p>
            </div>
            
            <div style={{ marginBottom: '15px', minHeight: '100px' }}>
              {receiptData.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>{item.product_name || item.name} (x{item.qty})</span>
                  <span>Rs. {(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div style={{ borderTop: '2px dashed #ccc', paddingTop: '10px' }}>
              {receiptData.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                  <span>Discount</span><span>- Rs. {receiptData.discount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }} className="total-amount">
                <span>Total Amount</span><span>Rs. {receiptData.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="print-only" style={{ textAlign: 'center', marginTop: '20px' }}>
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