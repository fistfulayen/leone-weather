import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateTextWithClaude } from '@/lib/ai-gateway';

const SKI_RESORTS = [
  {
    name: 'Prato Nevoso',
    country: 'Italy',
    url: 'https://www.snow-forecast.com/resorts/Prato-Nevoso',
  },
  {
    name: 'Artesina',
    country: 'Italy',
    url: 'https://www.snow-forecast.com/resorts/Artesina',
  },
  {
    name: 'Niseko',
    country: 'Japan',
    url: 'https://www.snow-forecast.com/resorts/Niseko',
  },
];

interface SkiReportData {
  resort_name: string;
  country: string;
  snow_depth_mountain: number | null;
  snow_depth_base: number | null;
  lifts_open: number | null;
  lifts_total: number | null;
  slopes_open_km: number | null;
  slopes_total_km: number | null;
  last_snowfall: string | null;
  snow_quality: string | null;
  fresh_snow_cm: number | null;
  forecast_snow_today: number | null;
  forecast_snow_tomorrow: number | null;
  skiresort_url: string;
}

async function scrapeSkiReport(resort: typeof SKI_RESORTS[0]): Promise<SkiReportData | null> {
  try {
    console.log(`Fetching data for ${resort.name} from ${resort.url}`);

    // Fetch the HTML from SkiResort.info
    const response = await fetch(resort.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${resort.name}: ${response.statusText}`);
      return null;
    }

    const html = await response.text();

    // Use Claude via AI Gateway to parse the HTML and extract structured data
    const textContent = await generateTextWithClaude({
      prompt: `Extract ski resort snow report data from this HTML page. Return ONLY valid JSON with no markdown formatting, no code blocks, no explanations.

Required JSON structure:
{
  "snow_depth_mountain": <number in cm or null>,
  "snow_depth_base": <number in cm or null>,
  "lifts_open": <number or null>,
  "lifts_total": <number or null>,
  "slopes_open_km": <number or null>,
  "slopes_total_km": <number or null>,
  "last_snowfall": "<YYYY-MM-DD or null>",
  "snow_quality": "<string or null>",
  "fresh_snow_cm": <number or null>,
  "forecast_snow_today": <number in cm or null>,
  "forecast_snow_tomorrow": <number in cm or null>
}

HTML to parse:
${html.slice(0, 50000)}`,
      maxTokens: 1024,
    });

    if (!textContent) {
      console.error(`No response from Claude for ${resort.name}`);
      return null;
    }

    // Clean up the response - remove markdown code blocks if present
    let jsonString = textContent.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```\n?/g, '');
    }

    const parsedData = JSON.parse(jsonString);

    return {
      resort_name: resort.name,
      country: resort.country,
      skiresort_url: resort.url,
      ...parsedData,
    };
  } catch (error) {
    console.error(`Error scraping ${resort.name}:`, error);
    return null;
  }
}

export async function GET() {
  try {
    console.log('Fetching ski resort data from SkiResort.info...');

    const skiData: SkiReportData[] = [];

    for (const resort of SKI_RESORTS) {
      const data = await scrapeSkiReport(resort);
      if (data) {
        skiData.push(data);
      }
      // Small delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (skiData.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No ski resort data fetched',
        count: 0,
      });
    }

    // Upsert ski report data (update if exists, insert if new)
    const { error } = await supabaseAdmin
      .from('ski_reports')
      .upsert(skiData, {
        onConflict: 'resort_name,country',
      });

    if (error) {
      console.error('Error storing ski reports:', error);
      throw error;
    }

    console.log(`Ski reports stored successfully: ${skiData.length} resorts`);

    return NextResponse.json({
      success: true,
      message: 'Ski reports fetched and stored',
      count: skiData.length,
      data: skiData,
    });
  } catch (error) {
    console.error('Error fetching ski reports:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch ski reports',
      },
      { status: 500 }
    );
  }
}
