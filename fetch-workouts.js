// fetch-workouts.js
// Fetches workout data from Google Sheets and updates the app

const https = require('https');
const fs = require('fs');

// Configuration
const SPREADSHEET_ID = '1e_NESQtVR6SHN-pZak8kxzElRjh6_fa94h30HUGTG1I';
const SHEET_GIDS = {
  cycle3: '1626995172'  // Cycle 3 - Post TLV tab
};

// Fetch CSV from Google Sheets
function fetchSheet(gid) {
  return new Promise((resolve, reject) => {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
    
    console.log(`📡 Fetching: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`✅ Received ${data.length} bytes of data`);
        resolve(data);
      });
    }).on('error', reject);
  });
}

// Main function
async function main() {
  try {
    console.log('🏃 Fetching workout data from Google Sheets...');
    
    // Fetch cycle 3 data to verify connection
    const csvData = await fetchSheet(SHEET_GIDS.cycle3);
    
    console.log('📊 CSV Data Preview (first 500 chars):');
    console.log(csvData.substring(0, 500));
    
    // Week 6 data - Update this when you move to Week 7, 8, etc.
    const workoutData = {
      lastUpdated: new Date().toISOString(),
      currentWeek: {
        week: 6,
        dates: 'Mar 8-14, 2026',
        distance: '27 km',
        cycle: 'Cycle 3 - Post TLV',
        workouts: [
          {
            name: 'Workout 1',
            type: 'Easy Run',
            distance: '7.0 km',
            completed: false,
            badge: 'easy',
            description: 'Week opener - easy run'
          },
          {
            name: 'Workout 2',
            type: 'Fartlek',
            distance: '8.0 km',
            completed: false,
            badge: 'fartlek',
            details: [
              'Warm up - 4 km',
              'Main: 10 × 30 seconds hard + 30 seconds easy'
            ]
          },
          {
            name: 'Workout 3',
            type: 'Volume',
            distance: '12 km',
            completed: false,
            badge: 'volume',
            description: 'Easy pace! Conversational pace!'
          }
        ]
      }
    };
    
    // Save to JSON file
    fs.writeFileSync('workout-data.json', JSON.stringify(workoutData, null, 2));
    console.log('✅ Workout data saved to workout-data.json');
    console.log(`📅 Last updated: ${workoutData.lastUpdated}`);
    
    // Update the HTML file
    updateHTMLFile(workoutData);
    
    console.log('✅ All done! Workout data updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function updateHTMLFile(data) {
  try {
    if (!fs.existsSync('index.html')) {
      console.log('⚠️  index.html not found - skipping HTML update');
      return;
    }
    
    let html = fs.readFileSync('index.html', 'utf8');
    
    // Remove existing WORKOUT_DATA
    html = html.replace(/<script>\s*window\.WORKOUT_DATA\s*=\s*\{[\s\S]*?\};\s*<\/script>/g, '');
    
    // Add new data
    const dataScript = `
    <script>
      window.WORKOUT_DATA = ${JSON.stringify(data)};
    </script>`;
    
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${dataScript}\n</head>`);
      fs.writeFileSync('index.html', html);
      console.log('✅ index.html updated!');
    }
    
  } catch (error) {
    console.error('⚠️  HTML update error:', error.message);
  }
}

// Run
main();
