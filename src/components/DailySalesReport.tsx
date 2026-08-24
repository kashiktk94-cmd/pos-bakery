import React, { useState, useEffect } from 'react';
import { SUPABASE_URL, headers } from '../config/supabase';

export default function DailySalesReport({ refreshTrigger }) {
  const [totalSales, setTotalSales] = useState(0);
  const [startDate, setStartDate] = useState(''); // Tareekh mehfooz karne ke liye

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/sales?select=total_amount,created_at`, { headers });
        const data = await res.json();
        
        if (!data.error && data.length > 0) {
          // 1. Sari sales ko jama (plus) karna
          const total = data.reduce((sum, sale) => sum + sale.total_amount, 0);
          setTotalSales(total);

          // 2. Sab se pehli (oldest) sale ki tareekh nikalna
          const oldestSale = data.reduce((oldest, current) => {
            return new Date(current.created_at) < new Date(oldest.created_at) ? current : oldest;
          });
          
          // Tareekh ko asaan format (DD/MM/YYYY) mein badalna
          const formattedDate = new Date(oldestSale.created_at).toLocaleDateString('en-PK');
          setStartDate(formattedDate);
        }
      } catch (err) { console.error(err); }
    };
    
    fetchSales();
  }, [refreshTrigger]);

  return (
    <div className="hide-on-print" style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '10px', textAlign: 'center', marginBottom: '20px', border: '1px solid #f59e0b' }}>
      <h4 style={{ margin: '0 0 5px 0', color: '#b45309' }}>
        📈 Total Sales {startDate ? `(Since: ${startDate})` : ''}
      </h4>
      <h2 style={{ margin: 0, color: '#92400e' }}>Rs. {totalSales.toLocaleString()}</h2>
    </div>
  );
}