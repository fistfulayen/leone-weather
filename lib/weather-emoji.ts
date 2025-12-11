interface WeatherData {
  rain_rate_mmh?: number;
  humidity?: number;
  wind_speed_kmh?: number;
  aqi?: number;
}

/**
 * Calculate the current moon phase emoji
 */
export function getMoonPhaseEmoji(): string {
  const now = new Date();

  // Known new moon date: January 11, 2024
  const knownNewMoon = new Date('2024-01-11T11:57:00Z');
  const lunarCycleDays = 29.53059; // Length of lunar cycle in days

  // Calculate days since known new moon
  const daysSinceNewMoon = (now.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);

  // Calculate current position in lunar cycle
  const phase = (daysSinceNewMoon % lunarCycleDays) / lunarCycleDays;

  // Return appropriate moon emoji based on phase
  if (phase < 0.03 || phase > 0.97) return '🌑'; // New moon
  if (phase < 0.22) return '🌒'; // Waxing crescent
  if (phase < 0.28) return '🌓'; // First quarter
  if (phase < 0.47) return '🌔'; // Waxing gibbous
  if (phase < 0.53) return '🌕'; // Full moon
  if (phase < 0.72) return '🌖'; // Waning gibbous
  if (phase < 0.78) return '🌗'; // Last quarter
  return '🌘'; // Waning crescent
}

/**
 * Get weather emoji based on current conditions
 */
export function getWeatherEmoji(weather: WeatherData): string {
  // Check for rain
  if (weather.rain_rate_mmh && weather.rain_rate_mmh > 0) {
    if (weather.rain_rate_mmh > 10) return '⛈️'; // Heavy rain/storm
    if (weather.rain_rate_mmh > 2.5) return '🌧️'; // Moderate rain
    return '🌦️'; // Light rain
  }

  // Check humidity and AQI for cloudiness
  if (weather.humidity && weather.humidity > 80) {
    return '☁️'; // Cloudy/overcast
  }

  if (weather.humidity && weather.humidity > 60) {
    return '⛅'; // Partly cloudy
  }

  // Clear/sunny
  return '☀️';
}

/**
 * Determine if it's currently daytime based on sunrise/sunset
 */
export function isDaytime(sunrise: Date, sunset: Date): boolean {
  const now = new Date();
  const currentTime = now.getTime();
  return currentTime >= sunrise.getTime() && currentTime <= sunset.getTime();
}

/**
 * Get the appropriate header emoji based on time of day and weather
 */
export function getHeaderEmoji(
  weather: WeatherData,
  sunrise: Date,
  sunset: Date
): string {
  if (isDaytime(sunrise, sunset)) {
    return getWeatherEmoji(weather);
  } else {
    return getMoonPhaseEmoji();
  }
}
