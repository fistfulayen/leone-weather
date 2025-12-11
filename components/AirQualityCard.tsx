'use client';

interface AirQualityCardProps {
  data: {
    aqi: number;
    pm25?: number;
    pm10?: number;
    level: string;
    color: string;
    description: string;
    story: string;
    healthGuidance: string;
    comparisons: Array<{
      city: string;
      country: string;
      aqi: number;
    }>;
  };
}

export default function AirQualityCard({ data }: AirQualityCardProps) {
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">AIR QUALITY</h2>
        <p className="text-gray-500">Loading air quality data...</p>
      </div>
    );
  }

  const { aqi, pm25, pm10, level, color, story, healthGuidance, comparisons } = data;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">AIR QUALITY</h2>

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xl font-medium">{level}</span>
          <span className="text-gray-500 ml-auto">AQI {aqi.toFixed(1)}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Davis AirLink sensor · Instantaneous reading · EU EEA European index
        </div>
      </div>

      <div className="text-sm text-gray-700 space-y-3 mb-4 whitespace-pre-line">
        {story}
      </div>

      {pm25 !== undefined && pm10 !== undefined && (
        <div className="text-xs text-gray-500 mb-3">
          PM2.5: {pm25.toFixed(1)} µg/m³ · PM10: {pm10.toFixed(1)} µg/m³
        </div>
      )}

      <div className="text-sm text-gray-600 italic border-t pt-3">
        {healthGuidance}
      </div>
    </div>
  );
}
