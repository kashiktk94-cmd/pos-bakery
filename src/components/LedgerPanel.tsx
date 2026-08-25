import React, { useState, useEffect } from 'react';
import { SUPABASE_URL, headers } from '../config/supabase';

export default function LedgerPanel() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // 🌟 NAYA: Search ke liye state
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [entries, setEntries] = useState([]);

  const fetchLedger = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ledger?select=*&order=id.desc`, { headers });
      const data = await res.json();
      if (!data.error) setCustomers(data);
    } catch (err) { console.error(err); }
  };

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

  const addCustomer = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Naam likhna zaroori hai!");
    await fetch(`${SUPABASE_URL}/rest/v1/ledger`, {
      method: 'POST', headers, body: JSON.stringify({ name, balance: 0 })
    });
    setName('');
    fetchLedger();
  };

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

  // 🌟 NAYA: Excel mein bhi Naam aur Number add ho gaya
  const handleDownloadExcel = () => {
    let csv = "S.No,Tareekh (Date),Naam,Tafseel (Detail),Udhaar (Dr),Wasooli (Cr),Baqaya (Balance)\n";
    entries.forEach((e, index) => {
      const date = new Date(e.created_at).toLocaleDateString('en-PK');
      csv += `${index + 1},"${date}","${selectedCustomer.name}","${e.description}",${e.udhaar},${e.wasooli},${e.balance}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedCustomer.name}_Khata.csv`;
    link.click();
  };

  // 🌟 NAYA: PDF/Print mein bhi Naam aur Number add ho gaya
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `
      <html><head><title>Khata - ${selectedCustomer.name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 10px; text-align: left; }
        th { background-color: #f0f0f0; }
        .red { color: #d32f2f; font-weight: bold; }
        .green { color: #388e3c; font-weight: bold; }
      </style></head><body>
      <h2>🏪 Kashif Bakery & Mart</h2>
      <h3>📓 Khata: ${selectedCustomer.name} | Total Baqaya: Rs. ${selectedCustomer.balance}</h3>
      <table>
        <tr><th>#</th><th>Tareekh</th><th>Naam</th><th>Tafseel</th><th>Udhaar</th><th>Wasooli</th><th>Baqaya</th></tr>
    `;
    entries.forEach((e, index) => {
      const date = new Date(e.created_at).toLocaleDateString('en-PK');
      const udhaarHtml = e.udhaar > 0 ? `<span class="red">Rs. ${e.udhaar}</span>` : '-';
      const wasooliHtml = e.wasooli > 0 ? `<span class="green">Rs. ${e.wasooli}</span>` : '-';
      html += `<tr><td>${index + 1}</td><td>${date}</td><td><strong>${selectedCustomer.name}</strong></td><td>${e.description}</td><td>${udhaarHtml}</td><td>${wasooliHtml}</td><td><strong>Rs. ${e.balance}</strong></td></tr>`;
    });
    html += `</table></body></html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  // 🌟 NAYA: Search filter logic
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // -----------------------------------------------------
  // 1. TAFSEELI KHATA SCREEN (Inside Detail)
  // -----------------------------------------------------
  if (selectedCustomer) {
    return (
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <button onClick={() => setSelectedCustomer(null)} style={{ backgroundColor: '#64748b', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}>⬅️ Back</button>
            <h2 style={{ margin: '5px 0', color: '#1e293b' }}>📓 Khata: {selectedCustomer.name}</h2>
            <h3 style={{ margin: 0, color: selectedCustomer.balance > 0 ? '#ef4444' : '#10b981' }}>Total Baqaya: Rs. {selectedCustomer.balance}</h3>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleDownloadExcel} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>⬇️ Excel</button>
            <button onClick={handlePrintPDF} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Print / PDF</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button onClick={() => addTransaction('udhaar')} style={{ flex: '1 1 200px', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>➕ Udhaar Likhain</button>
          <button onClick={() => addTransaction('wasooli')} style={{ flex: '1 1 200px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>➖ Wasooli (Payment)</button>
        </div>

        {/* 🌟 NAYA: Responsive Table Container */}
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', minWidth: '700px', textAlign: 'left', borderCollapse: 'collapse', fontSize: '15px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#0f172a' }}>
                <th style={{ padding: '12px', width: '50px' }}>#</th>
                <th style={{ padding: '12px' }}>Tareekh</th>
                <th style={{ padding: '12px' }}>Naam</th>
                <th style={{ padding: '12px' }}>Tafseel</th>
                <th style={{ padding: '12px', color: '#ef4444' }}>Udhaar</th>
                <th style={{ padding: '12px', color: '#10b981' }}>Wasooli</th>
                <th style={{ padding: '12px' }}>Baqaya</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, index) => (
                <tr key={e.id} style={{ borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{index + 1}</td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{new Date(e.created_at).toLocaleDateString('en-PK')}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0f172a' }}>{selectedCustomer.name}</td>
                  <td style={{ padding: '12px' }}>{e.description}</td>
                  <td style={{ padding: '12px', color: '#ef4444', fontWeight: 'bold' }}>{e.udhaar > 0 ? `Rs. ${e.udhaar}` : '-'}</td>
                  <td style={{ padding: '12px', color: '#10b981', fontWeight: 'bold' }}>{e.wasooli > 0 ? `Rs. ${e.wasooli}` : '-'}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0f172a' }}>Rs. {e.balance}</td>
                </tr>
              ))}
              {entries.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Koi record nahi hai.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // 2. MAIN CUSTOMER LIST SCREEN (Back Menu)
  // -----------------------------------------------------
  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', margin: '0 0 15px 0', color: '#1e293b' }}>📓 Udhaar Khata (Customers)</h2>
      
      {/* 🌟 NAYA: Search Box + Add Customer Form */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        
        {/* Naya Add karne ka hissa */}
        <form onSubmit={addCustomer} style={{ display: 'flex', gap: '10px', flex: '1 1 300px' }}>
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Naye customer ka naam..." 
            style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '15px' }} 
          />
          <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>➕ Add Person</button>
        </form>

        {/* 🔍 Search Box ka hissa */}
        <input 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          placeholder="🔍 Customer ka naam dhoondein..." 
          style={{ flex: '1 1 200px', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '5px', fontSize: '15px', backgroundColor: '#f8fafc' }} 
        />
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <table style={{ width: '100%', minWidth: '500px', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#0f172a' }}>
              <th style={{ padding: '15px', width: '50px' }}>#</th>
              <th style={{ padding: '15px' }}>Naam</th>
              <th style={{ padding: '15px' }}>Total Udhaar</th>
              <th style={{ padding: '15px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c, index) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>{index + 1}</td>
                <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }}>{c.name}</td>
                <td style={{ padding: '15px', fontWeight: 'bold', color: c.balance > 0 ? '#ef4444' : '#10b981', fontSize: '16px' }}>Rs. {c.balance}</td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <button onClick={() => setSelectedCustomer(c)} style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    📖 Khata Dekhein
                  </button>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Koi customer nahi mila.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}