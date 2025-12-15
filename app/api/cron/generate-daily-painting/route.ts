import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(request: Request) {
  try {
    // Verify this is a cron request (Vercel sets this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting daily painting generation cron job...');

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    // Step 1: Fetch all context data (same as send-daily-email does)
    console.log('Fetching context data...');

    // Get current weather reading from Supabase
    const { data: readings } = await supabase
      .from('readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1);

    const current = readings?.[0];
    if (!current) {
      return NextResponse.json({ error: 'No weather data available' }, { status: 404 });
    }

    // Get presence data
    const presenceResponse = await fetch(`${baseUrl}/api/presence`);
    const presenceData = await presenceResponse.json();
    const isPresent = presenceData.isPresent;

    // Get horoscope
    let horoscope = null;
    try {
      const horoscopeResponse = await fetch(`${baseUrl}/api/horoscope`);
      if (horoscopeResponse.ok) {
        horoscope = await horoscopeResponse.json();
      }
    } catch (error) {
      console.error('Error fetching horoscope:', error);
    }

    // Get forecast
    let forecastDays = null;
    try {
      const forecastResponse = await fetch(`${baseUrl}/api/forecast`);
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        forecastDays = forecastData.forecast;
      }
    } catch (error) {
      console.error('Error fetching forecast:', error);
    }

    // Get local news
    let localNews = null;
    try {
      const newsResponse = await fetch(`${baseUrl}/api/local-news`);
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        if (newsData.articles && newsData.articles.length > 0) {
          localNews = newsData.articles.slice(0, 15);
        }
      }
    } catch (error) {
      console.error('Error fetching local news:', error);
    }

    // Get crypto prices
    let cryptoPrices = null;
    try {
      const cryptoResponse = await fetch(`${baseUrl}/api/crypto-prices`);
      if (cryptoResponse.ok) {
        cryptoPrices = await cryptoResponse.json();
      }
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
    }

    // Get CryptoPunks sales
    let cryptoPunksSales = null;
    try {
      const punksResponse = await fetch(`${baseUrl}/api/cryptopunks-sales`);
      if (punksResponse.ok) {
        const punksData = await punksResponse.json();
        if (punksData.sales && punksData.sales.length > 0) {
          cryptoPunksSales = punksData.sales;
        }
      }
    } catch (error) {
      console.error('Error fetching CryptoPunks sales:', error);
    }

    // Helper functions
    const getSeason = (date: Date) => {
      const month = date.getMonth();
      if (month >= 2 && month <= 4) return 'spring';
      if (month >= 5 && month <= 7) return 'summer';
      if (month >= 8 && month <= 10) return 'autumn';
      return 'winter';
    };

    const getTimeOfDay = (date: Date) => {
      const hour = date.getHours();
      if (hour >= 5 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 21) return 'evening';
      return 'night';
    };

    const now = new Date();
    const timeOfDay = getTimeOfDay(now);

    // Build full context for the painting
    const paintingContext = {
      temperature: current.temp_c,
      feelsLike: current.wind_chill_c || current.heat_index_c || current.temp_c,
      conditions: current.weather_description || 'current weather',
      season: getSeason(now),
      timeOfDay,
      windSpeed: current.wind_speed_kmh,
      windGust: current.wind_gust_kmh,
      rainToday: current.rain_day_mm,
      humidity: current.humidity,
      isPresent,
      horoscope: horoscope?.horoscope_text,
      luckyColors: horoscope?.lucky_colors,
      luckyNumbers: horoscope?.lucky_numbers,
      forecast: forecastDays?.slice(0, 3).map((d: any) =>
        `${new Date(d.forecast_date).toLocaleDateString('en-US', { weekday: 'short' })}: ${d.weather_description}, ${Math.round(d.temp_max)}°/${Math.round(d.temp_min)}°`
      ).join('; '),
      news: localNews?.slice(0, 3).map((article: { title: string }) => article.title).join('; '),
      cryptoPrices: cryptoPrices ? {
        bitcoin: cryptoPrices.bitcoin,
        ethereum: cryptoPrices.ethereum,
      } : null,
      cryptoPunks: cryptoPunksSales?.map((punk: any) =>
        `Punk #${punk.punkId} sold for ${punk.priceEth} ETH ($${punk.priceUsd})`
      ).join('; '),
    };

    // Step 2: Generate the painting
    console.log('Generating daily painting...');
    const contextParam = encodeURIComponent(JSON.stringify(paintingContext));
    const paintingResponse = await fetch(`${baseUrl}/api/daily-painting?context=${contextParam}`);

    if (!paintingResponse.ok) {
      throw new Error(`Painting generation failed: ${await paintingResponse.text()}`);
    }

    const paintingData = await paintingResponse.json();

    if (!paintingData.imageUrl) {
      throw new Error('No image URL returned from painting generation');
    }

    console.log('Painting generated successfully:', paintingData.painter.name);

    // Step 3: Store in Supabase
    console.log('Storing painting in database...');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await supabase
      .from('daily_paintings')
      .upsert({
        painting_date: today,
        painter_name: paintingData.painter.name,
        painter_period: paintingData.painter.period,
        painter_style: paintingData.painter.style,
        source_image: paintingData.sourceImage,
        image_url: paintingData.imageUrl,
        claude_prompt: 'Generated by daily painting API',
        dalle_prompt: paintingData.prompt,
        revised_prompt: paintingData.revisedPrompt,
        context: paintingContext,
      }, {
        onConflict: 'painting_date'
      });

    if (error) {
      console.error('Error storing painting in database:', error);
      throw error;
    }

    console.log('Daily painting cron job completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Daily painting generated and stored',
      painter: paintingData.painter.name,
      date: today,
      imageUrl: paintingData.imageUrl,
    });

  } catch (error) {
    console.error('Error in daily painting cron job:', error);
    return NextResponse.json({
      error: 'Failed to generate daily painting',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
