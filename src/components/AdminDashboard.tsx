import React, { useState, useEffect } from 'react';
import { SUPABASE_URL, headers } from '../config/supabase';

export default function AdminDashboard() {
  const [formData, setFormData] = useState({ product_name: '', price: '', quantity: '' });
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]); // 🌟 Naya State: Godam ka sara saman

  // Database se sara saman mangwane ka function
  const fetchInventory = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory?select=*&order=id.asc`, { headers });
      const data = await res.json();
      if (!data.error) setInventory(data);
    } catch (err) { console.error(err); }
  };

  // Jab page khule toh fauran saman ki list le aao
  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          product_name: formData.product_name,
          price: Number(formData.price),
          quantity: Number(formData.quantity),
          category: 'Bakery'
        })
      });

      if (res.ok) {
        alert('✅ Naya saman database mein kamyabi se add ho gaya!');
        setFormData({ product_name: '', price: '', quantity: '' }); 
        fetchInventory(); // 🌟 Naya saman add hone ke baad list khud refresh ho jayegi
      } else {
        alert('❌ Kuch masla hai, dobara koshish karein.');
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' };

  return (
    <div>
      {/* 1. Naya Saman Add Karne Wala Dabba */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h2 style={{ marginTop: 0, color: '#334155' }}>📦 Add New Product</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '14px' }}>Product Name:</label>
            <input style={{...inputStyle, marginBottom: 0}} type="text" required value={formData.product_name} onChange={(e) => setFormData({...formData, product_name: e.target.value})} />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: '14px' }}>Price (Rs):</label>
            <input style={{...inputStyle, marginBottom: 0}} type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ fontSize: '14px' }}>Quantity:</label>
            <input style={{...inputStyle, marginBottom: 0}} type="number" required value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} style={{ backgroundColor: '#3b82f6', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? '...' : '➕ Add'}
          </button>
        </form>
      </div>

      {/* 2. 🌟 Naya Hissa: Saman Ki List aur Low Stock Alert */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0, color: '#334155' }}>📋 Current Inventory & Alerts</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Barcode (ID)</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Product</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Price</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Stock</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => {
                const isLowStock = item.quantity <= 5; // 👈 Agar 5 ya us se kam ho toh danger
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: isLowStock ? '#fee2e2' : 'white' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.id}</td>
                    <td style={{ padding: '12px' }}>{item.product_name}</td>
                    <td style={{ padding: '12px' }}>Rs. {item.price}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: isLowStock ? '#dc2626' : '#059669', fontSize: '18px' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isLowStock ? <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>⚠️ Low Stock</span> : '✅ OK'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}