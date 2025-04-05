// server.js - Backend making real Perplexity & OpenAI calls

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');

// --- Environment Variable Setup & Client Initialization ---
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// Perplexity Key Check
if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') {
  console.warn('WARNING: PERPLEXITY_API_KEY environment variable not set or using placeholder.');
} else {
  console.log('Perplexity API Key Status: Loaded successfully.');
}

// OpenAI Key Check & Client Initialization
let openai;
let isOpenAIInitialized = false;
if (!openaiApiKey || openaiApiKey === 'YOUR_OPENAI_API_KEY_GOES_HERE') {
  console.warn('WARNING: OPENAI_API_KEY environment variable not set or using placeholder. Real OpenAI calls will fail.');
} else {
  try {
    openai = new OpenAI({ apiKey: openaiApiKey });
    isOpenAIInitialized = true;
    console.log('OpenAI API Key Status: Loaded successfully & client initialized.');
  } catch (error) {
      console.error("Error initializing OpenAI client:", error.message);
  }
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

// POST endpoint - Calls Perplexity, then calls OpenAI
app.post('/api/process-researcher', async (req, res) => {
  const { name, affiliation } = req.body;
  let actualProfile = null;
  let actualKeywords = []; // Store keywords from OpenAI

  console.log('Received POST request to /api/process-researcher');
  console.log('  Name:', name);
  console.log('  Affiliation:', affiliation);

  if (!name || !affiliation) {
    return res.status(400).json({ error: 'Missing name or affiliation in request body' });
  }

  // --- Perplexity API Call ---
  if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') {
      console.error("Perplexity API Key is not configured correctly.");
      return res.status(500).json({ error: "Server configuration error: Missing Perplexity API Key" });
  }
  console.log('Attempting real Perplexity API call...');
  try {
    const perplexityApiUrl = 'https://api.perplexity.ai/chat/completions';
    const requestData = { model: "sonar", messages: [ { role: "system", content: "Generate a concise, professional researcher profile suitable for finding grant keywords. Focus on likely research areas based on name and affiliation." }, { role: "user", content: `Generate profile for ${name}, affiliated with ${affiliation}.` } ] };
    const headers = { 'Authorization': `Bearer ${perplexityApiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };
    const response = await axios.post(perplexityApiUrl, requestData, { headers });
    console.log('Perplexity API call successful.');
    if (response.data?.choices?.[0]?.message?.content) {
       actualProfile = response.data.choices[0].message.content;
       console.log('Successfully extracted profile from Perplexity.');
    } else { console.warn('Could not find profile in expected Perplexity response location.'); actualProfile = JSON.stringify(response.data); }
  } catch (error) {
    console.error('Error calling Perplexity API:');
    // ... (error logging) ...
    if (error.response) { console.error('  Status:', error.response.status); console.error('  Data:', error.response.data); } else if (error.request) { console.error('  Error: No response received.'); } else { console.error('  Error Message:', error.message); }
    return res.status(500).json({ error: "Failed to call Perplexity API", details: error.response ? error.response.data : error.message });
  }
  // --- End Perplexity API Call ---


  // --- OpenAI API Call for Keywords ---
  if (isOpenAIInitialized && actualProfile) { // Check if client is ready and we have a profile
    console.log('Attempting real OpenAI API call for keywords...');
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Or a different model like gpt-4
        messages: [
          { role: "system", content: "You are an expert in academic research funding. Extract 5-10 relevant keywords suitable for searching grant databases (like Grants.gov) from the provided researcher profile. Return only a comma-separated list of keywords." },
          { role: "user", content: actualProfile }
        ],
        temperature: 0.5, // Adjust creativity
        max_tokens: 50, // Limit token usage for keywords
      });

      console.log('OpenAI API call successful.');
      // console.log('OpenAI Response Data:', JSON.stringify(completion, null, 2)); // Log raw response

      // Extract keywords from the response content
      const keywordString = completion.choices?.[0]?.message?.content;
      if (keywordString) {
        // Simple parsing: split by comma or newline, trim whitespace, filter empty
        actualKeywords = keywordString.split(/,|\n/).map(kw => kw.trim()).filter(kw => kw.length > 0);
        console.log('Successfully extracted keywords from OpenAI:', actualKeywords);
      } else {
        console.warn('Could not find keywords in expected OpenAI response location.');
        actualKeywords = ['parsing_failed']; // Indicate parsing issue
      }

    } catch (error) {
      console.error('Error calling OpenAI API:');
      if (error instanceof OpenAI.APIError) {
        console.error('  Status:', error.status);
        console.error('  Message:', error.message);
        console.error('  Code:', error.code);
        console.error('  Type:', error.type);
      } else {
        console.error('  Error Message:', error.message);
      }
      // Don't stop execution, just note the failure; maybe keep mock keywords?
      actualKeywords = ['openai_call_failed']; // Indicate call failure
    }
  } else if (!actualProfile) {
      console.log('Skipping OpenAI call because profile was not obtained from Perplexity.');
  } else { // !isOpenAIInitialized
      console.log('Skipping OpenAI call because OpenAI client is not initialized (check API Key).');
      actualKeywords = ['openai_not_initialized'];
  }
  // --- End OpenAI API Call ---


  // --- Placeholder for Grants.gov call ---
  // TODO: Call Grants.gov API with actualKeywords

  res.json({
    message: "Successfully processed researcher, called Perplexity, and attempted OpenAI.", // Updated message
    received: { name, affiliation },
    profile: actualProfile,
    actualKeywords: actualKeywords // Send back actual keywords (or error indicators)
  });
});


// --- Start Server ---
app.listen(port, () => {
  // ... (startup logs) ...
  console.log(`BioBeacon backend server listening at http://localhost:${port}`);
  console.log(`Perplexity API Key Status on startup: ${perplexityApiKey ? 'Loaded' : 'Not Loaded or Placeholder'}`);
  console.log(`OpenAI API Key Status on startup: ${openaiApiKey ? 'Loaded' : 'Not Loaded or Placeholder'}`);
  console.log('Available endpoints:');
  console.log(`  GET /`);
  console.log(`  GET /api/grants?keyword=...`);
  console.log(`  POST /api/process-researcher (expects JSON body: {"name": "...", "affiliation": "..."})`);
});
