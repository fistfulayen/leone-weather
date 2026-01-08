/**
 * Vercel AI Gateway unified client
 * Replaces direct Anthropic and Gemini SDK usage
 *
 * Uses AI Gateway for unified access to multiple AI providers
 * with automatic fallbacks, spend monitoring, and 0% markup.
 */
import {
  generateText,
  experimental_generateImage as generateImage,
  createGateway,
  type ModelMessage,
} from 'ai';

// Create AI Gateway provider instance
// On Vercel deployments, OIDC authentication is automatic (no API key needed)
// API key is only used for local development or non-Vercel deployments
const gateway = createGateway(
  process.env.AI_GATEWAY_API_KEY
    ? { apiKey: process.env.AI_GATEWAY_API_KEY }
    : {}
);

// Model identifiers (AI Gateway format: provider/model-name)
export const MODELS = {
  // Text generation
  CLAUDE_SONNET: 'anthropic/claude-sonnet-4-5-20250929',

  // Image generation (image-only models via imageModel())
  FLUX_PRO: 'bfl/flux-pro-1.1-ultra',
  IMAGEN: 'google/imagen-4.0-generate',

  // Multimodal models that can generate images (via language model)
  GEMINI_IMAGE: 'google/gemini-3-pro-image',
} as const;

/**
 * Generate text using Claude via AI Gateway
 */
export async function generateTextWithClaude(options: {
  prompt: string;
  system?: string;
  maxTokens?: number;
}) {
  const result = await generateText({
    model: gateway(MODELS.CLAUDE_SONNET),
    prompt: options.prompt,
    system: options.system,
    maxOutputTokens: options.maxTokens,
  });

  return result.text;
}

/**
 * Generate text with conversation history using Claude via AI Gateway
 */
export async function generateChatWithClaude(options: {
  messages: ModelMessage[];
  system?: string;
  maxTokens?: number;
}) {
  const result = await generateText({
    model: gateway(MODELS.CLAUDE_SONNET),
    messages: options.messages,
    system: options.system,
    maxOutputTokens: options.maxTokens,
  });

  return result.text;
}

/**
 * Analyze an image with Claude (multimodal)
 */
export async function analyzeImageWithClaude(options: {
  imageBase64: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  prompt: string;
  system?: string;
  maxTokens?: number;
}) {
  const result = await generateText({
    model: gateway(MODELS.CLAUDE_SONNET),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image: Buffer.from(options.imageBase64, 'base64'),
            mediaType: options.mimeType,
          },
          {
            type: 'text',
            text: options.prompt,
          },
        ],
      },
    ],
    system: options.system,
    maxOutputTokens: options.maxTokens,
  });

  return result.text;
}

/**
 * Generate an image using AI Gateway
 *
 * Default: Gemini 3 Pro Image (Nano Banana Pro)
 * Alternatives: FLUX Pro, Imagen
 */
export async function generateImageWithAI(options: {
  prompt: string;
  model?: 'gemini' | 'flux' | 'imagen';
}): Promise<{ base64: string; mimeType: string }> {
  const modelId =
    options.model === 'flux'
      ? MODELS.FLUX_PRO
      : options.model === 'imagen'
        ? MODELS.IMAGEN
        : MODELS.GEMINI_IMAGE;

  const result = await generateImage({
    model: gateway.imageModel(modelId),
    prompt: options.prompt,
  });

  // The result contains the generated image
  const image = result.image;

  return {
    base64: image.base64,
    mimeType: image.mediaType || 'image/png',
  };
}

/**
 * Generate an image using Gemini's multimodal model
 *
 * Uses Gemini 3 Pro Image which can generate images alongside text
 */
export async function generateImageWithGemini(options: {
  prompt: string;
}): Promise<{ base64: string | null; text: string }> {
  const result = await generateText({
    model: gateway(MODELS.GEMINI_IMAGE),
    prompt: options.prompt,
  });

  // Gemini returns the image in the response
  // For now, we return the text response - image extraction needs special handling
  return {
    base64: null, // Gemini multimodal image extraction requires different handling
    text: result.text,
  };
}
