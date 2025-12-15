'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface CityWeather {
  city_name: string;
  country: string;
  current_temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  weather_description: string;
  weather_icon: string;
  humidity: number;
  wind_speed: number;
}

function getCityFlag(city: string): string {
  const flags: Record<string, string> = {
    'Portland': '🇺🇸',
    'New York': '🇺🇸',
    'Paris': '🇫🇷',
    'Tallinn': '🇪🇪',
  };
  return flags[city] || '';
}

export default function CityWeatherCard() {
  const [cities, setCities] = useState<CityWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCityWeather() {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from('city_weather')
          .select('*')
          .order('city_name');

        if (error) throw error;

        setCities(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load city weather');
        console.error('Error fetching city weather:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCityWeather();

    // Refresh every 30 minutes
    const interval = setInterval(fetchCityWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">Loading city weather...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Around the World 🌍
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cities.map((city) => (
          <div
            key={`${city.city_name}-${city.country}`}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 hover:shadow-lg transition-shadow"
          >
            {/* City Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {getCityFlag(city.city_name)} {city.city_name}
                </h3>
                <p className="text-sm text-gray-600 capitalize">
                  {city.weather_description}
                </p>
              </div>
              <img
                src={`https://openweathermap.org/img/wn/${city.weather_icon}@2x.png`}
                alt={city.weather_description}
                className="w-16 h-16"
              />
            </div>

            {/* Current Temperature */}
            <div className="mb-4">
              <div className="text-4xl font-bold text-gray-900">
                {Math.round(city.current_temp)}°C
              </div>
              <div className="text-sm text-gray-600">
                Feels like {Math.round(city.feels_like)}°C
              </div>
            </div>

            {/* High/Low */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-blue-200">
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">High</div>
                <div className="text-lg font-bold text-orange-600">
                  {Math.round(city.temp_max)}°
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Low</div>
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(city.temp_min)}°
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>💧 Humidity:</span>
                <span className="font-semibold">{city.humidity}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>🌬️ Wind:</span>
                <span className="font-semibold">{Math.round(city.wind_speed * 3.6)} km/h</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Updated hourly from OpenWeatherMap
      </p>
    </div>
  );
}
