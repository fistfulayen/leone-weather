import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/claude';

export async function GET(request: Request) {
  try {
    // Get today's date in Italy timezone
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Europe/Rome',
    });

    // Check if we already have today's horoscope
    const { data: existing } = await supabaseAdmin
      .from('daily_horoscopes')
      .select('*')
      .eq('date', today)
      .single();

    // Allow refetch with ?force=true query parameter
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    if (existing && !force) {
      return NextResponse.json({
        success: true,
        message: 'Horoscope already fetched today',
        horoscope: existing,
      });
    }

    // Fetch the horoscope page
    const response = await fetch(
      'https://www.prokerala.com/astrology/love-horoscope/virgo-pisces.html'
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch horoscope: ${response.statusText}`);
    }

    const html = await response.text();

    // Use Claude to extract the horoscope content
    const extraction = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `Extract the daily horoscope information from this HTML page. Return ONLY a JSON object with these fields:
{
  "horoscope_text": "the main horoscope prediction and advice text, combined into one coherent paragraph",
  "lucky_colors": "comma-separated list of lucky colors",
  "lucky_numbers": "comma-separated list of lucky numbers"
}

HTML:
${html}`,
        },
      ],
    });

    const extractedText =
      extraction.content[0].type === 'text' ? extraction.content[0].text : '';

    // Parse the JSON response
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract horoscope data');
    }

    const horoscopeData = JSON.parse(jsonMatch[0]);

    // Store in database (upsert to update if exists)
    const { data: stored, error } = await supabaseAdmin
      .from('daily_horoscopes')
      .upsert({
        date: today,
        horoscope_text: horoscopeData.horoscope_text,
        lucky_colors: horoscopeData.lucky_colors,
        lucky_numbers: horoscopeData.lucky_numbers,
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing horoscope:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Horoscope fetched and stored',
      horoscope: stored,
    });
  } catch (error) {
    console.error('Error fetching horoscope:', error);
    return NextResponse.json(
      { error: 'Failed to fetch horoscope' },
      { status: 500 }
    );
  }
}
