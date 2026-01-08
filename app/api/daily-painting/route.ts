import { NextResponse } from 'next/server';
import { analyzeImageWithClaude, generateImageWithAI } from '@/lib/ai-gateway';
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

    const claudePrompt = `You are an expert art curator creating a museum exhibition. Generate an image generation prompt for Gemini 3 Pro Image.

TASK: Transform this photograph of Cascina Leone into an oil painting by ${todaysPainter.name} (${todaysPainter.period}) that captures today's weather conditions and forecast.

TODAY'S WEATHER:
- Current: ${fullContext?.temperature}°C, ${fullContext?.conditions}
- Feels like: ${fullContext?.feelsLike}°C
- Wind: ${fullContext?.windSpeed} km/h
- Rain today: ${fullContext?.rainToday} mm
- Humidity: ${fullContext?.humidity}%
- Time: ${fullContext?.timeOfDay}, ${fullContext?.season}

${fullContext?.forecast ? `FORECAST: ${fullContext.forecast}` : ''}

PAINTER'S STYLE: ${todaysPainter.style}

CRITICAL REQUIREMENTS:
1. Paint the scene from the photograph interpreting it through TODAY'S WEATHER CONDITIONS
2. Use ${todaysPainter.name}'s distinctive techniques and color palette
3. The weather must be VISIBLE in the painting (clouds, mist, rain, wind, light quality)
4. Include an ornate baroque gilt frame with acanthus leaves and scrollwork
5. **MOST IMPORTANT**: The frame must have a visible brass plaque at the bottom center with clearly legible text showing:
   - Title: "[Create an evocative Italian title based on weather/scene]"
   - Artist: "${todaysPainter.name}, ${todaysPainter.period.split('-')[0]}"

Create a detailed 5-6 sentence prompt. Be specific about weather interpretation, ${todaysPainter.name}'s painting techniques, and ensure the plaque text is legible and prominent.

Return ONLY the complete image generation prompt.`;

    // Use AI Gateway to analyze the image and generate the painting prompt
    const imagePrompt = await analyzeImageWithClaude({
      imageBase64: base64Image,
      mimeType: mimeType as 'image/png' | 'image/jpeg',
      prompt: claudePrompt,
      maxTokens: 1024,
    });

    console.log('Claude-generated image prompt:', imagePrompt);

    // Check if AI Gateway API key is available
    if (!process.env.AI_GATEWAY_API_KEY) {
      return NextResponse.json({
        painter: todaysPainter,
        sourceImage: selectedImage,
        prompt: imagePrompt,
        imageUrl: null,
        error: 'AI Gateway API key not configured. Add AI_GATEWAY_API_KEY to environment.',
      });
    }

    // Determine which image model to use (gemini/Nano Banana Pro by default)
    const modelParam = searchParams.get('model');
    const imageModel = modelParam === 'flux' ? 'flux' : modelParam === 'imagen' ? 'imagen' : 'gemini';
    const modelNames: Record<string, string> = {
      gemini: 'Gemini 3 Pro Image (Nano Banana Pro)',
      flux: 'FLUX Pro Ultra',
      imagen: 'Google Imagen',
    };
    console.log(`Generating image with AI Gateway using ${modelNames[imageModel]}...`);

    // Generate the painting using AI Gateway
    const generatedImage = await generateImageWithAI({
      prompt: imagePrompt,
      model: imageModel,
    });

    console.log('Image generated successfully via AI Gateway');

    // Convert base64 image data to buffer
    const downloadedImageBuffer = Buffer.from(generatedImage.base64, 'base64');

    // Upload to Supabase Storage
    console.log('Uploading image to Supabase Storage...');
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    const today = new Date().toISOString().split('T')[0];
    const fileName = `painting-${today}-${todaysPainter.name.toLowerCase().replace(/\s+/g, '-')}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('daily-paintings')
      .upload(fileName, downloadedImageBuffer, {
        contentType: 'image/png',
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('daily-paintings')
      .getPublicUrl(fileName);

    console.log('Image uploaded successfully. Public URL:', publicUrl);

    const modelIds: Record<string, string> = {
      gemini: 'google/gemini-3-pro-image',
      flux: 'bfl/flux-pro-1.1-ultra',
      imagen: 'google/imagen-4.0-generate',
    };

    return NextResponse.json({
      painter: todaysPainter,
      sourceImage: selectedImage,
      prompt: imagePrompt,
      model: modelIds[imageModel],
      imageUrl: publicUrl,
    });

  } catch (error) {
    console.error('Error generating daily painting:', error);
    return NextResponse.json({
      error: 'Failed to generate daily painting',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
