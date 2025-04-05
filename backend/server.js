// server.js - Backend prepared for OpenAI calls

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai'); // Added OpenAI library

// --- Environment Variable Setup & Client Initialization ---
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY; // Added OpenAI Key

// Perplexity Key Check
if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') {
  console.warn('WARNING: PERPLEXITY_API_KEY environment variable not set or using placeholder.');
} else {
  console.log('Perplexity API Key Status: Loaded successfully.');
}

// OpenAI Key Check & Client Initialization
let openai; // Declare openai client variable
if (!openaiApiKey || openaiApiKey === 'YOUR_OPENAI_API_KEY_GOES_HERE') {
  console.warn('WARNING: OPENAI_API_KEY environment variable not set or using placeholder. Real OpenAI calls will fail.');
  // Optionally initialize with a dummy key or handle differently if needed
  // openai = new OpenAI({ apiKey: 'DUMMY_KEY_FOR_INITIALIZATION' }); // Example if constructor requires key
} else {
  console.log('OpenAI API Key Status: Loaded successfully.');
  // Initialize OpenAI client only if key is valid
  openai = new OpenAI({ apiKey: openaiApiKey });
}
// --- End Environment Variable Setup ---


const app = express();
app.use(cors());
app.use(express.json());
const port = 3001;

// --- Mock Grant Data ---
const mockGrants = [
  // ... (mock grant data remains the same)
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
  // ... (GET /api/grants endpoint remains the same)
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

// POST endpoint - Calls Perplexity, simulates ChatGPT
app.post('/api/process-researcher', async (req, res) => {
  const { name, affiliation } = req.body;
  let actualProfile = null;
  let simulatedKeywords = []; // Keep simulation for now

  console.log('Received POST request to /api/process-researcher');
  console.log('  Name:', name);
  console.log('  Affiliation:', affiliation);

  if (!name || !affiliation) {
    return res.status(400).json({ error: 'Missing name or affiliation in request body' });
  }

  // Check Perplexity Key before proceeding
  if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') {
      console.error("Perplexity API Key is not configured correctly.");
      return res.status(500).json({ error: "Server configuration error: Missing Perplexity API Key" });
  }

  console.log('Attempting real Perplexity API call...');
  // --- Perplexity API Call ---
  try {
    const perplexityApiUrl = 'https://api.perplexity.ai/chat/completions';
    const requestData = {
      model: "sonar", // Or sonar-deep-research etc.
      messages: [
        { role: "system", content: "Generate a concise, professional researcher profile suitable for finding grant keywords. Focus on likely research areas based on name and affiliation." },
        { role: "user", content: `Generate profile for ${name}, affiliated with ${affiliation}.` }
      ]
    };
    const headers = { 'Authorization': `Bearer ${perplexityApiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };
    const response = await axios.post(perplexityApiUrl, requestData, { headers });
    console.log('Perplexity API call successful.');

    if (response.data?.choices?.[0]?.message?.content) {
       actualProfile = response.data.choices[0].message.content;
       console.log('Successfully extracted profile from Perplexity.');
    } else {
       console.warn('Could not find profile in expected Perplexity response location.');
       actualProfile = JSON.stringify(response.data);
    }
  } catch (error) {
    console.error('Error calling Perplexity API:');
    // ... (error logging) ...
    if (error.response) { console.error('  Status:', error.response.status); console.error('  Data:', error.response.data); }
    else if (error.request) { console.error('  Error: No response received.'); }
    else { console.error('  Error Message:', error.message); }
    return res.status(500).json({ error: "Failed to call Perplexity API", details: error.response ? error.response.data : error.message });
  }
  // --- End Perplexity API Call ---


  // --- Simulate ChatGPT API Call (KEEPING simulation for now) ---
  if (actualProfile) {
      console.log('Simulating ChatGPT API call with received profile...');
      // Log OpenAI client status for debugging
      console.log('OpenAI Client Status:', openai ? 'Initialized' : 'Not Initialized (Check API Key)');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      simulatedKeywords = ["simulated", "keywords", "using", name.toLowerCase().split(' ')[0]]; // Slightly different mock keywords
      console.log('Simulated keywords generated:', simulatedKeywords);
  } else {
      console.log('Skipping ChatGPT simulation because profile was not obtained.');
  }
  // --- End ChatGPT Simulation ---


  // --- Placeholder for Grants.gov call ---
  // TODO: Call Grants.gov API with keywords

  res.json({
    message: "Successfully processed researcher, called Perplexity, and simulated ChatGPT.",
    received: { name, affiliation },
    profile: actualProfile,
    simulatedKeywords: simulatedKeywords // Still sending simulated keywords
  });
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`BioBeacon backend server listening at http://localhost:${port}`);
  console.log(`Perplexity API Key Status on startup: ${perplexityApiKey ? 'Loaded' : 'Not Loaded or Placeholder'}`);
  console.log(`OpenAI API Key Status on startup: ${openaiApiKey ? 'Loaded' : 'Not Loaded or Placeholder'}`); // Added OpenAI key status
  console.log('Available endpoints:');
  console.log(`  GET /`);
  console.log(`  GET /api/grants?keyword=...`);
  console.log(`  POST /api/process-researcher (expects JSON body: {"name": "...", "affiliation": "..."})`);
});
