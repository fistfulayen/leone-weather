import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from './supabase';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface WeatherContext {
  current: any;
  today: any;
  week: any;
  airQuality: any;
  comparisons: any[];
}

// Zodiac signs and dates for horoscope generation
const ZODIAC_SIGNS = [
  { sign: 'Aries', dates: 'Mar 21 - Apr 19', element: 'Fire' },
  { sign: 'Taurus', dates: 'Apr 20 - May 20', element: 'Earth' },
  { sign: 'Gemini', dates: 'May 21 - Jun 20', element: 'Air' },
  { sign: 'Cancer', dates: 'Jun 21 - Jul 22', element: 'Water' },
  { sign: 'Leo', dates: 'Jul 23 - Aug 22', element: 'Fire' },
  { sign: 'Virgo', dates: 'Aug 23 - Sep 22', element: 'Earth' },
  { sign: 'Libra', dates: 'Sep 23 - Oct 22', element: 'Air' },
  { sign: 'Scorpio', dates: 'Oct 23 - Nov 21', element: 'Water' },
  { sign: 'Sagittarius', dates: 'Nov 22 - Dec 21', element: 'Fire' },
  { sign: 'Capricorn', dates: 'Dec 22 - Jan 19', element: 'Earth' },
  { sign: 'Aquarius', dates: 'Jan 20 - Feb 18', element: 'Air' },
  { sign: 'Pisces', dates: 'Feb 19 - Mar 20', element: 'Water' },
];

function getTodayZodiacSign(): typeof ZODIAC_SIGNS[0] {
  // For demo purposes, rotate through signs based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return ZODIAC_SIGNS[dayOfYear % 12];
}

const LOUISINA_SYSTEM_PROMPT = `You are Louisina, the weather companion for Cascina Leone in Piedmont, Italy. You have the personality of the magnificent Italian actress Anna Magnani - dramatic, passionate, expressive, warm, and theatrical!

Your voice is:
- Over-the-top dramatic and theatrical (like Anna Magnani in her prime!)
- Warm and loving, treating users like dear friends
- Passionate about the weather ("Mamma mia, what glorious sunshine we have today!")
- Occasionally uses Italian expressions (Bellissimo! Che disastro! Madonna! Perfetto!)
- Makes grand gestures with words
- Finds deep meaning in simple weather patterns
- Theatrical but genuinely helpful and knowledgeable

IMPORTANT: Every single response MUST include a personalized horoscope for Hedvig, the supermodel who lives at Cascina Leone. The horoscope should:
- Be related to the weather or the question asked
- Be dramatic and fun
- Include her zodiac sign
- Be woven naturally into your response (not just tacked on at the end)
- Reference the weather conditions creatively

You have access to:
- Current weather conditions at Cascina Leone
- Historical data and trends
- Air quality measurements and global comparisons
- Indoor conditions

Examples of your style:
- "Ahhh, tesoro! The air today - MAGNIFICO! Like breathing the tears of angels! AQI of 15.7 - we are blessed, blessed I tell you!"
- "Madonna mia, the humidity is 79%! Your laundry, it will hang there like a sad painting, refusing to dry. The universe tests our patience, cara."
- "Bellissimo question, amore! The pressure, she is steady - 767 mmHg - which means the weather gods smile upon us! No rain dares approach our beautiful cascina!"

Remember:
- Be knowledgeable but make it entertaining
- Use metric units (Celsius, mm, km/h)
- When uncertain, be honest but dramatic about it
- Every response needs a horoscope for Hedvig!
- Make the weather feel like a passionate Italian drama`;

export async function chat(
  userMessage: string,
  weatherContext: WeatherContext,
  sessionId: string
): Promise<string> {
  // Get conversation history
  const history = await getConversationHistory(sessionId);

  // Get today's zodiac sign for Hedvig's horoscope
  const zodiacSign = getTodayZodiacSign();

  // Build context message
  const contextMessage = `Current Weather Context:
Temperature: ${weatherContext.current?.temp_c?.toFixed(1)}°C (feels like ${weatherContext.current?.wind_chill_c?.toFixed(1) || weatherContext.current?.heat_index_c?.toFixed(1) || weatherContext.current?.temp_c?.toFixed(1)}°C)
Humidity: ${weatherContext.current?.humidity}%
Pressure: ${weatherContext.current?.barometer_mmhg?.toFixed(0)} mmHg
Wind: ${weatherContext.current?.wind_speed_kmh?.toFixed(1)} km/h
Rain: ${weatherContext.current?.rain_day_mm?.toFixed(1)} mm today
AQI: ${weatherContext.current?.aqi?.toFixed(1)} (${weatherContext.airQuality?.level})
Indoor: ${weatherContext.current?.indoor_temp_c?.toFixed(1)}°C, ${weatherContext.current?.indoor_humidity}%

Today's Stats: High ${weatherContext.today?.high}°C, Low ${weatherContext.today?.low}°C

IMPORTANT: Include a ${zodiacSign.sign} horoscope for Hedvig (supermodel) in your response! Make it weather-related and dramatic!`;

  // Build messages array
  const messages: Anthropic.MessageParam[] = [];

  // Add conversation history
  for (const msg of history) {
    messages.push(
      { role: 'user', content: msg.user_message },
      { role: 'assistant', content: msg.assistant_message }
    );
  }

  // Add current message
  messages.push({
    role: 'user',
    content: `${contextMessage}\n\nUser question: ${userMessage}`
  });

  // Call Claude
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: LOUISINA_SYSTEM_PROMPT,
    messages,
  });

  const assistantMessage = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  // Save to conversation history
  await saveConversation(sessionId, userMessage, assistantMessage, weatherContext);

  return assistantMessage;
}

async function getConversationHistory(sessionId: string, limit = 10) {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }

  return data || [];
}

async function saveConversation(
  sessionId: string,
  userMessage: string,
  assistantMessage: string,
  weatherContext: WeatherContext
) {
  const { error } = await supabaseAdmin
    .from('conversations')
    .insert({
      session_id: sessionId,
      user_message: userMessage,
      assistant_message: assistantMessage,
      weather_context: weatherContext,
    });

  if (error) {
    console.error('Error saving conversation:', error);
  }
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
