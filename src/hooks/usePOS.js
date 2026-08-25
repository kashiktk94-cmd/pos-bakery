import { useState, useEffect } from 'react';
import { SUPABASE_URL, headers } from '../config/supabase';

export function usePOS() {
  const [cart, setCart] = useState([]);
  const [heldCart, setHeldCart] = useState(null);
  const [dbProducts, setDbProducts] = useState([]); 
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
  const finalAmount = totalAmount - discount;

  const handleHold = () => {
    if (cart.length === 0) return alert('Tokri khali hai!');
    setHeldCart(cart); setCart([]); setDiscount(0);
  };

  const handleResume = () => {
    if (cart.length > 0) return alert('Pehle screen wali tokri khali karein!');
    setCart(heldCart); setHeldCart(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Tokri khali hai!');
    
    // 🌟 1. SAB SE PEHLE PARCHI KA TEXT BANAYEIN
    let receiptText = "🏪 KASHIF BAKERY & MART\n-----------------------\n";
    cart.forEach(item => {
      receiptText += `${item.product_name || item.name} (x${item.qty}) = Rs. ${item.price * item.qty}\n`;
    });
    receiptText += "-----------------------\n";
    if (discount > 0) receiptText += `Discount: -Rs. ${discount}\n`;
    receiptText += `Total Paid: Rs. ${finalAmount}\n`;
    receiptText += "Thank You For Shopping!\nSystem by wp_doctr";

    // 🌟 2. FAURAN SHARE MENU KHOLAIN (Bina kisi alert ke, taake block na ho)
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Bakery Receipt',
          text: receiptText,
        });
      } else {
        window.print();
      }
    } catch (error) {
      console.log("Share menu closed by user");
    }

    // 🌟 3. US KE BAAD DATABASE MEIN SAVE KAREIN
    for (let item of cart) {
      const remainingStock = item.quantity - item.qty; 
      await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${item.id}`, {
        method: 'PATCH', headers: headers, body: JSON.stringify({ quantity: remainingStock })
      });
    }

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/sales`, {
        method: 'POST', headers: headers, body: JSON.stringify({ total_amount: finalAmount }) 
      });
    } catch (err) { console.error("Sale error:", err); }

    // 🌟 4. AAKHIR MEIN TOKRI KHALI KAR DEIN
    setCart([]); 
    setDiscount(0); 
    fetchProducts(); 
  };

  return { cart, totalAmount, finalAmount, discount, setDiscount, heldCart, handleScan, handleCheckout, handleHold, handleResume };
}