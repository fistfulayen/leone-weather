# Leone Weather - Project Context

## Overview
A Next.js weather application for Cascina Leone (a property in Piedmont, Italy). Features a dramatic AI weather companion named "Louisina" with the personality of Italian actress Anna Magnani.

## Tech Stack
- **Framework**: Next.js 15.5.7 (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI**: Vercel AI Gateway (migrated Jan 2025)
- **Email**: Resend
- **Deployment**: Vercel (auto-deploys from `main` branch)
- **Repo**: github.com/fistfulayen/leone-weather

## AI Integration (Vercel AI Gateway)

### Key Files
- `/lib/ai-gateway.ts` - Unified AI client for all providers
- `/lib/claude.ts` - Louisina chat function (uses ai-gateway)

### Models Used
- **Text**: `anthropic/claude-sonnet-4-5-20250929` (Louisina narratives, chat, data extraction)
- **Image**: `bfl/flux-pro-1.1-ultra` (daily paintings, default)
- **Image Alt**: `google/imagen-4.0-generate` (A/B testing via `?model=imagen`)

### Authentication
- **Production**: OIDC automatic (no API key needed on Vercel)
- **Local Dev**: Requires `AI_GATEWAY_API_KEY` in `.env.local`
- **BYOK**: Can add own keys in Vercel Dashboard → AI Gateway → BYOK

### Environment Variables
```
AI_GATEWAY_API_KEY=...      # For local dev only (OIDC handles production)
ANTHROPIC_API_KEY=...       # Legacy, can be used for BYOK
GEMINI_API_KEY=...          # Legacy, can be used for BYOK
SUPABASE_SECRET_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
RESEND_API_KEY=...
WEATHERLINK_API_KEY=...
OPENWEATHERMAP_API_KEY=...
```

## Key Features

### Louisina (AI Weather Companion)
- Dramatic Italian personality (Anna Magnani style)
- Daily narratives with weather, wine education, horoscopes
- Presence-aware (knows if residents are home via `presence_dates` table)
- Mandatory satirical commentary on biodynamic wines

### Daily Painting
- AI-generated oil paintings of Cascina Leone
- Rotates through 12 Italian master painters
- Uses Claude to analyze camera photo → generates prompt → FLUX/Imagen creates painting
- Stored in Supabase Storage (`daily-paintings` bucket)

### API Routes
- `/api/generate-daily-narrative` - Cron-triggered daily narrative
- `/api/louisina-narrative` - Real-time narrative for website
- `/api/daily-painting` - Generate daily painting (`?model=imagen` for A/B test)
- `/api/chat` - Interactive chat with Louisina
- `/api/send-daily-email` - Daily email newsletter
- `/api/fetch-horoscope` - Scrapes Virgo-Pisces horoscope
- `/api/fetch-ski-reports` - Scrapes ski resort data

## Residents
- **Hedvig** (Pisces) - Former Dior etalon, Estonian, "Stay Punk" spirit
- **Ian** (Virgo) - Digital sovereign, early adopter, Goshen Indiana origins
- **Niina** - Their daughter (born Aug 2014)

## Database Tables (Supabase)
- `readings` - Weather sensor data
- `daily_narratives` - Stored Louisina narratives
- `daily_horoscopes` - Scraped horoscopes
- `weather_forecasts` - 7-day forecasts
- `weather_overviews` - Weather summaries
- `presence_dates` - When residents are at Cascina Leone
- `conversations` - Chat history with Louisina
- `ski_reports` - Ski resort conditions

## Recent Changes (Jan 2025)
- Migrated from direct Anthropic/Gemini SDKs to Vercel AI Gateway
- Added A/B testing for image generation (FLUX vs Imagen)
- Removed `@anthropic-ai/sdk`, `@google/generative-ai` dependencies
- Added `ai`, `@ai-sdk/anthropic`, `@ai-sdk/google` dependencies
