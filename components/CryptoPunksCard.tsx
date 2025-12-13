'use client';

import { useEffect, useState } from 'react';

interface Sale {
  punkId: string;
  priceEth: number;
  priceUsd: string;
  hoursAgo: number;
  imageUrl: string;
}

export default function CryptoPunksCard() {
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/cryptopunks-sales');
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales || null);
      }
    } catch (error) {
      console.error('Error fetching CryptoPunks sales:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!sales || sales.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">🔷 CryptoPunks Last 24 Hours ({sales.length} {sales.length === 1 ? 'Sale' : 'Sales'})</h2>
      <div className="space-y-4">
        {sales.map((sale) => (
          <div key={`${sale.punkId}-${sale.hoursAgo}`} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <img
              src={sale.imageUrl}
              alt={`Punk ${sale.punkId}`}
              className="w-24 h-24 rounded pixelated"
              style={{
                imageRendering: 'pixelated',
                WebkitImageRendering: '-webkit-crisp-edges',
              }}
            />
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900">
                Punk #{sale.punkId} bought for {sale.priceEth} ETH (${sale.priceUsd} USD)
              </p>
              <p className="text-sm text-gray-600 mt-1">{sale.hoursAgo} hours ago</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
