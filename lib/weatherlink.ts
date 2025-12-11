const API_KEY = process.env.WEATHERLINK_API_KEY!;
const API_SECRET = process.env.WEATHERLINK_API_SECRET!;
const STATION_ID = process.env.WEATHERLINK_STATION_ID!;

interface WeatherlinkResponse {
  sensors: Array<{
    data: Array<{
      // Outdoor sensor (type 37)
      temp?: number;
      hum?: number;
      dew_point?: number;
      heat_index?: number;
      wind_chill?: number;
      wind_speed_avg_last_10_min?: number;
      wind_dir_scalar_avg_last_10_min?: number;
      wind_speed_hi_last_10_min?: number;
      rainfall_day_mm?: number;
      rain_rate_hi_mm?: number;
      // Barometer sensor (type 242)
      bar_sea_level?: number;
      // Indoor sensor (type 365)
      temp_in?: number;
      hum_in?: number;
      // Air quality sensor (type 323)
      pm_1?: number;
      pm_2p5?: number;
      pm_10?: number;
      aqi_val?: number;
    }>;
    sensor_type: number;
  }>;
  station: {
    station_id: number;
  };
}

export async function getCurrentConditions() {
  const url = `https://api.weatherlink.com/v2/current/${STATION_ID}?api-key=${API_KEY}`;

  const response = await fetch(url, {
    headers: {
      'X-Api-Secret': API_SECRET,
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
    cache: 'no-store' // Don't cache in API routes
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Weatherlink API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(`Weatherlink API error: ${response.statusText} - ${errorText}`);
  }

  const data: WeatherlinkResponse = await response.json();

  return parseWeatherlinkData(data);
}

function parseWeatherlinkData(data: WeatherlinkResponse) {
  // Find the main outdoor sensor (ISS - Integrated Sensor Suite)
  // Type 37 = WeatherLink Live ISS
  const outdoorSensor = data.sensors.find(s => s.sensor_type === 37);
  // Type 323 = AirLink sensor (air quality)
  const airQualitySensor = data.sensors.find(s => s.sensor_type === 323);
  // Type 365 = Indoor temp/humidity sensor
  const indoorSensor = data.sensors.find(s => s.sensor_type === 365);
  // Type 242 = Barometer sensor
  const barometerSensor = data.sensors.find(s => s.sensor_type === 242);

  const outdoor = outdoorSensor?.data[0] || {};
  const airQuality = airQualitySensor?.data[0] || {};
  const indoor = indoorSensor?.data[0] || {};
  const barometer = barometerSensor?.data[0] || {};

  return {
    timestamp: new Date().toISOString(),

    // Outdoor conditions (sensor type 37)
    temp_c: outdoor.temp !== undefined ? fahrenheitToCelsius(outdoor.temp) : undefined,
    humidity: outdoor.hum,
    dew_point_c: outdoor.dew_point !== undefined ? fahrenheitToCelsius(outdoor.dew_point) : undefined,
    heat_index_c: outdoor.heat_index !== undefined ? fahrenheitToCelsius(outdoor.heat_index) : undefined,
    wind_chill_c: outdoor.wind_chill !== undefined ? fahrenheitToCelsius(outdoor.wind_chill) : undefined,

    // Wind (sensor type 37, speeds are in mph)
    wind_speed_kmh: outdoor.wind_speed_avg_last_10_min !== undefined
      ? outdoor.wind_speed_avg_last_10_min * 1.60934
      : undefined,
    wind_dir_deg: outdoor.wind_dir_scalar_avg_last_10_min,
    wind_gust_kmh: outdoor.wind_speed_hi_last_10_min !== undefined
      ? outdoor.wind_speed_hi_last_10_min * 1.60934
      : undefined,

    // Rain (sensor type 37, already in mm)
    rain_rate_mmh: outdoor.rain_rate_hi_mm,
    rain_day_mm: outdoor.rainfall_day_mm,

    // Pressure (sensor type 242, convert inHg to mmHg)
    barometer_mmhg: barometer.bar_sea_level !== undefined
      ? barometer.bar_sea_level * 25.4
      : undefined,

    // Air Quality (sensor type 323)
    aqi: airQuality.aqi_val,
    pm1_ugm3: airQuality.pm_1,
    pm25_ugm3: airQuality.pm_2p5,
    pm10_ugm3: airQuality.pm_10,

    // Indoor (sensor type 365)
    indoor_temp_c: indoor.temp_in !== undefined ? fahrenheitToCelsius(indoor.temp_in) : undefined,
    indoor_humidity: indoor.hum_in,
  };
}

function fahrenheitToCelsius(f: number): number {
  return (f - 32) * 5 / 9;
}

export async function getHistoricalData(startTimestamp: number, endTimestamp: number) {
  const url = `https://api.weatherlink.com/v2/historic/${STATION_ID}?api-key=${API_KEY}&start-timestamp=${startTimestamp}&end-timestamp=${endTimestamp}`;

  const response = await fetch(url, {
    headers: {
      'X-Api-Secret': API_SECRET,
    },
  });

  if (!response.ok) {
    throw new Error(`Weatherlink API error: ${response.statusText}`);
  }

  return response.json();
}
