import { useState, useEffect } from 'react';
import { SUPABASE_URL, headers } from '../config/supabase';

export function usePOS() {
  const [cart, setCart] = useState([]);
  const [heldCart, setHeldCart] = useState(null);
  const [dbProducts, setDbProducts] = useState([]); 
  
  // 🌟 NAYA: Discount ka state (brain)
  const [discount, setDiscount] = useState(0); 

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/inventory?select=*`, { headers });
      const data = await res.json();
      if (!data.error) setDbProducts(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleScan = (scannedCode) => {
    const product = dbProducts.find(p => p.id.toString() === scannedCode.toString());
    if (product) {
      const existingItem = cart.find(item => item.id === product.id);
      if (existingItem && existingItem.qty >= product.quantity) {
         return alert(`⚠️ Stock khatam! Aap ke paas sirf ${product.quantity} bache hain.`);
      }
      if (existingItem) {
        setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      } else {
        setCart([{ ...product, qty: 1 }, ...cart]);
      }
    } else {
      alert('⚠️ Yeh ID database mein majood nahi!');
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  // 🌟 NAYA: Final Amount (Total mein se discount nikalne ke baad)
  const finalAmount = totalAmount - discount;

  const handleHold = () => {
    if (cart.length === 0) return alert('Tokri khali hai!');
    setHeldCart(cart); setCart([]); setDiscount(0); // Hold karte waqt discount 0 kar do
  };

  const handleResume = () => {
    if (cart.length > 0) return alert('Pehle screen wali tokri khali karein!');
    setCart(heldCart); setHeldCart(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Tokri khali hai!');
    
    for (let item of cart) {
      const remainingStock = item.quantity - item.qty; 
      await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${item.id}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ quantity: remainingStock })
      });
    }

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/sales`, {
        method: 'POST',
        headers: headers,
        // 🌟 NAYA: Database mein sirf wo paise jayenge jo discount ke baad bache!
        body: JSON.stringify({ total_amount: finalAmount }) 
      });
    } catch (err) { console.error("Sale error:", err); }

    window.print(); 
    setCart([]); 
    setDiscount(0); // 🌟 Parchi nikalne ke baad discount wapas 0 kar do
    fetchProducts(); 
  };

  // 🌟 Yahan discount aur finalAmount bhi aage bhej rahe hain
  return { cart, totalAmount, finalAmount, discount, setDiscount, heldCart, handleScan, handleCheckout, handleHold, handleResume };
}