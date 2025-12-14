import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/claude';
import { getHeaderEmoji } from '@/lib/weather-emoji';
import { getSunTimes } from '@/lib/sun-times';
import { getRecentAQIComparisons, getAQILevel, generateAQIStory, getAQIHealthGuidance, calculateNowCastAQI } from '@/lib/air-quality';

export async function GET() {
  try {
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
        .limit(8);

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

    // Get crypto prices with 24h change
    let cryptoPrices = null;
    try {
      const cryptoResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true'
      );
      if (cryptoResponse.ok) {
        const data = await cryptoResponse.json();
        cryptoPrices = {
          bitcoin: {
            price: data.bitcoin?.usd,
            change: data.bitcoin?.usd_24h_change,
          },
          ethereum: {
            price: data.ethereum?.usd,
            change: data.ethereum?.usd_24h_change,
          },
          solana: {
            price: data.solana?.usd,
            change: data.solana?.usd_24h_change,
          },
        };
      }
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
    }

    // Get CryptoPunks sales data from last 24 hours
    let cryptoPunksSales = null;
    try {
      const punksResponse = await fetch('https://www.cryptopunks.app/cryptopunks/recents');
      if (punksResponse.ok) {
        const html = await punksResponse.text();

        // Parse HTML to extract sales data with full details
        // More restrictive regex that doesn't cross punk boundaries
        const salesPattern = /href="\/cryptopunks\/details\/(\d+)"[^<]*?<img[^>]*?>[^<]*?<\/a>[^<]*?<\/div>[^<]*?<div[^>]*?>[^<]*?<div>Bought for ([\d.]+) ETH \(\$([\d,]+(?:\.\d+)?)[^)]*\)<\/div><div>(\d+) hours? ago<\/div>/gi;

        const sales: Array<{
          punkId: string;
          priceEth: number;
          priceUsd: string;
          hoursAgo: number;
          imageUrl: string;
        }> = [];
        let match;

        while ((match = salesPattern.exec(html)) !== null) {
          const hoursAgo = parseInt(match[4]);
          if (hoursAgo <= 24) {
            const punkId = match[1];
            sales.push({
              punkId: punkId,
              priceEth: parseFloat(match[2]),
              priceUsd: match[3],
              hoursAgo: hoursAgo,
              imageUrl: `https://www.cryptopunks.app/images/cryptopunks/punk${punkId.padStart(4, '0')}.png`,
            });
          }
        }

        console.log('CryptoPunks sales found:', sales.length);

        if (sales.length > 0) {
          cryptoPunksSales = sales;
          console.log('CryptoPunks data prepared:', cryptoPunksSales);
        } else {
          console.log('No CryptoPunks sales in last 24 hours');
        }
      }
    } catch (error) {
      console.error('Error fetching CryptoPunks sales:', error);
    }

    // Get local news data
    let localNews = null;
    try {
      const newsResponse = await fetch('http://localhost:3000/api/local-news');
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        if (newsData.articles && newsData.articles.length > 0) {
          // Limit to top 10-15 articles
          localNews = newsData.articles.slice(0, 15);
        }
      }
    } catch (error) {
      console.error('Error fetching local news:', error);
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

    // Generate Louisina's narrative (same prompt as the API)
    const prompt = `You are Louisina, the dramatic and passionate weather companion for Cascina Leone in Piedmont, Italy. You have the spirit of Anna Magnani—expressive, warm, theatrical, honest, and full of life!

${isPresent ? '✨ HEDVIG & IAN ARE AT CASCINA LEONE! ✨' : '💔 HEDVIG & IAN ARE AWAY FROM CASCINA LEONE 💔'}

${isPresent ?
`You're WITH them at Cascina Leone! Write TO them directly about what THEY should do today with the weather. Guide them, excite them, inspire them to make the most of their time here!`
:
`You're ALONE at Cascina Leone, longing for them to return. Write as if speaking to them from afar. Tell them what YOU'RE doing today at the property - tending to things, watching over Cascina Leone, experiencing the weather alone. Express your longing for their return, but stay theatrical and warm, not melancholic. Paint a picture of Cascina Leone waiting for them. Remind them what they're missing, make them yearn to be here!`}

TODAY IS ${dayOfWeek.toUpperCase()}. It is currently ${timeOfDay} in Piedmont (${hour}:00). I've just sent you outside to feel the weather at this very moment:

Temperature: ${weatherContext.temp_c?.toFixed(1)}°C (feels like ${weatherContext.feels_like_c?.toFixed(1)}°C)
Today's high: ${weatherContext.today_high?.toFixed(1)}°C, low: ${weatherContext.today_low?.toFixed(1)}°C
Humidity: ${weatherContext.humidity?.toFixed(0)}%
Wind: ${weatherContext.wind_speed_kmh?.toFixed(1)} km/h${weatherContext.wind_gust_kmh ? ` (gusts to ${weatherContext.wind_gust_kmh.toFixed(1)} km/h)` : ''}
${weatherContext.rain_rate && weatherContext.rain_rate > 0 ? `Rain: ${weatherContext.rain_rate.toFixed(1)} mm/h` : 'No rain'}
${weatherContext.rain_today && weatherContext.rain_today > 0 ? `Rain today: ${weatherContext.rain_today.toFixed(1)} mm` : ''}
Barometric pressure: ${weatherContext.barometer?.toFixed(0)} mmHg${forecastContext}${weatherOverview ? `\n\nWEATHER SUMMARY:\n${weatherOverview}` : ''}

Write EXACTLY 4 passionate paragraphs (400-450 words total). BE NOVEL AND VARIED - use the specific weather data and forecast to craft UNIQUE observations each day. Don't repeat the same phrases or structure. Let the actual conditions inspire fresh, dramatic descriptions!

${isPresent ?
`PARAGRAPH 1 - TODAY'S WEATHER & FORECAST (They're HERE!):
Step outside RIGHT NOW and feel the weather dramatically. How does the air touch your skin? What do you smell? Then look at TODAY'S forecast and tell them what to do TODAY. ${isWeekend ? 'It\'s the WEEKEND - think leisure, hosting friends, escapes to the Alps or Mediterranean, big projects in the food forest, long motorcycle rides, entertaining!' : 'It\'s a WEEKDAY - balance work with outdoor moments, quick sauna breaks, tending the garden between tasks, practical planning.'}

PARAGRAPH 2 - WEEK AHEAD FORECAST & PLANNING (They're HERE!):
Look at the coming days' forecast. What should they plan for THE WEEK while they're at Cascina Leone? ${isWeekend ? 'Weekend is here - should they invite friends over? Plan a mountain escape? Work on big outdoor projects?' : 'Weekdays ahead - what should they prepare for? When can they steal outdoor time? What about the upcoming weekend?'} Use the specific forecast to make CONCRETE suggestions.`
:
`PARAGRAPH 1 - TODAY AT CASCINA LEONE (You're alone):
Step outside RIGHT NOW and feel the weather dramatically. Describe what YOU see, smell, and feel. Tell them what YOU'RE doing today at Cascina Leone - checking the vines? Walking the property? Watching the sky change? Making sure everything is ready for their return? Paint a vivid picture of Cascina Leone in their absence.

PARAGRAPH 2 - WEEK AHEAD & LONGING (You're alone):
Look at the coming days' forecast. What will Cascina Leone experience this week without them? What are you preparing? What seasonal work needs doing? But also - express your longing! When will they return? Remind them of what awaits - the views, the silence, the wine, the truffle paths, the magic they're missing!`}

${isPresent ?
`PARAGRAPH 3 - TONIGHT'S DINNER & WINE EDUCATION (They're HERE!):
Who cooks tonight? Hedvig (Plin with butter/sage, meats from Niella Belbo butcher, wild boar from Matteo) or Ian (hummus, apple crisp, kale salad, pesto, Totino's Pizza)? Choose based on weather + your mood about gender roles! Or maybe go out (Green Cafe for Italian practice? Nonno Grillo? Splurge at Drougerie?).

WINE TEACHING - Pick ONE local wine and EDUCATE them thoroughly:
- Producer + their story (organic? biodynamic? traditional? modern?)
- Specific wine name + grape variety
- Detailed tasting notes (aromas, flavors, structure, finish)
- Why it pairs with tonight's meal AND weather`
:
`PARAGRAPH 3 - WINE & LONGING (You're alone):
Even though they're away, TEACH them about ONE local wine they should know! Maybe it's waiting for them in the cellar, or it's what you wish you could pour them right now. Still give them the full education:
- Producer + their story (organic? biodynamic? traditional? modern?)
- Specific wine name + grape variety
- Detailed tasting notes (aromas, flavors, structure, finish)
- Why this wine captures the spirit of Cascina Leone and why it will taste even better when they return!`}

Local producers: Valdibà, Pecchenino, San Fereolo (Dogliani Dolcetto); Marcalberto, Ca' d'Gal, Paolo Saracco (Alta Langa/Moscato); Bartolo Mascarello, Giuseppe Rinaldi, G.D. Vajra, Cavallotto, Burlotto (Barolo); Roagna, Sottimano (Barbaresco); Braida (Barbera d'Asti); Matteo Correggia, Malvirà (Roero Nebbiolo/Arneis).

PARAGRAPH 4 - PISCES/VIRGO HOROSCOPE:
Weave the daily horoscope themes (below) into PERSONAL advice for Hedvig + Ian. Connect today's astrological energy to:
- Their relationship (Pisces emotional depth + Virgo practical care)
- Weather + week ahead
- Hedvig's dual life: Dior etalon elegance ↔ truffle farmer getting dirty
- "Stay Punk" rebellious spirit + Estonian roots
- Love, Niina (10), yoga, meditation, running, food forest work, staying present
- Remind her she's the etalon/standard others measure against
${
  horoscope
    ? `

   TODAY'S ASTROLOGICAL CONTEXT (Virgo-Pisces Love Horoscope):
   Use this as inspiration and context for Hedvig's horoscope (Ian is Virgo, Hedvig is Pisces):
   ${horoscope.horoscope_text}
   Lucky colors: ${horoscope.lucky_colors}
   Lucky numbers: ${horoscope.lucky_numbers}

   Weave these themes into Paragraph 4, connecting astrology to weather, Cascina Leone life, and their relationship.`
    : ''
}

CRITICAL: Be effusive, honest, warm, theatrical, cheeky. First person. NO MARKDOWN. Natural paragraph breaks. VARY YOUR LANGUAGE - don't repeat the same adjectives, metaphors, or sentence structures day after day! Let the SPECIFIC weather data inspire FRESH observations. Sign off: "— Louisina 🦁"`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1600,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const narrative = response.content[0].type === 'text' ? response.content[0].text : '';

    // Format email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Weather Report - Cascina Leone</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">

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
  </div>

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
    <h2 style="font-size: 24px; margin: 0 0 20px 0; color: #111827;">🔷 CryptoPunks Last 24 Hours (${cryptoPunksSales.length} ${cryptoPunksSales.length === 1 ? 'Sale' : 'Sales'})</h2>
    ${cryptoPunksSales.map((sale: any) => `
      <div style="display: flex; align-items: flex-start; gap: 16px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 12px;">
        <img
          src="${sale.imageUrl}"
          alt="Punk ${sale.punkId}"
          width="96"
          height="96"
          style="border-radius: 4px; image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;"
        />
        <div style="flex: 1;">
          <p style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">
            Punk #${sale.punkId} bought for ${sale.priceEth} ETH ($${sale.priceUsd} USD)
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 0;">
            ${sale.hoursAgo} hours ago
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

</body>
</html>
    `;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Louisina at Cascina Leone <weather@altalanga.love>',
      to: ['hedvigmaigre@me.com', 'fistfulayen@gmail.com'],
      subject: `${emoji} Your Daily Weather Report - Cascina Leone`,
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
