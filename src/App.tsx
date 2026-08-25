// @ts-nocheck
import React, { useState } from 'react';

import { usePOS } from './hooks/usePOS';
import ScannerInput from './components/ScannerInput';
import CartTable from './components/CartTable';
import CheckoutPanel from './components/CheckoutPanel';
import DailySalesReport from './components/DailySalesReport';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  // 🌟 NAYA: receiptData aur closeReceipt add kiya hai
  const { cart, totalAmount, finalAmount, discount, setDiscount, heldCart, handleScan, handleCheckout, handleHold, handleResume, receiptData, closeReceipt } = usePOS();
  const [isModeAdmin, setIsModeAdmin] = useState(false);

  return (
    <>
      {/* 🌟 NAYA: Mukammal Mobile Responsive CSS */}
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background-color: #f8fafc; }
        
        .main-container { padding: 15px; max-width: 900px; margin: 0 auto; font-family: 'Inter', sans-serif; }
        .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        
        @media screen { .show-on-print { display: none !important; } }
        @media print {
          .hide-on-print { display: none !important; }
          .show-on-print { display: block !important; text-align: center; color: black; font-family: monospace; }
          body { background: white; margin: 0; padding: 10px; }
        }

        /* MOBILE FIXES */
        @media (max-width: 600px) {
          .main-container { padding: 10px; }
          .header-flex { flex-direction: column; gap: 15px; text-align: center; }
          .header-flex button { width: 100%; padding: 15px; font-size: 16px; }
          
          /* Table ko mobile par fit karne ke liye */
          table th, table td { padding: 8px 4px !important; font-size: 13px !important; }
          input { width: 100% !important; }
        }
      `}</style>

      <div className="main-container">
        
        {/* Parchi ka Header (Sirf hardware printer ke liye) */}
        <div className="show-on-print" style={{ borderBottom: '2px dashed #000', paddingBottom: '10px', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 5px 0' }}>🏪 Kashif Bakery & Mart</h2>
          <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>Date: {new Date().toLocaleDateString('en-PK')} | Time: {new Date().toLocaleTimeString('en-PK')}</p>
        </div>

        {/* Top Header */}
        <div className="hide-on-print header-flex">
          <h1 style={{ margin: 0 }}>🏪 Bakery POS</h1>
          <button 
            onClick={() => setIsModeAdmin(!isModeAdmin)}
            style={{ backgroundColor: isModeAdmin ? '#ef4444' : '#334155', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isModeAdmin ? '⬅️ Back to POS' : '⚙️ Admin Panel'}
          </button>
        </div>

        {isModeAdmin ? (
          <AdminDashboard />
        ) : (
          <>
            <DailySalesReport refreshTrigger={cart.length} />
            <div className="hide-on-print"><ScannerInput onScan={handleScan} /></div>
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

            {/* Parchi ka Footer (Sirf hardware printer ke liye) */}
            <div className="show-on-print" style={{ borderTop: '2px dashed #000', paddingTop: '10px', marginTop: '20px' }}>
              {discount > 0 && <p style={{ margin: '5px 0' }}>Discount: -Rs. {discount}</p>}
              <h3 style={{ margin: '5px 0' }}>Total Paid: Rs. {finalAmount?.toLocaleString()}</h3>
              <p style={{ margin: 0, fontSize: '12px' }}>System by wp_doctr</p>
            </div>
          </>
        )}
      </div>

      {/* 🌟 NAYA: E-RECEIPT POPUP (Screen Parchi) */}
      {receiptData && (
        <div className="hide-on-print" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}>
          
          {/* Parchi Ka Kaghaz */}
          <div style={{ backgroundColor: '#fff', padding: '20px', width: '100%', maxWidth: '400px', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', fontFamily: 'monospace' }}>
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

            {/* Buttons (Print & Close) */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => window.print()} style={{ flex: 1, backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                🖨️ Print
              </button>
              <button onClick={closeReceipt} style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                ❌ Close
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: '10px', color: '#999', marginTop: '10px', marginBottom: 0 }}>* Screenshot lene ke liye behtareen *</p>
          </div>
        </div>
      )}
    </>
  );
}