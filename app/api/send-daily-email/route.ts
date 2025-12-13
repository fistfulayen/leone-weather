import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/claude';
import { getHeaderEmoji } from '@/lib/weather-emoji';
import { getSunTimes } from '@/lib/sun-times';

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

    // Get next 3 days forecast for context
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
        forecastContext = '\n\nTHE NEXT FEW DAYS:\n' + forecasts.slice(1, 4).map((f: any, i: number) => {
          const date = new Date(f.forecast_date);
          const dayName = i === 0 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'long' });
          return `${dayName}: ${f.weather_description}, ${Math.round(f.temp_min)}-${Math.round(f.temp_max)}°C${f.pop > 0.3 ? `, ${Math.round(f.pop * 100)}% chance of ${f.rain_mm > 0 ? 'rain' : 'precipitation'}` : ''}${f.snow_mm > 5 ? ` (${Math.round(f.snow_mm)}mm snow!)` : ''}`;
        }).join('\n');
      }
    }

    // Get day of week
    const dayOfWeek = italyTime.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Europe/Rome' });
    const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

    // Generate Louisina's narrative (same prompt as the API)
    const prompt = `You are Louisina, the dramatic and passionate weather companion for Cascina Leone in Piedmont, Italy. You have the spirit of Anna Magnani—expressive, warm, theatrical, honest, and full of life!

TODAY IS ${dayOfWeek.toUpperCase()}. It is currently ${timeOfDay} in Piedmont (${hour}:00). I've just sent you outside to feel the weather at this very moment:

Temperature: ${weatherContext.temp_c?.toFixed(1)}°C (feels like ${weatherContext.feels_like_c?.toFixed(1)}°C)
Today's high: ${weatherContext.today_high?.toFixed(1)}°C, low: ${weatherContext.today_low?.toFixed(1)}°C
Humidity: ${weatherContext.humidity?.toFixed(0)}%
Wind: ${weatherContext.wind_speed_kmh?.toFixed(1)} km/h${weatherContext.wind_gust_kmh ? ` (gusts to ${weatherContext.wind_gust_kmh.toFixed(1)} km/h)` : ''}
${weatherContext.rain_rate && weatherContext.rain_rate > 0 ? `Rain: ${weatherContext.rain_rate.toFixed(1)} mm/h` : 'No rain'}
${weatherContext.rain_today && weatherContext.rain_today > 0 ? `Rain today: ${weatherContext.rain_today.toFixed(1)} mm` : ''}
Barometric pressure: ${weatherContext.barometer?.toFixed(0)} mmHg${forecastContext}${weatherOverview ? `\n\nWEATHER SUMMARY:\n${weatherOverview}` : ''}

Write EXACTLY 4 passionate paragraphs (400-450 words total). BE NOVEL AND VARIED - use the specific weather data and forecast to craft UNIQUE observations each day. Don't repeat the same phrases or structure. Let the actual conditions inspire fresh, dramatic descriptions!

PARAGRAPH 1 - TODAY'S WEATHER & FORECAST:
Step outside RIGHT NOW and feel the weather dramatically. How does the air touch your skin? What do you smell? Then look at TODAY'S forecast and tell them what to do TODAY. ${isWeekend ? 'It\'s the WEEKEND - think leisure, hosting friends, escapes to the Alps or Mediterranean, big projects in the food forest, long motorcycle rides, entertaining!' : 'It\'s a WEEKDAY - balance work with outdoor moments, quick sauna breaks, tending the garden between tasks, practical planning.'}

PARAGRAPH 2 - WEEK AHEAD FORECAST & PLANNING:
Look at the coming days' forecast. What should they plan for THE WEEK? ${isWeekend ? 'Weekend is here - should they invite friends over? Plan a mountain escape? Work on big outdoor projects?' : 'Weekdays ahead - what should they prepare for? When can they steal outdoor time? What about the upcoming weekend?'} Use the specific forecast to make CONCRETE suggestions.

PARAGRAPH 3 - TONIGHT'S DINNER & WINE EDUCATION:
Who cooks tonight? Hedvig (Plin with butter/sage, meats from Niella Belbo butcher, wild boar from Matteo) or Ian (hummus, apple crisp, kale salad, pesto, Totino's Pizza)? Choose based on weather + your mood about gender roles! Or maybe go out (Green Cafe for Italian practice? Nonno Grillo? Splurge at Drougerie?).

WINE TEACHING - Pick ONE local wine and EDUCATE them thoroughly:
- Producer + their story (organic? biodynamic? traditional? modern?)
- Specific wine name + grape variety
- Detailed tasting notes (aromas, flavors, structure, finish)
- Why it pairs with tonight's meal AND weather

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
        <strong>Wind:</strong> ${current.wind_speed_kmh?.toFixed(1)} km/h
        ${current.wind_gust_kmh ? ` (gusts to ${current.wind_gust_kmh.toFixed(1)} km/h)` : ''}
      </p>
      <p style="margin: 8px 0; color: #4b5563;">
        <strong>Rain today:</strong> ${current.rain_day_mm?.toFixed(1)} mm
      </p>
      <p style="margin: 8px 0; color: #4b5563;">
        <strong>Pressure:</strong> ${current.barometer_mmhg?.toFixed(0)} mmHg
      </p>
    </div>
  </div>

  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <h2 style="font-size: 20px; margin: 0 0 16px 0; color: #92400e;">🦁 Louisina's Weather Report</h2>
    <div style="white-space: pre-line; color: #78350f; line-height: 1.8;">
${narrative}
    </div>
  </div>

${forecastDays.length > 0 ? `
  <div style="background: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
    <h2 style="font-size: 24px; margin: 0 0 20px 0; color: #111827;">7-Day Forecast</h2>
    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
      ${forecastDays.map((day, index) => {
        const date = new Date(day.forecast_date);
        const dayName = index === 0
          ? 'Today'
          : date.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `
      <div style="text-align: center; padding: 12px; background: #f9fafb; border-radius: 8px;">
        <p style="font-weight: 600; color: #111827; margin: 0 0 4px 0; font-size: 14px;">${dayName}</p>
        <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0;">${monthDay}</p>
        <img src="https://openweathermap.org/img/wn/${day.weather_icon}@2x.png" alt="${day.weather_description}" style="width: 48px; height: 48px; display: block; margin: 0 auto;" />
        <p style="font-size: 11px; color: #6b7280; margin: 8px 0; text-transform: capitalize;">${day.weather_description}</p>
        <div style="margin-top: 8px;">
          <span style="font-size: 18px; font-weight: bold; color: #111827;">${Math.round(day.temp_max)}°</span>
          <span style="font-size: 13px; color: #9ca3af; margin-left: 4px;">${Math.round(day.temp_min)}°</span>
        </div>
        ${(day.rain_mm > 0 || day.snow_mm > 0 || day.pop > 0.3) ? `
        <p style="font-size: 11px; color: #3b82f6; margin: 6px 0 0 0;">
          💧 ${Math.round(day.pop * 100)}%${day.rain_mm > 0 ? ` (${day.rain_mm.toFixed(1)}mm)` : ''}${day.snow_mm > 0 ? ` ❄️ ${day.snow_mm.toFixed(1)}mm` : ''}
        </p>
        ` : ''}
      </div>
        `;
      }).join('')}
    </div>
  </div>
` : ''}

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 14px; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0;">Cascina Leone Weather Station · Niella Belbo, Piedmont</p>
    <p style="margin: 8px 0 0 0;">
      <a href="https://leone-weather.vercel.app" style="color: #3b82f6; text-decoration: none;">View Full Dashboard</a>
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
