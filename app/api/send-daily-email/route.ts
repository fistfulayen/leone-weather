import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/claude';
import { getHeaderEmoji } from '@/lib/weather-emoji';
import { getSunTimes } from '@/lib/sun-times';
import { getRecentAQIComparisons, getAQILevel, generateAQIStory, getAQIHealthGuidance, calculateNowCastAQI } from '@/lib/air-quality';

// Helper function to determine current season
function getSeason(date: Date): string {
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export async function GET(request: Request) {
  try {
    // Check if this is a preview request (for website display)
    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get('preview') === 'true';

    // Test mode for incrementally adding content to diagnose Apple Mail issues
    // Options: 'basic', 'icons', 'crypto', 'nfts', 'news', 'painting', 'full' (default)
    const testMode = searchParams.get('mode') || 'full';

    // Get current reading
    const { data: readings } = await supabaseAdmin
      .from('readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1);

    const current = readings?.[0];
    if (!current) {
      return NextResponse.json({ error: 'No data' }, { status: 404 });
    }

    // Get today's high/low
    const today = new Date().toISOString().split('T')[0];
    const { data: todayReadings } = await supabaseAdmin
      .from('readings')
      .select('temp_c')
      .gte('timestamp', `${today}T00:00:00`)
      .order('temp_c', { ascending: false });

    const todayHigh = todayReadings?.[0]?.temp_c;
    const todayLow = todayReadings?.[todayReadings.length - 1]?.temp_c;

    // Get sun times for emoji
    const sunTimes = getSunTimes();
    const emoji = getHeaderEmoji(current, sunTimes.sunrise, sunTimes.sunset);

    // Get current time in Italy timezone to determine time of day
    const now = new Date();
    const italyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
    const hour = italyTime.getHours();

    let timeOfDay = '';
    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }

    const weatherContext = {
      temp_c: current.temp_c,
      feels_like_c: current.wind_chill_c || current.heat_index_c || current.temp_c,
      humidity: current.humidity,
      wind_speed_kmh: current.wind_speed_kmh,
      wind_gust_kmh: current.wind_gust_kmh,
      rain_rate: current.rain_rate_mmh,
      rain_today: current.rain_day_mm,
      barometer: current.barometer_mmhg,
      today_high: todayHigh,
      today_low: todayLow,
    };

    // Get today's horoscope for context
    const todayDate = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Europe/Rome',
    });
    const { data: horoscope } = await supabaseAdmin
      .from('daily_horoscopes')
      .select('*')
      .eq('date', todayDate)
      .single();

    // Get weather overview for additional context
    const { data: latestOverview } = await supabaseAdmin
      .from('weather_overviews')
      .select('overview_text')
      .eq('overview_date', todayDate)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    const weatherOverview = latestOverview?.overview_text || '';

    // Get full 7-day forecast for context
    const { data: latestForecast } = await supabaseAdmin
      .from('weather_forecasts')
      .select('fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    let forecastContext = '';
    let forecastDays: any[] = [];
    if (latestForecast) {
      const { data: forecasts } = await supabaseAdmin
        .from('weather_forecasts')
        .select('*')
        .eq('fetched_at', latestForecast.fetched_at)
        .gte('forecast_date', todayDate)
        .order('forecast_date', { ascending: true })
        .limit(7);

      if (forecasts && forecasts.length > 0) {
        forecastDays = forecasts;
        forecastContext = '\n\nTHE FULL WEEK AHEAD:\n' + forecasts.slice(1).map((f: any, i: number) => {
          const date = new Date(f.forecast_date);
          const dayName = i === 0 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' });
          return `${dayName}: ${f.weather_description}, ${Math.round(f.temp_min)}-${Math.round(f.temp_max)}°C${f.pop > 0.3 ? `, ${Math.round(f.pop * 100)}% chance of ${f.rain_mm > 0 ? 'rain' : 'precipitation'}` : ''}${f.snow_mm > 0 ? ` (${Math.round(f.snow_mm)}mm snow!)` : ''}`;
        }).join('\n');
      }
    }

    // Get day of week
    const dayOfWeek = italyTime.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Europe/Rome' });
    const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

    // Check if Hedvig & Ian are present at Cascina Leone today
    const { data: presenceCheck, error: presenceError } = await supabaseAdmin
      .rpc('is_present_on_date', { check_date: todayDate });

    console.log('=== PRESENCE CHECK ===');
    console.log('Date:', todayDate);
    console.log('RPC result:', presenceCheck);
    console.log('RPC error:', presenceError);

    const isPresent = presenceCheck === true;
    console.log('Is present?', isPresent);
    console.log('======================');

    // Get crypto prices from database (fetched by cron job)
    let cryptoPrices = null;
    const includeCrypto = ['crypto', 'nfts', 'news', 'painting', 'full'].includes(testMode);
    if (includeCrypto) {
    try {
      const { data: latestCrypto } = await supabaseAdmin
        .from('crypto_prices')
        .select('*')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single();

      if (latestCrypto) {
        cryptoPrices = {
          bitcoin: {
            price: latestCrypto.bitcoin_price,
            change: latestCrypto.bitcoin_change_24h,
          },
          ethereum: {
            price: latestCrypto.ethereum_price,
            change: latestCrypto.ethereum_change_24h,
          },
          solana: {
            price: latestCrypto.solana_price,
            change: latestCrypto.solana_change_24h,
          },
        };
        console.log('Crypto prices loaded from database');
      }
    } catch (error) {
      console.error('Error loading crypto prices from database:', error);
    }
    }

    // Get NFT sales from database (fetched by cron job)
    let cryptoPunksSales = null;
    const includeNFTs = ['nfts', 'news', 'painting', 'full'].includes(testMode);
    if (includeNFTs) {
    try {
      const { data: nftSales } = await supabaseAdmin
        .from('nft_sales')
        .select('*')
        .order('sale_timestamp', { ascending: false });

      if (nftSales && nftSales.length > 0) {
        cryptoPunksSales = nftSales.map((sale: any) => ({
          tokenName: sale.token_name,
          collectionName: sale.collection_name,
          collectionArtist: sale.collection_artist,
          priceEth: sale.price_eth,
          priceUsd: sale.price_usd,
          imageUrl: sale.image_url,
          platform: sale.platform,
          timestamp: sale.sale_timestamp,
          punkId: sale.token_id,
          hoursAgo: sale.hours_ago,
        }));
        console.log('NFT sales loaded from database:', cryptoPunksSales.length);
      }
    } catch (error) {
      console.error('Error loading NFT sales from database:', error);
    }
    }

    // Get local news from database (fetched by cron job)
    let localNews = null;
    const includeNews = ['news', 'painting', 'full'].includes(testMode);
    if (includeNews) {
    try {
      const { data: newsArticles } = await supabaseAdmin
        .from('local_news_articles')
        .select('*')
        .order('pub_date', { ascending: false })
        .limit(15);

      if (newsArticles && newsArticles.length > 0) {
        localNews = newsArticles.map((article: any) => ({
          title: article.title,
          link: article.link,
          pubDate: article.pub_date,
          source: article.source,
          villages: article.villages,
        }));
        console.log('Local news loaded from database:', localNews.length);
      }
    } catch (error) {
      console.error('Error loading local news from database:', error);
    }
    }

    // Get city weather from database (fetched by cron job)
    let cityWeather = null;
    const includeIcons = ['icons', 'crypto', 'news', 'painting', 'full'].includes(testMode);
    if (includeIcons) {
    try {
      const { data: cities } = await supabaseAdmin
        .from('city_weather')
        .select('*')
        .order('city_name');

      if (cities && cities.length > 0) {
        cityWeather = cities;
        console.log('City weather loaded from database:', cities.length);
      }
    } catch (error) {
      console.error('Error loading city weather from database:', error);
    }
    }

    // Get ski reports from database (fetched by cron job)
    // TEMPORARILY DISABLED - will re-enable with MyWeather2 API
    // let skiReports = null;
    // try {
    //   const { data: reports } = await supabaseAdmin
    //     .from('ski_reports')
    //     .select('*')
    //     .order('resort_name');

    //   if (reports && reports.length > 0) {
    //     skiReports = reports;
    //     console.log('Ski reports loaded from database:', reports.length);
    //   }
    // } catch (error) {
    //   console.error('Error loading ski reports from database:', error);
    // }

    // Get daily painting from database (pre-generated by cron job)
    let dailyPainting = null;
    const includePainting = ['painting', 'full'].includes(testMode);
    if (includePainting) {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      const { data: paintingData, error } = await supabaseAdmin
        .from('daily_paintings')
        .select('*')
        .eq('painting_date', today)
        .single();

      if (error) {
        console.error('Error fetching daily painting from database:', error);
      } else if (paintingData) {
        dailyPainting = {
          painter: {
            name: paintingData.painter_name,
            period: paintingData.painter_period,
            style: paintingData.painter_style,
          },
          sourceImage: paintingData.source_image,
          imageUrl: paintingData.image_url,
          prompt: paintingData.dalle_prompt,
          revisedPrompt: paintingData.revised_prompt,
        };
        console.log(`Daily painting loaded from database: ${paintingData.painter_name}`);
      } else {
        console.log('No daily painting found in database for today');
      }
    } catch (error) {
      console.error('Error fetching daily painting:', error);
    }
    }

    // Get air quality data
    let airQualityData = null;
    try {
      const { data: aqiReadings } = await supabaseAdmin
        .from('readings')
        .select('aqi, pm25_ugm3, pm10_ugm3, timestamp')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (aqiReadings && aqiReadings[0] && aqiReadings[0].aqi !== null) {
        const aqiCurrent = aqiReadings[0];

        // Get last 12 hours for NowCast
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
        const { data: historicalReadings } = await supabaseAdmin
          .from('readings')
          .select('aqi, timestamp')
          .gte('timestamp', twelveHoursAgo)
          .order('timestamp', { ascending: false });

        const hourlyAQI = historicalReadings
          ?.filter(r => r.aqi !== null)
          .map(r => r.aqi) || [];
        const nowcastAQI = calculateNowCastAQI(hourlyAQI);

        const comparisons = await getRecentAQIComparisons();
        const displayAQI = nowcastAQI ?? aqiCurrent.aqi;
        const level = getAQILevel(displayAQI);
        const story = generateAQIStory(displayAQI, comparisons);
        const healthGuidance = getAQIHealthGuidance(displayAQI);

        airQualityData = {
          aqi: aqiCurrent.aqi,
          nowcastAQI,
          pm25: aqiCurrent.pm25_ugm3,
          pm10: aqiCurrent.pm10_ugm3,
          level: level.level,
          color: level.color,
          story,
          healthGuidance,
        };
      }
    } catch (error) {
      console.error('Error fetching air quality for email:', error);
    }

    // Get cron status data
    let cronStatus = null;
    try {
      const { data: latestReading } = await supabaseAdmin
        .from('readings')
        .select('timestamp')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      const { data: latestForecastStatus } = await supabaseAdmin
        .from('weather_forecasts')
        .select('fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single();

      const { data: latestOverviewStatus } = await supabaseAdmin
        .from('weather_overviews')
        .select('fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single();

      const { data: latestHoroscopeStatus } = await supabaseAdmin
        .from('daily_horoscopes')
        .select('fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single();

      const { data: latestAQIStatus } = await supabaseAdmin
        .from('aqi_comparisons')
        .select('fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single();

      cronStatus = {
        weatherlink: latestReading?.timestamp,
        forecast: latestForecastStatus?.fetched_at,
        overview: latestOverviewStatus?.fetched_at,
        horoscope: latestHoroscopeStatus?.fetched_at,
        aqi: latestAQIStatus?.fetched_at,
      };
    } catch (error) {
      console.error('Error fetching cron status for email:', error);
    }

    // Get today's narrative from database (pre-generated by cron job)
    let narrative = '';
    try {
      const { data: narrativeData } = await supabaseAdmin
        .from('daily_narratives')
        .select('narrative_text')
        .eq('narrative_date', todayDate)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (narrativeData) {
        narrative = narrativeData.narrative_text;
        console.log('Daily narrative loaded from database');
      } else {
        console.log('No narrative found in database for today');
        narrative = 'Ciao! Louisina is still preparing today\'s weather story. Check back soon! — Louisina 🦁';
      }
    } catch (error) {
      console.error('Error loading narrative from database:', error);
      narrative = 'Ciao! Louisina is taking a little break. The weather is lovely as always at Cascina Leone! — Louisina 🦁';
    }

    // Calculate days until Alta Langa Love (July 16, 2027)
    const altaLangaLove = new Date('2027-07-16T00:00:00+02:00'); // CET timezone
    const todayMidnight = new Date(italyTime.toLocaleDateString('en-US', { timeZone: 'Europe/Rome' }));
    const daysUntilALL = Math.ceil((altaLangaLove.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

    // Convert number to emoji digits (vintage counter style)
    const numberToEmoji = (num: number): string => {
      const digitEmojis = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
      return num.toString().split('').map(digit => digitEmojis[parseInt(digit)]).join(' ');
    };

    const countdownEmoji = numberToEmoji(daysUntilALL);

    // Format email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Daily Weather Report - Cascina Leone</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff;">
          <tr>
            <td style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937;">

  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="font-size: 32px; margin: 0; color: #111827;">${emoji} Cascina Leone</h1>
    <p style="color: #6b7280; margin: 10px 0;">
      ${new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Rome',
      })}
    </p>
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 16px 24px; margin: 20px auto; max-width: 400px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <p style="color: #ffffff; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
        Days Until Alta Langa Love
      </p>
      <p style="color: #ffffff; font-size: 36px; margin: 0; letter-spacing: 4px; font-weight: bold;">
        ${countdownEmoji}
      </p>
    </div>
  </div>

${dailyPainting && dailyPainting.imageUrl ? `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
    <tr>
      <td>
        <div style="background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
          <h2 style="font-size: 24px; margin: 0 0 16px 0; color: #111827; font-weight: 600;">🎨 Today's Vista from Cascina Leone</h2>
          <p style="color: #6b7280; margin: 0 0 20px 0; font-style: italic; line-height: 1.5;">
            In the style of <strong>${dailyPainting.painter.name}</strong> (${dailyPainting.painter.period})
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <img
                  src="${dailyPainting.imageUrl}"
                  alt="Daily painting of Cascina Leone in the style of ${dailyPainting.painter.name}"
                  width="552"
                  style="display: block; max-width: 100%; height: auto; border-radius: 8px; border: none;"
                />
              </td>
            </tr>
          </table>
          <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0; text-align: center; font-style: italic; line-height: 1.4;">
            Source image: ${dailyPainting.sourceImage}
          </p>
        </div>
      </td>
    </tr>
  </table>
` : ''}

  <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <h2 style="font-size: 24px; margin: 0 0 16px 0; color: #111827;">Current Weather</h2>

    <div style="display: flex; align-items: baseline; margin-bottom: 12px;">
      <span style="font-size: 48px; font-weight: bold; color: #111827;">${current.temp_c?.toFixed(1)}°C</span>
    </div>

    <p style="color: #4b5563; margin: 8px 0;">
      Feels like ${(current.wind_chill_c || current.heat_index_c || current.temp_c)?.toFixed(1)}°C ·
      Humidity ${current.humidity}%
    </p>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px;">
      <div>
        <p style="color: #6b7280; margin: 0; font-size: 14px;">Today's High</p>
        <p style="font-size: 24px; font-weight: bold; margin: 4px 0; color: #111827;">
          ${todayHigh?.toFixed(1)}°C
        </p>
      </div>
      <div>
        <p style="color: #6b7280; margin: 0; font-size: 14px;">Today's Low</p>
        <p style="font-size: 24px; font-weight: bold; margin: 4px 0; color: #111827;">
          ${todayLow?.toFixed(1)}°C
        </p>
      </div>
    </div>

    ${current.indoor_temp_c !== undefined && current.indoor_humidity !== undefined ? `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
      <div>
        <p style="color: #6b7280; margin: 0; font-size: 14px;">Inside Temp</p>
        <p style="font-size: 24px; font-weight: bold; margin: 4px 0; color: #111827;">
          ${current.indoor_temp_c.toFixed(1)}°C
        </p>
      </div>
      <div>
        <p style="color: #6b7280; margin: 0; font-size: 14px;">Inside Humidity</p>
        <p style="font-size: 24px; font-weight: bold; margin: 4px 0; color: #111827;">
          ${current.indoor_humidity}%
        </p>
      </div>
    </div>
    ` : ''}

    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 8px 0; color: #4b5563;">
        <strong>🌬️ Wind:</strong> ${current.wind_speed_kmh?.toFixed(1)} km/h
        ${current.wind_gust_kmh ? ` (gusts to ${current.wind_gust_kmh.toFixed(1)} km/h)` : ''}
      </p>
      <p style="margin: 8px 0; color: #4b5563;">
        <strong>💧 Rain today:</strong> ${current.rain_day_mm?.toFixed(1)} mm
      </p>
      <p style="margin: 8px 0; color: #4b5563;">
        <strong>💪 Pressure:</strong> ${current.barometer_mmhg?.toFixed(0)} mmHg
      </p>
      ${cryptoPrices ? `
      <p style="margin: 8px 0; color: #4b5563;">
        <strong>₿ Bitcoin:</strong> <span style="color: ${cryptoPrices.bitcoin.change >= 0 ? '#10b981' : '#ef4444'}; font-weight: 600;">$${cryptoPrices.bitcoin.price?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span> <span style="font-size: 12px; color: ${cryptoPrices.bitcoin.change >= 0 ? '#10b981' : '#ef4444'};">(${cryptoPrices.bitcoin.change >= 0 ? '+' : ''}${cryptoPrices.bitcoin.change?.toFixed(2)}%)</span>
      </p>
      <p style="margin: 8px 0; color: #4b5563;">
        <strong>Ξ Ethereum:</strong> <span style="color: ${cryptoPrices.ethereum.change >= 0 ? '#10b981' : '#ef4444'}; font-weight: 600;">$${cryptoPrices.ethereum.price?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span> <span style="font-size: 12px; color: ${cryptoPrices.ethereum.change >= 0 ? '#10b981' : '#ef4444'};">(${cryptoPrices.ethereum.change >= 0 ? '+' : ''}${cryptoPrices.ethereum.change?.toFixed(2)}%)</span>
      </p>
      <p style="margin: 8px 0; color: #4b5563;">
        <strong>◎ Solana:</strong> <span style="color: ${cryptoPrices.solana.change >= 0 ? '#10b981' : '#ef4444'}; font-weight: 600;">$${cryptoPrices.solana.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> <span style="font-size: 12px; color: ${cryptoPrices.solana.change >= 0 ? '#10b981' : '#ef4444'};">(${cryptoPrices.solana.change >= 0 ? '+' : ''}${cryptoPrices.solana.change?.toFixed(2)}%)</span>
      </p>
      ` : ''}
      <p style="margin: 8px 0; color: #4b5563;">
        <strong>🌅 Sunrise:</strong> ${sunTimes.sunrise.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })} ·
        <strong>🌇 Sunset:</strong> ${sunTimes.sunset.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })}
      </p>
    </div>
  </div>

  ${cityWeather && cityWeather.length > 0 ? `
  <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <h3 style="font-size: 16px; margin: 0 0 12px 0; color: #6b7280; font-weight: 600;">🌍 Around the World</h3>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
      ${cityWeather.map((city: any) => {
        const flag = city.city_name === 'Portland' || city.city_name === 'New York' ? '🇺🇸' :
                     city.city_name === 'Paris' ? '🇫🇷' :
                     city.city_name === 'Tallinn' ? '🇪🇪' : '';
        return `
      <div style="text-align: center; background: #ffffff; border-radius: 6px; padding: 12px 8px; border: 1px solid #e5e7eb;">
        <div style="font-size: 12px; font-weight: 600; color: #111827; margin-bottom: 4px;">
          ${flag} ${city.city_name}
        </div>
        <img src="https://openweathermap.org/img/wn/${city.weather_icon}.png" alt="${city.weather_description}" style="width: 32px; height: 32px; display: block; margin: 0 auto 4px auto;" />
        <div style="font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 4px;">
          ${Math.round(city.current_temp)}°
        </div>
        <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">
          <span style="color: #ea580c; font-weight: 600;">${Math.round(city.temp_max)}°</span> / <span style="color: #0284c7; font-weight: 600;">${Math.round(city.temp_min)}°</span>
        </div>
        <div style="font-size: 10px; color: #9ca3af; text-transform: capitalize; line-height: 1.3;">
          ${city.weather_description}
        </div>
      </div>
        `;
      }).join('')}
    </div>
  </div>
  ` : ''}

  ${airQualityData ? `
  <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #86efac;">
    <h2 style="font-size: 24px; margin: 0 0 16px 0; color: #111827;">AIR QUALITY</h2>

    <div style="margin-bottom: 16px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background-color: ${airQualityData.color};"></span>
        <span style="font-size: 20px; font-weight: bold; color: #111827;">${airQualityData.level}</span>
      </div>

      ${airQualityData.nowcastAQI !== null && airQualityData.nowcastAQI !== undefined ? `
      <div style="margin-bottom: 8px;">
        <span style="font-size: 14px; color: #374151; font-weight: 500;">NowCast AQI: </span>
        <span style="font-size: 18px; font-weight: bold; color: #111827;">${airQualityData.nowcastAQI.toFixed(1)}</span>
      </div>
      ` : ''}

      <div style="margin-bottom: 8px;">
        <span style="font-size: 14px; color: #374151; font-weight: 500;">Current AQI: </span>
        <span style="font-size: 18px; font-weight: bold; color: #111827;">${airQualityData.aqi.toFixed(1)}</span>
      </div>

      <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
        Davis AirLink sensor · EU EEA European index
      </div>
    </div>

    <div style="font-size: 14px; color: #374151; line-height: 1.6; margin-bottom: 16px; white-space: pre-line;">
${airQualityData.story}
    </div>

    ${airQualityData.pm25 !== undefined && airQualityData.pm10 !== undefined ? `
    <div style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">
      PM2.5: ${airQualityData.pm25.toFixed(1)} µg/m³ · PM10: ${airQualityData.pm10.toFixed(1)} µg/m³
    </div>
    ` : ''}

    <div style="font-size: 14px; color: #4b5563; font-style: italic; border-top: 1px solid #d1fae5; padding-top: 12px;">
      ${airQualityData.healthGuidance}
    </div>
  </div>
  ` : ''}

  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <h2 style="font-size: 20px; margin: 0 0 16px 0; color: #92400e;">🦁 Louisina's Weather Report</h2>
    <div style="white-space: pre-line; color: #78350f; line-height: 1.8;">
${narrative}
    </div>
  </div>

${forecastDays.length > 0 ? `
  <div style="background: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
    <h2 style="font-size: 24px; margin: 0 0 20px 0; color: #111827;">7-Day Forecast</h2>
    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px;">
      ${forecastDays.map((day, index) => {
        const date = new Date(day.forecast_date);
        const dayName = index === 0
          ? 'Today'
          : date.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `
      <div style="text-align: center; padding: 16px 12px; background: #f9fafb; border-radius: 8px; border: 2px solid #e5e7eb;">
        <p style="font-weight: 700; color: #111827; margin: 0 0 2px 0; font-size: 14px;">${dayName}</p>
        <p style="font-size: 11px; color: #6b7280; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">${monthDay}</p>
        <img src="https://openweathermap.org/img/wn/${day.weather_icon}@2x.png" alt="${day.weather_description}" style="width: 48px; height: 48px; display: block; margin: 0 auto;" />
        <p style="font-size: 10px; color: #6b7280; margin: 8px 0 12px 0; text-transform: capitalize; min-height: 28px; line-height: 14px;">${day.weather_description}</p>
        <div style="margin: 12px 0; padding: 8px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
          <span style="font-size: 20px; font-weight: bold; color: #111827;">${Math.round(day.temp_max)}°</span>
          <span style="font-size: 14px; color: #9ca3af; margin-left: 6px;">${Math.round(day.temp_min)}°</span>
        </div>
        ${day.wind_speed ? `
        <p style="font-size: 10px; color: #6b7280; margin: 8px 0 0 0;">
          🌬️ ${Math.round(day.wind_speed * 3.6)} km/h
        </p>
        ` : ''}
        ${(day.rain_mm > 0 || day.snow_mm > 0 || day.pop > 0.3) ? `
        <p style="font-size: 11px; color: #3b82f6; margin: 8px 0 0 0; font-weight: 600;">
          💧 ${Math.round(day.pop * 100)}%${day.rain_mm > 0 ? `<br/>${day.rain_mm.toFixed(1)}mm` : ''}${day.snow_mm > 0 ? `<br/>❄️ ${day.snow_mm.toFixed(1)}mm` : ''}
        </p>
        ` : ''}
      </div>
        `;
      }).join('')}
    </div>
  </div>
` : ''}

${localNews && localNews.length > 0 ? `
  <div style="background: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
    <h2 style="font-size: 24px; margin: 0 0 20px 0; color: #111827;">📰 Alta Langa Local News (${localNews.length} ${localNews.length === 1 ? 'Article' : 'Articles'})</h2>
    ${localNews.map((article: any) => {
      const pubDate = new Date(article.pubDate);
      const now = new Date();
      const diffMs = now.getTime() - pubDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      let timeAgo = '';
      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else {
        timeAgo = pubDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Rome',
        });
      }

      const villagesFormatted = article.villages.map((v: string) => v.charAt(0).toUpperCase() + v.slice(1)).join(', ');

      return `
      <div style="padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 12px;">
        <a href="${article.link}" style="text-decoration: none; color: inherit; display: block;">
          <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px 0; line-height: 1.4;">
            ${article.title}
          </h3>
          <div style="font-size: 12px; color: #6b7280;">
            <span style="font-weight: 600;">${article.source}</span>
            <span style="margin: 0 6px;">•</span>
            <span>${timeAgo}</span>
            ${article.villages.length > 0 ? `
            <span style="margin: 0 6px;">•</span>
            <span style="color: #3b82f6; font-weight: 600;">${villagesFormatted}</span>
            ` : ''}
          </div>
        </a>
      </div>
      `;
    }).join('')}
  </div>
` : ''}

${cryptoPunksSales && cryptoPunksSales.length > 0 ? `
  <div style="background: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
    <h2 style="font-size: 24px; margin: 0 0 20px 0; color: #111827;">🎨 Notable NFT Sales (Last 24 Hours, ${cryptoPunksSales.length} ${cryptoPunksSales.length === 1 ? 'Sale' : 'Sales'} > 0.5 ETH)</h2>
    ${cryptoPunksSales.map((sale: any) => `
      <div style="display: flex; align-items: flex-start; gap: 16px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 12px;">
        <img
          src="${sale.imageUrl}"
          alt="${sale.tokenName}"
          width="96"
          height="96"
          style="border-radius: 4px; object-fit: cover;"
        />
        <div style="flex: 1;">
          <p style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 4px 0;">
            ${sale.tokenName}
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">
            ${sale.collectionName} by ${sale.collectionArtist}
          </p>
          <p style="font-size: 16px; font-weight: 500; color: #059669; margin: 0 0 4px 0;">
            ${sale.priceEth} ETH ($${sale.priceUsd} USD)
          </p>
          <p style="font-size: 14px; color: #9ca3af; margin: 0;">
            ${sale.hoursAgo} hours ago · ${sale.platform}
          </p>
        </div>
      </div>
    `).join('')}
  </div>
` : ''}

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0 0 16px 0; font-size: 14px;">
      <strong>Cascina Leone Weather Station</strong> · Località Novelli, Niella Belbo, Piedmont
    </p>
    ${cronStatus ? `
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-width: 500px; margin: 0 auto 16px auto; font-size: 11px; color: #6b7280;">
      <div style="padding: 8px; background: #f9fafb; border-radius: 4px;">
        <strong>WeatherLink</strong><br/>
        ${cronStatus.weatherlink ? new Date(cronStatus.weatherlink).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }) : 'N/A'}
      </div>
      <div style="padding: 8px; background: #f9fafb; border-radius: 4px;">
        <strong>Forecast</strong><br/>
        ${cronStatus.forecast ? new Date(cronStatus.forecast).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }) : 'N/A'}
      </div>
      <div style="padding: 8px; background: #f9fafb; border-radius: 4px;">
        <strong>Overview</strong><br/>
        ${cronStatus.overview ? new Date(cronStatus.overview).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }) : 'N/A'}
      </div>
      <div style="padding: 8px; background: #f9fafb; border-radius: 4px;">
        <strong>Horoscope</strong><br/>
        ${cronStatus.horoscope ? new Date(cronStatus.horoscope).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }) : 'N/A'}
      </div>
      <div style="padding: 8px; background: #f9fafb; border-radius: 4px;">
        <strong>AQI Data</strong><br/>
        ${cronStatus.aqi ? new Date(cronStatus.aqi).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }) : 'N/A'}
      </div>
      <div style="padding: 8px; background: #f9fafb; border-radius: 4px;">
        <strong>Email Sent</strong><br/>
        ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })}
      </div>
    </div>
    ` : ''}
    <p style="margin: 0;">
      <a href="https://weather.altalanga.love" style="color: #3b82f6; text-decoration: none;">View Full Dashboard</a>
    </p>
  </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // If preview mode, return HTML directly for website display
    if (isPreview) {
      return new Response(emailHtml, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Louisina <weather@altalanga.love>',
      to: ['hedvigmaigre@me.com', 'fistfulayen@gmail.com'],
      subject: `${emoji} Daily Weather - Cascina Leone`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: 'Daily weather email sent successfully',
    });
  } catch (error) {
    console.error('Error sending daily email:', error);
    return NextResponse.json(
      { error: 'Failed to send daily email' },
      { status: 500 }
    );
  }
}
