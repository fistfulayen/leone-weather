interface WeatherData {
  rain_rate_mmh?: number;
  humidity?: number;
  wind_speed_kmh?: number;
  aqi?: number;
}

/**
 * Calculate the current moon phase
 */
function getMoonPhase(): { emoji: string; name: string; phase: number } {
  const now = new Date();

  // Known new moon date: January 11, 2024
  const knownNewMoon = new Date('2024-01-11T11:57:00Z');
  const lunarCycleDays = 29.53059; // Length of lunar cycle in days

  // Calculate days since known new moon
  const daysSinceNewMoon = (now.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);

  // Calculate current position in lunar cycle
  const phase = (daysSinceNewMoon % lunarCycleDays) / lunarCycleDays;

  // Return appropriate moon emoji and name based on phase
  if (phase < 0.03 || phase > 0.97) return { emoji: '🌑', name: 'New Moon', phase };
  if (phase < 0.22) return { emoji: '🌒', name: 'Waxing Crescent', phase };
  if (phase < 0.28) return { emoji: '🌓', name: 'First Quarter', phase };
  if (phase < 0.47) return { emoji: '🌔', name: 'Waxing Gibbous', phase };
  if (phase < 0.53) return { emoji: '🌕', name: 'Full Moon', phase };
  if (phase < 0.72) return { emoji: '🌖', name: 'Waning Gibbous', phase };
  if (phase < 0.78) return { emoji: '🌗', name: 'Last Quarter', phase };
  return { emoji: '🌘', name: 'Waning Crescent', phase };
}

/**
 * Calculate the current moon phase emoji
 */
export function getMoonPhaseEmoji(): string {
  return getMoonPhase().emoji;
}

/**
 * Get moon phase with planting guidance
 */
export function getMoonPhaseInfo(): { name: string; emoji: string; goodForPlanting: boolean; plantingAdvice: string } {
  const moonPhase = getMoonPhase();

  // Waxing moon (new to full) is good for planting above-ground crops
  // Waning moon (full to new) is good for root crops and pruning
  const isWaxing = moonPhase.phase >= 0 && moonPhase.phase < 0.5;
  const goodForPlanting = isWaxing;

  let plantingAdvice = '';
  if (moonPhase.phase < 0.03 || moonPhase.phase > 0.97) {
    // New moon
    plantingAdvice = 'Perfect time to plant leafy greens and herbs in the food forest!';
  } else if (moonPhase.phase < 0.25) {
    // Waxing crescent to first quarter
    plantingAdvice = 'Excellent for planting above-ground crops - the moon is pulling growth upward!';
  } else if (moonPhase.phase < 0.5) {
    // Waxing gibbous
    plantingAdvice = 'Still good for planting before the full moon - strong growth energy!';
  } else if (moonPhase.phase < 0.55) {
    // Full moon
    plantingAdvice = 'Full moon energy! Better for harvesting than planting, but great for transplanting.';
  } else if (moonPhase.phase < 0.75) {
    // Waning gibbous to last quarter
    plantingAdvice = 'Perfect time to plant root vegetables and bulbs - energy moves downward!';
  } else {
    // Waning crescent
    plantingAdvice = 'Good for pruning, weeding, and preparing soil for the next new moon planting.';
  }

  return {
    name: moonPhase.name,
    emoji: moonPhase.emoji,
    goodForPlanting,
    plantingAdvice
  };
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
