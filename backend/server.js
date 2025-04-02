// server.js - Backend making real Perplexity API call

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// --- Environment Variable Setup ---
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') {
  console.warn('WARNING: PERPLEXITY_API_KEY environment variable not set or using placeholder. Real API calls will fail.');
} else {
  console.log('Perplexity API Key Status: Loaded successfully.');
}
// --- End Environment Variable Setup ---

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

// POST endpoint - Makes real Perplexity API call
app.post('/api/process-researcher', async (req, res) => {
  const { name, affiliation } = req.body;
  let actualProfile = null; // Variable to hold profile from API

  console.log('Received POST request to /api/process-researcher');
  console.log('  Name:', name);
  console.log('  Affiliation:', affiliation);

  if (!name || !affiliation) {
    return res.status(400).json({ error: 'Missing name or affiliation in request body' });
  }

  // Check if API key is loaded before attempting call
  if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') {
      console.error("Perplexity API Key is not configured correctly.");
      return res.status(500).json({ error: "Server configuration error: Missing API Key" });
  }

  console.log('Attempting real Perplexity API call...');

  // --- Perplexity API Call ---
  try {
    const perplexityApiUrl = 'https://api.perplexity.ai/chat/completions';
    const requestData = {
      model: "sonar-deep-research",// Or "sonar-medium-online", etc. Choose appropriate model
      messages: [
        {
          role: "system",
          content: "Generate a concise, professional researcher profile suitable for finding grant keywords. Focus on likely research areas based on name and affiliation."
        },
        {
          role: "user",
          content: `Generate profile for ${name}, affiliated with ${affiliation}.`
        }
      ],
      // Optional parameters (refer to Perplexity docs)
      // max_tokens: 150,
      // temperature: 0.7,
    };
    const headers = {
      'Authorization': `Bearer ${perplexityApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Make the API call using axios
    const response = await axios.post(perplexityApiUrl, requestData, { headers });

    console.log('Perplexity API Response Status:', response.status);
    // console.log('Perplexity API Response Data:', JSON.stringify(response.data, null, 2)); // Log formatted JSON

    // Extract profile from response - **Adjust based on actual Perplexity response structure**
    // Common structure for chat completions:
    if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message) {
       actualProfile = response.data.choices[0].message.content;
       console.log('Successfully extracted profile from choices[0].message.content');
    } else {
       console.warn('Could not find profile in expected location (response.data.choices[0].message.content). Logging raw data.');
       actualProfile = JSON.stringify(response.data); // Fallback to raw data string
    }

  } catch (error) {
    console.error('Error calling Perplexity API:');
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Headers:', error.response.headers);
      console.error('  Data:', error.response.data);
    } else if (error.request) {
      console.error('  Request:', error.request);
      console.error('  Error: No response received from Perplexity API.');
    } else {
      console.error('  Error Message:', error.message);
    }
    return res.status(500).json({
        error: "Failed to call Perplexity API",
        details: error.response ? error.response.data : error.message
    });
  }
  // --- End API Call ---

  res.json({
    message: "Successfully processed researcher and called Perplexity API.", // Updated message
    received: { name, affiliation },
    profile: actualProfile, // Send back the actual profile
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
