import React, { useState, useEffect } from 'react';
import { SUPABASE_URL, headers } from '../config/supabase';

export default function LedgerPanel() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState('');
  
  // Ek customer ka mukammal record dekhne ke liye states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [entries, setEntries] = useState([]);

  // 1. Saare customers mangwana
  const fetchLedger = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ledger?select=*&order=id.desc`, { headers });
      const data = await res.json();
      if (!data.error) setCustomers(data);
    } catch (err) { console.error(err); }
  };

  // 2. Ek makhsoos customer ki tafseel (Izafi Table) mangwana
  const fetchEntries = async (customerId) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/khata_entries?customer_id=eq.${customerId}&order=id.asc`, { headers });
      const data = await res.json();
      if (!data.error) setEntries(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchLedger(); }, []);
  
  useEffect(() => { 
    if (selectedCustomer) fetchEntries(selectedCustomer.id); 
  }, [selectedCustomer]);

  // Naya Customer Banana
  const addCustomer = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Naam likhna zaroori hai!");
    await fetch(`${SUPABASE_URL}/rest/v1/ledger`, {
      method: 'POST', headers, body: JSON.stringify({ name, balance: 0 })
    });
    setName('');
    fetchLedger();
  };

  // Tafseeli Entry (Udhaar ya Wasooli) Karna
  const addTransaction = async (type) => {
    const desc = type === 'udhaar' ? prompt("Kis cheez ka udhaar liya? (Maslan: 2 Bread, 1 Doodh):") : "Cash Wasooli";
    if (desc === null) return; 

    const amountStr = prompt(type === 'udhaar' ? 'Kitna UDHAAR (Rs) ka samaan hai?' : 'Kitne PAISE WASOOL hue?');
    if (!amountStr || isNaN(amountStr)) return;
    
    const amount = Number(amountStr);
    const currentBalance = selectedCustomer.balance;
    const newBalance = type === 'udhaar' ? currentBalance + amount : currentBalance - amount;

    await fetch(`${SUPABASE_URL}/rest/v1/ledger?id=eq.${selectedCustomer.id}`, {
      method: 'PATCH', headers, body: JSON.stringify({ balance: newBalance })
    });

    await fetch(`${SUPABASE_URL}/rest/v1/khata_entries`, {
      method: 'POST', headers, body: JSON.stringify({
        customer_id: selectedCustomer.id,
        description: desc,
        udhaar: type === 'udhaar' ? amount : 0,
        wasooli: type === 'wasooli' ? amount : 0,
        balance: newBalance
      })
    });

    setSelectedCustomer({ ...selectedCustomer, balance: newBalance });
    fetchLedger(); 
  };

  // EXCEL DOWNLOAD
  const handleDownloadExcel = () => {
    let csv = "Tareekh (Date),Tafseel (Detail),Udhaar (Dr),Wasooli (Cr),Baqaya (Balance)\n";
    entries.forEach(e => {
      const date = new Date(e.created_at).toLocaleDateString('en-PK');
      csv += `"${date}","${e.description}",${e.udhaar},${e.wasooli},${e.balance}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedCustomer.name}_Khata.csv`;
    link.click();
  };

  // PDF / PRINT
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `
      <html><head><title>Khata - ${selectedCustomer.name}</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #f0f0f0; }
      </style></head><body>
      <h2>🏪 Kashif Bakery & Mart</h2>
      <h3>📓 Khata: ${selectedCustomer.name} (Total Baqaya: Rs. ${selectedCustomer.balance})</h3>
      <table>
        <tr><th>Tareekh</th><th>Tafseel</th><th>Udhaar</th><th>Wasooli</th><th>Baqaya</th></tr>
    `;
    entries.forEach(e => {
      const date = new Date(e.created_at).toLocaleDateString('en-PK');
      html += `<tr><td>${date}</td><td>${e.description}</td><td>${e.udhaar > 0 ? e.udhaar : '-'}</td><td>${e.wasooli > 0 ? e.wasooli : '-'}</td><td><strong>${e.balance}</strong></td></tr>`;
    });
    html += `</table></body></html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  // -----------------------------------------------------
  // 1. TAFSEELI KHATA SCREEN (Izafi Table)
  // -----------------------------------------------------
  if (selectedCustomer) {
    return (
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <button onClick={() => setSelectedCustomer(null)} style={{ backgroundColor: '#64748b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', marginBottom: '5px' }}>⬅️ Back</button>
            <h2 style={{ margin: '5px 0' }}>📓 Khata: {selectedCustomer.name}</h2>
            <h3 style={{ margin: 0, color: selectedCustomer.balance > 0 ? '#ef4444' : '#10b981' }}>Total Baqaya: Rs. {selectedCustomer.balance}</h3>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleDownloadExcel} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>⬇️ Excel</button>
            <button onClick={handlePrintPDF} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Print / PDF</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => addTransaction('udhaar')} style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>➕ Udhaar Likhain</button>
          <button onClick={() => addTransaction('wasooli')} style={{ flex: 1, backgroundColor: '#10b981', color: 'white', border: 'none', padding: '15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>➖ Wasooli (Payment)</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '10px' }}>Tareekh</th>
                <th style={{ padding: '10px' }}>Tafseel</th>
                <th style={{ padding: '10px', color: '#ef4444' }}>Udhaar</th>
                <th style={{ padding: '10px', color: '#10b981' }}>Wasooli</th>
                <th style={{ padding: '10px' }}>Baqaya</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{new Date(e.created_at).toLocaleDateString('en-PK')}</td>
                  <td style={{ padding: '10px' }}>{e.description}</td>
                  <td style={{ padding: '10px', color: '#ef4444' }}>{e.udhaar > 0 ? `Rs. ${e.udhaar}` : '-'}</td>
                  <td style={{ padding: '10px', color: '#10b981' }}>{e.wasooli > 0 ? `Rs. ${e.wasooli}` : '-'}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>Rs. {e.balance}</td>
                </tr>
              ))}
              {entries.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Koi record nahi hai.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // 2. MAIN CUSTOMER LIST SCREEN
  // -----------------------------------------------------
  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', margin: '0 0 15px 0' }}>📓 Udhaar Khata (Customers)</h2>
      
      <form onSubmit={addCustomer} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="Naye customer ka naam likhein..." 
          style={{ flex: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '5px' }} 
        />
        <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>➕ Add Person</button>
      </form>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '12px' }}>Naam</th>
              <th style={{ padding: '12px' }}>Total Udhaar</th>
              <th style={{ padding: '12px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.name}</td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: c.balance > 0 ? '#ef4444' : '#10b981' }}>Rs. {c.balance}</td>
                <td style={{ padding: '12px' }}>
                  <button onClick={() => setSelectedCustomer(c)} style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    📖 Khata Dekhein
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}