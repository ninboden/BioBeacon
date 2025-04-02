// server.js - Backend with setup for real API calls (dotenv, axios)

// Load environment variables from .env file (for local development)
// IMPORTANT: This line MUST be at the very top BEFORE accessing process.env
require('dotenv').config();

// Import necessary libraries
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Added axios for making HTTP requests

// --- Environment Variable Check ---
// Access the API key from environment variables
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

// Log the status of the API key loading (helps debugging)
if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') {
  console.warn('WARNING: PERPLEXITY_API_KEY environment variable not set or using placeholder.');
} else {
  console.log('Perplexity API Key Status: Loaded successfully.'); // Avoid logging the key itself!
}
// --- End Environment Variable Check ---


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

// Root endpoint
app.get('/', (req, res) => {
  res.send('Hello from the BioBeacon Backend!');
});

// GET endpoint for mock grant data
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
app.post('/api/process-researcher', async (req, res) => {
  const { name, affiliation } = req.body;

  console.log('Received POST request to /api/process-researcher');
  console.log('  Name:', name);
  console.log('  Affiliation:', affiliation);

  if (!name || !affiliation) {
    return res.status(400).json({ error: 'Missing name or affiliation in request body' });
  }

  // Log the status of the API key for this request (for debugging deployed app)
  console.log('Perplexity API Key Status (in request):', perplexityApiKey ? 'Loaded' : 'Not Loaded or Placeholder');

  // --- Simulate Perplexity API Call (KEEPING for now) ---
  console.log('Simulating Perplexity API call...');
  await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
  const mockProfile = `Generated profile for ${name} from ${affiliation}. Areas of expertise include advanced research methods, grant writing, and scientific collaboration. Currently focusing on topics relevant to ${affiliation}. (Using API Key Status: ${perplexityApiKey ? 'Loaded' : 'Not Set'})`;
  console.log('Simulated profile generated.');
  // --- End Simulation ---


  // --- Placeholder for actual API call (Next Step) ---
  // try {
  //   const response = await axios.post('PERPLEXITY_API_ENDPOINT', { query: `Profile for ${name}, ${affiliation}` }, { headers: { 'Authorization': `Bearer ${perplexityApiKey}` } });
  //   actualProfile = response.data.profile; // Adjust based on actual API response structure
  // } catch (error) {
  //   console.error("Error calling Perplexity API:", error);
  //   return res.status(500).json({ error: "Failed to call Perplexity API" });
  // }


  res.json({
    message: "Received researcher data and simulated profile generation.",
    received: { name, affiliation },
    mockProfile: mockProfile, // Still sending mock profile
    mockKeywords: ["grant", "research", name.toLowerCase().split(' ')[0], affiliation.toLowerCase().split(' ')[0]]
  });
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`BioBeacon backend server listening at http://localhost:${port}`);
  // Log API key status on startup as well
  console.log(`Perplexity API Key Status on startup: ${perplexityApiKey ? 'Loaded' : 'Not Loaded or Placeholder'}`);
  console.log('Available endpoints:');
  console.log(`  GET /`);
  console.log(`  GET /api/grants?keyword=...`);
  console.log(`  POST /api/process-researcher (expects JSON body: {"name": "...", "affiliation": "..."})`);
});
