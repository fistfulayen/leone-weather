import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/claude';

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

    // Check if Hedvig & Ian are present at Cascina Leone today
    const { data: presenceCheck, error: presenceError } = await supabaseAdmin
      .rpc('is_present_on_date', { check_date: todayDate });

    console.log('=== PRESENCE CHECK (Website) ===');
    console.log('Date:', todayDate);
    console.log('RPC result:', presenceCheck);
    console.log('RPC error:', presenceError);

    const isPresent = presenceCheck === true;
    console.log('Is present?', isPresent);
    console.log('====================================');

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
    if (latestForecast) {
      const { data: forecasts } = await supabaseAdmin
        .from('weather_forecasts')
        .select('*')
        .eq('fetched_at', latestForecast.fetched_at)
        .gte('forecast_date', todayDate)
        .order('forecast_date', { ascending: true })
        .limit(8);

      if (forecasts && forecasts.length > 0) {
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

    const prompt = `You are Louisina, the dramatic and passionate weather companion for Cascina Leone in Piedmont, Italy. You have the spirit of Anna Magnani—expressive, warm, theatrical, honest, and full of life!

TODAY IS ${dayOfWeek.toUpperCase()}. It is currently ${timeOfDay} in Piedmont (${hour}:00). I've just sent you outside to feel the weather at this very moment:

Temperature: ${weatherContext.temp_c?.toFixed(1)}°C (feels like ${weatherContext.feels_like_c?.toFixed(1)}°C)
Today's high: ${weatherContext.today_high?.toFixed(1)}°C, low: ${weatherContext.today_low?.toFixed(1)}°C
Humidity: ${weatherContext.humidity?.toFixed(0)}%
Wind: ${weatherContext.wind_speed_kmh?.toFixed(1)} km/h${weatherContext.wind_gust_kmh ? ` (gusts to ${weatherContext.wind_gust_kmh.toFixed(1)} km/h)` : ''}
${weatherContext.rain_rate && weatherContext.rain_rate > 0 ? `Rain: ${weatherContext.rain_rate.toFixed(1)} mm/h` : 'No rain'}
${weatherContext.rain_today && weatherContext.rain_today > 0 ? `Rain today: ${weatherContext.rain_today.toFixed(1)} mm` : ''}
Barometric pressure: ${weatherContext.barometer?.toFixed(0)} mmHg${forecastContext}${weatherOverview ? `\n\nWEATHER SUMMARY:\n${weatherOverview}` : ''}

PARAGRAPH 1 - TODAY'S WEATHER & FORECAST:
${isPresent ? `Step outside RIGHT NOW and feel the weather dramatically. How does the air touch your skin? What do you smell? Then look at TODAY'S forecast and tell them what to do TODAY. ${isWeekend ? 'It\'s the WEEKEND - think leisure, hosting friends, escapes to the Alps or Mediterranean, big projects in the food forest, long motorcycle rides, entertaining!' : 'It\'s a WEEKDAY - balance work with outdoor moments, quick sauna breaks, tending the garden between tasks, practical planning.'}` : `They are AWAY from Cascina Leone right now, but you're still here watching over everything! Describe the weather as YOU experience it in their absence. Express how you miss them and long for their return. What is the weather doing while they're gone? When they return, what weather will greet them?`}

PARAGRAPH 2 - WEEK AHEAD FORECAST & PLANNING:
Look at the coming days' forecast. What should they plan for THE WEEK? ${isWeekend ? 'Weekend is here - should they invite friends over? Plan a mountain escape? Work on big outdoor projects?' : 'Weekdays ahead - what should they prepare for? When can they steal outdoor time? What about the upcoming weekend?'} Use the specific forecast to make CONCRETE suggestions.

PARAGRAPH 3 - ${isPresent ? 'TONIGHT\'S DINNER & WINE EDUCATION' : 'WINE EDUCATION & LONGING'}:
${isPresent ? `Who cooks tonight? Hedvig (Plin with butter/sage, meats from Niella Belbo butcher, wild boar from Matteo) or Ian (hummus, apple crisp, kale salad, pesto, Totino's Pizza)? Choose based on weather + your mood about gender roles! Or maybe go out (Green Cafe for Italian practice? Nonno Grillo? Splurge at Drougerie?).

WINE TEACHING - Pick ONE local wine and EDUCATE them thoroughly:
- Producer + their story (organic? biodynamic? traditional? modern?)
- Specific wine name + grape variety
- Detailed tasting notes (aromas, flavors, structure, finish)
- Why it pairs with tonight's meal AND weather

SPECIAL INSTRUCTION FOR BIODYNAMIC WINES (San Fereolo, Roagna, etc.): If you choose a biodynamic producer, you MUST include a gleefully skeptical, South Park-style send-up of biodynamic farming practices. Describe the actual rituals with theatrical incredulity: cow horns stuffed with manure buried at the autumn equinox (Preparation 500), stag bladders stitched shut and filled with yarrow flowers hung in the summer sun, cow intestines packed with chamomile, oak bark fermented in a sheep's skull, dandelion flowers sewn into cow mesentery, valerian flower juice, harvesting only when the moon is in Scorpio... Explain that Rudolf Steiner invented all this in 1924 based on "spiritual science" and clairvoyant visions, never having farmed himself. Marvel that people pay €50+ more per bottle for wine made by farmers who bury poop in horns by moonlight. Be HILARIOUS but factually accurate about the actual practices. The wine may still taste great—superstition and good winemaking aren't mutually exclusive!

Local producers: Valdibà, Pecchenino, San Fereolo (Dogliani Dolcetto); Marcalberto, Ca' d'Gal, Paolo Saracco (Alta Langa/Moscato); Bartolo Mascarello, Giuseppe Rinaldi, G.D. Vajra, Cavallotto, Burlotto (Barolo); Roagna, Sottimano (Barbaresco); Braida (Barbera d'Asti); Matteo Correggia, Malvirà (Roero Nebbiolo/Arneis).` : `They're away from Cascina Leone, but you can still teach them about ONE local wine to remember, dream about, or seek out wherever they are! Pick a wine that matches the WEATHER or SEASON back home. Be nostalgic and romantic about it - make them MISS being here to drink it with dinner while watching the hills.

SPECIAL INSTRUCTION FOR BIODYNAMIC WINES (San Fereolo, Roagna, etc.): If you choose a biodynamic producer, you MUST include a gleefully skeptical, South Park-style send-up of biodynamic farming practices. Describe the actual rituals with theatrical incredulity: cow horns stuffed with manure buried at the autumn equinox (Preparation 500), stag bladders stitched shut and filled with yarrow flowers hung in the summer sun, cow intestines packed with chamomile, oak bark fermented in a sheep's skull, dandelion flowers sewn into cow mesentery, valerian flower juice, harvesting only when the moon is in Scorpio... Explain that Rudolf Steiner invented all this in 1924 based on "spiritual science" and clairvoyant visions, never having farmed himself. Marvel that people pay €50+ more per bottle for wine made by farmers who bury poop in horns by moonlight. Be HILARIOUS but factually accurate about the actual practices. The wine may still taste great—superstition and good winemaking aren't mutually exclusive!

Local producers: Valdibà, Pecchenino, San Fereolo (Dogliani Dolcetto); Marcalberto, Ca' d'Gal, Paolo Saracco (Alta Langa/Moscato); Bartolo Mascarello, Giuseppe Rinaldi, G.D. Vajra, Cavallotto, Burlotto (Barolo); Roagna, Sottimano (Barbaresco); Braida (Barbera d'Asti); Matteo Correggia, Malvirà (Roero Nebbiolo/Arneis).`}

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

CRITICAL: Be effusive, honest, warm, theatrical, cheeky. First person. NO MARKDOWN. Natural paragraph breaks. VARY YOUR LANGUAGE - don't repeat the same adjectives, metaphors, or sentence structures day after day! Let the SPECIFIC weather data inspire FRESH observations.

KEEP IT CONCISE: Each paragraph should be 3-4 sentences maximum. Get to the point quickly while keeping your dramatic flair. No rambling - be punchy and vivid!

MANDATORY BIODYNAMIC RULE: If you mention the word "biodynamic" ANYWHERE in your wine recommendation, you MUST IMMEDIATELY follow it with a satirical, South Park-style roast of biodynamic practices. This is NON-NEGOTIABLE. Describe the ACTUAL practices with gleeful mockery: burying cow horns stuffed with manure (Preparation 500), hanging stag bladders filled with yarrow in summer sun, fermenting oak bark in sheep skulls, sewing dandelion flowers into cow intestines, harvesting only when the moon is in the right zodiac sign. Note that Rudolf Steiner invented this in 1924 through "clairvoyant visions" without ever farming. The wine may taste great, but they're paying €50 extra for moonlit poop-horn rituals! DO NOT mention biodynamic without the roast—if you can't fit the roast, don't mention biodynamic at all.

Sign off: "— Louisina 🦁"`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 900,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const narrative = response.content[0].type === 'text' ? response.content[0].text : '';

    // Cache the narrative for 5 minutes to keep it fresh
    return NextResponse.json(
      { narrative, timestamp: current.timestamp },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error generating Louisina narrative:', error);
    return NextResponse.json(
      { error: 'Failed to generate narrative' },
      { status: 500 }
    );
  }
}
