// server.js - Basic Express server for BioBeacon Backend with CORS and API endpoints

// Import the Express library
const express = require('express');
// Import the CORS middleware package
const cors = require('cors');

// Create an instance of the Express application
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Define the port number the server will listen on
const port = 3001;

// --- Mock Data ---
const mockGrants = [
  { id: 1, title: 'Cancer Research Initiative', agency: 'NIH', amount: 500000, keyword: 'cancer' },
  { id: 2, title: 'Neuroscience Fellowship', agency: 'NSF', amount: 150000, keyword: 'neuroscience' },
  { id: 3, title: 'Public Health Study Grant', agency: 'CDC', amount: 300000, keyword: 'health' },
  { id: 4, title: 'Plant Biology Research Grant', agency: 'NSF', amount: 250000, keyword: 'biology' },
];

// --- API Endpoints ---

// Root endpoint (for basic testing)
app.get('/', (req, res) => {
  res.send('Hello from the BioBeacon Backend!');
});

// GET endpoint to retrieve mock grant data based on keyword
app.get('/api/grants', (req, res) => {
  const keyword = req.query.keyword;
  console.log(`Received GET request for grants with keyword: ${keyword}`);
  let results = [];
  if (keyword) {
    const searchTerm = keyword.toLowerCase();
    results = mockGrants.filter(grant =>
      grant.keyword.toLowerCase().includes(searchTerm) ||
      grant.title.toLowerCase().includes(searchTerm)
    );
    if (results.length === 0) {
         return res.json({ message: `No grants found matching keyword: ${keyword}` });
    }
  } else {
    results = [];
  }
  res.json(results);
});

// POST endpoint to receive researcher data and simulate Perplexity call
// Make the handler async to allow for await
app.post('/api/process-researcher', async (req, res) => { // Added async
  const { name, affiliation } = req.body;

  console.log('Received POST request to /api/process-researcher');
  console.log('  Name:', name);
  console.log('  Affiliation:', affiliation);

  if (!name || !affiliation) {
    return res.status(400).json({ error: 'Missing name or affiliation in request body' });
  }

  // --- Simulate Perplexity API Call ---
  console.log('Simulating Perplexity API call...');
  // Add an artificial delay to mimic network latency
  await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds

  // Generate a mock profile based on input
  const mockProfile = `Generated profile for ${name} from ${affiliation}. Areas of expertise include advanced research methods, grant writing, and scientific collaboration. Currently focusing on topics relevant to ${affiliation}.`;
  console.log('Simulated profile generated.');
  // --- End Simulation ---


  // --- Placeholder for future logic ---
  // TODO: Replace simulation with actual Perplexity API call
  // TODO: Call ChatGPT API with profile to get keywords
  // TODO: Call Grants.gov API with keywords
  // For now, send back confirmation, received data, mock profile, and mock keywords

  res.json({
    message: "Received researcher data and simulated profile generation.", // Updated message
    received: {
      name: name,
      affiliation: affiliation
    },
    mockProfile: mockProfile, // Added mock profile to response
    mockKeywords: ["grant", "research", name.toLowerCase().split(' ')[0], affiliation.toLowerCase().split(' ')[0]] // Kept mock keywords for now
  });
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`BioBeacon backend server listening at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log(`  GET /`);
  console.log(`  GET /api/grants?keyword=...`);
  console.log(`  POST /api/process-researcher (expects JSON body: {"name": "...", "affiliation": "..."})`);
});
