# 🌤️ Cascina Leone Weather Agent

Your personal weather companion for Cascina Leone in beautiful Piedmont, Italy.

## What is This?

A Next.js web application that transforms raw weather data from your Davis Weatherlink station into beautiful, actionable insights. Features:

- **Real-time weather dashboard** with current conditions
- **Air quality monitoring** with global comparisons
- **Leone, your dramatic weather companion** - Chat with an AI agent that has the personality of Italian actress Anna Magnani
- **Personalized horoscopes** for Hedvig in every response!
- **Smart insights** like "Should I air out the house?" or "Good day for laundry?"

Built with Next.js, TypeScript, Tailwind CSS, Supabase, and Claude.

## 🚀 Quick Start

### 1. Database Setup

**Go to your Supabase project:**
1. Open https://supabase.com/dashboard/project/ypshbbjaftctktvmmvsx
2. Navigate to **SQL Editor**
3. Open the file `supabase-schema.sql` from this project
4. Copy and paste the entire contents into the SQL Editor
5. Click **Run** to create all tables

This will create:
- `readings` - Weather data captured every 15 minutes
- `daily_summaries` - Computed daily statistics
- `conversations` - Chat history with Leone
- `aqi_comparisons` - Air quality data for comparison cities
- `seasonal_baselines` - For "warmer/colder than normal" comparisons

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

### 4. Fetch Your First Weather Data

Open a new terminal and run:

```bash
npx tsx scripts/fetch-initial-data.ts
```

Or simply visit in your browser:
```
http://localhost:3000/api/ingest-weather
```

This will fetch current conditions from your Weatherlink station and populate the database.

### 5. Explore!

Visit **http://localhost:3000** and you should see:
- Current weather conditions
- Air quality with global comparisons
- Today's summary
- Chat with Leone (try asking "Is it a good day to air out the house?")

## 📁 Project Structure

```
leone-weather/
├── app/
│   ├── api/
│   │   ├── current/           # Current weather conditions
│   │   ├── air-quality/       # AQI data and comparisons
│   │   ├── chat/              # Leone chat interface
│   │   ├── ingest-weather/    # Cron: Fetch from Weatherlink
│   │   └── daily-summary/     # Cron: Compute daily stats
│   ├── page.tsx               # Main dashboard
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── components/
│   ├── CurrentWeather.tsx     # Current conditions card
│   ├── AirQualityCard.tsx     # Air quality display
│   ├── TodaySummary.tsx       # Today's stats
│   └── ChatInterface.tsx      # Leone chat UI
├── lib/
│   ├── supabase.ts            # Supabase client
│   ├── weatherlink.ts         # Weatherlink API integration
│   ├── air-quality.ts         # AQI fetching and narratives
│   ├── claude.ts              # Leone personality + Claude AI
│   └── insights.ts            # Weather insights generator
├── scripts/
│   └── fetch-initial-data.ts  # Initial data fetch helper
├── supabase-schema.sql        # Database schema
├── vercel.json                # Vercel cron jobs config
└── .env.local                 # Environment variables (created)
```

## 🔑 Environment Variables

Already configured in `.env.local` (not committed to git):

```env
# Weatherlink API
WEATHERLINK_API_KEY=your_weatherlink_api_key
WEATHERLINK_API_SECRET=your_weatherlink_api_secret
WEATHERLINK_STATION_ID=your_station_id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 🤖 Meet Leone

Leone is your weather companion with the dramatic flair of Italian actress Anna Magnani! Every response includes:
- Over-the-top theatrical weather commentary
- Practical, helpful advice
- A personalized horoscope for Hedvig
- Italian expressions (Mamma mia! Bellissimo!)

Try asking:
- "Is it a good day to air out the house?"
- "Should I worry about the air quality?"
- "What's the coldest it's been this week?"
- "Good day to hang laundry outside?"

## 📊 API Endpoints

### `GET /api/current`
Returns current weather conditions with insights.

### `GET /api/air-quality`
Returns AQI with global city comparisons and narrative story.

### `POST /api/chat`
Chat with Leone. Send:
```json
{
  "message": "Is it going to rain?",
  "sessionId": "session_123"
}
```

### `GET /api/ingest-weather`
Fetches data from Weatherlink and stores in database. Runs every 15 minutes via Vercel cron when deployed.

### `GET /api/daily-summary`
Computes daily statistics. Runs at 1 AM daily via Vercel cron when deployed.

## 🚀 Deploying to Vercel

### 1. Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit - Cascina Leone Weather Agent"
```

### 2. Push to GitHub

Create a new repository on GitHub called `leone-weather`, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/leone-weather.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Vercel

```bash
vercel
```

Follow the prompts:
- Link to existing project or create new
- Set up project settings
- Deploy!

### 4. Add Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add all variables from `.env.local`.

### 5. Configure Custom Domain

In Vercel project settings → Domains:
1. Add `weather.altalanga.love`
2. Vercel will provide DNS records
3. Add a CNAME record in GoDaddy:
   - Type: CNAME
   - Name: weather
   - Value: cname.vercel-dns.com

### 6. Cron Jobs

The `vercel.json` file already configures:
- Weather ingestion every 15 minutes
- Daily summary at 1 AM Europe/Rome time

These activate automatically when deployed to Vercel.

## 🔧 Development

### Fetching Weather Data Manually

During development, trigger data ingestion:

```bash
curl http://localhost:3000/api/ingest-weather
```

### Viewing Database

Use Supabase Table Editor:
```
https://supabase.com/dashboard/project/ypshbbjaftctktvmmvsx/editor
```

### Testing Leone's Personality

Leone's personality is defined in `lib/claude.ts`. The system prompt includes:
- Anna Magnani's dramatic style
- Weather expertise
- Horoscope generation
- Italian expressions

## 🌍 Air Quality Comparisons

The app fetches AQI data from the World Air Quality Index API for:
- Milan, Turin, Rome (Italy)
- Paris (France)
- London (UK)
- Barcelona (Spain)
- Berlin (Germany)
- Los Angeles, New York (USA)
- Shanghai (China)

Data is cached in Supabase and refreshed periodically.

## 📝 Notes

- **Weather data updates every 15 minutes** (when cron runs on Vercel, or manually during dev)
- **Chat history is preserved** per session - Leone remembers your conversation
- **Air quality comparisons** update every ~2.5 hours
- **All times are in Europe/Rome timezone** (matching your location)

## 🎨 Customization

### Changing Leone's Personality

Edit `lib/claude.ts` → `LEONE_SYSTEM_PROMPT`

### Adding More Cities for AQI Comparison

Edit `lib/air-quality.ts` → `COMPARISON_CITIES`

### Adjusting Data Refresh Rate

Edit `vercel.json` cron schedules (uses cron syntax)

## 🆘 Troubleshooting

### "No weather data available"
Run the initial data fetch: `npx tsx scripts/fetch-initial-data.ts`

### Air quality shows "Loading..."
The first AQI fetch happens with the first weather ingest. Wait a few minutes or manually trigger.

### Chat not working
Check that your Anthropic API key is correctly set in `.env.local`

### Database errors
Ensure you've run the `supabase-schema.sql` in the Supabase SQL Editor

## 📚 Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude (Anthropic)
- **Weather API:** Davis Weatherlink v2
- **Air Quality:** World Air Quality Index API
- **Hosting:** Vercel (with cron jobs)

## 🎭 Credits

Built with love for Ian and Hedvig at Cascina Leone.

Weather station data courtesy of Davis Weatherlink.
Air quality data from the World Air Quality Index Project.
Powered by Anthropic's Claude for Leone's fabulous personality.

---

**Buongiorno! Enjoy your weather! ☀️🌧️❄️**
