import React, { useState, useEffect, useRef } from 'react';
import { SUPABASE_URL, headers } from '../config/supabase';

export default function AdminDashboard() {
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [newBarcode, setNewBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newExpiry, setNewExpiry] = useState('');

  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [refundItemId, setRefundItemId] = useState('');
  const [refundQty, setRefundQty] = useState('');

  const fileInputRef = useRef(null);
  const barcodeRef = useRef(null);
  const nameRef = useRef(null);
  const priceRef = useRef(null);
  const qtyRef = useRef(null);

  useEffect(() => { fetchInventory(); fetchSales(); fetchExpenses(); }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory?select=*&order=product_name.asc`, { headers });
      const data = await res.json();
      if (!data.error) setInventory(data);
    } catch (err) { console.error(err); }
  };

  const fetchSales = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/sales?select=*&order=id.desc`, { headers });
      const data = await res.json();
      if (!data.error) setSales(data);
    } catch (err) { console.error(err); }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses?select=*&order=id.desc`, { headers });
      const data = await res.json();
      if (!data.error) setExpenses(data);
    } catch (err) { console.error(err); }
  };

  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') { e.preventDefault(); if (nextRef && nextRef.current) nextRef.current.focus(); }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newName || !newPrice || !newQty) return alert('⚠️ Naam, Price, aur Stock likhna zaroori hai!');

    const existingItem = inventory.find(i => i.barcode === newBarcode.trim() && newBarcode.trim() !== '');
    if (existingItem) return alert(`⚠️ Yeh Barcode pehle se "${existingItem.product_name}" ke paas hai!`);

    const finalBarcode = newBarcode.trim() || Math.floor(100000 + Math.random() * 900000).toString();
    const payload = { 
      barcode: finalBarcode, product_name: newName, price: Number(newPrice), 
      quantity: Number(newQty), category: 'General',
      expiry_date: newExpiry || null 
    };

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory`, { method: 'POST', headers, body: JSON.stringify(payload) });
      if (res.ok) {
        setNewBarcode(''); setNewName(''); setNewPrice(''); setNewQty(''); setNewExpiry('');
        fetchInventory(); if (barcodeRef.current) barcodeRef.current.focus();
      } else {
        const errData = await res.json(); alert(`❌ Database Error: ${errData.message}`);
      }
    } catch (err) { console.error(err); alert('⚠️ Network ka masla hai.'); }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount) return alert('⚠️ Tafseel aur Rakam likhna zaroori hai!');
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/expenses`, { method: 'POST', headers, body: JSON.stringify({ description: expenseDesc, amount: Number(expenseAmount) }) });
      if (res.ok) { setExpenseDesc(''); setExpenseAmount(''); fetchExpenses(); } 
      else alert('❌ Kharcha save hone mein masla hai.');
    } catch (err) { console.error(err); alert('⚠️ Network masla.'); }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("⚠️ Kya aap waqai is kharchay ko delete karna chahte hain?")) return;
    try { await fetch(`${SUPABASE_URL}/rest/v1/expenses?id=eq.${id}`, { method: 'DELETE', headers }); fetchExpenses(); } catch (err) { console.error(err); }
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    if (!refundItemId || !refundQty || Number(refundQty) <= 0) return alert("⚠️ Sahi item aur tadaad select karein!");
    const item = inventory.find(i => i.id.toString() === refundItemId); if (!item) return;
    const refundAmount = item.price * Number(refundQty);
    if (!window.confirm(`Kya aap waqai ${refundQty}x "${item.product_name || item.name}" wapas kar ke Rs. ${refundAmount} gally se nikalna chahte hain?`)) return;

    try {
      const newStock = item.quantity + Number(refundQty);
      await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${item.id}`, { method: 'PATCH', headers, body: JSON.stringify({ quantity: newStock }) });
      const refundDetails = [{ id: item.id, name: `(WAPSI) ${item.product_name || item.name}`, price: item.price, qty: -Number(refundQty) }];
      await fetch(`${SUPABASE_URL}/rest/v1/sales`, { method: 'POST', headers, body: JSON.stringify({ total_amount: -refundAmount, details: refundDetails, payment_method: 'Refund' }) });
      alert(`✅ Samaan wapas ho gaya!`); setRefundItemId(''); setRefundQty(''); fetchInventory(); fetchSales();
    } catch (err) { console.error(err); alert('⚠️ Wapsi mein masla aya.'); }
  };

  const handleEditPrice = async (item) => {
    const itemName = item.product_name || item.name;
    const newPrice = prompt(`✏️ "${itemName}" ki nayi qeemat (Price) likhein:`, item.price);
    if (newPrice === null || newPrice.trim() === "" || isNaN(newPrice) || Number(newPrice) <= 0) return;
    try { await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${item.id}`, { method: 'PATCH', headers, body: JSON.stringify({ price: Number(newPrice) }) }); fetchInventory(); } catch (err) { console.error(err); }
  };

  const handleRestock = async (item) => {
    const itemName = item.product_name || item.name;
    const addedQty = prompt(`📦 "${itemName}" ka naya stock kitna aya hai? \n(Purana stock: ${item.quantity})`, "10");
    if (addedQty === null || addedQty.trim() === "" || isNaN(addedQty) || Number(addedQty) <= 0) return;
    const newTotalStock = item.quantity + Number(addedQty);
    try { await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${item.id}`, { method: 'PATCH', headers, body: JSON.stringify({ quantity: newTotalStock }) }); fetchInventory(); alert(`✅ Stock update ho gaya!`); } catch (err) { console.error(err); }
  };

  const downloadSampleCSV = () => {
    const csv = "Barcode,Item Name,Price,Stock\n123456789,Lays French Cheese,100,50\n,Khuli Cheeni (1Kg),150,20\n";
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Sample_Upload_Format.csv`; link.click();
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result; const rows = text.split('\n'); const payload = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim(); if (!row) continue; const cols = row.split(',');
        if (cols.length >= 4) {
          let barcode = cols[0].trim(); let name = cols[1].trim(); let price = Number(cols[2].trim()); let qty = Number(cols[3].trim());
          if (name && price > 0 && qty >= 0) {
            if (!barcode) barcode = Math.floor(100000 + Math.random() * 900000).toString();
            payload.push({ barcode: barcode, product_name: name, price: price, quantity: qty, category: 'General' });
          }
        }
      }
      if (payload.length === 0) return alert("⚠️ File khali hai.");
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory`, { method: 'POST', headers, body: JSON.stringify(payload) });
        if (res.ok) { alert(`✅ Zabardast! ${payload.length} naye items add ho gaye!`); fetchInventory(); } 
        else { const errData = await res.json(); alert(`❌ Database Error: ${errData.message}`); }
      } catch (err) { console.error(err); alert('⚠️ Network ka masla hai.'); }
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const downloadInventoryExcel = () => {
    let csv = "ID,Barcode/Code,Item Name,Price (Rs),Baqi Stock,Status\n";
    inventory.forEach(item => {
      const status = item.quantity < 4 ? "⚠️ Low Stock Warning" : "Normal";
      csv += `${item.id},"${item.barcode || item.id}","${item.product_name || item.name}",${item.price},${item.quantity},"${status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Godam_Report_${new Date().toLocaleDateString('en-PK')}.csv`; link.click();
  };

  const handlePrintInventoryPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `<html><head><title>Godam (Inventory) Report</title><style>body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; } table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; } th, td { border: 1px solid #ddd; padding: 12px; text-align: left; } th { background-color: #f8f9fa; color: #555; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; } .right { text-align: right; } .center { text-align: center; } .red { color: #dc2626; font-weight: bold; } .warning-row { background-color: #fef2f2; } .header-box { border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }</style></head><body><div class="header-box"><h2 style="margin:0 0 5px 0; color: #1e293b;">🏪 Kashif Bakery & Mart</h2><h3 style="margin:0; color: #475569;">📦 Godam (Inventory) Report</h3><p style="margin:5px 0 0 0; font-size:12px; color:#64748b;">Printed on: ${new Date().toLocaleString('en-PK')}</p></div><table><tr><th>#</th><th>Item Code</th><th>Item Name</th><th class="right">Price</th><th class="right">Stock (Baqi)</th><th class="center">Status</th></tr>`;
    inventory.forEach((item, index) => {
      const isLow = item.quantity < 4; const rowClass = isLow ? 'warning-row' : ''; const stockClass = isLow ? 'red' : ''; const statusText = isLow ? '<span class="red">⚠️ Low Stock</span>' : '<span style="color:#10b981;">✅ OK</span>';
      html += `<tr class="${rowClass}"><td>${index + 1}</td><td>${item.barcode || item.id}</td><td><strong>${item.product_name || item.name}</strong></td><td class="right">Rs. ${item.price}</td><td class="right ${stockClass}">${item.quantity}</td><td class="center">${statusText}</td></tr>`;
    });
    html += `</table></body></html>`; printWindow.document.write(html); printWindow.document.close(); setTimeout(() => { printWindow.print(); }, 500);
  };

  const downloadSalesExcel = () => {
    let csv = "Bill No,Date,Time,Total Bill (Rs),Payment Method\n";
    sales.forEach(sale => {
      const dateObj = new Date(sale.created_at);
      csv += `${sale.id},"${dateObj.toLocaleDateString('en-PK')}","${dateObj.toLocaleTimeString('en-PK')}",${sale.total_amount},"${sale.payment_method || 'Cash'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Sales_Report_${new Date().toLocaleDateString('en-PK')}.csv`; link.click();
  };

  const handlePrintSalesPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `<html><head><title>Sales Report</title><style>body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; } table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; } th, td { border: 1px solid #ddd; padding: 12px; text-align: left; } th { background-color: #f8f9fa; color: #555; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; } .right { text-align: right; } .red { color: #dc2626; font-weight: bold; } .green { color: #10b981; font-weight: bold; } .header-box { border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }</style></head><body><div class="header-box"><h2 style="margin:0 0 5px 0; color: #1e293b;">🏪 Kashif Bakery & Mart</h2><h3 style="margin:0; color: #475569;">💰 Sales Report</h3><p style="margin:5px 0 0 0; font-size:12px; color:#64748b;">Printed on: ${new Date().toLocaleString('en-PK')}</p></div><table><tr><th>Bill No</th><th>Date</th><th>Time</th><th>Payment</th><th class="right">Total Bill</th></tr>`;
    sales.forEach(sale => {
      const dateObj = new Date(sale.created_at);
      const isRefund = sale.total_amount < 0;
      const colorClass = isRefund ? 'red' : 'green';
      html += `<tr><td>#${sale.id}</td><td>${dateObj.toLocaleDateString('en-PK')}</td><td>${dateObj.toLocaleTimeString('en-PK')}</td><td>${sale.payment_method || 'Cash'}</td><td class="right ${colorClass}">Rs. ${sale.total_amount.toLocaleString()}</td></tr>`;
    });
    html += `</table></body></html>`; printWindow.document.write(html); printWindow.document.close(); setTimeout(() => { printWindow.print(); }, 500);
  };

  const handlePrintZReport = async () => {
    try {
      const salesRes = await fetch(`${SUPABASE_URL}/rest/v1/sales?select=*&order=id.desc`, { headers }); const latestSales = await salesRes.json();
      const expRes = await fetch(`${SUPABASE_URL}/rest/v1/expenses?select=*&order=id.desc`, { headers }); const latestExpenses = await expRes.json();
      const dataToUseSales = latestSales.error ? sales : latestSales;
      const dataToUseExpenses = latestExpenses.error ? expenses : latestExpenses;
      const todayStr = new Date().toLocaleDateString('en-PK');
      const todaysSales = dataToUseSales.filter(s => new Date(s.created_at).toLocaleDateString('en-PK') === todayStr).reverse();
      
      let startTime = "N/A"; let endTime = new Date().toLocaleTimeString('en-PK');
      if (todaysSales.length > 0) startTime = new Date(todaysSales[0].created_at).toLocaleTimeString('en-PK');

      let cashSales = 0; let walletSales = 0; let cardSales = 0; let udhaarSales = 0;
      const soldItemsList = {}; let todaysTotalSales = 0;

      todaysSales.forEach(sale => {
        todaysTotalSales += (sale.total_amount || 0);
        const pm = sale.payment_method || 'Cash';
        if (pm === 'Cash') cashSales += sale.total_amount; else if (pm === 'Mobile Wallet') walletSales += sale.total_amount; else if (pm === 'Card') cardSales += sale.total_amount; else if (pm === 'Udhaar') udhaarSales += sale.total_amount;
        if (sale.details) {
          const itemsArray = typeof sale.details === 'string' ? JSON.parse(sale.details) : sale.details;
          itemsArray.forEach(item => {
            const name = item.product_name || item.name;
            if (!soldItemsList[name]) soldItemsList[name] = { qty: 0, price: item.price, total: 0 };
            soldItemsList[name].qty += item.qty; soldItemsList[name].total += (item.price * item.qty);
          });
        }
      });
      const todaysExpenses = dataToUseExpenses.filter(e => new Date(e.created_at).toLocaleDateString('en-PK') === todayStr);
      const todaysTotalExpenses = todaysExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const netCashDrawer = cashSales - todaysTotalExpenses;

      const printWindow = window.open('', '_blank');
      let html = `<html><head><title>Z-Report</title><style> body { font-family: monospace; padding: 10px; color: #000; max-width: 350px; margin: 0 auto; font-size: 13px; } .center { text-align: center; } .line { border-bottom: 2px dashed #000; margin: 10px 0; } .row { display: flex; justify-content: space-between; margin: 4px 0; } .bold { font-weight: bold; } table { width: 100%; border-collapse: collapse; margin: 10px 0; } th, td { border-bottom: 1px dotted #ccc; padding: 4px 0; text-align: left; font-size: 12px; } .right { text-align: right; } </style></head><body><div class="center"><h2 style="margin:0;">Kashif Bakery</h2><h3 style="margin:5px 0;">🌙 SHIFT CLOSE (Z-REPORT)</h3><p style="margin:0;">Date: ${todayStr}</p></div><div class="line"></div><div class="row"><span>Start Time:</span><span>${startTime}</span></div><div class="row"><span>End Time:</span><span>${endTime}</span></div><div class="row"><span>Total Bills:</span><span>${todaysSales.length}</span></div><div class="line"></div><div class="center bold" style="margin: 10px 0;">--- ITEMS SOLD & RETURNED ---</div><table><tr><th>Item</th><th class="right">Qty</th><th class="right">Total</th></tr>${Object.entries(soldItemsList).map(([name, data]) => `<tr style="${name.includes('(WAPSI)') ? 'color: red;' : ''}"><td>${name}</td><td class="right">${data.qty}</td><td class="right">${data.total.toLocaleString()}</td></tr>`).join('')}</table><div class="line"></div><div class="center bold" style="margin: 10px 0;">--- PAYMENT BREAKDOWN ---</div><div class="row"><span>💵 Cash:</span><span>Rs. ${cashSales.toLocaleString()}</span></div><div class="row"><span>📱 Wallet:</span><span>Rs. ${walletSales.toLocaleString()}</span></div><div class="row"><span>💳 Card:</span><span>Rs. ${cardSales.toLocaleString()}</span></div><div class="row"><span>📓 Udhaar:</span><span>Rs. ${udhaarSales.toLocaleString()}</span></div><div class="line"></div><div class="row bold"><span>Gross Total:</span><span>Rs. ${todaysTotalSales.toLocaleString()}</span></div><div class="row"><span>Expenses (Cash):</span><span>- Rs. ${todaysTotalExpenses.toLocaleString()}</span></div><div class="line"></div><div class="row bold" style="font-size: 16px; background: #000; color: #fff; padding: 8px;"><span>CASH IN DRAWER:</span><span>Rs. ${netCashDrawer.toLocaleString()}</span></div><div class="line"></div><div class="center" style="margin-top: 30px;"><p>System by wp_doctr</p></div></body></html>`;
      printWindow.document.write(html); printWindow.document.close(); setTimeout(() => { printWindow.print(); }, 500);
    } catch (err) { console.error(err); alert("⚠️ Z-Report load karne mein masla aya."); }
  };

  const totalSalesAmount = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalExpensesAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const netProfit = totalSalesAmount - totalExpensesAmount;

  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);

  const expiringSoonItems = inventory.filter(item => {
    if (!item.expiry_date) return false;
    const expDate = new Date(item.expiry_date);
    return expDate <= threeDaysFromNow && item.quantity > 0;
  });

  const calculateTopItems = () => {
    const itemCounts = {};
    sales.forEach(sale => {
      if (sale.total_amount > 0 && sale.details) {
        const itemsArray = typeof sale.details === 'string' ? JSON.parse(sale.details) : sale.details;
        itemsArray.forEach(item => {
          if (item.qty > 0) {
            const name = item.product_name || item.name;
            itemCounts[name] = (itemCounts[name] || 0) + item.qty;
          }
        });
      }
    });
    return Object.entries(itemCounts).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);
  };

  const topItems = calculateTopItems();
  const maxQty = topItems.length > 0 ? topItems[0].qty : 1; 

  // ==========================================
  // 🌟 NAYA: PRINT BARCODE STICKER
  // ==========================================
  const handlePrintBarcode = (item) => {
    const printWindow = window.open('', '_blank', 'width=400,height=400');
    const barcodeCode = item.barcode || item.id;
    // Hum free Bwip-JS api use kar rahe hain barcode ki tasveer (image) bananane ke liye
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${barcodeCode}&scale=3&includetext=true`;
    
    let html = `
      <html><head><title>Print Barcode - ${item.product_name || item.name}</title>
      <style>
        body { text-align: center; font-family: sans-serif; padding-top: 20px; }
        .label { border: 1px dashed #ccc; padding: 10px; display: inline-block; border-radius: 8px; max-width: 250px; }
        img { max-width: 100%; height: auto; margin-bottom: 5px; }
      </style>
      </head><body>
        <div class="label">
          <h4 style="margin: 0 0 5px 0;">Kashif Bakery & Mart</h4>
          <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">${item.product_name || item.name}</p>
          <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 900;">Rs. ${item.price}</p>
          <img src="${barcodeUrl}" alt="Barcode Loading..." onload="window.print(); window.close();" />
        </div>
      </body></html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <>
      <style>{`
        .admin-card { background: #fff; padding: 25px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); margin-bottom: 25px; }
        .admin-btn { padding: 12px 20px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; font-size: 14px; }
        .admin-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .btn-green { background-color: #10b981; color: white; } .btn-blue { background-color: #3b82f6; color: white; }
        .btn-orange { background-color: #f59e0b; color: white; } .btn-purple { background-color: #8b5cf6; color: white; }
        .btn-red { background-color: #ef4444; color: white; } .btn-black { background-color: #0f172a; color: white; }
        
        .admin-input { width: 100%; padding: 12px 15px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 15px; background-color: #f8fafc; color: #000 !important; font-weight: bold; }
        .admin-input::placeholder { color: #94a3b8; font-weight: normal; }
        .admin-input:focus { outline: none; border-color: #3b82f6; background-color: #fff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        
        .form-label { display: block; font-size: 12px; font-weight: bold; color: #475569; margin-bottom: 6px; text-transform: uppercase; }
        .admin-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 700px; }
        .admin-table th { background-color: #f8fafc; color: #64748b; font-weight: 600; padding: 12px 15px; text-align: left; }
        .admin-table td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; color: #000; }
        .stat-box { padding: 20px; border-radius: 10px; color: #000; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }

        @keyframes fillBar { from { width: 0; } }
        .graph-bar { animation: fillBar 1s ease-out forwards; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', backgroundColor: '#fff', padding: '15px 20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>⚙️ Dukan Ka Hisaab (Admin)</h2>
        <button onClick={handlePrintZReport} className="admin-btn btn-black">🌙 Day Close (Itemized Z-Report)</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div className="stat-box" style={{ background: '#e0f2fe', borderColor: '#bae6fd' }}><div><p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Sales</p><h2 style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: '900' }}>Rs. {totalSalesAmount.toLocaleString()}</h2></div><div style={{ fontSize: '35px' }}>📈</div></div>
        <div className="stat-box" style={{ background: '#fee2e2', borderColor: '#fecaca' }}><div><p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Kharcha</p><h2 style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: '900' }}>Rs. {totalExpensesAmount.toLocaleString()}</h2></div><div style={{ fontSize: '35px' }}>💸</div></div>
        <div className="stat-box" style={{ background: '#d1fae5', borderColor: '#a7f3d0' }}><div><p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold' }}>Asal Munafa</p><h2 style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: '900' }}>Rs. {netProfit.toLocaleString()}</h2></div><div style={{ fontSize: '35px' }}>💰</div></div>
        <div className="stat-box" style={{ background: '#fef3c7', borderColor: '#fde68a' }}><div><p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', fontWeight: 'bold' }}>Godam Items</p><h2 style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: '900' }}>{inventory.length} Kism</h2></div><div style={{ fontSize: '35px' }}>📦</div></div>
      </div>

      <div className="admin-card" style={{ borderLeft: '4px solid #3b82f6', backgroundColor: '#f8fafc' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>📊 Top 5 Bikne Wale Items (Best Sellers)</h2>
        {topItems.length > 0 ? (
          <div>
            {topItems.map((item, index) => {
              const colors = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];
              const percentage = (item.qty / maxQty) * 100;
              return (
                <div key={index} style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px', color: '#0f172a' }}>
                    <span>{index + 1}. {item.name}</span><span style={{ color: colors[index] }}>{item.qty} Pcs</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '8px', height: '14px', overflow: 'hidden' }}>
                    <div className="graph-bar" style={{ width: `${percentage}%`, backgroundColor: colors[index], height: '100%', borderRadius: '8px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#64748b', fontStyle: 'italic', margin: 0 }}>Abhi tak koi sale nahi hui, is liye graph khali hai.</p>
        )}
      </div>

      {expiringSoonItems.length > 0 && (
        <div style={{ backgroundColor: '#fef2f2', border: '2px solid #ef4444', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>🚨 Khabardar! Expiry Alert</h3>
          <p style={{ margin: '0 0 15px 0', color: '#7f1d1d', fontWeight: 'bold' }}>Yeh cheezein aglay 3 din mein expire hone wali hain ya ho chuki hain, inko jaldi clear karein:</p>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#991b1b' }}>
            {expiringSoonItems.map(item => (<li key={item.id} style={{ marginBottom: '5px', fontWeight: 'bold' }}>{item.product_name || item.name} (Baqi: {item.quantity}) - Expiring on: {new Date(item.expiry_date).toLocaleDateString('en-PK')}</li>))}
          </ul>
        </div>
      )}

      <div className="admin-card" style={{ borderLeft: '4px solid #f59e0b' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>➕ Naya Samaan Godam Mein Dalein</h2>
        <form onSubmit={handleAddItem}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '15px' }}>
            <div><label className="form-label">Barcode (Optional)</label><input type="text" placeholder="Scan karein" ref={barcodeRef} onKeyDown={(e) => handleKeyDown(e, nameRef)} value={newBarcode} onChange={(e) => setNewBarcode(e.target.value)} className="admin-input" /></div>
            <div><label className="form-label">Item Ka Naam *</label><input type="text" placeholder="Lays French Cheese" ref={nameRef} onKeyDown={(e) => handleKeyDown(e, priceRef)} value={newName} onChange={(e) => setNewName(e.target.value)} className="admin-input" required /></div>
            <div><label className="form-label">Price (Rs) *</label><input type="number" placeholder="100" ref={priceRef} onKeyDown={(e) => handleKeyDown(e, qtyRef)} value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="admin-input" required /></div>
            <div><label className="form-label">Stock (Pcs) *</label><input type="number" placeholder="50" ref={qtyRef} value={newQty} onChange={(e) => setNewQty(e.target.value)} className="admin-input" required /></div>
            <div><label className="form-label">Expiry Date (Optional)</label><input type="date" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} className="admin-input" /></div>
          </div>
          <button type="submit" className="admin-btn btn-orange" style={{ width: '100%', padding: '15px' }}>💾 Item Save Karein</button>
        </form>
      </div>

      <div className="admin-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>🔄 Samaan Wapsi (Refund)</h2>
        <form onSubmit={handleRefund} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 300px' }}><label className="form-label">Konsa Item Wapas Aaya?</label><select value={refundItemId} onChange={(e) => setRefundItemId(e.target.value)} className="admin-input" required><option value="">-- Select --</option>{inventory.map(item => <option key={item.id} value={item.id}>{item.product_name || item.name} (Rs. {item.price})</option>)}</select></div>
          <div style={{ flex: '1 1 150px' }}><label className="form-label">Tadaad</label><input type="number" placeholder="1" value={refundQty} onChange={(e) => setRefundQty(e.target.value)} className="admin-input" required /></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', flex: '1 1 150px' }}><button type="submit" className="admin-btn btn-purple" style={{ width: '100%', padding: '12px' }}>💸 Wapas Karein</button></div>
        </form>
      </div>

      <div className="admin-card" style={{ borderLeft: '4px solid #ef4444' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>💸 Roznamcha (Kharchay)</h2>
        <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 300px' }}><label className="form-label">Tafseel *</label><input type="text" placeholder="Chai, Safai..." value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="admin-input" required /></div>
          <div style={{ flex: '1 1 150px' }}><label className="form-label">Rakam (Rs) *</label><input type="number" placeholder="200" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="admin-input" required /></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', flex: '1 1 150px' }}><button type="submit" className="admin-btn btn-red" style={{ width: '100%', padding: '12px' }}>➕ Kharcha Likhain</button></div>
        </form>
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', maxHeight: '250px' }}>
          <table className="admin-table">
            <thead><tr><th>Tareekh</th><th>Tafseel</th><th style={{ textAlign: 'right' }}>Rakam</th><th>Action</th></tr></thead>
            <tbody>
              {expenses.map(exp => (<tr key={exp.id}><td>{new Date(exp.created_at).toLocaleDateString('en-PK')}</td><td style={{ fontWeight: 'bold' }}>{exp.description}</td><td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 'bold' }}>Rs. {exp.amount}</td><td><button onClick={() => handleDeleteExpense(exp.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>🗑️</button></td></tr>))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, color: '#0f172a' }}>📦 Godam Ka Current Stock</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={downloadInventoryExcel} className="admin-btn btn-green">⬇️ Excel</button>
            <button onClick={handlePrintInventoryPDF} className="admin-btn btn-blue">🖨️ PDF / Print</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', maxHeight: '400px' }}>
          <table className="admin-table">
            <thead><tr><th>Item Code</th><th>Item Name</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Stock</th><th>Expiry</th><th style={{ textAlign: 'center' }}>Print Barcode</th></tr></thead>
            <tbody>
              {inventory.map(item => {
                const isLowStock = item.quantity < 4;
                const expDateObj = item.expiry_date ? new Date(item.expiry_date) : null;
                const isExpiring = expDateObj && expDateObj <= threeDaysFromNow;
                return (
                  <tr key={item.id} style={{ backgroundColor: isExpiring ? '#fef2f2' : isLowStock ? '#fffbeb' : 'transparent' }}>
                    <td style={{ fontWeight: 'bold' }}>{item.barcode || item.id}</td>
                    <td style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.product_name || item.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Rs. {item.price} <button onClick={() => handleEditPrice(item)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button></td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: isLowStock ? '#ef4444' : '#10b981', fontSize: '16px' }}>{item.quantity} <button onClick={() => handleRestock(item)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>➕</button></td>
                    <td style={{ color: isExpiring ? '#ef4444' : '#64748b', fontWeight: isExpiring ? 'bold' : 'bold' }}>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-PK') : '-'}</td>
                    
                    {/* 🌟 NAYA: Barcode Print Ka Button */}
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => handlePrintBarcode(item)} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        🖨️ Barcode
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, color: '#0f172a' }}>💰 Sales Report</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={downloadSalesExcel} className="admin-btn btn-green">⬇️ Excel</button>
            <button onClick={handlePrintSalesPDF} className="admin-btn btn-blue">🖨️ PDF / Print</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', maxHeight: '300px' }}>
          <table className="admin-table">
            <thead><tr><th>Bill No</th><th>Tareekh</th><th>Waqt</th><th>Payment</th><th style={{ textAlign: 'right' }}>Total Bill</th></tr></thead>
            <tbody>
              {sales.map(sale => {
                const dateObj = new Date(sale.created_at); const isRefund = sale.total_amount < 0;
                return (
                  <tr key={sale.id} style={{ backgroundColor: isRefund ? '#fef2f2' : 'transparent' }}>
                    <td style={{ fontWeight: 'bold' }}>#{sale.id}</td><td style={{ fontWeight: 'bold' }}>{dateObj.toLocaleDateString('en-PK')}</td><td style={{ fontWeight: 'bold' }}>{dateObj.toLocaleTimeString('en-PK')}</td>
                    <td><span style={{backgroundColor: '#e2e8f0', color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'}}>{sale.payment_method || 'Cash'}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: isRefund ? '#ef4444' : '#10b981' }}>Rs. {sale.total_amount.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}