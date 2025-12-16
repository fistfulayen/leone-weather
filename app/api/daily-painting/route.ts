import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';

// List of Italian painters to rotate through
const ITALIAN_PAINTERS = [
  { name: 'Caravaggio', period: '1571-1610', style: 'Dramatic chiaroscuro, intense realism, theatrical lighting' },
  { name: 'Sandro Botticelli', period: '1445-1510', style: 'Graceful lines, mythological themes, Renaissance beauty' },
  { name: 'Titian', period: '1488-1576', style: 'Rich colors, dynamic compositions, Venetian mastery' },
  { name: 'Leonardo da Vinci', period: '1452-1519', style: 'Sfumato technique, scientific precision, enigmatic atmosphere' },
  { name: 'Raphael', period: '1483-1520', style: 'Harmonious compositions, idealized beauty, clarity' },
  { name: 'Michelangelo', period: '1475-1564', style: 'Powerful forms, dynamic poses, sculptural quality' },
  { name: 'Giotto', period: '1267-1337', style: 'Emotional depth, spatial innovation, narrative clarity' },
  { name: 'Tintoretto', period: '1518-1594', style: 'Dramatic movement, bold brushwork, Mannerist energy' },
  { name: 'Paolo Veronese', period: '1528-1588', style: 'Sumptuous colors, grand architectural settings, festive scenes' },
  { name: 'Giovanni Bellini', period: '1430-1516', style: 'Luminous color, serene landscapes, devotional intimacy' },
  { name: 'Piero della Francesca', period: '1415-1492', style: 'Mathematical precision, calm dignity, crystalline light' },
  { name: 'Andrea Mantegna', period: '1431-1506', style: 'Archaeological detail, foreshortening mastery, antique grandeur' },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const contextParam = searchParams.get('context');

    // Parse the FULL context data (same as Louisina gets)
    let fullContext = null;
    if (contextParam) {
      try {
        fullContext = JSON.parse(decodeURIComponent(contextParam));
      } catch (e) {
        console.error('Failed to parse context:', e);
      }
    }

    // Select painter based on day of year (consistent rotation)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const painterIndex = dayOfYear % ITALIAN_PAINTERS.length;
    const todaysPainter = ITALIAN_PAINTERS[painterIndex];

    console.log(`Today's painter: ${todaysPainter.name} (${todaysPainter.period})`);

    // Get list of camera images
    const imagesDir = path.join(process.cwd(), 'public', 'camera-images');
    const files = await fs.readdir(imagesDir);
    const imageFiles = files.filter(f =>
      /\.(jpg|jpeg|png|webp)$/i.test(f) && f !== 'README.md'
    );

    if (imageFiles.length === 0) {
      return NextResponse.json({
        error: 'No images found in camera-images directory'
      }, { status: 404 });
    }

    // Select image based on day of year (consistent selection)
    const imageIndex = dayOfYear % imageFiles.length;
    const selectedImage = imageFiles[imageIndex];
    const imagePath = path.join(imagesDir, selectedImage);

    console.log(`Selected image: ${selectedImage}`);

    // Read the image and convert to base64
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = selectedImage.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    // Use Claude to analyze the image WITH ALL OF LOUISINA'S CONTEXT
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build the full context description for Claude (everything Louisina sees)
    let contextDescription = '';
    if (fullContext) {
      contextDescription = `
CONTEXT FOR THE PAINTING (same context Louisina uses for her weather report):

WEATHER:
- Temperature: ${fullContext.temperature}°C (feels like ${fullContext.feelsLike}°C)
- Conditions: ${fullContext.conditions}
- Season: ${fullContext.season}
- Time of day: ${fullContext.timeOfDay}
- Wind: ${fullContext.windSpeed} km/h${fullContext.windGust ? ` (gusts to ${fullContext.windGust} km/h)` : ''}
- Rain today: ${fullContext.rainToday} mm
- Humidity: ${fullContext.humidity}%
- Location: Cascina Leone, Piemonte, Italy

PRESENCE:
- Owners present: ${fullContext.isPresent ? 'Yes - estate is alive with activity' : 'No - serene, unoccupied tranquility'}

${fullContext.horoscope ? `
HOROSCOPE (Virgo-Pisces):
${fullContext.horoscope}
Lucky colors: ${fullContext.luckyColors}
Lucky numbers: ${fullContext.luckyNumbers}
` : ''}

${fullContext.forecast ? `
WEATHER FORECAST:
${fullContext.forecast}
` : ''}

${fullContext.news ? `
LOCAL NEWS HEADLINES:
${fullContext.news}
` : ''}

${fullContext.cryptoPrices ? `
CRYPTO MARKETS:
Bitcoin: $${fullContext.cryptoPrices.bitcoin.price} (${fullContext.cryptoPrices.bitcoin.change >= 0 ? '+' : ''}${fullContext.cryptoPrices.bitcoin.change}%)
Ethereum: $${fullContext.cryptoPrices.ethereum.price} (${fullContext.cryptoPrices.ethereum.change >= 0 ? '+' : ''}${fullContext.cryptoPrices.ethereum.change}%)
` : ''}

${fullContext.cryptoPunks ? `
CRYPTOPUNKS SALES:
${fullContext.cryptoPunks}
` : ''}
`;
    }

    const claudePrompt = `You are an expert art curator helping create a DALL-E 3 prompt for an oil painting.

TASK: Analyze this photograph of Cascina Leone and create a detailed DALL-E 3 prompt that will generate a museum-quality oil painting in the style of ${todaysPainter.name} (${todaysPainter.period}).

${contextDescription}

PAINTER'S STYLE: ${todaysPainter.style}

INSTRUCTIONS:
1. Describe what you see in the photograph in rich visual detail
2. Incorporate the weather/seasonal context into the painting's mood and atmosphere
3. Weave in the emotional context (presence, horoscope themes, local events)
4. Specify how ${todaysPainter.name} would paint this scene using their distinctive techniques
5. Include a museum-quality ornate gilt frame with baroque details

Your DALL-E 3 prompt should be 4-5 sentences that paint a vivid picture. Be specific about:
- Composition and perspective
- Lighting and atmosphere (informed by weather/time of day)
- Color palette (influenced by painter's style and weather)
- Brushwork and technique specific to ${todaysPainter.name}
- Emotional mood (informed by presence, horoscope, current events)
- The ornate gilt frame

Return ONLY the DALL-E 3 prompt, nothing else.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: claudePrompt,
            },
          ],
        },
      ],
    });

    const dallePrompt = response.content[0].type === 'text' ? response.content[0].text : '';

    console.log('Claude-generated Nano Banana prompt:', dallePrompt);

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        painter: todaysPainter,
        sourceImage: selectedImage,
        prompt: dallePrompt,
        imageUrl: null,
        error: 'Gemini API key not configured. Add GEMINI_API_KEY to .env.local to generate images.',
      });
    }

    // Generate the painting using Nano Banana Pro (Gemini 3 Pro Image)
    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: dallePrompt,
            }],
          }],
          generationConfig: {
            responseModalities: ['IMAGE'],
            imageConfig: {
              aspectRatio: '1:1',
              imageSize: '2K',
            },
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text();
      console.error('Gemini API error:', error);
      return NextResponse.json({
        painter: todaysPainter,
        sourceImage: selectedImage,
        prompt: dallePrompt,
        imageUrl: null,
        error: `Image generation failed: ${error}`,
      }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();

    // Extract image data from Gemini response
    const imagePart = geminiData.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);
    if (!imagePart?.inlineData?.data) {
      throw new Error('No image data in Gemini response');
    }

    // Convert base64 image to a data URL
    const imageBase64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    const imageUrl = `data:${mimeType};base64,${imageBase64}`;

    console.log('Generated image with Nano Banana Pro');
    console.log('Image size:', imageBase64.length, 'bytes');

    return NextResponse.json({
      painter: todaysPainter,
      sourceImage: selectedImage,
      prompt: dallePrompt,
      revisedPrompt: dallePrompt, // Gemini doesn't revise prompts like DALL-E
      imageUrl: imageUrl,
    });

  } catch (error) {
    console.error('Error generating daily painting:', error);
    return NextResponse.json({
      error: 'Failed to generate daily painting',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
