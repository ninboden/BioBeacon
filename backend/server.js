// server.js - Backend: Perplexity -> OpenAI -> Grants.gov API calls

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');

// --- Environment Variable Setup & Client Initialization ---
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// Perplexity Key Check
// ... (key check logic) ...
if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') { console.warn('WARNING: PERPLEXITY_API_KEY not set or using placeholder.'); }
else { console.log('Perplexity API Key Status: Loaded successfully.'); }

// OpenAI Key Check & Client Initialization
// ... (key check and client init logic) ...
let openai;
let isOpenAIInitialized = false;
if (!openaiApiKey || openaiApiKey === 'YOUR_OPENAI_API_KEY_GOES_HERE') { console.warn('WARNING: OPENAI_API_KEY not set or using placeholder.'); }
else { try { openai = new OpenAI({ apiKey: openaiApiKey }); isOpenAIInitialized = true; console.log('OpenAI API Key Status: Loaded successfully & client initialized.'); } catch (error) { console.error("Error initializing OpenAI client:", error.message); } }
// --- End Environment Variable Setup ---

const app = express();
app.use(cors());
app.use(express.json());
const port = 3001;

// --- Mock Grant Data (Only used by direct /api/grants endpoint now) ---
const mockGrants = [
  { id: 1, title: 'Cancer Research Initiative', agency: 'NIH', amount: 500000, keyword: 'cancer' },
  { id: 2, title: 'Neuroscience Fellowship', agency: 'NSF', amount: 150000, keyword: 'neuroscience' },
  { id: 3, title: 'Public Health Study Grant', agency: 'CDC', amount: 300000, keyword: 'health' },
  { id: 4, title: 'Plant Biology Research Grant', agency: 'NSF', amount: 250000, keyword: 'biology' },
  { id: 5, title: 'AI in Medicine Grant', agency: 'NIH', amount: 400000, keyword: 'ai' },
  { id: 6, title: 'Computational Biology Tools', agency: 'NSF', amount: 200000, keyword: 'computational biology' },
];

// --- API Endpoints ---

app.get('/', (req, res) => {
  res.send('Hello from the BioBeacon Backend!');
});

// GET endpoint for mock grant data (kept for potential direct use/testing)
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
    results = mockGrants; // Return all if no keyword
  }
  res.json(results);
});

// POST endpoint - Full workflow: Perplexity -> OpenAI -> Grants.gov
app.post('/api/process-researcher', async (req, res) => {
  const { name, affiliation } = req.body;
  let actualProfile = null;
  let actualKeywords = [];
  let grantResults = []; // Store results from Grants.gov call

  console.log('Received POST request to /api/process-researcher');
  console.log('  Name:', name);
  console.log('  Affiliation:', affiliation);

  if (!name || !affiliation) { return res.status(400).json({ error: 'Missing name or affiliation' }); }
  if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') { return res.status(500).json({ error: "Server config error: Missing Perplexity API Key" }); }

  // --- Perplexity API Call ---
  console.log('Attempting Perplexity API call...');
  try {
    // ... (Perplexity axios call remains the same) ...
    const perplexityApiUrl = 'https://api.perplexity.ai/chat/completions';
    const requestData = { model: "sonar", messages: [ { role: "system", content: "Generate a concise, professional researcher profile..." }, { role: "user", content: `Generate profile for ${name}, affiliated with ${affiliation}.` } ] };
    const headers = { 'Authorization': `Bearer ${perplexityApiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };
    const response = await axios.post(perplexityApiUrl, requestData, { headers });
    console.log('Perplexity API call successful.');
    if (response.data?.choices?.[0]?.message?.content) { actualProfile = response.data.choices[0].message.content; console.log('Extracted profile from Perplexity.'); }
    else { console.warn('Could not find profile in Perplexity response.'); actualProfile = JSON.stringify(response.data); }
  } catch (error) { console.error('Error calling Perplexity API:', error.message); return res.status(500).json({ error: "Failed to call Perplexity API", details: error.response ? error.response.data : error.message }); }
  // --- End Perplexity API Call ---


  // --- OpenAI API Call for Keywords ---
  if (isOpenAIInitialized && actualProfile) {
    console.log('Attempting OpenAI API call for keywords...');
    try {
      // ... (OpenAI call remains the same) ...
      const completion = await openai.chat.completions.create({ model: "gpt-3.5-turbo", messages: [ { role: "system", content: "Extract 5-10 relevant keywords suitable for searching grant databases... Return only a comma-separated list." }, { role: "user", content: actualProfile } ], temperature: 0.5, max_tokens: 50 });
      console.log('OpenAI API call successful.');
      const keywordString = completion.choices?.[0]?.message?.content;
      if (keywordString) { actualKeywords = keywordString.split(/,|\n/).map(kw => kw.trim().toLowerCase()).filter(kw => kw.length > 0); console.log('Extracted keywords from OpenAI:', actualKeywords); }
      else { console.warn('Could not find keywords in OpenAI response.'); actualKeywords = ['parsing_failed']; }
    } catch (error) { console.error('Error calling OpenAI API:', error.message); actualKeywords = ['openai_call_failed']; }
  } else if (!actualProfile) { console.log('Skipping OpenAI call: profile missing.'); }
  else { console.log('Skipping OpenAI call: client not initialized.'); actualKeywords = ['openai_not_initialized']; }
  // --- End OpenAI API Call ---


  // --- Grants.gov API Call (using actualKeywords) ---
  if (actualKeywords.length > 0 && !actualKeywords[0].includes('_failed') && !actualKeywords[0].includes('_not_initialized')) {
      console.log(`Attempting Grants.gov API call with keywords: ${actualKeywords.join(' ')}`);
      try {
          const grantsApiUrl = 'https://api.grants.gov/v1/api/search2';
          // Join keywords with space for the search query (adjust if API prefers OR, AND, etc.)
          const keywordString = actualKeywords.join(' ');
          const requestData = {
              keyword: keywordString,
              rows: 15, // Request up to 15 results
              oppStatuses: "forecasted|posted" // Look for current opportunities
              // Add other filters like 'agencies' if needed later
          };
          const headers = { 'Content-Type': 'application/json' };

          const response = await axios.post(grantsApiUrl, requestData, { headers });

          console.log('Grants.gov API call successful. Status:', response.status);
          // Extract results from the 'oppHits' array within the 'data' object
          grantResults = response.data?.data?.oppHits || [];
          console.log(`Found ${grantResults.length} grant results from Grants.gov.`);

      } catch (error) {
          console.error('Error calling Grants.gov API:');
          if (error.response) { console.error('  Status:', error.response.status); console.error('  Data:', error.response.data); }
          else if (error.request) { console.error('  Error: No response received.'); }
          else { console.error('  Error Message:', error.message); }
          // Don't stop execution, just return empty results for this step
          grantResults = []; // Set empty results on error
          // Optionally add an error indicator to the main response?
      }
  } else {
      console.log('Skipping Grants.gov call because no valid keywords were obtained.');
  }
  // --- End Grants.gov API Call ---


  // --- Final Response ---
  res.json({
    message: "Successfully processed researcher: Perplexity -> OpenAI -> Grants.gov.", // Updated message
    received: { name, affiliation },
    profile: actualProfile,
    actualKeywords: actualKeywords,
    grantResults: grantResults // Send back actual grant results
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
  console.log(`  GET /api/grants?keyword=...`); // Kept this endpoint
  console.log(`  POST /api/process-researcher (expects JSON body: {"name": "...", "affiliation": "..."})`);
});
