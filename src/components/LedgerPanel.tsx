import React, { useState, useEffect } from 'react';
import { SUPABASE_URL, headers } from '../config/supabase';

export default function LedgerPanel() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState('');

  const fetchLedger = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ledger?select=*&order=id.desc`, { headers });
      const data = await res.json();
      if (!data.error) setCustomers(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchLedger(); }, []);

  const addCustomer = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Naam likhna zaroori hai!");
    await fetch(`${SUPABASE_URL}/rest/v1/ledger`, {
      method: 'POST', headers, body: JSON.stringify({ name, balance: 0 })
    });
    setName('');
    fetchLedger();
  };

  const updateBalance = async (id, currentBalance, type) => {
    const amountStr = prompt(type === 'add' ? 'Kitna UDHAAR (Rs) add karna hai?' : 'Kitne PAISE WASOOL (Receive) hue?');
    if (!amountStr || isNaN(amountStr)) return;
    
    const amount = Number(amountStr);
    // Agar udhaar add ho raha hai toh balance barhega, wasool ho raha hai toh kam hoga
    const newBalance = type === 'add' ? currentBalance + amount : currentBalance - amount;

    await fetch(`${SUPABASE_URL}/rest/v1/ledger?id=eq.${id}`, {
      method: 'PATCH', headers, body: JSON.stringify({ balance: newBalance })
    });
    fetchLedger();
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '20px' }}>
      <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', margin: '0 0 15px 0' }}>📓 Udhaar Khata (Customer Ledger)</h2>
      
      {/* Naya Customer Add Karne Ka Form */}
      <form onSubmit={addCustomer} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="Naye customer ka naam likhein..." 
          style={{ flex: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '5px' }} 
        />
        <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          ➕ Add Person
        </button>
      </form>

      {/* Udhaar Ki List */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '12px' }}>Naam</th>
              <th style={{ padding: '12px' }}>Udhaar (Balance)</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.name}</td>
                <td style={{ padding: '12px', fontWeight: 'bold', color: c.balance > 0 ? '#ef4444' : '#10b981' }}>
                  Rs. {c.balance}
                </td>
                <td style={{ padding: '12px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <button onClick={() => updateBalance(c.id, c.balance, 'add')} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                    ➕ Udhaar
                  </button>
                  <button onClick={() => updateBalance(c.id, c.balance, 'pay')} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                    ➖ Wasooli
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Abhi tak koi udhaar nahi hai.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}