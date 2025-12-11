'use client';

interface CurrentWeatherProps {
  data: {
    current: any;
    summary: string;
    pressureTrend: string;
    rainHint: string;
  };
}

export default function CurrentWeather({ data }: CurrentWeatherProps) {
  const { current, summary, pressureTrend, rainHint } = data;

  if (!current) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-500">Loading weather data...</p>
      </div>
    );
  }

  const temp = current.temp_c?.toFixed(1);
  const feelsLike = (current.wind_chill_c || current.heat_index_c || current.temp_c)?.toFixed(1);
  const humidity = current.humidity?.toFixed(0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="mb-4">
        <div className="text-5xl font-light mb-2">{temp}°C</div>
        <div className="text-gray-600 mb-3">
          Feels like {feelsLike}°C · Humidity {humidity}%
        </div>
      </div>

      <div className="text-gray-700 space-y-1">
        <p className="capitalize">{summary}</p>
        {rainHint && <p>{rainHint}</p>}
        {pressureTrend && (
          <p className="text-sm text-gray-500">
            Pressure: {current.barometer_mmhg?.toFixed(0)} mmHg ({pressureTrend})
          </p>
        )}
      </div>
    </div>
  );
}
