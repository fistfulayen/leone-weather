import { supabaseAdmin } from './supabase';

// World Air Quality Index API
const WAQI_TOKEN = process.env.WAQI_API_TOKEN || 'demo';

interface CityAQI {
  city: string;
  country: string;
  aqi: number;
  pm25?: number;
  pm10?: number;
}

const COMPARISON_CITIES = [
  { city: 'Milan', country: 'Italy', query: 'milan' },
  { city: 'Turin', country: 'Italy', query: 'torino' },
  { city: 'Genoa', country: 'Italy', query: '@10883' }, // Mignanego station near Genoa
  { city: 'Rome', country: 'Italy', query: 'rome' },
  { city: 'Paris', country: 'France', query: 'paris' },
  { city: 'Los Angeles', country: 'USA', query: 'los-angeles' },
  { city: 'New York', country: 'USA', query: 'new-york' },
  { city: 'Shanghai', country: 'China', query: 'shanghai' },
  { city: 'London', country: 'UK', query: 'london' },
  { city: 'Barcelona', country: 'Spain', query: 'barcelona' },
  { city: 'Berlin', country: 'Germany', query: 'berlin' },
];

export async function fetchGlobalAQIData(): Promise<CityAQI[]> {
  const results: CityAQI[] = [];

  for (const city of COMPARISON_CITIES) {
    try {
      const url = `https://api.waqi.info/feed/${city.query}/?token=${WAQI_TOKEN}`;
      const response = await fetch(url, {
        next: { revalidate: 3600 } // Cache for 1 hour
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (data.status === 'ok' && data.data) {
        results.push({
          city: city.city,
          country: city.country,
          aqi: data.data.aqi || 0,
          pm25: data.data.iaqi?.pm25?.v,
          pm10: data.data.iaqi?.pm10?.v,
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching AQI for ${city.city}:`, error);
    }
  }

  // Cache in database
  if (results.length > 0) {
    await cacheAQIComparisons(results);
  }

  return results;
}

async function cacheAQIComparisons(data: CityAQI[]) {
  const records = data.map(d => ({
    city: d.city,
    country: d.country,
    aqi: d.aqi,
    pm25: d.pm25,
    pm10: d.pm10,
    fetched_at: new Date().toISOString(),
  }));

  await supabaseAdmin
    .from('aqi_comparisons')
    .insert(records);
}

export async function getRecentAQIComparisons(): Promise<CityAQI[]> {
  // Get the most recent AQI data for each city
  const { data, error } = await supabaseAdmin
    .from('aqi_comparisons')
    .select('*')
    .gte('fetched_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
    .order('fetched_at', { ascending: false });

  if (error || !data || data.length === 0) {
    // Fetch fresh data if cache is empty or stale
    return await fetchGlobalAQIData();
  }

  // Group by city and take the most recent
  const cityMap = new Map<string, CityAQI>();
  for (const record of data) {
    const key = `${record.city}-${record.country}`;
    if (!cityMap.has(key)) {
      cityMap.set(key, {
        city: record.city,
        country: record.country,
        aqi: record.aqi,
        pm25: record.pm25,
        pm10: record.pm10,
      });
    }
  }

  return Array.from(cityMap.values());
}

export function getAQILevel(aqi: number): {
  level: string;
  color: string;
  description: string;
} {
  if (aqi <= 15) {
    return {
      level: 'Excellent',
      color: '#10b981',
      description: 'Cleaner than a mountain forest. Among the best air in Europe right now.',
    };
  } else if (aqi <= 25) {
    return {
      level: 'Excellent',
      color: '#10b981',
      description: 'Excellent—like a clear day in the Alps. Better than 90% of European cities.',
    };
  } else if (aqi <= 50) {
    return {
      level: 'Good',
      color: '#84cc16',
      description: 'Good air. Similar to a quiet day in a small Italian town away from traffic.',
    };
  } else if (aqi <= 100) {
    return {
      level: 'Moderate',
      color: '#eab308',
      description: 'Moderate. Comparable to a typical day in Milan\'s suburbs. Sensitive people may notice.',
    };
  } else if (aqi <= 150) {
    return {
      level: 'Unhealthy for Sensitive Groups',
      color: '#f97316',
      description: 'Like standing near a busy road. Consider keeping windows closed.',
    };
  } else {
    return {
      level: 'Unhealthy',
      color: '#ef4444',
      description: 'Urban pollution levels. Limit time outdoors, keep windows closed.',
    };
  }
}

export function generateAQIStory(currentAQI: number, comparisons: CityAQI[]): string {
  const level = getAQILevel(currentAQI);
  const sorted = [...comparisons].sort((a, b) => a.aqi - b.aqi);

  // Find percentile ranking
  const betterThan = sorted.filter(c => c.aqi > currentAQI).length;
  const percentile = Math.round((betterThan / sorted.length) * 100);

  let story = `${level.description}\n\n`;

  if (percentile > 80) {
    story += `The air at Cascina Leone right now is cleaner than ${percentile}% of major cities worldwide. You're breathing mountain-quality air.\n\n`;
  } else if (percentile > 50) {
    story += `Your air quality is better than ${percentile}% of major cities worldwide.\n\n`;
  }

  // Show comparison to all Italian cities first, then select international cities
  const italianCities = sorted.filter(c => c.country === 'Italy');
  const internationalCities = ['Paris', 'Los Angeles', 'Shanghai']
    .map(city => sorted.find(c => c.city === city))
    .filter(Boolean);

  const keyComparisons = [...italianCities, ...internationalCities];

  if (keyComparisons.length > 0) {
    story += 'Compared to right now:\n';
    keyComparisons.forEach(c => {
      if (c) {
        const cityLevel = getAQILevel(c.aqi);
        story += `• ${c.city}: AQI ${c.aqi} (${cityLevel.level})\n`;
      }
    });
  }

  return story;
}

export function getAQIHealthGuidance(aqi: number): string {
  if (aqi <= 50) {
    return 'Safe for all activities. Great day for outdoor exercise.';
  } else if (aqi <= 100) {
    return 'Most people won\'t notice anything. Those with asthma or respiratory conditions might want to limit prolonged outdoor exertion.';
  } else if (aqi <= 150) {
    return 'Consider keeping windows closed. Not ideal for outdoor exercise.';
  } else {
    return 'Limit time outdoors. Keep windows closed. Sensitive groups should avoid outdoor activities.';
  }
}
