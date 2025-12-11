'use client';

import { useEffect, useState } from 'react';
import CurrentWeather from '@/components/CurrentWeather';
import AirQualityCard from '@/components/AirQualityCard';
import TodaySummary from '@/components/TodaySummary';
import ChatInterface from '@/components/ChatInterface';
import LeoneNarrative from '@/components/LeoneNarrative';

export default function Home() {
  const [currentData, setCurrentData] = useState<any>(null);
  const [airQualityData, setAirQualityData] = useState<any>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch current weather
      const currentRes = await fetch('/api/current');
      if (currentRes.ok) {
        const data = await currentRes.json();
        setCurrentData(data);
        // Use the actual timestamp from when the cron job last pulled data
        if (data.timestamp) {
          setLastUpdate(new Date(data.timestamp).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Rome',
          }));
        }
      }

      // Fetch air quality
      const aqRes = await fetch('/api/air-quality');
      if (aqRes.ok) {
        const data = await aqRes.json();
        setAirQualityData(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">☀️ Cascina Leone</h1>
          </div>
          <div className="text-sm text-gray-700 font-medium">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Europe/Rome',
            })}
          </div>
        </header>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Weather Data */}
          <div className="space-y-6">
            {/* Current Weather */}
            {currentData && <CurrentWeather data={currentData} />}

            {/* Today Summary */}
            {currentData && <TodaySummary current={currentData.current} />}

            {/* Air Quality */}
            {airQualityData && <AirQualityCard data={airQualityData} />}
          </div>

          {/* Right Column - Louisina's Narrative */}
          <div>
            <LeoneNarrative />
          </div>
        </div>

        {/* Chat Interface - Full Width */}
        <ChatInterface sessionId={sessionId} />

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-gray-500">
          Last updated: {lastUpdate || 'Loading...'} · Station: Cascina Leone, Niella Belbo
        </footer>
      </div>
    </main>
  );
}
