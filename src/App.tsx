// @ts-nocheck
import React, { useState } from 'react';

import { usePOS } from './hooks/usePOS';
import ScannerInput from './components/ScannerInput';
import CartTable from './components/CartTable';
import CheckoutPanel from './components/CheckoutPanel';
import DailySalesReport from './components/DailySalesReport';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  // 🌟 NAYA: Yahan 'finalAmount', 'discount', aur 'setDiscount' add kar diye hain
  const { cart, totalAmount, finalAmount, discount, setDiscount, heldCart, handleScan, handleCheckout, handleHold, handleResume } = usePOS();
  const [isModeAdmin, setIsModeAdmin] = useState(false);

  return (
    <>
      <style>{`
        @media screen { .show-on-print { display: none !important; } }
        @media print {
          .hide-on-print { display: none !important; }
          .show-on-print { display: block !important; text-align: center; color: black; font-family: 'Courier New', Courier, monospace; }
          body { background: white; margin: 0; padding: 10px; }
        }
      `}</style>

      <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        
        {/* Parchi ka Header */}
        <div className="show-on-print" style={{ borderBottom: '2px dashed #000', paddingBottom: '10px', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 5px 0' }}>🏪 Kashif Bakery & Mart</h2>
          <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>Main Market, Islamabad, Pakistan</p>
          <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
            Date: {new Date().toLocaleDateString('en-PK')} | Time: {new Date().toLocaleTimeString('en-PK')}
          </p>
        </div>

        {/* Top Bar (Dukan / Godam Switch) */}
        <div className="hide-on-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>🏪 Bakery POS System</h1>
          <button 
            onClick={() => setIsModeAdmin(!isModeAdmin)}
            style={{ backgroundColor: isModeAdmin ? '#ef4444' : '#334155', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
          >
            {isModeAdmin ? '⬅️ Back to POS' : '⚙️ Admin Panel'}
          </button>
        </div>

        {isModeAdmin ? (
          <AdminDashboard />
        ) : (
          <>
            <DailySalesReport refreshTrigger={cart.length} />
            
            <div className="hide-on-print">
              <ScannerInput onScan={handleScan} />
            </div>
            
            <CartTable cart={cart} totalAmount={totalAmount} />
            
            {/* 🌟 NAYA: Yahan CheckoutPanel ko discount ka data bhej diya hai */}
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

            {/* Parchi ka Footer */}
            <div className="show-on-print" style={{ borderTop: '2px dashed #000', paddingTop: '10px', marginTop: '20px' }}>
              
              {/* 🌟 NAYA: Agar discount diya hai toh parchi par bhi print hoga */}
              {discount > 0 && <p style={{ margin: '5px 0', fontSize: '14px' }}>Discount: -Rs. {discount}</p>}
              <h3 style={{ margin: '5px 0' }}>Total Paid: Rs. {finalAmount?.toLocaleString()}</h3>
              
              <h3 style={{ margin: '15px 0 5px 0' }}>Thank You For Shopping!</h3>
              <p style={{ margin: 0, fontSize: '12px' }}>System developed by wp_doctr</p>
            </div>
          </>
        )}
        
      </div>
    </>
  );
}