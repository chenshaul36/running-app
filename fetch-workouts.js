// fetch-workouts.js
// Fetches workout data from Google Sheets and updates the app

const https = require('https');
const fs = require('fs');

// Configuration
const SPREADSHEET_ID = '1e_NESQtVR6SHN-pZak8kxzElRjh6_fa94h30HUGTG1I';
const SHEET_GIDS = {
  cycle1: '0',
  cycle2: '614132126',
  cycle3: '1626995172'
};

// Current date for week detection
const today = new Date();

// Fetch CSV from Google Sheets
function fetchSheet(gid) {
  return new Promise((resolve, reject) => {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Parse CSV to extract workout data
function parseWorkouts(csvData) {
  const lines = csvData.split('\n');
  const workouts = [];
  
  // Simple parser - adjust based on your sheet structure
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for week headers (e.g., "week 6 : 8-14.3")
    if (line.toLowerCase().includes('week')) {
      const weekMatch = line.match(/week\s+(\d+)/i);
      if (weekMatch) {
        const weekNum = parseInt(weekMatch[1]);
        const dateMatch = line.match(/:\s*([\d\-\.]+)/);
        const dates = dateMatch ? dateMatch[1] : '';
        
        // Extract workouts for this week (next few rows)
        const weekWorkouts = extractWeekWorkouts(lines, i + 1);
        
        if (weekWorkouts.length > 0) {
          workouts.push({
            week: weekNum,
            dates: dates,
            workouts: weekWorkouts
          });
        }
      }
    }
  }
  
  return workouts;
}

function extractWeekWorkouts(lines, startIndex) {
  const workouts = [];
  
  // Look for Practice/Workout rows
  for (let i = startIndex; i < Math.min(startIndex + 20, lines.length); i++) {
    const line = lines[i];
    
    if (line.toLowerCase().includes('practice') || line.toLowerCase().includes('workout')) {
      const cells = line.split(',');
      
      if (cells.length > 2) {
        workouts.push({
          name: cells[0].trim(),
          type: cells[2].trim(),
          details: cells.slice(3).join(' ').trim()
        });
      }
    }
    
    // Stop if we hit another week or empty rows
    if (line.toLowerCase().includes('week') && i > startIndex) break;
  }
  
  return workouts;
}

// Main function
async function main() {
  try {
    console.log('🏃 Fetching workout data from Google Sheets...');
    
    // Fetch cycle 3 data
    const cycle3Data = await fetchSheet(SHEET_GIDS.cycle3);
    
    console.log('📊 Parsing workout data...');
    const workouts = parseWorkouts(cycle3Data);
    
    // Find current week (Week 6 for now)
    const currentWeek = workouts.find(w => w.week === 6) || workouts[0];
    
    // Generate workout data JSON
    const workoutData = {
      lastUpdated: new Date().toISOString(),
      currentWeek: {
        week: currentWeek.week,
        dates: currentWeek.dates,
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
    console.log('✅ Workout data updated successfully!');
    console.log(`📅 Last updated: ${workoutData.lastUpdated}`);
    
    // Update the HTML file to use this data
    updateHTMLFile(workoutData);
    
  } catch (error) {
    console.error('❌ Error fetching workouts:', error);
    process.exit(1);
  }
}

function updateHTMLFile(data) {
  // Read the current HTML
  let html = fs.readFileSync('index.html', 'utf8');
  
  // Inject the workout data as a script tag
  const dataScript = `
    <script>
      window.WORKOUT_DATA = ${JSON.stringify(data)};
    </script>
  `;
  
  // Insert before the closing </head> tag
  html = html.replace('</head>', `${dataScript}\n</head>`);
  
  // Write back
  fs.writeFileSync('index.html', html);
  console.log('✅ HTML file updated with latest data!');
}

// Run the script
main();
