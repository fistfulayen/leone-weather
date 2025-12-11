import { Reading } from './supabase';

export function generateCurrentConditionsSummary(current: Reading | null): string {
  if (!current) return 'No current data available';

  // Determine time of day
  const now = new Date();
  const hour = now.getHours();
  let timeOfDay = '';

  if (hour >= 5 && hour < 12) {
    timeOfDay = 'This morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'This afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'This evening';
  } else {
    timeOfDay = 'Tonight';
  }

  // Add condition description
  const conditions: string[] = [];

  // Rain assessment (prioritize this)
  if (current.rain_rate_mmh !== undefined && current.rain_rate_mmh > 0) {
    if (current.rain_rate_mmh > 10) {
      conditions.push('Heavy rain');
    } else if (current.rain_rate_mmh > 2.5) {
      conditions.push('Moderate rain');
    } else {
      conditions.push('Light rain');
    }
  } else {
    // If no rain, assess cloudiness/clarity based on humidity and other factors
    if (current.humidity !== undefined && current.humidity > 80) {
      conditions.push('Overcast and humid');
    } else if (current.humidity !== undefined && current.humidity < 40) {
      conditions.push('Clear and dry');
    } else {
      conditions.push('Partly cloudy');
    }
  }

  // Temperature assessment
  if (current.temp_c !== undefined) {
    if (current.temp_c < 0) {
      conditions.push('freezing');
    } else if (current.temp_c < 5) {
      conditions.push('cold');
    } else if (current.temp_c < 15) {
      conditions.push('cool');
    } else if (current.temp_c < 25) {
      conditions.push('mild');
    } else if (current.temp_c < 30) {
      conditions.push('warm');
    } else {
      conditions.push('hot');
    }
  }

  // Wind assessment
  if (current.wind_speed_kmh !== undefined) {
    if (current.wind_speed_kmh > 30) {
      conditions.push('windy');
    } else if (current.wind_speed_kmh > 15) {
      conditions.push('breezy');
    } else if (current.wind_speed_kmh < 2) {
      conditions.push('calm');
    }
  }

  return `${timeOfDay}: ${conditions.join(', ')}`;
}

export function getPressureTrend(
  current: number | undefined,
  past: number | undefined
): string {
  if (!current || !past) return 'unknown';

  const diff = current - past;

  if (Math.abs(diff) < 0.5) return 'steady';
  if (diff > 0) return 'rising';
  return 'falling';
}

export function getRainForecastHint(
  barometer: number | undefined,
  trend: string
): string {
  if (!barometer) return '';

  // Low pressure + falling = rain likely
  if (barometer < 760 && trend === 'falling') {
    return 'Rain may be approaching—pressure is falling.';
  }

  // High pressure + rising = clear weather
  if (barometer > 770 && trend === 'rising') {
    return 'Clear weather ahead—pressure is rising nicely.';
  }

  // Steady pressure
  if (trend === 'steady') {
    return 'Pressure is steady—weather should remain stable.';
  }

  return '';
}

export function getWindDirection(degrees: number | undefined): string {
  if (degrees === undefined) return 'Unknown';

  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

export function getComfortLevel(temp: number | undefined, humidity: number | undefined): {
  level: string;
  description: string;
} {
  if (temp === undefined) {
    return { level: 'Unknown', description: '' };
  }

  // Temperature comfort
  if (temp < 15) {
    return {
      level: 'Cool',
      description: 'On the cool side for comfort—most people prefer 18-21°C indoors.',
    };
  }

  if (temp > 24) {
    return {
      level: 'Warm',
      description: 'Getting warm—consider opening windows or using ventilation.',
    };
  }

  // Check humidity if available
  if (humidity !== undefined) {
    if (humidity > 70) {
      return {
        level: 'Humid',
        description: 'Humidity is high—may feel stuffy. Good day to air out the house if outdoor air is better.',
      };
    }

    if (humidity < 30) {
      return {
        level: 'Dry',
        description: 'Air is quite dry—you might notice it in your throat or skin.',
      };
    }
  }

  return {
    level: 'Comfortable',
    description: 'Temperature is in the comfortable range.',
  };
}

export function shouldAirOutHouse(
  indoorTemp: number | undefined,
  indoorHumidity: number | undefined,
  outdoorTemp: number | undefined,
  outdoorHumidity: number | undefined,
  aqi: number | undefined
): { should: boolean; reason: string } {
  if (
    indoorTemp === undefined ||
    outdoorTemp === undefined ||
    aqi === undefined
  ) {
    return { should: false, reason: 'Insufficient data to recommend' };
  }

  // Don't air out if AQI is poor
  if (aqi > 100) {
    return {
      should: false,
      reason: 'Air quality outside is poor. Better to keep windows closed.',
    };
  }

  // Don't air out if it's much colder outside
  if (outdoorTemp < indoorTemp - 10) {
    return {
      should: false,
      reason: 'It\'s much colder outside—you\'ll lose too much heat.',
    };
  }

  // Good conditions for airing out
  if (aqi < 50 && outdoorTemp > 5 && outdoorTemp < 25) {
    return {
      should: true,
      reason: 'Perfect conditions! Good air quality and comfortable temperature. Open those windows!',
    };
  }

  return {
    should: true,
    reason: 'Conditions are decent for airing out the house for a short while.',
  };
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Rome',
  });
}
