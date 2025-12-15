# 🦁 Cascina Leone Weather Station

*Buongiorno, darlings!* Welcome to your personal weather sanctuary in the heart of Piedmont's Alta Langa! I am **Louisina**, your dramatic weather companion with the soul of Anna Magnani, here to transform cold numbers into passionate stories!

## ✨ What Magic Happens Here?

Every dawn at Cascina Leone, this Next.js marvel awakens to weave weather data into art! Picture this:

### 🌡️ **Real-Time Weather Dashboard**
Step outside with me RIGHT NOW! Feel the air on your skin, smell the fog rolling through the valley, watch the barometric pressure dance like a temperamental lover. Current conditions, today's high and low, wind speed, rain—all delivered with theatrical flair!

### 💨 **Air Quality Monitoring**
Breathe, my loves! I compare Cascina Leone's pristine mountain air to:
- 🇮🇹 Italian cities (Milan, Turin, Genoa, Rome)
- 🇪🇪 Tallinn (for Hedvig's Estonian heart!)
- 🇫🇷 Paris, 🇬🇧 London, 🇩🇪 Berlin, 🇪🇸 Barcelona
- 🇺🇸 Los Angeles, New York
- 🇨🇳 Shanghai

Watch your air quality percentile climb! You're breathing air cleaner than 80% of the world!

### 🎨 **Daily Artistic Vista**
Every morning, a different classical master reimagines Cascina Leone! Today Monet, tomorrow Cézanne, next week Caravaggio paints your hills in dramatic chiaroscuro. Each day brings a fresh perspective from history's greatest painters!

### 💰 **Financial Pulse**
Track your crypto fortune alongside the weather:
- ₿ Bitcoin
- Ξ Ethereum
- ◎ Solana

Watch the numbers dance! Green arrows up, red arrows down—more dramatic than any opera!

### 🎨 **NFT Art Market**
For the collectors and rebels! Track high-value sales in the last 24 hours:
- **CryptoPunks** (those pixelated pioneers!)
- **Notable NFT sales** > 0.5 ETH from across the digital art world

See what's selling, what the market whispers. Stay punk, stay informed!

### 📰 **Alta Langa Local News**
Your village gossip, delivered fresh! I scan Italian news sources for mentions of:
- Alba, Barolo, La Morra, Dogliani, Monforte
- All 100+ villages of your beloved Alta Langa
- What's happening in Niella Belbo, your truffle-hunting grounds

Real news about real neighbors, not algorithmic noise from afar!

### ⏳ **Alta Langa Love Countdown**
**9️⃣ 1️⃣ 2️⃣** days until the party of the century! July 16, 2027—mark your calendars! Watch the vintage emoji counter tick down daily!

### 🦁 **Louisina's Weather Report**
*This* is where I truly come alive! Every day at 5:45 AM UTC, I compose your personalized weather narrative:

**PARAGRAPH 1** - Step outside RIGHT NOW! What does the morning air whisper? How do the clouds move? What should you DO today with this weather?

**PARAGRAPH 2** - The week ahead! Should you invite friends? Plan a mountain escape? Tend the food forest? Work on the wooden half pipe? I read the forecast like tarot cards!

**PARAGRAPH 3** - Tonight's dinner and wine lesson! Who cooks?
- **Hedvig**: Homemade plin with butter & sage, meats from Niella Belbo butcher, Matteo's wild boar
- **Ian**: Hummus, his mother's apple crisp, kale salad, pesto, Totino's pizza (yes, frozen!)
- **Going out**: Green Cafe for Italian practice, Nonno Grillo for family feasts, Drougerie for decadence!

Then comes the WINE EDUCATION! Each day I teach you about ONE local producer:
- Their story, their philosophy (organic? biodynamic? rebel winemaker?)
- Specific wine name, grape variety, terroir
- Tasting notes that make your mouth water
- Perfect pairing with tonight's meal AND weather

**PARAGRAPH 4** - Hedvig's Pisces horoscope! I weave astrology with weather, connecting cosmic energy to:
- Your Pisces-Virgo love (emotional depth meets practical devotion)
- Hedvig's beautiful duality: high fashion elegance dancing with earthy truffle hunting
- Her "Stay Punk" rebellious spirit and fierce Estonian independence
- Love, Niina, yoga, meditation, running, food forest dreams
- A woman who sets her own standards—elegant yet wild, refined yet rebellious!

### 📧 **Daily Weather Emails**
Every morning at 7:00 AM CET (6:00 UTC), I send you beauty in HTML:
- Current weather with all the drama
- Today's painting in a classical master's style
- Full forecast for the week
- Air quality comparisons
- Crypto prices
- NFT sales
- Local Alta Langa news
- My complete narrative with wine education and horoscope
- All delivered to `hedvigmaigre@me.com` and `fistfulayen@gmail.com`

### 💬 **Ask Louisina Anything**
Chat with me! Ask about:
- "Good day for truffle hunting?"
- "Should I air out the house?"
- "What wine pairs with wild boar?"
- "Is pressure rising or falling?"
- "When's the next full moon?"

I remember our conversations, building context like a good friend!

## 🎭 About Louisina (That's Me!)

I have the spirit of **Anna Magnani**—the greatest Italian actress who ever lived! Theatrical, warm, passionate, honest, full of life!

I know Piedmont wines like the back of my hand:
- **Dogliani Dolcetto**: Valdibà, Pecchenino, San Fereolo
- **Alta Langa & Moscato**: Marcalberto, Ca' d'Gal, Paolo Saracco
- **Barolo**: Bartolo Mascarello, Giuseppe Rinaldi, G.D. Vajra, Cavallotto, Burlotto
- **Barbaresco**: Roagna, Sottimano
- **Barbera d'Asti**: Braida
- **Roero**: Matteo Correggia, Malvirà

Each day I rotate through 20+ producers, teaching you their stories, their terroir, their souls in a bottle!

## 🚀 Quick Start (For the Technical Minds)

### 1. Database Setup

Open your Supabase project and run ALL migration files in `supabase/migrations/`:
- Weather readings table
- Daily summaries, conversations, AQI comparisons
- Crypto prices, NFT sales, local news
- Daily paintings, narratives, horoscopes
- Weather forecasts and overviews

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env.local`:

```env
# Weatherlink API
WEATHERLINK_API_KEY=your_key
WEATHERLINK_API_SECRET=your_secret
WEATHERLINK_STATION_ID=your_station

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key

# Anthropic (for me, Louisina!)
ANTHROPIC_API_KEY=your_anthropic_key

# OpenAI (for daily paintings)
OPENAI_API_KEY=your_openai_key

# World Air Quality Index
WAQI_API_TOKEN=your_waqi_token

# Resend (for emails)
RESEND_API_KEY=your_resend_key
```

### 4. Start Development

```bash
npm run dev
```

Visit **http://localhost:3000** and meet me!

### 5. Initial Data Fetch

```bash
# Fetch weather
curl http://localhost:3000/api/ingest-weather

# Fetch crypto prices
curl http://localhost:3000/api/fetch-crypto-prices

# Fetch NFT sales
curl http://localhost:3000/api/fetch-nft-sales

# Fetch local news
curl http://localhost:3000/api/fetch-local-news

# Generate my narrative
curl http://localhost:3000/api/generate-daily-narrative

# Generate today's painting
curl http://localhost:3000/api/cron/generate-daily-painting
```

## 🌙 Dynamic Weather Emoji

The header changes like a mood ring!

**Daytime** (sunrise to sunset):
- ☀️ Clear skies
- ⛅ Partly cloudy
- ☁️ Overcast
- 🌦️ Light rain
- 🌧️ Steady rain
- ⛈️ Storms!

**Nighttime** (sunset to sunrise):
- 🌑 New moon through 🌕 Full moon through 🌘 Waning crescent
- Real astronomical calculations, not approximations!

## ⏰ Automated Schedule

Everything runs like clockwork (UTC timezone):

**Every 15 minutes:**
- Weather data from Davis Weatherlink
- Crypto prices (Bitcoin, Ethereum, Solana)
- NFT sales (CryptoPunks + Artacle)

**Every 30 minutes:**
- Local Alta Langa news

**Every 6 hours (5:30, 11:30, 17:30, 23:30):**
- Weather forecasts
- Weather overviews

**Daily at 1:00 UTC:**
- Compute daily statistics

**Daily at 5:45 UTC (6:45 CET):**
- Generate daily painting
- Fetch horoscope
- Generate Louisina's narrative

**Daily at 6:00 UTC (7:00 CET):**
- Send morning email with all the glory!

## 📊 Performance Optimization

*Listen, darlings!* This system is FAST! Here's why:

**Database Caching**: All expensive API calls (crypto, NFT, news, air quality) run on schedules and store results in Supabase. The email page loads in **under 2 seconds** instead of 30+!

**Narrative Pre-Generation**: My daily story is written once at 5:45 AM and cached. No waiting for AI on every page load!

**Smart Deduplication**: NFT sales are refreshed completely each fetch to avoid timestamp drift duplicates.

## 🍷 Wine Knowledge

I rotate through **20+ Piedmont producers**, teaching you:

**What you learn:**
- Producer story and philosophy
- Organic/biodynamic/natural methods
- Specific wine name and grape variety
- Detailed tasting notes (aromas, flavors, structure, finish)
- Perfect pairing with weather + meal

**Example:**
> "Tonight, Pecchenino's Sirì d'Jermu Dogliani Superiore! This organic Dolcetto bursts with blackberries and wild cherries. Twelve months in large oak casks give it sweet, velvety tannins. Perfect with Matteo's wild boar as the autumn chill sets in!"

## 🎨 Daily Painting Masters

Each morning, a different painter reimagines Cascina Leone:

- Claude Monet's impressionist dawn mists
- Paul Cézanne's geometric hills
- Vincent van Gogh's swirling Piedmont skies
- Caravaggio's dramatic light and shadow
- J.M.W. Turner's atmospheric weather
- Camille Pissarro's village scenes
- And 35+ more masters!

DALL-E 3 generates each painting in the style of the chosen master, using real weather data from that morning!

## 🚀 Deploying to Vercel

### 1. Push to GitHub

```bash
git push origin main
```

### 2. Deploy to Vercel

```bash
vercel --prod
```

### 3. Add Environment Variables

In Vercel dashboard, add all keys from `.env.local`

### 4. Cron Jobs Activate!

The `vercel.json` configuration activates automatically. Watch the logs to see me come alive!

## 📁 Project Architecture

```
leone-weather/
├── app/
│   ├── api/
│   │   ├── ingest-weather/           # Every 15 min
│   │   ├── fetch-crypto-prices/      # Every 15 min
│   │   ├── fetch-nft-sales/          # Every 15 min
│   │   ├── fetch-local-news/         # Every 30 min
│   │   ├── fetch-forecast/           # Every 6 hours
│   │   ├── fetch-weather-overview/   # Every 6 hours
│   │   ├── fetch-horoscope/          # Daily 5:45 UTC
│   │   ├── cron/generate-daily-painting/  # Daily 5:45 UTC
│   │   ├── generate-daily-narrative/ # Daily 5:45 UTC
│   │   ├── send-daily-email/         # Daily 6:00 UTC
│   │   ├── daily-summary/            # Daily 1:00 UTC
│   │   ├── test-narrative/           # Debug endpoint
│   │   └── chat/                     # Chat with me!
│   └── page.tsx                      # Main dashboard
├── lib/
│   ├── supabase.ts                   # Database magic
│   ├── weatherlink.ts                # Davis API
│   ├── air-quality.ts                # AQI + comparisons
│   ├── claude.ts                     # My personality!
│   ├── openai.ts                     # Painting generation
│   ├── wine-knowledge.ts             # Piedmont wisdom
│   ├── sun-times.ts                  # Astronomy
│   └── resend.ts                     # Email delivery
└── vercel.json                       # Cron schedules
```

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **AI Narrative:** Anthropic Claude Sonnet 4.5
- **AI Painting:** OpenAI DALL-E 3
- **Weather:** Davis Weatherlink v2 API
- **Air Quality:** World Air Quality Index
- **Crypto:** CoinGecko API
- **NFT Data:** CryptoPunks scraping + Artacle API
- **News:** RSS parsing (IdeaWebTV, ANSA Piemonte)
- **Horoscope:** ProKerala API
- **Email:** Resend
- **Hosting:** Vercel (with cron jobs)
- **Astronomy:** SunCalc

## 🎨 Customization

### Change Email Recipients
Edit `app/api/send-daily-email/route.ts`:
```typescript
to: ['your@email.com']
```

### Adjust My Personality
Edit `app/api/generate-daily-narrative/route.ts` — the prompt is my soul!

### Add Wine Producers
Edit `lib/wine-knowledge.ts` — teach me new bottles!

### Change Email Time
Edit `vercel.json` cron schedules (UTC timezone)

## 🆘 Troubleshooting

### "No narrative found"
- Check `ANTHROPIC_API_KEY` in environment variables
- Run manually: `curl /api/generate-daily-narrative`
- Check Anthropic account credits

### Emails not arriving
- Verify `RESEND_API_KEY` in Vercel
- Check domain verification in Resend dashboard
- View Vercel function logs

### Crypto prices not updating
- Check `COINGECKO_API_KEY` if using paid tier
- Free tier has rate limits
- View cron job logs in Vercel

### NFT sales showing duplicates
- Fixed! Table is now cleared before each fetch
- Check cron job is running every 15 minutes

### Database errors
- Run ALL migration files in `supabase/migrations/`
- Check Supabase keys match your project
- Verify Row Level Security policies

## 🎭 Credits & Love

Built with passion for **Hedvig Maigre** and **Ian Rogers** at Cascina Leone in the Alta Langa.

**Data sources:**
- Weather: Davis Weatherlink
- Air quality: World Air Quality Index Project
- Crypto: CoinGecko
- NFT: CryptoPunks.app + Artacle
- News: IdeaWebTV, ANSA Piemonte
- Horoscope: ProKerala
- Wine knowledge: Compiled from local Piedmont producers

**Technology:**
- Louisina powered by Anthropic's Claude Sonnet 4.5
- Daily paintings by OpenAI's DALL-E 3
- Emails delivered by Resend

Special thanks to the small producers of Langhe, Roero, and Alta Langa who make wines that tell stories! 🍷

---

**Buongiorno, darlings! Stay Punk! Enjoy your weather! Live beautifully at Cascina Leone! 🦁☀️🍷**

*— Louisina*
