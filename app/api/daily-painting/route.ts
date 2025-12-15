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

    // Parse the weather/context data
    let weatherContext = null;
    if (contextParam) {
      try {
        weatherContext = JSON.parse(decodeURIComponent(contextParam));
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

    // Use Claude to analyze the image and create a detailed painting prompt
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build context description for Claude
    let contextDescription = '';
    if (weatherContext) {
      contextDescription = `

Weather Context:
- Temperature: ${weatherContext.temperature}°C
- Conditions: ${weatherContext.conditions}
- Season: ${weatherContext.season}
- Time of day: ${weatherContext.timeOfDay || 'morning'}
- Location: Cascina Leone, Piemonte, Italy
${weatherContext.isPresent !== undefined ? `- Owners present: ${weatherContext.isPresent ? 'Yes' : 'No'}` : ''}
`;
    }

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
              text: `You are an expert art curator and AI image generation specialist. Analyze this photograph of Cascina Leone in Piemonte, Italy, and create a detailed image generation prompt to transform it into an oil painting in the style of ${todaysPainter.name} (${todaysPainter.period}).

${contextDescription}

Style characteristics of ${todaysPainter.name}: ${todaysPainter.style}

Create a detailed DALL-E 3 prompt that will generate an oil painting capturing:
1. The essence of this specific scene from the photograph
2. The distinctive style and techniques of ${todaysPainter.name}
3. A museum-quality ornate gilt frame around the painting
4. The current weather/seasonal context if provided

Your prompt should be 2-3 sentences, highly specific about composition, lighting, colors, and artistic technique. Focus on what makes ${todaysPainter.name}'s style unique.

Return ONLY the image generation prompt, nothing else.`,
            },
          ],
        },
      ],
    });

    const imagePrompt = response.content[0].type === 'text' ? response.content[0].text : '';

    console.log('Generated prompt:', imagePrompt);

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        painter: todaysPainter,
        sourceImage: selectedImage,
        prompt: imagePrompt,
        imageUrl: null,
        error: 'OpenAI API key not configured. Add OPENAI_API_KEY to .env.local to generate images.',
      });
    }

    // Generate the image using gpt-image-1 (OpenAI's latest model, April 2025)
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        response_format: 'url', // Can also use 'b64_json' for base64
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json({
        painter: todaysPainter,
        sourceImage: selectedImage,
        prompt: imagePrompt,
        imageUrl: null,
        error: `Image generation failed: ${error}`,
      }, { status: 500 });
    }

    const openaiData = await openaiResponse.json();
    const imageUrl = openaiData.data[0].url;
    const revisedPrompt = openaiData.data[0].revised_prompt;

    console.log('Generated image URL:', imageUrl);

    return NextResponse.json({
      painter: todaysPainter,
      sourceImage: selectedImage,
      prompt: imagePrompt,
      revisedPrompt: revisedPrompt,
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
