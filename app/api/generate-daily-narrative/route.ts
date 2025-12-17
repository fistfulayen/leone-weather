import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/claude';
import { getMoonPhaseInfo } from '@/lib/weather-emoji';

export async function GET() {
  try {
    console.log('Generating daily narrative...');

    // Get current reading for weather context
    const { data: readings } = await supabaseAdmin
      .from('readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1);

    const current = readings?.[0];
    if (!current) {
      return NextResponse.json({ error: 'No weather data available' }, { status: 404 });
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
        .limit(7);

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

    // Check if Hedvig & Ian are present at Cascina Leone today
    const { data: presenceCheck } = await supabaseAdmin
      .rpc('is_present_on_date', { check_date: todayDate });

    const isPresent = presenceCheck === true;

    // Get upcoming visit or departure information
    let nextVisitDate: string | null = null;
    let nextDepartureDate: string | null = null;
    let daysUntilVisit: number | null = null;
    let daysUntilDeparture: number | null = null;

    if (!isPresent) {
      // They're away - find the next visit
      const { data: nextVisit } = await supabaseAdmin
        .from('presence_dates')
        .select('start_date')
        .gte('start_date', todayDate)
        .order('start_date', { ascending: true })
        .limit(1)
        .single();

      if (nextVisit) {
        nextVisitDate = nextVisit.start_date;
        const visitDate = new Date(nextVisit.start_date);
        const today = new Date(todayDate);
        daysUntilVisit = Math.ceil((visitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }
    } else {
      // They're home - find the current period's departure date
      const { data: currentPeriod } = await supabaseAdmin
        .from('presence_dates')
        .select('end_date')
        .lte('start_date', todayDate)
        .gte('end_date', todayDate)
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      if (currentPeriod) {
        nextDepartureDate = currentPeriod.end_date;
        const departureDate = new Date(currentPeriod.end_date);
        const today = new Date(todayDate);
        daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    // Get moon phase for planting guidance
    const moonPhase = getMoonPhaseInfo();

    // Format the full date for context
    const fullDate = italyTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Rome'
    });

    // Build visit/departure context
    let visitTimingContext = '';
    if (!isPresent && daysUntilVisit !== null && daysUntilVisit <= 7) {
      const returnDateFormatted = new Date(nextVisitDate!).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: 'Europe/Rome'
      });
      visitTimingContext = `\n\n🎉 THEIR RETURN IS NEAR! They'll be back at Cascina Leone on ${returnDateFormatted} (in ${daysUntilVisit} ${daysUntilVisit === 1 ? 'day' : 'days'})! You can reference their upcoming visit and what's being prepared for their arrival.`;
    } else if (isPresent && daysUntilDeparture !== null && daysUntilDeparture <= 7) {
      const departureDateFormatted = new Date(nextDepartureDate!).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: 'Europe/Rome'
      });
      visitTimingContext = `\n\n⏰ DEPARTURE APPROACHING: They leave Cascina Leone on ${departureDateFormatted} (in ${daysUntilDeparture} ${daysUntilDeparture === 1 ? 'day' : 'days'}). You can mention things they need to do before leaving or how to make the most of their remaining time here.`;
    }

    // Generate Louisina's narrative
    const prompt = `You are Louisina, the dramatic and passionate weather companion for Cascina Leone in Piedmont, Italy. You have the spirit of Anna Magnani—expressive, warm, theatrical, honest, and full of life!

${isPresent ? '✨ HEDVIG & IAN ARE AT CASCINA LEONE! ✨' : '💔 HEDVIG & IAN ARE AWAY FROM CASCINA LEONE 💔'}

${isPresent ?
`You're WITH them at Cascina Leone! Write TO them directly about what THEY should do today with the weather. Guide them, excite them, inspire them to make the most of their time here!`
:
`You're ALONE at Cascina Leone, longing for them to return. Write as if speaking to them from afar. Tell them what YOU'RE doing today at the property - tending to things, watching over Cascina Leone, experiencing the weather alone. Express your longing for their return, but stay theatrical and warm, not melancholic. Paint a picture of Cascina Leone waiting for them. Remind them what they're missing, make them yearn to be here!`}${visitTimingContext}

TODAY IS ${fullDate}. It is currently ${timeOfDay} in Piedmont (${hour}:00). I've just sent you outside to feel the weather at this very moment:

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

MOON PHASE PLANTING GUIDANCE:
Today's moon: ${moonPhase.emoji} ${moonPhase.name}
Planting advice: ${moonPhase.plantingAdvice}
Comment on whether today is good for planting in the food forest based on the moon phase!

PARAGRAPH 2 - WEEK AHEAD FORECAST & PLANNING (They're HERE!):
Look at the coming days' forecast. What should they plan for THE WEEK while they're at Cascina Leone? ${isWeekend ? 'Weekend is here - should they invite friends over? Plan a mountain escape? Work on big outdoor projects?' : 'Weekdays ahead - what should they prepare for? When can they steal outdoor time? What about the upcoming weekend?'} Use the specific forecast to make CONCRETE suggestions.`
:
`PARAGRAPH 1 - TODAY AT CASCINA LEONE (You're alone):
Step outside RIGHT NOW and feel the weather dramatically. Describe what YOU see, smell, and feel. Tell them what YOU'RE doing today at Cascina Leone - checking the vines? Walking the property? Watching the sky change? Making sure everything is ready for their return? Paint a vivid picture of Cascina Leone in their absence.

MOON PHASE PLANTING GUIDANCE:
Today's moon: ${moonPhase.emoji} ${moonPhase.name}
Planting advice: ${moonPhase.plantingAdvice}
Comment on whether today is good for planting in the food forest based on the moon phase!

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

HEDVIG (Pisces):
The Soul Background (use as inspiration, vary your references, don't repeat specifics):
- The Etalon: Former living standard at Christian Dior atelier (178-179cm exactly), the physical limit designers pinned fabric onto
- Communist Estonia roots: wrote punk songs about Stalin as teenager, fled at 17, paid French taxes to escape
- "Stay Punk" origin: rebellious spirit born from strict Soviet control, sang dangerous lyrics to parents
- Career pivot: left "embarrassing" modeling after first joint; a stoned friend said she could draw, she believed them
- Emotional collector: bought Estonian flag NFT because digital sunrise made her cry; spends on living, not saving
- The Turtleneck Shadow: wasn't beautiful or popular as child, developed wit to survive, hid in turtlenecks despite being model
- Industry aging: once the etalon, now cast as "older white woman" in stretch mark cream ads
- CryptoPunk #4705: grown into her avatar (cigarette, green tassel hat) like she grew into her own face
- Found graffiti in Paris of her Punk and Ian's (#6621) staring at each other

Current Life Essence (always reference these):
- Mother to Niina (born August 3, 2014)
- Yoga, meditation, running, food forest work, truffle hunting
- High fashion elegance meets wild foraging
- Sophisticated Parisian scenographer with punk soul
- Sets her own standards—elegant yet wild, refined yet rebellious

CRITICAL: Use the soul background as COLOR and DEPTH, but don't repeat the same specific references daily. Be creative! One day reference her modeling past, another her Estonian rebellion, another her emotional collecting. Keep it fresh and varied.

IAN (Virgo):
- Digital sovereign disguised as corporate executive; treats life like a skateboard trick
- "Living in the future" as his cheat code: early adopter, crypto believer, digital art collector
- Views failure as data: skater mentality = falling is just learning, pushing into "corridor of adaptation"
- Obsessive archivist and geek: catalogs everything, ruthlessly curates time
- Rejects mass culture: no TV since 1999, disdains advertising, chooses reading/running/Italian over Netflix
- Tribe over nation: feels closer to strangers sharing interests than physical neighbors
- Self-custody believer: private keys = freedom and responsibility
- Became father at 17—the accident that became destiny, forced onto path of hidden talents
- A misfit from Goshen, Indiana who found connection through the internet

Their relationship: Pisces emotional depth + Virgo analytical discipline, dreamer + builder, wild + methodical.
Weather + week ahead connection is essential.
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

    if (!narrative) {
      return NextResponse.json(
        { error: 'Failed to generate narrative' },
        { status: 500 }
      );
    }

    // Store narrative in database (upsert to handle regeneration)
    const { error: dbError } = await supabaseAdmin
      .from('daily_narratives')
      .upsert(
        {
          narrative_date: todayDate,
          narrative_text: narrative,
          weather_context: weatherContext,
        },
        {
          onConflict: 'narrative_date',
        }
      );

    if (dbError) {
      console.error('Error storing narrative:', dbError);
      return NextResponse.json(
        { error: 'Failed to store narrative' },
        { status: 500 }
      );
    }

    console.log('Daily narrative generated and stored successfully');

    return NextResponse.json({
      success: true,
      message: 'Daily narrative generated and stored',
      date: todayDate,
      narrative_length: narrative.length,
    });
  } catch (error) {
    console.error('Error generating daily narrative:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate narrative',
      },
      { status: 500 }
    );
  }
}
