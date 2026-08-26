import { useState, useEffect } from 'react';
import { SUPABASE_URL, headers } from '../config/supabase';

export function usePOS() {
  const [cart, setCart] = useState([]);
  const [heldCart, setHeldCart] = useState(null);
  const [dbProducts, setDbProducts] = useState([]); 
  const [customers, setCustomers] = useState([]); 
  const [discount, setDiscount] = useState(0); 
  const [receiptData, setReceiptData] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory?select=*`, { headers });
      const data = await res.json();
      if (!data.error) setDbProducts(data);
    } catch (err) { console.error(err); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/ledger?select=*&order=name.asc`, { headers });
      const data = await res.json();
      if (!data.error) setCustomers(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchProducts(); fetchCustomers(); }, []);

  const refreshData = () => { fetchProducts(); fetchCustomers(); };

  const handleScan = (scannedCode) => {
    if (!scannedCode) return;
    
    // 🌟 NAYA LOGIC: Pehle sirf BARCODE check karo, agar na mile toh ID check karo
    let product = dbProducts.find(p => p.barcode === scannedCode.toString());
    
    if (!product) {
      product = dbProducts.find(p => p.id.toString() === scannedCode.toString());
    }

    if (product) {
      const existingItem = cart.find(item => item.id === product.id);
      
      if (existingItem && existingItem.qty >= product.quantity) {
         return alert(`⚠️ Stock khatam! Aap ke paas sirf ${product.quantity} bache hain.`);
      } else if (!existingItem && product.quantity <= 0) {
         // 🌟 Item ka naam bhi error mein dikhayenge
         return alert(`⚠️ Yeh item godam mein khatam hai. (${product.product_name || product.name})`);
      }

      if (existingItem) {
        setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      } else {
        setCart([{ ...product, qty: 1 }, ...cart]);
      }
    } else {
      alert('⚠️ Yeh item database mein majood nahi!');
    }
  };

  const updateQuantity = (itemId, newQty) => {
    if (newQty <= 0) { setCart(cart.filter(item => item.id !== itemId)); return; }
    const product = dbProducts.find(p => p.id === itemId);
    if (product && newQty > product.quantity) return alert(`⚠️ Stock khatam!`);
    setCart(cart.map(item => item.id === itemId ? { ...item, qty: newQty } : item));
  };

  const removeItem = (itemId) => setCart(cart.filter(item => item.id !== itemId));

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const finalAmount = totalAmount - discount;

  const handleHold = () => {
    if (cart.length === 0) return alert('Tokri khali hai!');
    setHeldCart(cart); setCart([]); setDiscount(0);
  };
  
  const handleResume = () => {
    if (cart.length > 0) return alert('Tokri khali karein!');
    setCart(heldCart); setHeldCart(null);
  };

  const handleCheckout = async (paymentMethod = 'Cash') => {
    if (cart.length === 0) return alert('⚠️ Tokri khali hai!');

    setReceiptData({
      items: [...cart], total: finalAmount, discount: discount, date: new Date().toLocaleString('en-PK'), paymentMethod: paymentMethod
    });

    const cartToSave = [...cart];
    const amountToSave = finalAmount;
    setCart([]); setDiscount(0); 

    try {
      fetch(`${SUPABASE_URL}/rest/v1/sales`, {
        method: 'POST', headers: headers, 
        body: JSON.stringify({ total_amount: amountToSave, details: cartToSave, payment_method: paymentMethod }) 
      });

      const stockUpdatePromises = cartToSave.map(item => {
        const remainingStock = item.quantity - item.qty; 
        return fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${item.id}`, { method: 'PATCH', headers: headers, body: JSON.stringify({ quantity: remainingStock }) });
      });
      await Promise.all(stockUpdatePromises);
      fetchProducts(); 
    } catch (err) { console.error(err); }
  };

  const handleCreditCheckout = async (customer) => {
    if (cart.length === 0) return alert('⚠️ Tokri khali hai!');
    if (!customer) return alert('⚠️ Customer select karein!');

    const cartToSave = [...cart];
    const amountToSave = finalAmount;
    const newBalance = customer.balance + amountToSave;
    const descNames = cartToSave.map(c => `${c.product_name || c.name} (x${c.qty})`).join(', ');
    const khataDesc = `Udhaar Sale: ${descNames}`;

    setReceiptData({ items: cartToSave, total: amountToSave, discount: discount, date: new Date().toLocaleString('en-PK'), isUdhaar: true, customerName: customer.name, paymentMethod: 'Udhaar' });
    setCart([]); setDiscount(0);

    try {
      fetch(`${SUPABASE_URL}/rest/v1/ledger?id=eq.${customer.id}`, { method: 'PATCH', headers, body: JSON.stringify({ balance: newBalance }) });
      fetch(`${SUPABASE_URL}/rest/v1/khata_entries`, { method: 'POST', headers, body: JSON.stringify({ customer_id: customer.id, description: khataDesc.substring(0, 200), udhaar: amountToSave, wasooli: 0, balance: newBalance }) });
      fetch(`${SUPABASE_URL}/rest/v1/sales`, { method: 'POST', headers, body: JSON.stringify({ total_amount: amountToSave, details: cartToSave, payment_method: 'Udhaar' }) });

      const stockUpdatePromises = cartToSave.map(item => {
        const remainingStock = item.quantity - item.qty; 
        return fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${item.id}`, { method: 'PATCH', headers, body: JSON.stringify({ quantity: remainingStock }) });
      });
      await Promise.all(stockUpdatePromises);
      fetchProducts(); fetchCustomers(); 
    } catch (err) { console.error(err); alert("⚠️ Udhaar save karne mein masla aya."); }
  };

  const closeReceipt = () => setReceiptData(null);

  return { cart, totalAmount, finalAmount, discount, setDiscount, heldCart, handleScan, handleCheckout, handleCreditCheckout, handleHold, handleResume, receiptData, closeReceipt, dbProducts, customers, updateQuantity, removeItem, refreshData };
}