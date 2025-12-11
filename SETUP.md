# 🌤️ Cascina Leone Weather - Setup Instructions

Welcome back! Your weather application is ready to test. Follow these steps to get it running.

## ✅ What's Already Done

Everything is built and ready! Here's what was created:

- ✅ Complete Next.js application with TypeScript and Tailwind CSS
- ✅ All API routes (current weather, air quality, chat, cron jobs)
- ✅ Beautiful dashboard components
- ✅ Leone chat interface with Anna Magnani personality & horoscopes
- ✅ Weatherlink API integration
- ✅ Global AQI comparison system
- ✅ Conversation history system
- ✅ Environment variables configured (.env.local)
- ✅ Git repository initialized
- ✅ Vercel cron jobs configured
- ✅ Database schema created (needs to be applied)
- ✅ Build tested successfully

## 🚀 Quick Start (3 Steps)

### Step 1: Set Up the Database (5 minutes)

The database schema needs to be created in your Supabase project.

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/ypshbbjaftctktvmmvsx/sql
   ```

2. **Open the schema file:**
   - Open `supabase-schema.sql` in this project
   - Copy the entire contents

3. **Run in SQL Editor:**
   - Paste into the Supabase SQL Editor
   - Click **Run**
   - You should see "Success. No rows returned"

This creates 5 tables:
- `readings` - Weather data every 15 min
- `daily_summaries` - Daily statistics
- `conversations` - Chat history with Leone
- `aqi_comparisons` - Global air quality data
- `seasonal_baselines` - Historical averages

### Step 2: Start the Development Server

```bash
npm run dev
```

The app will start at **http://localhost:3000**

### Step 3: Fetch Your First Weather Data

**Option A - Browser:**
Open http://localhost:3000/api/ingest-weather in your browser

**Option B - Terminal:**
```bash
npx tsx scripts/fetch-initial-data.ts
```

**Option C - curl:**
```bash
curl http://localhost:3000/api/ingest-weather
```

You should see:
```json
{
  "success": true,
  "timestamp": "2025-12-11T...",
  "message": "Weather data ingested successfully"
}
```

## 🎉 You're Done!

Visit **http://localhost:3000** and you should see:

1. **Current Weather** - Live conditions from Cascina Leone
2. **Today's Summary** - Temperature, humidity, rain, pressure
3. **Air Quality Card** - AQI with global comparisons
4. **Chat with Leone** - Ask questions!

## 💬 Try Chatting with Leone

Click in the chat box and ask:
- "Is it a good day to air out the house?"
- "Should I worry about the air quality?"
- "What's the coldest it's been this week?"
- "Good day to hang laundry outside?"

Leone will respond with:
- Dramatic Italian flair (Mamma mia!)
- Practical weather advice
- A personalized horoscope for Hedvig!

## 📊 What Happens Next?

### During Development:
- Weather data updates when you manually trigger `/api/ingest-weather`
- Air quality comparisons fetch automatically
- Chat history is saved per session
- Data auto-refreshes every 5 minutes on the page

### When Deployed to Vercel:
- Weather data ingests automatically every 15 minutes
- Daily summaries compute at 1 AM Europe/Rome time
- Everything runs on Vercel's infrastructure

## 🔍 Verify Everything Works

### Check Current Weather
```bash
curl http://localhost:3000/api/current
```

Should return temperature, humidity, pressure, etc.

### Check Air Quality
```bash
curl http://localhost:3000/api/air-quality
```

Should return AQI with city comparisons.

### Check Database
Visit Supabase Table Editor:
```
https://supabase.com/dashboard/project/ypshbbjaftctktvmmvsx/editor
```

You should see data in the `readings` table.

## 🚀 Ready to Deploy to Vercel?

Once you've tested locally and everything works:

### 1. Create GitHub Repository

Go to https://github.com/new and create a repo called `leone-weather`

Then push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/leone-weather.git
git push -u origin main
```

### 2. Deploy to Vercel

```bash
vercel
```

Follow the prompts to deploy.

### 3. Add Environment Variables in Vercel

In your Vercel project → Settings → Environment Variables, add all variables from `.env.local`:

```
WEATHERLINK_API_KEY
WEATHERLINK_API_SECRET
WEATHERLINK_STATION_ID
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
ANTHROPIC_API_KEY
```

### 4. Configure Custom Domain

In Vercel → Domains:
1. Add `weather.altalanga.love`
2. Vercel provides DNS records
3. In GoDaddy, add CNAME record:
   - Name: `weather`
   - Value: `cname.vercel-dns.com`

The cron jobs in `vercel.json` will activate automatically!

## 🐛 Troubleshooting

### "No weather data available"
Run the data fetch: `npx tsx scripts/fetch-initial-data.ts`

### Database errors
Make sure you ran the SQL schema in Supabase SQL Editor

### Air quality shows "Loading..."
First AQI fetch happens with first weather ingest. Wait ~1 minute.

### Chat not responding
Check that ANTHROPIC_API_KEY is set correctly in `.env.local`

### Port 3000 already in use
```bash
lsof -ti:3000 | xargs kill
npm run dev
```

## 📚 Next Steps

1. **Test locally** - Make sure everything works
2. **Push to GitHub** - Version control
3. **Deploy to Vercel** - Go live!
4. **Configure domain** - weather.altalanga.love
5. **Enjoy** - Check the weather with Leone!

## 🎨 Customization Ideas

- **Change Leone's personality** - Edit `lib/claude.ts`
- **Add more comparison cities** - Edit `lib/air-quality.ts`
- **Adjust refresh rates** - Edit `vercel.json` cron schedules
- **Add more components** - Week view, historical charts, etc.

## 📖 Full Documentation

See `README.md` for complete documentation including:
- Project structure
- API endpoints
- Deployment guide
- Tech stack details

---

**Buongiorno! Your weather app is ready to go! ☀️**

If you have any questions or issues, check the README or examine the code - everything is well-commented and organized.

Enjoy chatting with Leone! 🎭
