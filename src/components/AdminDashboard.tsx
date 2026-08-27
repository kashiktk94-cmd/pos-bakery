import React, { useState, useEffect, useRef } from 'react';
import { SUPABASE_URL, headers } from '../config/supabase';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  
  const [newBarcode, setNewBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newShelf, setNewShelf] = useState('');
  
  // 🌟 NAYA: Edit Mode ke liye State
  const [editingId, setEditingId] = useState(null);
  
  const barcodeRef = useRef(null);
  const nameRef = useRef(null);
  const priceRef = useRef(null);
  const qtyRef = useRef(null);
  const shelfRef = useRef(null);

  useEffect(() => { fetchInventory(); fetchSales(); fetchExpenses(); }, []);

  const fetchInventory = async () => { try { const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory?select=*&order=product_name.asc`, { headers }); const data = await res.json(); if (!data.error) setInventory(data); } catch (err) {} };
  const fetchSales = async () => { try { const res = await fetch(`${SUPABASE_URL}/rest/v1/sales?select=*&order=id.desc`, { headers }); const data = await res.json(); if (!data.error) setSales(data); } catch (err) {} };
  const fetchExpenses = async () => { try { const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses?select=*&order=id.desc`, { headers }); const data = await res.json(); if (!data.error) setExpenses(data); } catch (err) {} };

  const handleKeyDown = (e, nextRef) => { if (e.key === 'Enter') { e.preventDefault(); if (nextRef && nextRef.current) nextRef.current.focus(); } };

  // 🌟 UPDATE: Save & Edit dono ka function
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newName || !newPrice || !newQty) return alert('⚠️ Naam, Price, aur Stock zaroori hai!');
    const finalBarcode = newBarcode.trim() || Math.floor(100000 + Math.random() * 900000).toString();
    const payload = { barcode: finalBarcode, product_name: newName, price: Number(newPrice), quantity: Number(newQty), category: newShelf || 'Dukan', expiry_date: null };
    
    try {
      let res;
      if (editingId) {
        // Agar Edit ho raha hai toh PATCH karein
        res = await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${editingId}`, { method: 'PATCH', headers, body: JSON.stringify(payload) });
      } else {
        // Naya hai toh POST karein
        res = await fetch(`${SUPABASE_URL}/rest/v1/inventory`, { method: 'POST', headers, body: JSON.stringify(payload) });
      }

      if (res.ok) { 
        handleCancelEdit(); 
        fetchInventory(); 
        if (barcodeRef.current) barcodeRef.current.focus(); 
      } 
    } catch (err) {}
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setNewBarcode(item.barcode || '');
    setNewName(item.product_name || item.name || '');
    setNewPrice(item.price || '');
    setNewQty(item.quantity || '');
    setNewShelf(item.category && item.category !== 'General' ? item.category : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewBarcode(''); setNewName(''); setNewPrice(''); setNewQty(''); setNewShelf('');
  };

  const handleDeleteItem = async (id) => {
    if(!window.confirm("⚠️ Kya aap is item ko hamesha ke liye GODAM se DELETE karna chahte hain?")) return;
    try { const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${id}`, { method: 'DELETE', headers }); if(res.ok) fetchInventory(); } catch(err) {}
  };

  const handleDeleteAllItems = async () => {
    if(!window.confirm("🚨 WARNING: Kya aap GODAM KA SARA SAMAAN delete karna chahte hain? Yeh wapas nahi aayega!")) return;
    const pass = window.prompt("Security Lock: Confirm karne ke liye Admin PIN (1234) darj karein:");
    if(pass !== "1234") return alert("❌ Ghalat PIN!");
    try { const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=not.is.null`, { method: 'DELETE', headers }); if(res.ok) { fetchInventory(); alert("✅ Godam poori tarah khali kar diya gaya hai!"); } } catch(err) {}
  };

  const handleDeleteSale = async (id) => {
    if(!window.confirm(`⚠️ Kya aap Bill #${id} ko Sales Report se DELETE karna chahte hain?`)) return;
    try { const res = await fetch(`${SUPABASE_URL}/rest/v1/sales?id=eq.${id}`, { method: 'DELETE', headers }); if(res.ok) fetchSales(); } catch(err) {}
  };

  const handleReprintReceipt = (sale) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    let html = `<html><head><style>body{font-family:monospace; padding:15px;} table{width:100%; border-collapse:collapse;} td{padding:4px 0;} .right{text-align:right;} .center{text-align:center;}</style></head><body>`;
    html += `<div class="center"><h2>Kashif Bakery</h2><p>*** DUPLICATE PARCHI ***</p><p>Bill #${sale.id} | ${new Date(sale.created_at).toLocaleString('en-PK')}</p></div><hr/><table>`;
    const items = typeof sale.details === 'string' ? JSON.parse(sale.details) : sale.details;
    items.forEach(item => { html += `<tr><td>${item.product_name || item.name} (x${item.qty})</td><td class="right">Rs. ${item.price * item.qty}</td></tr>`; });
    html += `</table><hr/><h3>Total Paid: Rs. ${sale.total_amount}</h3><p>Payment: ${sale.payment_method}</p><div class="center"><p>Thank You!</p></div></body></html>`;
    printWindow.document.write(html); printWindow.document.close(); setTimeout(() => printWindow.print(), 500);
  };

  const totalSalesAmount = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalExpensesAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <div className="admin-wrapper">
      <style>{`
        .admin-wrapper { display: flex; flex-direction: row; min-height: 86vh; background-color: var(--card-bg); border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); width: 100%; font-family: 'Inter', sans-serif; }
        .admin-sidebar { width: 220px; background-color: #0f172a; display: flex; flex-direction: column; padding: 20px; flex-shrink: 0; }
        .admin-content { flex: 1; padding: 25px; overflow-y: auto; max-height: 86vh; width: 100%; background: var(--card-bg); }
        .nav-btn { background: transparent; color: #94a3b8; border: none; text-align: left; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 5px; }
        .nav-btn.active { background: #3b82f6; color: #fff; }
        .admin-card { background: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 20px; }
        .admin-input { width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; font-weight: bold; background: transparent; color: var(--text-main); }
        .admin-btn { padding: 10px 15px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; color: white; display: inline-flex; align-items: center; justify-content: center; gap: 5px; }
        table { width: 100%; border-collapse: collapse; } th { background: rgba(148,163,184,0.1); padding: 10px; text-align: left; color: var(--text-muted); font-size: 12px; text-transform: uppercase;} td { padding: 10px; border-bottom: 1px solid var(--border-color); color: var(--text-main); font-size: 14px; }
        
        /* 🌟 NAYA: HD Sharp Headings CSS */
        .modern-title {
          font-weight: 900;
          font-size: 22px;
          letter-spacing: -0.5px;
          color: var(--text-main);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-shadow: 0px 1px 2px rgba(0,0,0,0.1);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
      `}</style>

      <div className="admin-sidebar">
        <h2 style={{ color: '#fff', fontSize: '18px', marginBottom: '20px', fontWeight: '900' }}>⚙️ Admin Panel</h2>
        <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</button>
        <button className={`nav-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>📦 Godam / Shelf</button>
        <button className={`nav-btn ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>💰 Sales & Reprint</button>
      </div>

      <div className="admin-content">
        
        {activeTab === 'dashboard' && (
          <div className="admin-card">
            <h2 className="modern-title">📊 Overview Dashboard</h2>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ padding: '20px', background: '#ecfdf5', borderRadius: '10px', flex: 1, border: '1px solid #10b981' }}><h3>Total Sales</h3><h2 style={{color: '#047857', fontWeight:'900'}}>Rs. {totalSalesAmount.toLocaleString()}</h2></div>
              <div style={{ padding: '20px', background: '#fef2f2', borderRadius: '10px', flex: 1, border: '1px solid #ef4444' }}><h3>Total Expense</h3><h2 style={{color: '#b91c1c', fontWeight:'900'}}>Rs. {totalExpensesAmount.toLocaleString()}</h2></div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            <div className="admin-card" style={{ borderLeft: '4px solid #f59e0b', background: editingId ? '#fffbeb' : 'var(--card-bg)' }}>
              <h2 className="modern-title" style={{color: editingId ? '#d97706' : 'var(--text-main)'}}>
                {editingId ? '✏️ Item Update Karein' : '➕ Naya Samaan Dalein'}
              </h2>
              <form onSubmit={handleAddItem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div><label style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'bold'}}>Item Name *</label><input type="text" ref={nameRef} onKeyDown={e => handleKeyDown(e, priceRef)} value={newName} onChange={e => setNewName(e.target.value)} className="admin-input" required /></div>
                <div><label style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'bold'}}>Price (Rs) *</label><input type="number" ref={priceRef} onKeyDown={e => handleKeyDown(e, qtyRef)} value={newPrice} onChange={e => setNewPrice(e.target.value)} className="admin-input" required /></div>
                <div><label style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'bold'}}>Stock Qty *</label><input type="number" ref={qtyRef} onKeyDown={e => handleKeyDown(e, shelfRef)} value={newQty} onChange={e => setNewQty(e.target.value)} className="admin-input" required /></div>
                <div><label style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'bold'}}>Barcode (Optional)</label><input type="text" ref={barcodeRef} onKeyDown={e => handleKeyDown(e, nameRef)} value={newBarcode} onChange={e => setNewBarcode(e.target.value)} className="admin-input" /></div>
                <div><label style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'bold'}}>Shelf No / Location</label><input type="text" ref={shelfRef} placeholder="Maslan: Rack 1" value={newShelf} onChange={e => setNewShelf(e.target.value)} className="admin-input" /></div>
                
                <div style={{display:'flex', alignItems:'flex-end', gap: '10px'}}>
                  {editingId && <button type="button" onClick={handleCancelEdit} className="admin-btn" style={{background:'#64748b', padding:'12px', flex: 1}}>❌ Cancel</button>}
                  <button type="submit" className="admin-btn" style={{background: editingId ? '#10b981' : '#f59e0b', padding:'12px', flex: 2}}>
                    {editingId ? '💾 Update Item' : '💾 Save Item'}
                  </button>
                </div>
              </form>
            </div>

            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="modern-title" style={{margin: 0}}>📦 Godam Stock</h2>
                <button onClick={handleDeleteAllItems} className="admin-btn" style={{background: '#ef4444'}}>🚨 Delete All Stock</button>
              </div>
              <table>
                <thead><tr><th>Code</th><th>Name</th><th>Shelf No</th><th>Price</th><th>Stock</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
                <tbody>
                  {inventory.map(item => (
                    <tr key={item.id} style={{background: editingId === item.id ? '#fef3c7' : 'transparent'}}>
                      <td style={{fontWeight:'bold'}}>{item.barcode || item.id}</td>
                      <td style={{fontWeight:'bold'}}>{item.product_name || item.name}</td>
                      <td style={{color:'#3b82f6', fontWeight:'bold'}}>{item.category || 'N/A'}</td>
                      <td style={{fontWeight:'bold'}}>Rs. {item.price}</td>
                      <td style={{fontWeight:'900', color: item.quantity<4?'#ef4444':'#10b981'}}>{item.quantity}</td>
                      <td style={{textAlign:'right', display:'flex', gap:'5px', justifyContent:'flex-end'}}>
                        <button onClick={() => handleEditClick(item)} className="admin-btn" style={{background:'#f59e0b', padding:'6px 10px', fontSize:'12px'}}>✏️ Edit</button>
                        <button onClick={() => handleDeleteItem(item.id)} className="admin-btn" style={{background:'#ef4444', padding:'6px 10px', fontSize:'12px'}}>🗑️ Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="admin-card">
            <h2 className="modern-title">💰 Sales Report & Actions</h2>
            <table>
              <thead><tr><th>Bill No</th><th>Date</th><th>Total</th><th>Payment</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale.id}>
                    <td style={{fontWeight:'bold'}}>#{sale.id}</td>
                    <td style={{color:'var(--text-muted)'}}>{new Date(sale.created_at).toLocaleString('en-PK')}</td>
                    <td style={{fontWeight:'900', color:'#10b981'}}>Rs. {sale.total_amount.toLocaleString()}</td>
                    <td><span style={{background:'rgba(148,163,184,0.1)', padding:'4px 8px', borderRadius:'4px', fontWeight:'bold'}}>{sale.payment_method || 'Cash'}</span></td>
                    <td style={{textAlign:'right', display:'flex', gap:'5px', justifyContent:'flex-end'}}>
                      <button onClick={() => handleReprintReceipt(sale)} className="admin-btn" style={{background:'#3b82f6', padding:'6px 10px', fontSize:'12px'}}>🖨️ Reprint</button>
                      <button onClick={() => handleDeleteSale(sale.id)} className="admin-btn" style={{background:'#ef4444', padding:'6px 10px', fontSize:'12px'}}>🗑️ Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}