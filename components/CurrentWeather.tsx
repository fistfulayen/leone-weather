'use client';

interface CurrentWeatherProps {
  data: {
    current: any;
    summary: string;
    pressureTrend: string;
    rainHint: string;
    sunrise: string;
    sunset: string;
    todayHigh: number | null;
    todayHighTime: string | null;
    todayLow: number | null;
    todayLowTime: string | null;
  };
}

export default function CurrentWeather({ data }: CurrentWeatherProps) {
  const { current, summary, pressureTrend, rainHint, sunrise, sunset, todayHigh, todayHighTime, todayLow, todayLowTime } = data;

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

  const formatTimeFromISO = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Rome',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {/* Main temperature display */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-5xl font-light mb-2">{temp}°C</div>
          <div className="text-gray-600 mb-3">
            Feels like {feelsLike}°C · Humidity {humidity}%
          </div>
        </div>

        {/* Sun times */}
        <div className="text-right text-sm text-gray-600">
          <div>☀️ ↑ {sunrise}</div>
          <div>☀️ ↓ {sunset}</div>
        </div>
      </div>

      {/* Summary */}
      <div className="text-gray-700 space-y-1 mb-4">
        <p className="capitalize font-medium">{summary}</p>
        {rainHint && <p className="text-sm">{rainHint}</p>}
      </div>

      {/* High/Low temps and pressure */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        {todayHigh !== null && todayHighTime && (
          <div>
            <div className="text-gray-500 text-xs">High</div>
            <div className="font-semibold">{todayHigh.toFixed(1)}°C</div>
            <div className="text-gray-500 text-xs">{formatTimeFromISO(todayHighTime)}</div>
          </div>
        )}

        {todayLow !== null && todayLowTime && (
          <div>
            <div className="text-gray-500 text-xs">Low</div>
            <div className="font-semibold">{todayLow.toFixed(1)}°C</div>
            <div className="text-gray-500 text-xs">{formatTimeFromISO(todayLowTime)}</div>
          </div>
        )}

        {pressureTrend && (
          <div>
            <div className="text-gray-500 text-xs">Pressure</div>
            <div className="font-semibold">{current.barometer_mmhg?.toFixed(0)} mmHg</div>
            <div className="text-gray-500 text-xs">{pressureTrend}</div>
          </div>
        )}
      </div>
    </div>
  );
}
