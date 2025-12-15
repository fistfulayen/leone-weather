const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function test() {
  const url = 'https://www.skiresort.info/ski-resort/mondole-ski-artesinafrabosa-sopranaprato-nevoso/snow-report/';

  console.log('Fetching:', url);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  });

  const html = await response.text();
  console.log('HTML length:', html.length);
  console.log('First 500 chars:', html.slice(0, 500));

  console.log('\nSending to Claude...');
  const claudeResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Extract ski resort snow report data from this HTML page. Return ONLY valid JSON with no markdown formatting, no code blocks, no explanations.

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
${html.slice(0, 50000)}`
      },
    ],
  });

  const textContent = claudeResponse.content[0].type === 'text'
    ? claudeResponse.content[0].text
    : '';

  console.log('\nClaude response:');
  console.log(textContent);

  // Try to parse it
  let jsonString = textContent.trim();
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/```\n?/g, '');
  }

  const parsed = JSON.parse(jsonString);
  console.log('\nParsed JSON:');
  console.log(JSON.stringify(parsed, null, 2));
}

test().catch(console.error);
