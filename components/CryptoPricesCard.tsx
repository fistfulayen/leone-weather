'use client';

import { useEffect, useState } from 'react';

interface CryptoPrice {
  price: number;
  change: number;
}

interface CryptoPrices {
  bitcoin: CryptoPrice;
  ethereum: CryptoPrice;
  solana: CryptoPrice;
}

export default function CryptoPricesCard() {
  const [prices, setPrices] = useState<CryptoPrices | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await fetch('/api/crypto-prices');
      if (res.ok) {
        const data = await res.json();
        setPrices(data);
      }
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !prices) {
    return null;
  }

  const formatPrice = (price: number, decimals: number = 0) => {
    return price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const formatChange = (change: number) => {
    const color = change >= 0 ? 'text-green-600' : 'text-red-600';
    const sign = change >= 0 ? '+' : '';
    return <span className={color}>{sign}{change.toFixed(2)}%</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Cryptocurrency Prices</h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 font-medium">₿ Bitcoin:</span>
          <div className="text-right">
            <span className="text-sm font-semibold text-gray-900">${formatPrice(prices.bitcoin.price)}</span>
            <span className="text-xs ml-2">{formatChange(prices.bitcoin.change)}</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 font-medium">Ξ Ethereum:</span>
          <div className="text-right">
            <span className="text-sm font-semibold text-gray-900">${formatPrice(prices.ethereum.price)}</span>
            <span className="text-xs ml-2">{formatChange(prices.ethereum.change)}</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 font-medium">◎ Solana:</span>
          <div className="text-right">
            <span className="text-sm font-semibold text-gray-900">${formatPrice(prices.solana.price, 2)}</span>
            <span className="text-xs ml-2">{formatChange(prices.solana.change)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
