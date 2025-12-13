'use client';

import { useEffect, useState } from 'react';

interface ForecastDay {
  forecast_date: string;
  temp_min: number;
  temp_max: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
  pop: number; // probability of precipitation
  rain_mm: number;
  snow_mm: number;
  wind_speed: number; // in m/s
}

export default function ForecastCard() {
  const [forecasts, setForecasts] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchForecast() {
      try {
        const response = await fetch('/api/forecast');
        if (!response.ok) throw new Error('Failed to fetch forecast');
        const data = await response.json();
        setForecasts(data.forecasts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load forecast');
      } finally {
        setLoading(false);
      }
    }

    fetchForecast();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">7-Day Forecast</h2>
        <p className="text-gray-600">Loading forecast...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">7-Day Forecast</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">7-Day Forecast</h2>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {forecasts.map((day, index) => {
          const date = new Date(day.forecast_date);
          const dayName = index === 0
            ? 'Today'
            : date.toLocaleDateString('en-US', { weekday: 'short' });
          const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return (
            <div
              key={day.forecast_date}
              className="flex flex-col items-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <p className="font-semibold text-gray-800">{dayName}</p>
              <p className="text-sm text-gray-600 mb-2">{monthDay}</p>

              <img
                src={`https://openweathermap.org/img/wn/${day.weather_icon}@2x.png`}
                alt={day.weather_description}
                className="w-16 h-16"
              />

              <p className="text-sm text-gray-600 text-center capitalize mb-2">
                {day.weather_description}
              </p>

              <div className="flex gap-2 items-center">
                <span className="text-lg font-bold text-gray-800">
                  {Math.round(day.temp_max)}°
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(day.temp_min)}°
                </span>
              </div>

              {day.wind_speed && (
                <div className="mt-2 text-xs text-gray-600">
                  🌬️ {Math.round(day.wind_speed * 3.6)} km/h
                </div>
              )}

              {(day.rain_mm > 0 || day.snow_mm > 0 || day.pop > 0.3) && (
                <div className="mt-2 text-xs text-blue-600">
                  💧 {Math.round(day.pop * 100)}%
                  {day.rain_mm > 0 && ` (${day.rain_mm.toFixed(1)}mm)`}
                  {day.snow_mm > 0 && ` ❄️ ${day.snow_mm.toFixed(1)}mm`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
