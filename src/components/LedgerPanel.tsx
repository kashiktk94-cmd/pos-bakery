import React, { useState, useEffect } from 'react';
import { SUPABASE_URL, headers } from '../config/supabase';

export default function LedgerPanel() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [entries, setEntries] = useState([]);
  
  const [newCustomerName, setNewCustomerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ledger?select=*&order=name.asc`, { headers });
      const data = await res.json();
      if (!data.error) setCustomers(data);
    } catch (err) { console.error(err); }
  };

  // 🌟 SELF-HEALING ENTRIES FETCH: Har dafa history se theek balance calculate karega
  const fetchEntries = async (customer) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/khata_entries?customer_id=eq.${customer.id}&select=*&order=created_at.asc`, { headers });
      const data = await res.json();
      if (!data.error) {
        let runningBal = 0;
        const correctedEntries = data.map(entry => {
          runningBal = runningBal + (entry.udhaar || 0) - (entry.wasooli || 0);
          return { ...entry, balance: runningBal };
        });
        setEntries(correctedEntries);

        // Agar ledger balance match nahi kar raha toh auto-sync kar do
        const finalBal = correctedEntries.length > 0 ? correctedEntries[correctedEntries.length - 1].balance : 0;
        if (finalBal !== customer.balance) {
          await fetch(`${SUPABASE_URL}/rest/v1/ledger?id=eq.${customer.id}`, {
            method: 'PATCH', headers, body: JSON.stringify({ balance: finalBal })
          });
          setSelectedCustomer(prev => ({ ...prev, balance: finalBal }));
          fetchCustomers();
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName) return alert('⚠️ Customer ka naam zaroori hai!');
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/ledger`, {
        method: 'POST', headers, body: JSON.stringify({ name: newCustomerName, balance: 0 })
      });
      setNewCustomerName(''); 
      fetchCustomers();
    } catch (err) { console.error(err); }
  };

  // ==========================================
  // 🌟 BULLETPROOF TRANSACTION SYSTEM
  // ==========================================
  const performTransaction = async (type) => {
    let amount = 0;
    let description = '';

    // Pehle se true balance entries ka sum nikal kar rakhein
    const currentTrueBalance = entries.reduce((acc, e) => acc + (e.udhaar || 0) - (e.wasooli || 0), 0);

    if (type === 'udhaar') {
      const amtStr = prompt("📓 Kitne rupay ka naya Udhaar diya hai?");
      if (!amtStr || isNaN(amtStr) || Number(amtStr) <= 0) return;
      amount = Number(amtStr);
      description = prompt("📝 Tafseel (Maslan: Samaan diya, Cash diya):", "Samaan / Cash Udhaar") || "Udhaar";
    } else if (type === 'wasooli') {
      const amtStr = prompt("💰 Kitne rupay Wasool kiye (Wapas aaye)?");
      if (!amtStr || isNaN(amtStr) || Number(amtStr) <= 0) return;
      amount = Number(amtStr);
      description = "Cash Wasooli";
    } else if (type === 'settle') {
      if (currentTrueBalance <= 0) return alert("⚠️ Koi baqaya nahi hai!");
      if (!window.confirm(`⚠️ Kya aap waqai Rs. ${currentTrueBalance} ka poora khata zero (0) karna chahte hain?`)) return;
      amount = currentTrueBalance;
      description = "Khata Clear / Settle All";
      type = 'wasooli';
    }

    let newBalance = currentTrueBalance;
    let udhaarEntry = 0;
    let wasooliEntry = 0;

    if (type === 'udhaar') {
      newBalance = currentTrueBalance + amount;
      udhaarEntry = amount;
    } else if (type === 'wasooli') {
      newBalance = currentTrueBalance - amount;
      wasooliEntry = amount;
    }

    try {
      // 1. Nayi entry save karein
      await fetch(`${SUPABASE_URL}/rest/v1/khata_entries`, {
        method: 'POST', headers, body: JSON.stringify({
          customer_id: selectedCustomer.id, description: description, udhaar: udhaarEntry, wasooli: wasooliEntry, balance: newBalance
        })
      });

      // 2. Main ledger table update karein
      await fetch(`${SUPABASE_URL}/rest/v1/ledger?id=eq.${selectedCustomer.id}`, {
        method: 'PATCH', headers, body: JSON.stringify({ balance: newBalance })
      });

      // 3. Fauran screen refresh karein
      await fetchCustomers();
      await fetchEntries(selectedCustomer);
      setSelectedCustomer(prev => ({ ...prev, balance: newBalance }));

    } catch (err) { 
      console.error(err); 
      alert("⚠️ Network ka masla aya."); 
    }
  };

  const handleDeleteEntry = async (entry) => {
    if (!window.confirm("⚠️ Kya aap waqai is entry ko delete karna chahte hain?")) return;
    
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/khata_entries?id=eq.${entry.id}`, { method: 'DELETE', headers });

      // Baqaya entries ko dobara fetch kar ke balance recalculate karo
      const res = await fetch(`${SUPABASE_URL}/rest/v1/khata_entries?customer_id=eq.${selectedCustomer.id}&select=*&order=created_at.asc`, { headers });
      const data = await res.json();
      
      let runningBal = 0;
      for (let ent of data) {
        runningBal = runningBal + (ent.udhaar || 0) - (ent.wasooli || 0);
        await fetch(`${SUPABASE_URL}/rest/v1/khata_entries?id=eq.${ent.id}`, {
          method: 'PATCH', headers, body: JSON.stringify({ balance: runningBal })
        });
      }

      await fetch(`${SUPABASE_URL}/rest/v1/ledger?id=eq.${selectedCustomer.id}`, {
        method: 'PATCH', headers, body: JSON.stringify({ balance: runningBal })
      });

      await fetchCustomers();
      await fetchEntries(selectedCustomer);
      setSelectedCustomer(prev => ({ ...prev, balance: runningBal }));

    } catch (err) { console.error(err); }
  };

  const openCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    fetchEntries(customer);
  };

  const downloadKhataExcel = () => {
    let csv = "Tareekh,Naam,Tafseel,Udhaar,Wasooli,Baqaya\n";
    entries.forEach(e => {
      csv += `${new Date(e.created_at).toLocaleDateString()},"${selectedCustomer.name}","${e.description}",${e.udhaar},${e.wasooli},${e.balance}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Khata_${selectedCustomer.name}.csv`; link.click();
  };

  const printKhataPDF = () => {
    const printWindow = window.open('', '_blank');
    let html = `<html><head><title>Khata - ${selectedCustomer.name}</title><style>body{font-family:sans-serif; padding:20px;} table{width:100%; border-collapse:collapse; margin-top:20px;} th,td{border:1px solid #ddd; padding:10px; text-align:left;} th{background:#f8f9fa;} .red{color:#ef4444;} .green{color:#10b981;}</style></head><body><h2>📓 Khata: ${selectedCustomer.name}</h2><h3>Total Baqaya: Rs. ${selectedCustomer.balance}</h3><table><tr><th>Tareekh</th><th>Tafseel</th><th>Udhaar</th><th>Wasooli</th><th>Baqaya</th></tr>`;
    entries.forEach(e => {
      html += `<tr><td>${new Date(e.created_at).toLocaleDateString('en-PK')}</td><td>${e.description}</td><td class="red">${e.udhaar > 0 ? e.udhaar : '-'}</td><td class="green">${e.wasooli > 0 ? e.wasooli : '-'}</td><td><strong>${e.balance}</strong></td></tr>`;
    });
    html += `</table></body></html>`;
    printWindow.document.write(html); printWindow.document.close(); setTimeout(() => printWindow.print(), 500);
  };

  const totalBazarUdhaar = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // VIEW 1: CUSTOMER DETAILS
  if (selectedCustomer) {
    return (
      <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        <button onClick={() => setSelectedCustomer(null)} style={{ background: '#64748b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}>
          ⬅️ Back to List
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: '#0f172a' }}>📓 Khata: {selectedCustomer.name}</h2>
            <h3 style={{ margin: 0, color: selectedCustomer.balance > 0 ? '#ef4444' : '#10b981' }}>
              Total Baqaya: Rs. {selectedCustomer.balance.toLocaleString()}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={downloadKhataExcel} style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>⬇️ Excel</button>
            <button onClick={printKhataPDF} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Print PDF</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '25px' }}>
          <button onClick={() => performTransaction('udhaar')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>➕ Udhaar Diya</button>
          <button onClick={() => performTransaction('wasooli')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>➖ Cash Wasool</button>
          <button onClick={() => performTransaction('settle')} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>✅ Settle All (Zero)</button>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr>
                <th style={{ background: '#f8fafc', color: '#64748b', padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>#</th>
                <th style={{ background: '#f8fafc', color: '#64748b', padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Tareekh</th>
                <th style={{ background: '#f8fafc', color: '#64748b', padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Naam</th>
                <th style={{ background: '#f8fafc', color: '#64748b', padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Tafseel</th>
                <th style={{ background: '#f8fafc', color: '#ef4444', padding: '15px', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>Udhaar</th>
                <th style={{ background: '#f8fafc', color: '#10b981', padding: '15px', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>Wasooli</th>
                <th style={{ background: '#f8fafc', color: '#0f172a', padding: '15px', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>Baqaya</th>
                <th style={{ background: '#f8fafc', color: '#64748b', padding: '15px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#94a3b8' }}>{index + 1}</td>
                  <td style={{ padding: '15px', color: '#334155' }}>{new Date(entry.created_at).toLocaleDateString('en-PK')}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#0f172a' }}>{selectedCustomer.name}</td>
                  <td style={{ padding: '15px', color: '#475569' }}>{entry.description}</td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>{entry.udhaar > 0 ? entry.udhaar.toLocaleString() : '-'}</td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{entry.wasooli > 0 ? entry.wasooli.toLocaleString() : '-'}</td>
                  <td style={{ padding: '15px', textAlign: 'right', fontWeight: '900', color: '#0f172a' }}>{entry.balance.toLocaleString()}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button onClick={() => handleDeleteEntry(entry)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }} title="Delete">🗑️</button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Khata bilkul saaf hai.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // VIEW 2: CUSTOMER LIST
  return (
    <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      
      <div style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', padding: '25px', borderRadius: '12px', color: 'white', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)' }}>
        <div>
          <h4 style={{ margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>Bazar Mein Total Udhaar</h4>
          <h1 style={{ margin: 0, fontSize: '36px' }}>Rs. {totalBazarUdhaar.toLocaleString()}</h1>
        </div>
        <div style={{ fontSize: '60px', opacity: 0.8 }}>💰</div>
      </div>

      <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', textAlign: 'center' }}>📓 Udhaar Khata (Customers)</h2>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <form onSubmit={handleAddCustomer} style={{ display: 'flex', flex: '2 1 300px', gap: '10px' }}>
          <input type="text" placeholder="Naye customer ka naam likhein..." value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '2px solid #e2e8f0', background: '#f8fafc', fontWeight: 'bold', color: '#000' }} required />
          <button type="submit" style={{ padding: '14px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>➕ Add Person</button>
        </form>
        <div style={{ flex: '1 1 200px' }}>
          <input type="text" placeholder="🔍 Naam dhoondein..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '2px solid #e2e8f0', background: '#f8fafc', fontWeight: 'bold', color: '#000' }} />
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
          <thead>
            <tr>
              <th style={{ background: '#f8fafc', color: '#64748b', padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>#</th>
              <th style={{ background: '#f8fafc', color: '#64748b', padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Customer Ka Naam</th>
              <th style={{ background: '#f8fafc', color: '#64748b', padding: '15px', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>Total Udhaar</th>
              <th style={{ background: '#f8fafc', color: '#64748b', padding: '15px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c, index) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '15px', fontWeight: 'bold', color: '#94a3b8' }}>{index + 1}</td>
                <td style={{ padding: '15px', fontWeight: 'bold', color: '#0f172a', fontSize: '16px' }}>{c.name}</td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: '900', color: c.balance > 0 ? '#ef4444' : '#10b981', fontSize: '16px' }}>
                  Rs. {c.balance.toLocaleString()}
                </td>
                <td style={{ padding: '15px', textAlign: 'center' }}>
                  <button onClick={() => openCustomerDetails(c)} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    📖 Details
                  </button>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Koi customer nahi mila.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}