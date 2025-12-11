# Cascina Leone Weather Agent

A personal weather companion for Cascina Leone, living at **weather.altalanga.love**

## Overview

**Goal:** A simple, beautiful web page that tells you what's happening with the weather at the cascina—right now, today, this week—in terms that actually matter. No meteorology degree required. Includes a chat interface to ask questions in natural language.

**Primary Users:** Ian and his wife
**Station:** Davis Weatherlink at Cascina Leone
**URL:** weather.altalanga.love

---

## The Experience

When you open the page, you should immediately understand:
1. **What it feels like outside right now**
2. **Anything notable or actionable** (frost tonight, great air quality, rain coming)
3. **How today compares** to recent days and what's normal for this time of year

Everything should be glanceable. The chat box is there when you want to dig deeper or ask specific questions.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    weather.altalanga.love                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     Web Application                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │   │
│  │  │  Weather    │  │  Air        │  │  Chat               │  │   │
│  │  │  Dashboard  │  │  Quality    │  │  Interface          │  │   │
│  │  │             │  │  Story      │  │                     │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Backend API                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Weather      │  │ Context &    │  │ Chat                     │   │
│  │ Data API     │  │ Insights     │  │ (Claude)                 │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Davis Weatherlink│  │ SQLite/DuckDB    │  │ AQI Context      │
│ API              │  │ Historical DB    │  │ (cached research)│
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Page Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  ☀️ Cascina Leone                                    Thu 11 Dec, 09:36  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                                                                 │  │
│  │   3.6°C                                                         │  │
│  │   Feels like 2°C · Humidity 79%                                 │  │
│  │                                                                 │  │
│  │   Clear and cold. A bit colder than yesterday morning.         │  │
│  │   No rain expected—pressure is steady.                         │  │
│  │                                                                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐ │
│  │  TODAY                  │  │  AIR QUALITY                        │ │
│  │                         │  │                                     │ │
│  │  High: 5.8°C (midnight) │  │  Excellent ●                        │ │
│  │  Low:  3.5°C (06:28)    │  │                                     │ │
│  │  Rain: 0mm              │  │  "The air right now is cleaner than │ │
│  │                         │  │   92% of places in Europe. You're   │ │
│  │  Inside: 13.9°C, 63%    │  │   breathing some of the best air    │ │
│  │                         │  │   on the continent."                │ │
│  │                         │  │                                     │ │
│  │  Pressure: 767 mmHg     │  │  [What does this mean?]             │ │
│  │  (steady)               │  │                                     │ │
│  └─────────────────────────┘  └─────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  THIS WEEK                                                       │ │
│  │  ┌────┬────┬────┬────┬────┬────┬────┐                           │ │
│  │  │Mon │Tue │Wed │Thu │Fri │Sat │Sun │                           │ │
│  │  │ 8° │ 6° │ 4° │ 4° │ -- │ -- │ -- │  ← High temps             │ │
│  │  │ 2° │ 1° │-1° │ 2° │ -- │ -- │ -- │  ← Low temps              │ │
│  │  │ ○  │ ○  │ ○  │ ○  │    │    │    │  ← Conditions             │ │
│  │  └────┴────┴────┴────┴────┴────┴────┘                           │ │
│  │                                                                  │ │
│  │  It's been a cold week—about 3°C below normal for December.     │ │
│  │  No rain since Monday.                                          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  💬 Ask me anything                                              │ │
│  │  ┌────────────────────────────────────────────────────────────┐  │ │
│  │  │ Is it a good day to air out the house?                     │  │ │
│  │  └────────────────────────────────────────────────────────────┘  │ │
│  │                                                          [Ask →] │ │
│  │                                                                  │ │
│  │  ┌────────────────────────────────────────────────────────────┐  │ │
│  │  │ Perfect day for it, actually! The air quality is excellent │  │ │
│  │  │ (AQI 15.7) and humidity isn't too high outside. Open the   │  │ │
│  │  │ windows for a couple hours this afternoon when it warms    │  │ │
│  │  │ up a bit—you'll refresh the indoor air without losing too  │  │ │
│  │  │ much heat.                                                 │  │ │
│  │  └────────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  Last updated: 06:30 · Station: Cascina Leone · [View detailed data]   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Air Quality: Making It Meaningful

The AQI numbers from your station (15.7, PM2.5 at 15.7 µg/m³, etc.) mean nothing to most people. The goal is to translate these into **understandable, contextual, actionable information**.

### The Air Quality Story

Instead of showing raw numbers, we tell a story with three parts:

#### 1. Simple Rating with Color
```
Excellent ●  |  Good ●  |  Moderate ●  |  Poor ●  |  Unhealthy ●
```

#### 2. Contextual Comparison
Compare your air to places people understand:

| Your AQI | Comparison |
|----------|------------|
| 0-15 | "Cleaner than a mountain forest. Among the best air in Europe right now." |
| 15-25 | "Excellent—like a clear day in the Alps. Better than 90% of European cities." |
| 25-50 | "Good air. Similar to a quiet day in a small Italian town away from traffic." |
| 50-100 | "Moderate. Comparable to a typical day in Milan's suburbs. Sensitive people may notice." |
| 100-150 | "Like standing near a busy road. Consider keeping windows closed." |
| 150+ | "Urban pollution levels. Limit time outdoors, keep windows closed." |

#### 3. What's Causing It
Based on patterns, time of day, and season:

- **Early morning spike (like your 05:25 high):** "Probably wood smoke from neighbors starting their fires. Common on cold mornings."
- **Steady low readings:** "Clean air flowing down from the hills."
- **Daytime increase:** "Could be agricultural activity or distant traffic."
- **Evening spike:** "Wood burning season—everyone's fires getting going for the night."

#### 4. Health Context (When Relevant)
Only shown when air quality is notable:

- **Excellent:** "Safe for all activities. Great day for outdoor exercise."
- **Moderate:** "Most people won't notice anything. Those with asthma or respiratory conditions might want to limit prolonged outdoor exertion."
- **Poor:** "Consider keeping windows closed. Not ideal for outdoor exercise."

### Air Quality Data Sources for Context

To make comparisons meaningful, we cache/reference:

1. **European Air Quality Index data** (European Environment Agency)
   - Average readings for major cities
   - Percentile rankings
   
2. **WHO Guidelines**
   - PM2.5: 15 µg/m³ annual mean, 45 µg/m³ 24-hour mean
   - PM10: 45 µg/m³ annual mean, 45 µg/m³ 24-hour mean
   
3. **Typical readings for reference points:**
   - Alpine villages: AQI 5-20
   - Rural Italy: AQI 15-35
   - Italian suburbs: AQI 30-60
   - Milan city center: AQI 50-100+
   - Beijing bad day: AQI 200+

### Example Air Quality Display States

**Excellent (Your current reading: AQI 15.7)**
```
┌─────────────────────────────────────────────────────────────────┐
│  AIR QUALITY                                                    │
│                                                                 │
│  Excellent ●                                          AQI 15.7  │
│                                                                 │
│  The air at Cascina Leone right now is cleaner than 92% of      │
│  monitoring stations in Europe. You're breathing mountain-      │
│  quality air.                                                   │
│                                                                 │
│  PM2.5: 15.7 µg/m³ · PM10: 16.3 µg/m³                          │
│  (Both well below WHO guidelines)                               │
│                                                                 │
│  📈 This morning's peak (35 at 05:25) was likely wood smoke     │
│     from early fires—now cleared.                               │
└─────────────────────────────────────────────────────────────────┘
```

**Moderate (Hypothetical: AQI 65)**
```
┌─────────────────────────────────────────────────────────────────┐
│  AIR QUALITY                                                    │
│                                                                 │
│  Moderate ●                                             AQI 65  │
│                                                                 │
│  The air is similar to a typical day in Turin's residential     │
│  areas. Fine for most people, but if you have asthma or are     │
│  sensitive to air quality, maybe skip the long run today.       │
│                                                                 │
│  PM2.5: 42 µg/m³ (above WHO daily guideline of 15)             │
│                                                                 │
│  🔥 It's wood-burning season, and cold mornings mean more       │
│     fires. The haze usually lifts by midday.                    │
│                                                                 │
│  Compared to right now:                                         │
│  • Milan: AQI 78 (Moderate)                                     │
│  • Turin: AQI 62 (Moderate)                                     │
│  • Alpine village: AQI 12 (Excellent)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Chat Interface

### Purpose
Let users ask natural questions and get answers in the agent's voice, with full context of current and historical weather data.

### Example Queries & Responses

**"Is it going to rain?"**
> Looking at the pressure (steady at 767 mmHg) and the pattern over the last few days, I don't see rain coming soon. It's been dry since Monday and the barometer isn't showing any incoming weather systems. That said, I can only tell you what the station sees—I don't have forecast data. But right now, everything points to continued dry weather.

**"Should I worry about the air quality?"**
> Not at all today. AQI 15.7 is excellent—better than most of Europe right now. You did have a brief spike to 35 around 5:25 this morning, probably from neighbors' wood fires getting started, but it cleared quickly. The air right now is cleaner than a typical day in the Alps.

**"What's the coldest it's been this week?"**
> Wednesday night dropped to -1°C—the only time we've gone below freezing this week. Last night was milder at 3.5°C. Overall it's been a cold week though, running about 3 degrees below normal for mid-December.

**"Good day to hang laundry outside?"**
> Hmm, tricky. No rain, which is good, but 79% humidity means things will dry slowly. There's basically no wind (0 km/h average), so you won't get much help there. If you hang it out by mid-morning when temperatures climb a bit, you might get things dry by late afternoon—but I'd have a backup plan for bringing them in if they're still damp. Tomorrow might be better if the humidity drops.

**"How's the inside of the house?"**
> 13.9°C inside with 63% humidity. That's on the cool side for comfort—most people prefer 18-21°C. The humidity is fine, right in the healthy range. With the excellent air quality outside (AQI 15.7), it's actually a good day to open windows for a bit to freshen things up, then warm the house back up.

### Chat Implementation

```typescript
// Chat request handler
interface ChatRequest {
  message: string;
  conversationHistory?: Message[];  // Optional for follow-ups
}

interface ChatResponse {
  response: string;
  relatedData?: {
    // Optionally surface relevant data points
    metric: string;
    value: string;
  }[];
}
```

**System prompt for chat includes:**
- Current conditions
- Today's highs/lows
- Week's context
- Air quality with comparisons
- Inside conditions
- Historical baselines
- Voice/personality configuration

---

## Voice Configuration

```yaml
# config/voice.yaml

name: "Leone"

personality:
  style: "Knowledgeable neighbor who happens to be a weather enthusiast"
  traits:
    - Warm and conversational
    - Practical—focuses on what you can do with the information
    - Honest about uncertainty ("I only see what the station tells me")
    - Occasional dry wit
    - Knows the local context (rural Piedmont, wood-burning season, etc.)
  
  avoid:
    - Weather jargon without explanation
    - False precision ("there's a 23% chance...")
    - Being preachy about health/safety
    - Excessive caveats

tone:
  default: casual
  adjust_for:
    - health_concerns: slightly more careful/serious
    - simple_questions: brief and direct
    - curious_questions: more expansive, educational

language:
  primary: english
  occasional_italian: true  # "Buongiorno", "bel tempo", etc.
  units: metric

examples:
  greeting: "Buongiorno! Here's what's happening at the cascina..."
  uncertainty: "I can only tell you what the station sees, not predict the future—but based on the pattern..."
  good_news: "The air is gorgeous today—cleaner than just about anywhere in Europe."
  concerning: "Worth noting: the AQI crept up this morning. Probably wood smoke. Should clear soon."
```

---

## Technical Specification

### Stack

```
Frontend:       Next.js or SvelteKit (SSR for fast initial load)
Styling:        Tailwind CSS
Backend:        Node.js/Express or Next.js API routes
Database:       SQLite (simple) or PostgreSQL (if scaling)
LLM:            Claude API (claude-sonnet-4-5-20250929)
Hosting:        Vercel, Railway, or VPS
Domain:         weather.altalanga.love
```

### API Endpoints

```
GET  /api/current          → Current conditions + insights
GET  /api/today            → Today's summary with highs/lows
GET  /api/week             → Last 7 days of data
GET  /api/air-quality      → AQI with full contextual story
POST /api/chat             → Chat interface
GET  /api/history?days=30  → Historical data for charts
```

### Data Flow

1. **Ingestion (every 15 min)**
   - Fetch from Davis Weatherlink API
   - Store in database
   - Update cached current conditions

2. **Context Building (on request)**
   - Assemble current + historical data
   - Calculate comparisons
   - Generate insights
   - Build air quality narrative

3. **Chat (on demand)**
   - Receive user question
   - Build full context
   - Send to Claude with system prompt
   - Return response

### Database Schema

```sql
-- Raw readings (every 15 minutes)
CREATE TABLE readings (
  id INTEGER PRIMARY KEY,
  timestamp DATETIME NOT NULL,
  
  -- Outdoor
  temp_c REAL,
  humidity REAL,
  dew_point_c REAL,
  heat_index_c REAL,
  wind_chill_c REAL,
  
  -- Wind
  wind_speed_kmh REAL,
  wind_dir_deg INTEGER,
  wind_gust_kmh REAL,
  
  -- Rain
  rain_rate_mmh REAL,
  rain_day_mm REAL,
  
  -- Pressure
  barometer_mmhg REAL,
  
  -- Air Quality
  aqi REAL,
  pm1_ugm3 REAL,
  pm25_ugm3 REAL,
  pm10_ugm3 REAL,
  
  -- Indoor
  indoor_temp_c REAL,
  indoor_humidity REAL
);

-- Daily summaries (computed nightly)
CREATE TABLE daily_summaries (
  date DATE PRIMARY KEY,
  temp_high REAL,
  temp_high_at TIME,
  temp_low REAL,
  temp_low_at TIME,
  temp_avg REAL,
  humidity_avg REAL,
  rain_total_mm REAL,
  aqi_avg REAL,
  aqi_high REAL,
  aqi_high_at TIME
);

-- Seasonal baselines (for "warmer/colder than normal")
CREATE TABLE seasonal_baselines (
  month INTEGER,
  day INTEGER,
  avg_high REAL,
  avg_low REAL,
  avg_humidity REAL,
  PRIMARY KEY (month, day)
);
```

### Weatherlink API Integration

```typescript
// src/lib/weatherlink.ts

interface WeatherlinkConfig {
  apiKey: string;
  apiSecret: string;
  stationId: string;
}

async function getCurrentConditions(config: WeatherlinkConfig) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(config.apiSecret, timestamp);
  
  const response = await fetch(
    `https://api.weatherlink.com/v2/current/${config.stationId}`,
    {
      headers: {
        'x-api-secret': signature,
        'x-api-key': config.apiKey,
      }
    }
  );
  
  return parseWeatherlinkResponse(await response.json());
}
```

---

## File Structure

```
cascina-weather/
├── src/
│   ├── app/                      # Next.js app router
│   │   ├── page.tsx              # Main dashboard
│   │   ├── layout.tsx
│   │   └── api/
│   │       ├── current/route.ts
│   │       ├── air-quality/route.ts
│   │       └── chat/route.ts
│   │
│   ├── components/
│   │   ├── CurrentWeather.tsx
│   │   ├── TodaySummary.tsx
│   │   ├── WeekView.tsx
│   │   ├── AirQualityCard.tsx
│   │   └── ChatInterface.tsx
│   │
│   ├── lib/
│   │   ├── weatherlink.ts        # API client
│   │   ├── db.ts                 # Database queries
│   │   ├── context.ts            # Context builder
│   │   ├── air-quality.ts        # AQI narrative generator
│   │   ├── insights.ts           # Derived observations
│   │   └── claude.ts             # Chat integration
│   │
│   └── data/
│       └── aqi-comparisons.json  # Reference data for AQI context
│
├── config/
│   ├── voice.yaml
│   └── settings.yaml
│
├── scripts/
│   ├── ingest.ts                 # Run via cron every 15 min
│   └── compute-daily.ts          # Run nightly
│
├── prisma/
│   └── schema.prisma             # If using Prisma ORM
│
└── package.json
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up Next.js project
- [ ] Configure domain (weather.altalanga.love)
- [ ] Implement Weatherlink API integration
- [ ] Create database and ingestion script
- [ ] Basic current conditions display

### Phase 2: Dashboard (Week 2)
- [ ] Design and build main UI
- [ ] Today's summary with highs/lows
- [ ] Week view with historical data
- [ ] Indoor conditions display
- [ ] Mobile-responsive layout

### Phase 3: Air Quality Story (Week 3)
- [ ] Build AQI comparison database
- [ ] Implement narrative generator
- [ ] Design air quality card with context
- [ ] Add health guidance when relevant
- [ ] "What's causing this" logic

### Phase 4: Chat Interface (Week 4)
- [ ] Design chat UI component
- [ ] Implement Claude integration
- [ ] Build comprehensive system prompt
- [ ] Test with various query types
- [ ] Add conversation history (optional)

### Phase 5: Polish & Deploy (Week 5)
- [ ] Refine voice/personality
- [ ] Performance optimization
- [ ] Error handling and edge cases
- [ ] Deploy to production
- [ ] Set up monitoring/alerts

---

## Deployment

### Recommended: Vercel + PlanetScale/Turso

```yaml
# vercel.json
{
  "crons": [
    {
      "path": "/api/ingest",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/daily-summary", 
      "schedule": "0 1 * * *"
    }
  ]
}
```

### Alternative: VPS (Railway, Render, DigitalOcean)

If you want more control or need SQLite:
- Single server running Node.js
- Cron jobs for ingestion
- Nginx reverse proxy
- Let's Encrypt for SSL

### Environment Variables

```
WEATHERLINK_API_KEY=xxx
WEATHERLINK_API_SECRET=xxx
WEATHERLINK_STATION_ID=xxx
ANTHROPIC_API_KEY=xxx
DATABASE_URL=xxx
```

---

## Example: Complete Air Quality Response

When AQI is elevated (hypothetical AQI 45):

**On the dashboard:**
```
┌─────────────────────────────────────────────────────────────────┐
│  AIR QUALITY                                                    │
│                                                                 │
│  Good ●                                                 AQI 45  │
│                                                                 │
│  The air is fine for most people—similar to a quiet residential │
│  area in a small Italian city. Better than Milan, not quite as  │
│  pristine as yesterday.                                         │
│                                                                 │
│  PM2.5: 28 µg/m³                                               │
│  Just above WHO's annual guideline (15), fine for a day.        │
│                                                                 │
│  🔥 It's wood-burning season, and cold mornings mean more       │
│     fires. The haze usually lifts by midday.                    │
│                                                                 │
│  Compared to right now:                                         │
│  • Milan: AQI 78 (Moderate)                                     │
│  • Turin: AQI 62 (Moderate)                                     │
│  • Alpine village: AQI 12 (Excellent)                           │
└─────────────────────────────────────────────────────────────────┘
```

**In chat, if asked "Is the air okay today?":**

> The air's good today—AQI 45. Not the crystalline mountain air you had yesterday, but absolutely fine for normal activities. It's roughly what you'd breathe in a quiet part of Turin on a decent day.
>
> The PM2.5 is slightly elevated at 28 µg/m³, which is above the WHO annual guideline but well within daily limits. This is pretty normal for cold December mornings in Piedmont—everyone's got their wood fires going and cold air traps the smoke low.
>
> It'll probably clear up by early afternoon when the sun warms things up. If you're planning a run, maybe wait until then. But for regular activities? Totally fine.

---

## Notes for Implementation

- **Start simple:** Get current conditions and chat working first. Historical comparison can come later.
- **Cache aggressively:** Weather doesn't change that fast. Cache API responses for 5-10 minutes.
- **Mobile first:** Design for phone screens—this is the "check while making coffee" use case.
- **Fail gracefully:** If Weatherlink API is down, show last known data with timestamp.
- **AQI context:** Pre-compute comparisons and store them. Don't call external APIs on every request.
