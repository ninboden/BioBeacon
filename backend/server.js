// server.js - Basic Express server for BioBeacon Backend with CORS and API endpoints

// Import the Express library
const express = require('express');
// Import the CORS middleware package
const cors = require('cors');

// Create an instance of the Express application
const app = express();

// --- Middleware ---
// Enable CORS for all origins
app.use(cors());
// Enable parsing of JSON request bodies
// This MUST come before routes that need to handle JSON POST/PUT data
app.use(express.json()); // Added this line

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

// POST endpoint to receive researcher data
app.post('/api/process-researcher', (req, res) => {
  // Extract name and affiliation from the JSON request body
  // This requires the express.json() middleware to be used
  const { name, affiliation } = req.body;

  // Log received data (visible in server console / App Runner logs)
  console.log('Received POST request to /api/process-researcher');
  console.log('  Name:', name);
  console.log('  Affiliation:', affiliation);

  // Basic validation (example)
  if (!name || !affiliation) {
    return res.status(400).json({ error: 'Missing name or affiliation in request body' });
  }

  // --- Placeholder for future logic ---
  // TODO: Call Perplexity API with name/affiliation
  // TODO: Call ChatGPT API with profile to get keywords
  // TODO: Call Grants.gov API with keywords
  // For now, just send back a confirmation and mock keywords

  res.json({
    message: "Received researcher data successfully.",
    received: {
      name: name,
      affiliation: affiliation
    },
    // Placeholder for keywords that would eventually be generated
    mockKeywords: ["grant", "research", name.toLowerCase().split(' ')[0], affiliation.toLowerCase().split(' ')[0]]
  });
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`BioBeacon backend server listening at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log(`  GET /`);
  console.log(`  GET /api/grants?keyword=...`);
  console.log(`  POST /api/process-researcher (expects JSON body: {"name": "...", "affiliation": "..."})`); // Added info here
});
