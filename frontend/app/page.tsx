"use client";
import { useState } from 'react';
import TokenPriceForm from './components/TokenPriceForm';
import PriceDisplay from './components/PriceDisplay';
import ProgressBar from './components/ProgressBar';
import { TokenPriceResponse } from './types';

async function fetchHistory(token: string, network: string) {
  // Use the backend server directly
  const res = await fetch(`http://localhost:3001/api/history?token=${token}&network=${network}`);
  if (!res.ok) return [];
  return await res.json(); // Should be [{timestamp, price}, ...]
}

export default function Home() {
  const [priceResult, setPriceResult] = useState<TokenPriceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ timestamp: number; price: number }[]>([]);

  const handlePriceResult = async (result: TokenPriceResponse) => {
    setPriceResult(result);
    // Fetch history after getting a price result
    if (result.token && result.network) {
      const hist = await fetchHistory(result.token, result.network);
      setHistory(hist);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-100 mb-4">
            Token Price{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Oracle
            </span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Advanced historical token price lookup with intelligent interpolation engine
            and real-time caching for optimal performance
          </p>
        </div>
        <TokenPriceForm
          onPriceResult={handlePriceResult}
          loading={loading}
          setLoading={setLoading}
        />
        {loading && (
          <ProgressBar
            progress={Math.min(100, (Date.now() % 3000) / 30)}
            label="Fetching price data..."
          />
        )}
        <PriceDisplay result={priceResult} history={history} />
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="card p-6 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-white font-bold text-lg">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Real-time Data</h3>
              <p className="text-gray-300 text-sm">
                Live price feeds from Alchemy with Redis caching for lightning-fast responses
              </p>
            </div>
            <div className="card p-6 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-white font-bold text-lg">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Smart Interpolation</h3>
              <p className="text-gray-300 text-sm">
                Advanced algorithms fill missing historical data points with weighted averages
              </p>
            </div>
            <div className="card p-6 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-white font-bold text-lg">🔄</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Scheduled Jobs</h3>
              <p className="text-gray-300 text-sm">
                Automated historical data collection with BullMQ job processing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
