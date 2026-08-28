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
  const [editingId, setEditingId] = useState(null);

  const [editingSale, setEditingSale] = useState(null);
  
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

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newName || !newPrice || !newQty) return alert('⚠️ Naam, Price, aur Stock zaroori hai!');
    const finalBarcode = newBarcode.trim() || Math.floor(100000 + Math.random() * 900000).toString();
    const payload = { barcode: finalBarcode, product_name: newName, price: Number(newPrice), quantity: Number(newQty), category: newShelf || 'Dukan', expiry_date: null };
    
    try {
      let res;
      if (editingId) {
        res = await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${editingId}`, { method: 'PATCH', headers, body: JSON.stringify(payload) });
      } else {
        res = await fetch(`${SUPABASE_URL}/rest/v1/inventory`, { method: 'POST', headers, body: JSON.stringify(payload) });
      }
      if (res.ok) { handleCancelEdit(); fetchInventory(); if (barcodeRef.current) barcodeRef.current.focus(); } 
    } catch (err) {}
  };

  const handleEditClick = (item) => {
    setEditingId(item.id); setNewBarcode(item.barcode || ''); setNewName(item.product_name || item.name || ''); setNewPrice(item.price || ''); setNewQty(item.quantity || ''); setNewShelf(item.category && item.category !== 'General' ? item.category : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleCancelEdit = () => { setEditingId(null); setNewBarcode(''); setNewName(''); setNewPrice(''); setNewQty(''); setNewShelf(''); };

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

  const downloadInventoryExcel = () => {
    let csv = "Code,Name,Shelf No,Price,Stock\n";
    inventory.forEach(item => { csv += `"${item.barcode || item.id}","${item.product_name || item.name}","${item.category || ''}",${item.price},${item.quantity}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Godam_Stock_${new Date().toLocaleDateString('en-PK')}.csv`; link.click();
  };
  const handlePrintInventoryPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `<html><head><title>Godam Stock Report</title><style>body { font-family: sans-serif; padding: 20px; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; } th { background-color: #f4f4f5; }</style></head><body><h2>📦 Godam Stock Report</h2><p>Date: ${new Date().toLocaleDateString('en-PK')}</p><table><tr><th>Code</th><th>Name</th><th>Shelf No</th><th>Price</th><th>Stock</th></tr>`;
    inventory.forEach(item => { html += `<tr><td>${item.barcode || item.id}</td><td>${item.product_name || item.name}</td><td>${item.category || '-'}</td><td>Rs. ${item.price}</td><td style="color: ${item.quantity < 5 ? 'red' : 'green'}; font-weight: bold;">${item.quantity}</td></tr>`; });
    html += `</table></body></html>`; printWindow.document.write(html); printWindow.document.close(); setTimeout(() => { printWindow.print(); }, 500);
  };

  const totalSalesAmount = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalExpensesAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const handleEditSaleClick = (sale) => {
    let parsed = typeof sale.details === 'string' ? JSON.parse(sale.details) : sale.details;
    setEditingSale({ ...sale, parsedDetails: parsed || [] });
  };
  
  const handleSaleItemQtyChange = (itemId, newQty) => {
    if (!editingSale || newQty < 1) return;
    const updatedDetails = editingSale.parsedDetails.map(item => 
      item.id === itemId ? { ...item, qty: newQty } : item
    );
    setEditingSale({ ...editingSale, parsedDetails: updatedDetails });
  };

  const handleSaveSaleEdit = async () => {
    if(!editingSale) return;
    const newTotal = editingSale.parsedDetails.reduce((sum, item) => sum + ((item.price || 0) * item.qty), 0);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/sales?id=eq.${editingSale.id}`, {
        method: 'PATCH', headers, 
        body: JSON.stringify({ total_amount: newTotal, payment_method: editingSale.payment_method, details: editingSale.parsedDetails })
      });
      if(res.ok) { setEditingSale(null); fetchSales(); }
    } catch(err) { console.error(err); alert("Network Error"); }
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

  const downloadSalesExcel = () => {
    let csv = "Bill No,Date,Payment Method,Total Amount\n";
    sales.forEach(s => { csv += `"${s.id}","${new Date(s.created_at).toLocaleString('en-PK')}","${s.payment_method || 'Cash'}",${s.total_amount}\n`; });
    csv += `\n,,GRAND TOTAL:,${totalSalesAmount}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Sales_Report_${new Date().toLocaleDateString('en-PK')}.csv`; link.click();
  };
  
  const handlePrintSalesPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `<html><head><title>Sales Report</title><style>body { font-family: sans-serif; padding: 20px; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 10px; text-align: left; } th { background-color: #f4f4f5; }</style></head><body><h2>💰 Sales Report</h2><p>Date: ${new Date().toLocaleDateString('en-PK')}</p><table><tr><th>Bill No</th><th>Date</th><th>Payment Method</th><th>Total</th></tr>`;
    sales.forEach(s => { html += `<tr><td>#${s.id}</td><td>${new Date(s.created_at).toLocaleString('en-PK')}</td><td>${s.payment_method || 'Cash'}</td><td style="color: #10b981; font-weight: bold;">Rs. ${s.total_amount.toLocaleString()}</td></tr>`; });
    html += `<tr><td colspan="3" style="text-align:right; font-weight:bold;">Grand Total:</td><td style="color: #10b981; font-weight: 900; font-size: 18px;">Rs. ${totalSalesAmount.toLocaleString()}</td></tr>`;
    html += `</table></body></html>`; printWindow.document.write(html); printWindow.document.close(); setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div className="admin-wrapper">
      <style>{`
        .admin-wrapper { display: flex; flex-direction: row; height: 100%; background-color: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color); width: 100%; font-family: 'Inter', sans-serif; }
        .admin-sidebar { width: 220px; background-color: #0f172a; display: flex; flex-direction: column; padding: 20px; flex-shrink: 0; }
        .admin-content { flex: 1; padding: 20px; overflow-y: auto; overflow-x: hidden; width: 100%; background: var(--card-bg); position: relative; }
        .nav-btn { background: transparent; color: #94a3b8; border: none; text-align: left; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 5px; white-space: nowrap; }
        .nav-btn.active { background: #3b82f6; color: #fff; }
        .admin-card { background: var(--card-bg); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 20px; width: 100%; overflow: hidden; }
        .admin-input { width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; font-weight: bold; background: transparent; color: var(--text-main); }
        .admin-btn { padding: 10px 15px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; color: white; display: inline-flex; align-items: center; justify-content: center; gap: 5px; white-space: nowrap; }
        .table-responsive { overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; }
        table { width: 100%; border-collapse: collapse; min-width: 550px; } th { background: rgba(148,163,184,0.1); padding: 10px; text-align: left; color: var(--text-muted); font-size: 12px; text-transform: uppercase;} td { padding: 10px; border-bottom: 1px solid var(--border-color); color: var(--text-main); font-size: 13px; }
        
        .modern-title { font-weight: 900; font-size: 20px; letter-spacing: -0.5px; color: var(--text-main); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .dashboard-stats { display: flex; gap: 15px; flex-wrap: wrap; }

        /* 📱 ULTRA RESPONSIVE ANDROID VIEW */
        @media (max-width: 900px) {
          .admin-wrapper { flex-direction: column; height: auto; border: none; border-radius: 0; background: transparent; }
          .admin-sidebar { width: 100%; flex-direction: row; padding: 10px; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; margin-bottom: 15px; }
          .admin-sidebar h2 { display: none; }
          .nav-btn { margin-bottom: 0; margin-right: 10px; flex: 0 0 auto; text-align: center; }
          .admin-content { padding: 0; overflow: visible; }
          .admin-card { padding: 15px; }
          .dashboard-stats > div { flex: 1 1 100%; }
        }
      `}</style>

      {/* 🌟 EDIT BILL MODAL */}
      {editingSale && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
          <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', width: '100%', maxWidth: '450px', border: '1px solid var(--border-color)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="modern-title" style={{marginBottom: '10px'}}>✏️ Edit Bill #{editingSale.id}</h3>
            <p style={{fontSize: '11px', color: '#ef4444', marginBottom: '15px'}}>Note: Yahan change karne se sirf Bill/Receipt update hogi.</p>
            
            <div style={{maxHeight: '250px', overflowY: 'auto', marginBottom: '15px', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px'}}>
              {editingSale.parsedDetails.map(item => (
                <div key={item.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed var(--border-color)'}}>
                  <div>
                    <div style={{fontWeight: 'bold', fontSize: '13px'}}>{item.product_name || item.name}</div>
                    <div style={{fontSize: '11px', color: '#10b981'}}>Rs. {item.price} each</div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <button onClick={() => handleSaleItemQtyChange(item.id, item.qty - 1)} style={{padding: '4px 8px', fontWeight: 'bold'}}>-</button>
                    <span style={{fontWeight: 'bold', fontSize: '13px'}}>{item.qty}</span>
                    <button onClick={() => handleSaleItemQtyChange(item.id, item.qty + 1)} style={{padding: '4px 8px', fontWeight: 'bold'}}>+</button>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
              <span style={{fontWeight: 'bold', fontSize: '14px'}}>Payment Method:</span>
              <select value={editingSale.payment_method} onChange={e => setEditingSale({...editingSale, payment_method: e.target.value})} style={{padding: '5px', borderRadius: '4px', fontSize: '13px'}}>
                <option value="Cash">Cash</option><option value="Mobile Wallet">Mobile Wallet</option><option value="Card">Card</option><option value="Udhaar">Udhaar</option>
              </select>
            </div>
            
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '16px'}}>
              <span style={{fontWeight: 'bold'}}>Naya Total:</span>
              <span style={{fontWeight: '900', color: '#10b981'}}>Rs. {editingSale.parsedDetails.reduce((sum, item) => sum + ((item.price || 0) * item.qty), 0)}</span>
            </div>
            
            <div style={{display: 'flex', gap: '10px'}}>
              <button onClick={handleSaveSaleEdit} className="admin-btn" style={{background: '#10b981', flex: 1}}>💾 Save</button>
              <button onClick={() => setEditingSale(null)} className="admin-btn" style={{background: '#ef4444', flex: 1}}>❌ Cancel</button>
            </div>
          </div>
        </div>
      )}

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
            <div className="dashboard-stats">
              <div style={{ padding: '15px', background: '#ecfdf5', borderRadius: '10px', flex: 1, border: '1px solid #10b981' }}><h3 style={{fontSize:'14px', margin:'0 0 5px 0'}}>Total Sales</h3><h2 style={{color: '#047857', fontWeight:'900', margin:0}}>Rs. {totalSalesAmount.toLocaleString()}</h2></div>
              <div style={{ padding: '15px', background: '#fef2f2', borderRadius: '10px', flex: 1, border: '1px solid #ef4444' }}><h3 style={{fontSize:'14px', margin:'0 0 5px 0'}}>Total Expense</h3><h2 style={{color: '#b91c1c', fontWeight:'900', margin:0}}>Rs. {totalExpensesAmount.toLocaleString()}</h2></div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            <div className="admin-card" style={{ borderLeft: '4px solid #f59e0b', background: editingId ? '#fffbeb' : 'var(--card-bg)' }}>
              <h2 className="modern-title" style={{color: editingId ? '#d97706' : 'var(--text-main)'}}>{editingId ? '✏️ Item Update Karein' : '➕ Naya Samaan Dalein'}</h2>
              <form onSubmit={handleAddItem} className="form-grid">
                <div><label style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'bold'}}>Item Name *</label><input type="text" ref={nameRef} onKeyDown={e => handleKeyDown(e, priceRef)} value={newName} onChange={e => setNewName(e.target.value)} className="admin-input" required /></div>
                <div><label style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'bold'}}>Price (Rs) *</label><input type="number" ref={priceRef} onKeyDown={e => handleKeyDown(e, qtyRef)} value={newPrice} onChange={e => setNewPrice(e.target.value)} className="admin-input" required /></div>
                <div><label style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'bold'}}>Stock Qty *</label><input type="number" ref={qtyRef} onKeyDown={e => handleKeyDown(e, shelfRef)} value={newQty} onChange={e => setNewQty(e.target.value)} className="admin-input" required /></div>
                <div><label style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'bold'}}>Barcode (Optional)</label><input type="text" ref={barcodeRef} onKeyDown={e => handleKeyDown(e, nameRef)} value={newBarcode} onChange={e => setNewBarcode(e.target.value)} className="admin-input" /></div>
                <div><label style={{fontSize:'12px', color:'var(--text-muted)', fontWeight:'bold'}}>Shelf No / Location</label><input type="text" ref={shelfRef} placeholder="Maslan: Rack 1" value={newShelf} onChange={e => setNewShelf(e.target.value)} className="admin-input" /></div>
                <div style={{display:'flex', alignItems:'flex-end', gap: '10px', gridColumn: '1 / -1'}}>
                  {editingId && <button type="button" onClick={handleCancelEdit} className="admin-btn" style={{background:'#64748b', padding:'12px', flex: 1}}>❌ Cancel</button>}
                  <button type="submit" className="admin-btn" style={{background: editingId ? '#10b981' : '#f59e0b', padding:'12px', flex: 2}}>{editingId ? '💾 Update Item' : '💾 Save Item'}</button>
                </div>
              </form>
            </div>

            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 className="modern-title" style={{margin: 0}}>📦 Godam Stock</h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={downloadInventoryExcel} className="admin-btn" style={{background: '#10b981'}}>⬇️ Excel</button>
                  <button onClick={handlePrintInventoryPDF} className="admin-btn" style={{background: '#3b82f6'}}>🖨️ PDF</button>
                  <button onClick={handleDeleteAllItems} className="admin-btn" style={{background: '#ef4444'}}>🚨 Delete All</button>
                </div>
              </div>
              <div className="table-responsive">
                <table>
                  <thead><tr><th>Code</th><th>Name</th><th>Shelf</th><th>Price</th><th>Stock</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
                  <tbody>
                    {inventory.map(item => (
                      <tr key={item.id} style={{background: editingId === item.id ? '#fef3c7' : 'transparent'}}>
                        <td style={{fontWeight:'bold'}}>{item.barcode || item.id}</td>
                        <td style={{fontWeight:'bold'}}>{item.product_name || item.name}</td>
                        <td style={{color:'#3b82f6', fontWeight:'bold'}}>{item.category || 'N/A'}</td>
                        <td style={{fontWeight:'bold'}}>Rs. {item.price}</td>
                        <td style={{fontWeight:'900', color: item.quantity<4?'#ef4444':'#10b981'}}>{item.quantity}</td>
                        <td style={{textAlign:'right', display:'flex', gap:'5px', justifyContent:'flex-end'}}>
                          <button onClick={() => handleEditClick(item)} className="admin-btn" style={{background:'#f59e0b', padding:'6px 10px', fontSize:'12px'}}>✏️</button>
                          <button onClick={() => handleDeleteItem(item.id)} className="admin-btn" style={{background:'#ef4444', padding:'6px 10px', fontSize:'12px'}}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 className="modern-title" style={{margin: 0}}>💰 Sales Report</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={downloadSalesExcel} className="admin-btn" style={{background: '#10b981'}}>⬇️ Excel</button>
                <button onClick={handlePrintSalesPDF} className="admin-btn" style={{background: '#3b82f6'}}>🖨️ PDF</button>
              </div>
            </div>
            
            <div className="table-responsive">
              <table>
                <thead><tr><th>Bill No</th><th>Date</th><th>Total</th><th>Payment</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
                <tbody>
                  {sales.map(sale => (
                    <tr key={sale.id}>
                      <td style={{fontWeight:'bold'}}>#{sale.id}</td>
                      <td style={{color:'var(--text-muted)'}}>{new Date(sale.created_at).toLocaleDateString('en-PK')}</td>
                      <td style={{fontWeight:'900', color:'#10b981'}}>Rs. {sale.total_amount.toLocaleString()}</td>
                      <td><span style={{background:'rgba(148,163,184,0.1)', padding:'4px 8px', borderRadius:'4px', fontWeight:'bold', fontSize:'12px'}}>{sale.payment_method || 'Cash'}</span></td>
                      <td style={{textAlign:'right', display:'flex', gap:'5px', justifyContent:'flex-end'}}>
                        <button onClick={() => handleEditSaleClick(sale)} className="admin-btn" style={{background:'#f59e0b', padding:'6px 10px', fontSize:'12px'}}>✏️</button>
                        <button onClick={() => handleReprintReceipt(sale)} className="admin-btn" style={{background:'#3b82f6', padding:'6px 10px', fontSize:'12px'}}>🖨️</button>
                        <button onClick={() => handleDeleteSale(sale.id)} className="admin-btn" style={{background:'#ef4444', padding:'6px 10px', fontSize:'12px'}}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {sales.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>Koi sale nahi mili.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}