// Script to fetch initial weather data
// Run with: npx tsx scripts/fetch-initial-data.ts

async function fetchInitialData() {
  console.log('🌤️  Fetching initial weather data from Weatherlink...\n');

  try {
    const response = await fetch('http://localhost:3000/api/ingest-weather');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log('✅ Successfully fetched and stored weather data!');
      console.log(`📅 Timestamp: ${data.timestamp}\n`);
      console.log('Your dashboard should now show current conditions.');
      console.log('Visit: http://localhost:3000\n');
    } else {
      console.error('❌ Failed to fetch weather data:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    console.log('\n💡 Make sure the development server is running: npm run dev\n');
  }
}

fetchInitialData();
