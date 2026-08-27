// @ts-nocheck
import React, { useState, useEffect } from 'react';

import { usePOS } from './hooks/usePOS';
import ScannerInput from './components/ScannerInput';
import CartTable from './components/CartTable';
import CheckoutPanel from './components/CheckoutPanel';
import DailySalesReport from './components/DailySalesReport';
import AdminDashboard from './components/AdminDashboard';
import LedgerPanel from './components/LedgerPanel'; 

const ADMIN_PIN = "1234";
const CASHIER_PIN = "1111";

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errorMessage: '' }; }
  static getDerivedStateFromError(error) { return { hasError: true, errorMessage: error.toString() }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#7f1d1d', color: 'white', padding: '20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '60px', margin: '0 0 20px 0' }}>⚠️</h1><h2 style={{ fontSize: '30px' }}>System Crash!</h2>
          <code style={{ fontSize: '16px', color: '#fca5a5' }}>{this.state.errorMessage}</code>
          <button onClick={() => window.location.reload()} style={{ marginTop: '30px', padding: '12px 24px', fontWeight: 'bold', background: '#f8fafc', color: '#7f1d1d', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🔄 Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainPOS() {
  const { cart, totalAmount, finalAmount, discount, setDiscount, heldCart, handleScan, handleCheckout, handleCreditCheckout, handleHold, handleResume, receiptData, closeReceipt, dbProducts, customers, updateQuantity, removeItem, refreshData } = usePOS();
  
  const [userRole, setUserRole] = useState(null); 
  const [loginPin, setLoginPin] = useState('');
  const [isModeAdmin, setIsModeAdmin] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquirySearch, setInquirySearch] = useState('');

  const showToast = (message, type = 'info') => { setToast({ show: true, message, type }); setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000); };

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => { if (msg.includes('✅') || msg.toLowerCase().includes('success')) { showToast(msg, 'success'); } else { showToast(msg.includes('⚠️') ? msg : `⚠️ ${msg}`, 'error'); } };
    return () => { window.alert = originalAlert; };
  }, []);

  const playBeep = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) { const ctx = new AudioContext(); const osc = ctx.createOscillator(); const gainNode = ctx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(800, ctx.currentTime); gainNode.gain.setValueAtTime(0.1, ctx.currentTime); osc.connect(gainNode); gainNode.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.1); }
  };

  const handleTouchItem = (id) => { playBeep(); handleScan(id); showToast("Item added!", "success"); };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (!userRole) return;
      if (e.key === 'Escape') { if (receiptData) closeReceipt(); if (showInquiry) setShowInquiry(false); }
      if (e.key === 'Enter' && cart && cart.length > 0 && !receiptData && !isModeAdmin && !showLedger && !showInquiry) {
        if(document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') { handleCheckout(); showToast("Bill Generated!", "success"); }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown); return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [userRole, cart, receiptData, isModeAdmin, showLedger, showInquiry]);

  const handleLogin = (e) => { e.preventDefault(); if (loginPin === ADMIN_PIN) { setUserRole('admin'); showToast("Welcome Malik!", "success"); } else if (loginPin === CASHIER_PIN) { setUserRole('cashier'); showToast("Welcome Cashier!", "success"); } else showToast("❌ Ghalat PIN Code!", "error"); setLoginPin(''); };
  const handleLogout = () => { if(window.confirm("⚠️ System lock karna chahte hain?")) { setUserRole(null); setIsModeAdmin(false); setShowLedger(false); showToast("System Locked", "info"); } };

  const handleAdminToggle = () => {
    if (!isModeAdmin) {
      if (userRole === 'cashier') { const pin = window.prompt("🔒 Malik (Admin) ka PIN Code darj karein:"); if (pin === ADMIN_PIN) { setIsModeAdmin(true); setShowLedger(false); } else if (pin !== null) showToast("❌ Ghalat PIN code!", "error"); } else { setIsModeAdmin(true); setShowLedger(false); }
    } else { setIsModeAdmin(false); refreshData(); }
  };

  const handleLedgerToggle = () => {
    if (!showLedger) {
      if (userRole === 'cashier') { const pin = window.prompt("🔒 Khata dekhne ke liye Malik ka PIN Code darj karein:"); if (pin === ADMIN_PIN) { setShowLedger(true); setIsModeAdmin(false); } else if (pin !== null) showToast("❌ Ghalat PIN code!", "error"); } else { setShowLedger(true); setIsModeAdmin(false); }
    } else { refreshData(); setShowLedger(false); }
  };

  const safeDbProducts = Array.isArray(dbProducts) ? dbProducts : [];
  const safeCart = Array.isArray(cart) ? cart : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeTotalAmount = totalAmount || 0;
  const safeFinalAmount = finalAmount || 0;

  const filteredInquiry = safeDbProducts.filter(p => {
    if (!p) return false;
    const itemName = String(p.product_name || p.name || "").toLowerCase();
    const searchTerm = String(inquirySearch || "").toLowerCase();
    const barcodeStr = p.barcode ? String(p.barcode) : "";
    return itemName.includes(searchTerm) || barcodeStr.includes(searchTerm);
  });

  if (!userRole) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#0b1120', fontFamily: 'sans-serif', margin: 0 }}>
        <style>{`html, body, #root { width: 100% !important; height: 100vh !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important; }`}</style>
        <div style={{ background: '#1e293b', padding: '50px 40px', borderRadius: '24px', textAlign: 'center', width: '90%', maxWidth: '420px', border: '1px solid #334155' }}>
          <h1 style={{ fontSize: '45px', margin: '0 0 15px 0' }}>🏪</h1>
          <h2 style={{ margin: '0 0 10px 0', color: '#f8fafc' }}>Kashif Bakery</h2>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="PIN Code" value={loginPin} onChange={e => setLoginPin(e.target.value)} style={{ width: '100%', padding: '15px', fontSize: '20px', textAlign: 'center', letterSpacing: '10px', borderRadius: '12px', border: '1px solid #475569', background: '#0f172a', color: '#fff', marginBottom: '25px', outline: 'none' }} autoFocus />
            <button type="submit" style={{ width: '100%', padding: '16px', fontSize: '16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}>🔓 Unlock Terminal</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? 'dark-theme' : 'light-theme'} style={{ height: '100vh', width: '100vw', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { width: 100vw !important; height: 100vh !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
        .light-theme { background-color: #f1f5f9; color: #0f172a; --card-bg: #ffffff; --border-color: #e2e8f0; --text-main: #0f172a; --text-muted: #64748b; --header-gradient: linear-gradient(90deg, #ffffff, #f8fafc); }
        .dark-theme { background-color: #0b1120; color: #f8fafc; --card-bg: #1e293b; --border-color: #334155; --text-main: #f8fafc; --text-muted: #94a3b8; --header-gradient: linear-gradient(90deg, #1e293b, #0f172a); }
        ::-webkit-scrollbar { width: 5px; height: 5px; } ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; } ::-webkit-scrollbar:horizontal { display: none !important; height: 0 !important; }
        
        /* 🌟 NAYA: HD Crisp Heading Style for Main POS Title */
        .sharp-heading {
          font-weight: 900;
          font-size: 24px;
          letter-spacing: -0.5px;
          color: var(--text-main);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-shadow: 0px 1px 2px rgba(0,0,0,0.1);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .smart-header { display: flex; justify-content: space-between; align-items: center; background: var(--header-gradient); padding: 12px 20px; border-radius: 12px; border: 1px solid var(--border-color); flex-shrink: 0; }
        table { border-collapse: separate; border-spacing: 0; width: 100%; text-align: left; } th { background: rgba(148, 163, 184, 0.05); color: var(--text-muted); font-size: 11px; padding: 10px 4px; border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; } td { font-size: 13px; font-weight: 600; color: var(--text-main); padding: 10px 4px; border-bottom: 1px solid rgba(148, 163, 184, 0.1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .right-col table { table-layout: fixed !important; width: 100% !important; } .right-col th:nth-child(1), .right-col td:nth-child(1) { width: 40% !important; white-space: normal !important; } .right-col th:nth-child(2), .right-col td:nth-child(2) { width: 30% !important; text-align: center !important; } .right-col th:nth-child(3), .right-col td:nth-child(3) { width: 20% !important; text-align: right !important; } .right-col th:nth-child(4), .right-col td:nth-child(4) { width: 10% !important; text-align: center !important; }
        .pos-workspace { display: grid; grid-template-columns: 1fr 480px; gap: 15px; height: 100%; min-height: 0; }
        .left-col { display: flex; flex-direction: column; gap: 12px; min-height: 0; height: 100%; } .right-col { display: flex; flex-direction: column; gap: 12px; min-height: 0; height: 100%; max-width: 480px; }
        .themed-panel { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 15px; display: flex; flex-direction: column; }
        .scrollable-content { flex-grow: 1; overflow-y: auto; overflow-x: hidden !important; min-height: 0; } .fixed-panel { flex-shrink: 0; }
        .quick-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; padding: 5px 0; }
        .quick-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 8px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; user-select: none; }
        .quick-card:hover { border-color: #3b82f6; transform: translateY(-2px); } .item-icon { font-size: 24px; } .item-name { font-size: 12px; font-weight: 700; color: var(--text-main); text-align: center; line-height: 1.2; word-wrap: break-word; } .item-price { font-size: 11px; color: #10b981; font-weight: 800; background-color: rgba(16, 185, 129, 0.1); padding: 3px 6px; border-radius: 6px; width: 100%; text-align: center; }
        .btn-modern { font-weight: 700; font-size: 12px; padding: 8px 15px; border-radius: 8px; border: none; cursor: pointer; } .btn-modern:hover { opacity: 0.8; transform: translateY(-1px); }
        @media print { .hide-on-print { display: none !important; } }
      `}</style>

      {/* 🌟 ITEM & SHELF INQUIRY MODAL */}
      {showInquiry && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '600px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h2 className="sharp-heading" style={{fontSize:'20px'}}>🔍 Item Search</h2>
              <button onClick={() => setShowInquiry(false)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold' }}>Close (Esc)</button>
            </div>
            <input type="text" placeholder="Customer ne kya manga hai? (Naam likhein)..." value={inquirySearch} onChange={e => setInquirySearch(e.target.value)} autoFocus style={{ width: '100%', padding: '15px', fontSize: '16px', borderRadius: '8px', border: '2px solid #3b82f6', marginBottom: '15px', outline: 'none', background: 'var(--card-bg)', color: 'var(--text-main)' }} />
            
            <div style={{ overflowY: 'auto', flexGrow: 1, border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <table style={{ width: '100%' }}>
                <thead><tr><th>Item Name</th><th>Price</th><th>Stock</th><th style={{color:'#3b82f6'}}>Shelf Location</th></tr></thead>
                <tbody>
                  {filteredInquiry.map(p => (
                    <tr key={p.id}>
                      <td style={{fontWeight:'bold'}}>{p.product_name || p.name || "Unknown"}</td>
                      <td style={{fontWeight:'bold', color:'#10b981'}}>Rs. {p.price}</td>
                      <td style={{fontWeight:'bold', color: p.quantity<1?'#ef4444':''}}>{p.quantity > 0 ? p.quantity : 'Khatam Hai'}</td>
                      <td style={{fontWeight:'bold', color:'#3b82f6'}}>{p.category !== 'General' ? p.category : 'N/A'}</td>
                    </tr>
                  ))}
                  {filteredInquiry.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>Koi item nahi mila.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {toast.show && ( <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', background: toast.type === 'error' ? '#ef4444' : '#10b981', color: 'white', borderRadius: '8px', fontWeight: 'bold', zIndex: 10000, fontSize: '13px' }}>{toast.message}</div> )}

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px', fontFamily: "'Inter', sans-serif" }} className="hide-on-print">
        
        <div className="smart-header" style={{ marginBottom: '12px' }}>
          {/* 🌟 NAYA: Yahan Sharp HD Class lagayi gayi hai */}
          <h1 className="sharp-heading">🏪 Kashif Bakery POS</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Session: <span style={{color: '#3b82f6'}}>{userRole === 'admin' ? '👑 Malik' : '👦 Cashier'}</span></span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-modern" onClick={() => setDarkMode(!darkMode)} style={{ background: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-main)' }}>{darkMode ? '☀️' : '🌙'}</button>
              <button className="btn-modern" onClick={() => setShowInquiry(true)} style={{ backgroundColor: '#8b5cf6', color: 'white' }}>🔍 Search Item</button>
              <button className="btn-modern" onClick={handleLedgerToggle} style={{ backgroundColor: showLedger ? '#f59e0b' : '#10b981', color: 'white' }}>{showLedger ? '⬅️ POS' : '📓 Ledger'}</button>
              <button className="btn-modern" onClick={handleAdminToggle} style={{ backgroundColor: isModeAdmin ? '#ef4444' : '#0f172a', color: 'white' }}>{isModeAdmin ? '⬅️ POS' : '⚙️ Admin'}</button>
              <button className="btn-modern" onClick={handleLogout} style={{ background: '#ef4444', color: 'white' }}>🔒 Lock</button>
            </div>
          </div>
        </div>

        <div style={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
          {isModeAdmin ? ( <div style={{ height: '100%', overflowY: 'auto' }}><AdminDashboard /></div> ) : showLedger ? ( <div style={{ height: '100%', overflowY: 'auto' }}><LedgerPanel /></div> ) : (
            <div className="pos-workspace">
              
              <div className="left-col">
                <div className="fixed-panel"><DailySalesReport refreshTrigger={safeCart.length} /></div>
                
                <div className="themed-panel fixed-panel" style={{ padding: '12px 15px' }}>
                  <ScannerInput onScan={(id) => { playBeep(); handleScan(id); }} dbProducts={safeDbProducts} cart={safeCart} />
                </div>

                <div className="themed-panel" style={{ flexGrow: 1, padding: '12px 15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 className="sharp-heading" style={{fontSize: '16px'}}>👆 Quick Touch Menu</h3>
                  </div>
                  <div className="scrollable-content">
                    <div className="quick-grid">
                      {safeDbProducts.map(product => {
                        if(!product) return null;
                        const isExpiring = product.expiry_date && new Date(product.expiry_date) <= new Date(new Date().setDate(new Date().getDate() + 3));
                        return (
                          <button key={product.id} onClick={() => handleTouchItem(product.id)} className="quick-card" style={{ borderColor: isExpiring ? '#fca5a5' : 'var(--border-color)' }}>
                            <span className="item-icon">{product.category === 'Food' ? '🍔' : '📦'}</span>
                            <span className="item-name">{product.product_name || product.name || "Unknown"}</span>
                            <span className="item-price">Rs. {product.price || 0}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="right-col">
                <div className="themed-panel" style={{ padding: 0, flexGrow: 1 }}>
                  <div className="scrollable-content" style={{ padding: 0 }}><CartTable cart={safeCart} totalAmount={safeTotalAmount} updateQuantity={updateQuantity} removeItem={removeItem} /></div>
                </div>
                <div className="themed-panel fixed-panel" style={{ padding: 0, borderTop: '4px solid #10b981' }}>
                  <CheckoutPanel totalAmount={safeTotalAmount} finalAmount={safeFinalAmount} discount={discount} setDiscount={setDiscount} onCheckout={() => { handleCheckout(); showToast("Bill Generated!", "success"); }} onCreditCheckout={handleCreditCheckout} customers={safeCustomers} onHold={handleHold} onResume={handleResume} isHeld={heldCart !== null} />
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {receiptData && (
        <div className="receipt-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div className="receipt-box" style={{ backgroundColor: '#fff', padding: '25px', width: '100%', maxWidth: '380px', borderRadius: '16px', fontFamily: 'monospace', color: '#000' }}>
            {receiptData.isUdhaar && ( <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', textAlign: 'center', padding: '8px', fontWeight: 'bold', borderRadius: '6px', marginBottom: '15px', border: '2px dashed #ef4444' }}>🛑 UNPAID / UDHAAR <br/> Khata: {receiptData.customerName}</div> )}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '12px', marginBottom: '15px' }}><h2 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>Kashif Bakery</h2><p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{receiptData.date}</p></div>
            <div style={{ marginBottom: '15px', minHeight: '100px' }}>{(receiptData.items || []).map((item, idx) => ( <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}><span>{item.product_name || item.name} (x{item.qty})</span><span style={{ fontWeight: 'bold' }}>Rs. {((item.price || 0) * (item.qty || 0)).toLocaleString()}</span></div> ))}</div>
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
              {receiptData.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444', fontSize: '13px' }}><span>Discount</span><span>- Rs. {receiptData.discount}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '16px', fontWeight: '900' }}><span>Total Paid</span><span>Rs. {(receiptData.total || 0).toLocaleString()}</span></div>
            </div>
            <div className="hide-on-print" style={{ display: 'flex', gap: '8px', marginTop: '25px' }}>
              <button className="btn-modern" onClick={() => window.print()} style={{ flex: 1, backgroundColor: '#3b82f6', color: 'white' }}>🖨️ Print</button>
              <button className="btn-modern" onClick={closeReceipt} style={{ flex: 1, backgroundColor: '#ef4444', color: 'white' }}>❌ Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <MainPOS />
    </AppErrorBoundary>
  );
}