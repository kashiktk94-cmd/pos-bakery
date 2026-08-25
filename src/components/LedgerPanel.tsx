import React, { useState, useEffect } from 'react';
import { SUPABASE_URL, headers } from '../config/supabase';

export default function LedgerPanel() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); 
  
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

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `
      <html><head><title>Khata - ${selectedCustomer.name}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; color: #555; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
        .right { text-align: right; }
        .red { color: #d32f2f; font-weight: bold; }
        .green { color: #388e3c; font-weight: bold; }
        .header-box { border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
      </style></head><body>
      <div class="header-box">
        <h2 style="margin:0 0 5px 0; color: #1e293b;">🏪 Kashif Bakery & Mart</h2>
        <h3 style="margin:0; color: #475569;">📓 Khata: ${selectedCustomer.name} | Total Baqaya: Rs. ${selectedCustomer.balance.toLocaleString()}</h3>
      </div>
      <table>
        <tr><th>#</th><th>Tareekh</th><th>Naam</th><th>Tafseel</th><th class="right">Udhaar</th><th class="right">Wasooli</th><th class="right">Baqaya</th></tr>
    `;
    entries.forEach((e, index) => {
      const date = new Date(e.created_at).toLocaleDateString('en-PK');
      const udhaarHtml = e.udhaar > 0 ? `<span class="red">${e.udhaar.toLocaleString()}</span>` : '-';
      const wasooliHtml = e.wasooli > 0 ? `<span class="green">${e.wasooli.toLocaleString()}</span>` : '-';
      html += `<tr><td>${index + 1}</td><td>${date}</td><td><strong>${selectedCustomer.name}</strong></td><td>${e.description}</td><td class="right">${udhaarHtml}</td><td class="right">${wasooliHtml}</td><td class="right"><strong>${e.balance.toLocaleString()}</strong></td></tr>`;
    });
    html += `</table></body></html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* 🌟 NAYA: Khالص Professional CSS jo sirf is Khata ke liye hai */}
      <style>{`
        .lp-card { background: #fff; padding: 25px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025); }
        .lp-input { flex: 1; padding: 14px 16px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 15px; color: #000 !important; font-weight: 500; background-color: #f8fafc; transition: all 0.2s ease; }
        .lp-input::placeholder { color: #94a3b8; font-weight: 400; }
        .lp-input:focus { outline: none; border-color: #3b82f6; background-color: #fff; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15); }
        .lp-btn { padding: 14px 24px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; font-size: 15px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .lp-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); filter: brightness(1.05); }
        .lp-btn-blue { background-color: #3b82f6; color: white; }
        .lp-btn-green { background-color: #10b981; color: white; }
        .lp-btn-red { background-color: #ef4444; color: white; }
        .lp-btn-orange { background-color: #f59e0b; color: white; }
        .lp-btn-gray { background-color: #64748b; color: white; }
        
        .lp-table-container { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 10px; }
        .lp-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 600px; }
        .lp-table th { background-color: #f8fafc; color: #64748b; font-weight: 600; padding: 16px 20px; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
        .lp-table td { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 15px; }
        .lp-table tbody tr { transition: background-color 0.15s ease; }
        .lp-table tbody tr:hover { background-color: #f8fafc; }
        .lp-table tbody tr:last-child td { border-bottom: none; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
      `}</style>

      {/* ----------------------------------------------------- */}
      {/* 1. TAFSEELI KHATA SCREEN (Inside Detail) */}
      {/* ----------------------------------------------------- */}
      {selectedCustomer ? (
        <div className="lp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <button onClick={() => setSelectedCustomer(null)} className="lp-btn lp-btn-gray" style={{ padding: '8px 16px', marginBottom: '12px', fontSize: '13px' }}>⬅️ Back</button>
              <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '24px' }}>📓 Khata: {selectedCustomer.name}</h2>
              <h3 style={{ margin: 0, color: selectedCustomer.balance > 0 ? '#ef4444' : '#10b981', fontSize: '18px' }}>
                Total Baqaya: Rs. {selectedCustomer.balance.toLocaleString()}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={handleDownloadExcel} className="lp-btn lp-btn-green">⬇️ Excel</button>
              <button onClick={handlePrintPDF} className="lp-btn lp-btn-blue">🖨️ Print PDF</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
            <button onClick={() => addTransaction('udhaar')} className="lp-btn lp-btn-red" style={{ flex: '1 1 200px' }}>➕ Udhaar Likhain</button>
            <button onClick={() => addTransaction('wasooli')} className="lp-btn lp-btn-green" style={{ flex: '1 1 200px' }}>➖ Wasooli (Payment)</button>
          </div>

          <div className="lp-table-container">
            <table className="lp-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Tareekh</th>
                  <th>Naam</th>
                  <th>Tafseel</th>
                  <th className="text-right" style={{ color: '#ef4444' }}>Udhaar</th>
                  <th className="text-right" style={{ color: '#10b981' }}>Wasooli</th>
                  <th className="text-right">Baqaya</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, index) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: '600' }}>{index + 1}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(e.created_at).toLocaleDateString('en-PK')}</td>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{selectedCustomer.name}</td>
                    <td>{e.description}</td>
                    <td className="text-right" style={{ color: '#ef4444', fontWeight: '600' }}>
                      {e.udhaar > 0 ? e.udhaar.toLocaleString() : '-'}
                    </td>
                    <td className="text-right" style={{ color: '#10b981', fontWeight: '600' }}>
                      {e.wasooli > 0 ? e.wasooli.toLocaleString() : '-'}
                    </td>
                    <td className="text-right" style={{ fontWeight: '700', color: '#0f172a' }}>
                      {e.balance.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && <tr><td colSpan={7} className="text-center" style={{ padding: '30px', color: '#64748b' }}>Koi record majood nahi.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ----------------------------------------------------- */
        /* 2. MAIN CUSTOMER LIST SCREEN (Back Menu)              */
        /* ----------------------------------------------------- */
        <div className="lp-card">
          <h2 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', margin: '0 0 20px 0', color: '#0f172a', fontSize: '24px' }}>
            📓 Udhaar Khata (Customers)
          </h2>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', flexWrap: 'wrap' }}>
            {/* Naya Add karne ka form */}
            <form onSubmit={addCustomer} style={{ display: 'flex', gap: '12px', flex: '2 1 300px' }}>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Naye customer ka naam likhein..." 
                className="lp-input"
              />
              <button type="submit" className="lp-btn lp-btn-blue">➕ Add Person</button>
            </form>

            {/* 🔍 Search Box */}
            <input 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="🔍 Naam dhoondein..." 
              className="lp-input"
              style={{ flex: '1 1 200px' }}
            />
          </div>

          <div className="lp-table-container">
            <table className="lp-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Customer Ka Naam</th>
                  <th className="text-right">Total Udhaar</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c, index) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '600' }}>{index + 1}</td>
                    <td style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>{c.name}</td>
                    <td className="text-right" style={{ fontWeight: '700', fontSize: '16px', color: c.balance > 0 ? '#ef4444' : '#10b981' }}>
                      Rs. {c.balance.toLocaleString()}
                    </td>
                    <td className="text-center">
                      <button onClick={() => setSelectedCustomer(c)} className="lp-btn lp-btn-orange" style={{ padding: '8px 20px', fontSize: '14px' }}>
                        📖 Khata Dekhein
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr><td colSpan={4} className="text-center" style={{ padding: '30px', color: '#64748b' }}>Koi customer nahi mila.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}