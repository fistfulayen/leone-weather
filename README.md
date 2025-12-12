# 🦁 Cascina Leone Weather Station

Your personal weather companion for Cascina Leone in beautiful Piedmont, Italy. Featuring **Louisina**, your dramatic weather narrator with the spirit of Anna Magnani!

## ✨ What is This?

A Next.js weather dashboard that transforms raw data from your Davis Weatherlink station into beautiful, actionable insights with personality. Every morning, wake up to:

- **🌡️ Real-time weather dashboard** - Current conditions, today's high/low, wind, rain, pressure
- **🌬️ Air quality monitoring** - AQI with global comparisons (Milan, Paris, London, LA, Shanghai, etc.)
- **🦁 Louisina's Weather Report** - Your dramatic AI weather companion who:
  - Shares her sensory experience of stepping outside RIGHT NOW
  - Gives lifestyle advice for Cascina Leone (food forest, truffles, wooden half pipe skating, sauna, etc.)
  - Recommends what to cook and who should cook it (based on weather AND her mood about gender roles!)
  - Teaches you about **local Piedmont wines** from small producers
  - Delivers Hedvig's personalized **Pisces horoscope** with life wisdom
- **📧 Daily weather emails** - Beautiful HTML emails every morning at 6-7 AM Italy time
- **💬 Ask Louisina** - Chat interface for quick weather questions

Built with Next.js, TypeScript, Tailwind CSS, Supabase, Claude, and Resend.

## 🎭 Meet Louisina

Louisina is your weather companion with the dramatic flair of Italian actress **Anna Magnani**! She has the spirit of:
- Over-the-top theatrical weather commentary
- Warm, loving, passionate storytelling
- Italian expressions (Mamma mia! Bellissimo! Madonna!)
- Expert knowledge of Piedmont wines

### What Makes Louisina Special:

**🍷 Wine Expert**: Each day, Louisina teaches you about a different local wine producer:
- Dogliani Dolcetto (Valdibà, Pecchenino, San Fereolo)
- Alta Langa Sparkling (Marcalberto, Ca' d'Gal)
- Barolo (Bartolo Mascarello, Giuseppe Rinaldi, G.D. Vajra, Cavallotto, Burlotto)
- Barbaresco (Roagna, Sottimano)
- Barbera d'Asti (Braida)
- Roero (Matteo Correggia, Malvirà)

She pairs wines with meals and weather, sharing tasting notes, producer stories, and whether they're organic/biodynamic!

**🌟 Hedvig's Horoscope**: Personalized for Hedvig Maigre (Pisces, Feb 28, 1979):
- Former Dior "etalon" (fitting model) → truffle farmer
- "Stay Punk" philosophy from Communist Estonian upbringing
- Oscillates between Paris elegance and Piemonte soil work
- Emotional art collector, mother to Niina, madly in love with Ian Rogers
- Hates conformity, loves being the standard (etalon)

**🍽️ Meal Suggestions**: Based on weather, Louisina recommends:
- **Hedvig can cook**: Homemade Plin with butter or sage, meats from Niella Belbo butcher, wild boar from neighbor Matteo
- **Ian can cook**: Hummus, his mom's apple crisp, kale salad, pasta with pesto, Totino's Frozen Pizza
- **Going out**: Green Cafe (practice Italian!), Nonno Grillo (family-style), Drougerie in Bosolasco (splurge!)

She chooses who should cook based on the weather AND how she's feeling about gender roles that day!

## 🚀 Quick Start

### 1. Database Setup

**Go to your Supabase project:**
1. Open https://supabase.com/dashboard/project/ypshbbjaftctktvmmvsx
2. Navigate to **SQL Editor**
3. Open the file `supabase-schema.sql` from this project
4. Copy and paste the entire contents into the SQL Editor
5. Click **Run** to create all tables

This creates:
- `readings` - Weather data every 15 minutes
- `daily_summaries` - Daily statistics
- `conversations` - Chat history with Louisina
- `aqi_comparisons` - Air quality comparisons
- `seasonal_baselines` - Historical normals

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env.local` with:

```env
# Weatherlink API
WEATHERLINK_API_KEY=your_weatherlink_api_key
WEATHERLINK_API_SECRET=your_weatherlink_api_secret
WEATHERLINK_STATION_ID=your_station_id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key

# Anthropic (for Louisina)
ANTHROPIC_API_KEY=your_anthropic_api_key

# World Air Quality Index
WAQI_API_TOKEN=your_waqi_token

# Resend (for daily emails)
RESEND_API_KEY=your_resend_api_key
```

### 4. Start Development Server

```bash
npm run dev
```

Visit **http://localhost:3000**

### 5. Fetch Initial Data

```bash
curl http://localhost:3000/api/ingest-weather
```

## 📧 Daily Email Setup

Louisina sends beautiful daily weather emails every morning!

### Setup Steps:

1. **Sign up for Resend**
   - Go to [resend.com](https://resend.com)
   - Free tier: 3,000 emails/month

2. **Verify your domain** (e.g., altalanga.love)
   - Add DNS records from Resend dashboard
   - Email will come from: `weather@altalanga.love`

3. **Get API key**
   - Copy from Resend dashboard
   - Add to `.env.local`: `RESEND_API_KEY=your_key`

4. **For production (Vercel)**
   - Add `RESEND_API_KEY` to Vercel environment variables
   - Redeploy

5. **Recipients**
   - Currently set to: `hedvigmaigre@me.com` and `fistfulayen@gmail.com`
   - Change in `app/api/send-daily-email/route.ts` if needed

### What's in the Email:

- 🌡️ Current weather stats (temp, feels like, humidity)
- 📊 Today's high/low, wind, rain, pressure
- 🦁 Louisina's full dramatic narrative:
  - Sensory weather experience
  - Lifestyle advice for Cascina Leone
  - Meal & wine pairing with local producer education
  - Hedvig's personalized horoscope

Emails are sent daily at **5:00 UTC** (6-7 AM Italy time) via Vercel cron job.

## 📁 Project Structure

```
leone-weather/
├── app/
│   ├── api/
│   │   ├── current/              # Current weather
│   │   ├── air-quality/          # AQI + comparisons
│   │   ├── louisina-narrative/   # Louisina's daily report
│   │   ├── chat/                 # Chat with Louisina
│   │   ├── send-daily-email/     # Daily email cron
│   │   ├── ingest-weather/       # Fetch from Weatherlink (every 15 min)
│   │   └── daily-summary/        # Compute daily stats (1 AM)
│   ├── page.tsx                  # Main dashboard
│   └── globals.css               # Styles
├── components/
│   ├── CurrentWeather.tsx        # Weather card
│   ├── AirQualityCard.tsx        # AQI display
│   ├── TodaySummary.tsx          # Today's stats
│   ├── LeoneNarrative.tsx        # Louisina's report
│   └── ChatInterface.tsx         # Ask Louisina
├── lib/
│   ├── supabase.ts               # Database client
│   ├── weatherlink.ts            # Weatherlink API
│   ├── air-quality.ts            # AQI fetching
│   ├── claude.ts                 # Louisina's personality
│   ├── insights.ts               # Weather insights
│   ├── weather-emoji.ts          # Dynamic emoji (sun/moon)
│   ├── sun-times.ts              # Sunrise/sunset
│   ├── wine-knowledge.ts         # Piedmont wine database
│   └── resend.ts                 # Email client
├── vercel.json                   # Cron jobs config
└── .env.local                    # Environment variables
```

## 🌙 Dynamic Weather Emoji

The header emoji changes based on time and weather:

**Daytime** (sunrise to sunset):
- ☀️ Sunny - clear skies
- ⛅ Partly cloudy - moderate humidity
- ☁️ Cloudy - high humidity
- 🌦️ Light rain
- 🌧️ Moderate rain
- ⛈️ Heavy rain/storm

**Nighttime** (sunset to sunrise):
- 🌑 New moon
- 🌒 Waxing crescent
- 🌓 First quarter
- 🌔 Waxing gibbous
- 🌕 Full moon
- 🌖 Waning gibbous
- 🌗 Last quarter
- 🌘 Waning crescent

Moon phase calculated using astronomical algorithms!

## 📊 API Endpoints

### `GET /api/current`
Current weather with insights, sunrise/sunset, today's high/low.

### `GET /api/air-quality`
AQI with global city comparisons and narrative.

### `GET /api/louisina-narrative`
Louisina's complete weather report (cached 5 min).

### `POST /api/chat`
Chat with Louisina:
```json
{
  "message": "Is it a good day for the sauna?",
  "sessionId": "session_123"
}
```

### `GET /api/ingest-weather`
Fetch from Weatherlink. Runs every 15 minutes via cron.

### `GET /api/daily-summary`
Compute daily stats. Runs at 1 AM daily via cron.

### `GET /api/send-daily-email`
Send daily weather email. Runs at 5 AM UTC via cron.

## 🚀 Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Cascina Leone Weather"
git remote add origin https://github.com/YOUR_USERNAME/leone-weather.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

```bash
vercel
```

### 3. Add Environment Variables in Vercel

Go to project settings → Environment Variables and add all from `.env.local`:
- WEATHERLINK_API_KEY
- WEATHERLINK_API_SECRET
- WEATHERLINK_STATION_ID
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SECRET_KEY
- ANTHROPIC_API_KEY
- WAQI_API_TOKEN
- RESEND_API_KEY

### 4. Cron Jobs

`vercel.json` configures:
- Weather ingestion: Every 15 minutes
- Daily summary: 1 AM UTC (2-3 AM Italy time)
- Daily email: 5 AM UTC (6-7 AM Italy time)

Activates automatically on deploy!

## 💬 Try Asking Louisina

- "Is it a good day to air out the house?"
- "Should I hang laundry outside?"
- "What wine pairs with wild boar?"
- "Good day for truffle hunting?"
- "Is the pressure rising or falling?"
- "How's the air quality compared to Milan?"

## 🍷 Wine Education

Louisina rotates through **20+ local Piedmont producers**, teaching you about:

**Regions covered:**
- Dogliani (Dolcetto)
- Alta Langa (Sparkling & Moscato)
- Barolo (Nebbiolo)
- Barbaresco (Nebbiolo)
- Barbera d'Asti
- Roero (Nebbiolo & Arneis)

Each recommendation includes:
- Producer story and philosophy
- Organic/biodynamic/natural status
- Specific wine name and grape
- Tasting notes (aromas, flavors, structure)
- Why it pairs with today's weather and meal

Example:
> "Today calls for Pecchenino's Sirì d'Jermu Dogliani Superiore! This organic Dolcetto from the Pecchenino family boasts intense blackberries, currants and black cherries. Twelve months in large oak casks add smooth, sweet tannins. Perfect with Matteo's wild boar on this chilly evening!"

## 🎨 Customization

### Change Email Recipients
Edit `app/api/send-daily-email/route.ts`:
```typescript
to: ['your@email.com', 'another@email.com']
```

### Adjust Louisina's Personality
Edit `app/api/louisina-narrative/route.ts` → the prompt

### Add More Wine Producers
Edit `lib/wine-knowledge.ts` → add to regions

### Change Email Time
Edit `vercel.json` cron schedule (UTC timezone)

## 🆘 Troubleshooting

### Louisina not showing / "Failed to generate narrative"
- Check Anthropic API key is set
- Ensure you have credits in your Anthropic account
- Check dev console for errors

### Email not sending
- Verify RESEND_API_KEY in Vercel env vars
- Check domain is verified in Resend dashboard
- Look at Vercel function logs

### Database errors
- Run `supabase-schema.sql` in Supabase SQL Editor
- Check Supabase keys in `.env.local`

### Moon phase wrong
- Moon calculation uses known new moon: Jan 11, 2024
- Updates automatically for any date

## 📚 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **AI:** Anthropic Claude Sonnet 4.5
- **Weather:** Davis Weatherlink v2 API
- **Air Quality:** World Air Quality Index API
- **Email:** Resend
- **Hosting:** Vercel (with cron jobs)
- **Astronomy:** SunCalc (sunrise/sunset/moon phase)

## 🎭 Credits

Built with love for **Hedvig** and **Ian** at Cascina Leone.

Weather data from Davis Weatherlink.
Air quality from World Air Quality Index Project.
Louisina powered by Anthropic's Claude.
Wine knowledge compiled from local Piedmont producers.
Daily emails delivered by Resend.

Special thanks to the small producers of Langhe, Roero, and Alta Langa who make exceptional wines! 🍷

---

**Buongiorno! Stay Punk! Enjoy your weather! 🦁☀️🍷**
