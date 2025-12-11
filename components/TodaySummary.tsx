'use client';

interface TodaySummaryProps {
  current: any;
}

export default function TodaySummary({ current }: TodaySummaryProps) {
  if (!current) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">TODAY</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">TODAY</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">Temperature</span>
          <span className="font-bold text-gray-900">{current.temp_c?.toFixed(1)}°C</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">Humidity</span>
          <span className="font-bold text-gray-900">{current.humidity?.toFixed(0)}%</span>
        </div>

        {current.rain_day_mm !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Rain</span>
            <span className="font-bold text-gray-900">{current.rain_day_mm?.toFixed(1)} mm</span>
          </div>
        )}

        {current.wind_speed_kmh !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Wind</span>
            <span className="font-bold text-gray-900">{current.wind_speed_kmh?.toFixed(1)} km/h</span>
          </div>
        )}

        {current.indoor_temp_c !== undefined && (
          <>
            <div className="border-t pt-3 mt-3" />
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Inside</span>
              <span className="font-bold text-gray-900">
                {current.indoor_temp_c?.toFixed(1)}°C, {current.indoor_humidity?.toFixed(0)}%
              </span>
            </div>
          </>
        )}

        {current.barometer_mmhg !== undefined && (
          <>
            <div className="border-t pt-3 mt-3" />
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Pressure</span>
              <span className="font-bold text-gray-900">{current.barometer_mmhg?.toFixed(0)} mmHg</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
