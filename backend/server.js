// server.js - Backend attempting real API call with axios

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Use axios

const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') {
  console.warn('WARNING: PERPLEXITY_API_KEY environment variable not set or using placeholder.');
} else {
  console.log('Perplexity API Key Status: Loaded successfully.');
}

const app = express();
app.use(cors());
app.use(express.json());
const port = 3001;

// --- Mock Grant Data (Keep for /api/grants endpoint) ---
const mockGrants = [
  { id: 1, title: 'Cancer Research Initiative', agency: 'NIH', amount: 500000, keyword: 'cancer' },
  { id: 2, title: 'Neuroscience Fellowship', agency: 'NSF', amount: 150000, keyword: 'neuroscience' },
  { id: 3, title: 'Public Health Study Grant', agency: 'CDC', amount: 300000, keyword: 'health' },
  { id: 4, title: 'Plant Biology Research Grant', agency: 'NSF', amount: 250000, keyword: 'biology' },
];

// --- API Endpoints ---

app.get('/', (req, res) => {
  res.send('Hello from the BioBeacon Backend!');
});

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

// POST endpoint - Now attempts real API call
app.post('/api/process-researcher', async (req, res) => {
  const { name, affiliation } = req.body;
  let actualProfile = null; // Variable to hold profile from API

  console.log('Received POST request to /api/process-researcher');
  console.log('  Name:', name);
  console.log('  Affiliation:', affiliation);

  if (!name || !affiliation) {
    return res.status(400).json({ error: 'Missing name or affiliation in request body' });
  }

  console.log('Attempting Perplexity API call...');
  console.log('Perplexity API Key Status (in request):', perplexityApiKey ? 'Loaded' : 'Not Loaded or Placeholder');

  // --- Attempt Perplexity API Call ---
  try {
    // --- IMPORTANT: Replace with ACTUAL Perplexity API details ---
    const perplexityApiUrl = 'https://api.perplexity.ai/some/endpoint'; // <-- Replace with real URL
    const requestData = { // <-- Adjust payload based on API docs
      query: `Generate a concise researcher profile for ${name} affiliated with ${affiliation}.`,
      model: "sonar-medium-online" // Example: Specify a model if required
    };
    const headers = { // <-- Adjust headers based on API docs
      'Authorization': `Bearer ${perplexityApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    // --- End of details to replace ---

    // Make the actual API call using axios
    const response = await axios.post(perplexityApiUrl, requestData, { headers });

    console.log('Perplexity API Response Status:', response.status);
    console.log('Perplexity API Response Data:', response.data); // Log raw response for debugging

    // --- IMPORTANT: Extract profile based on ACTUAL API response structure ---
    // This is a GUESS - adjust based on Perplexity's response format
    actualProfile = response.data?.choices?.[0]?.message?.content || response.data?.profile || JSON.stringify(response.data);
    console.log('Extracted Profile:', actualProfile);
    // --- End of extraction logic ---

  } catch (error) {
    // Log detailed error information
    console.error('Error calling Perplexity API:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('  Status:', error.response.status);
      console.error('  Headers:', error.response.headers);
      console.error('  Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('  Request:', error.request);
      console.error('  Error: No response received from Perplexity API.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('  Error Message:', error.message);
    }
    // Send an error response back to the client
    return res.status(500).json({
        error: "Failed to call Perplexity API",
        details: error.response ? error.response.data : error.message // Provide details if possible
    });
  }
  // --- End API Call Attempt ---


  // --- Placeholder for future logic ---
  // TODO: Call ChatGPT API with actualProfile to get keywords
  // TODO: Call Grants.gov API with keywords

  res.json({
    message: "Processing request complete (API call attempted).", // Updated message
    received: { name, affiliation },
    profile: actualProfile, // Send back the profile received (or null if error occurred before this)
    // Keep mock keywords for now, replace later
    mockKeywords: ["grant", "research", name.toLowerCase().split(' ')[0], affiliation.toLowerCase().split(' ')[0]]
  });
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`BioBeacon backend server listening at http://localhost:${port}`);
  console.log(`Perplexity API Key Status on startup: ${perplexityApiKey ? 'Loaded' : 'Not Loaded or Placeholder'}`);
  console.log('Available endpoints:');
  console.log(`  GET /`);
  console.log(`  GET /api/grants?keyword=...`);
  console.log(`  POST /api/process-researcher (expects JSON body: {"name": "...", "affiliation": "..."})`);
});
