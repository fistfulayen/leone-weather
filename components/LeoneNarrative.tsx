'use client';

import { useEffect, useState } from 'react';

export default function LeoneNarrative() {
  const [narrative, setNarrative] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNarrative();
    // Refresh every 5 minutes to stay current
    const interval = setInterval(fetchNarrative, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNarrative = async () => {
    try {
      const res = await fetch('/api/louisina-narrative');
      if (res.ok) {
        const data = await res.json();
        setNarrative(data.narrative);
      }
    } catch (error) {
      console.error('Error fetching Louisina narrative:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 h-full">
        <h2 className="text-lg font-semibold mb-4">LOUISINA&apos;S WEATHER REPORT 🦁</h2>
        <p className="text-gray-500 italic">Louisina is stepping outside to feel the weather...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-full">
      <h2 className="text-lg font-semibold mb-4">LOUISINA&apos;S WEATHER REPORT 🦁</h2>
      <div className="text-gray-700 whitespace-pre-line leading-relaxed text-sm">
        {narrative}
      </div>
    </div>
  );
}
