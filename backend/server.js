// server.js - Backend: Perplexity -> OpenAI -> Grants.gov (per keyword)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');

// --- Environment Variable Setup & Client Initialization ---
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// ... (API Key checks and OpenAI client initialization remain the same) ...
if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') { console.warn('WARNING: PERPLEXITY_API_KEY not set or using placeholder.'); } else { console.log('Perplexity API Key Status: Loaded successfully.'); }
let openai; let isOpenAIInitialized = false;
if (!openaiApiKey || openaiApiKey === 'YOUR_OPENAI_API_KEY_GOES_HERE') { console.warn('WARNING: OPENAI_API_KEY not set or using placeholder.'); } else { try { openai = new OpenAI({ apiKey: openaiApiKey }); isOpenAIInitialized = true; console.log('OpenAI API Key Status: Loaded successfully & client initialized.'); } catch (error) { console.error("Error initializing OpenAI client:", error.message); } }
// --- End Environment Variable Setup ---

const app = express();
app.use(cors());
app.use(express.json());
const port = 3001;

// --- Mock Grant Data (Only used by direct /api/grants endpoint) ---
const mockGrants = [ /* ... mock data ... */ ];

// --- API Endpoints ---

app.get('/', (req, res) => { res.send('Hello from the BioBeacon Backend!'); });
app.get('/api/grants', (req, res) => { /* ... /api/grants endpoint remains the same ... */ });

// POST endpoint - Full workflow: Perplexity -> OpenAI -> Grants.gov (per keyword)
app.post('/api/process-researcher', async (req, res) => {
  const { name, affiliation } = req.body;
  let actualProfile = null;
  let actualKeywords = [];
  let grantResults = []; // Store combined results from Grants.gov calls

  console.log('Received POST request to /api/process-researcher');
  console.log('  Name:', name);
  console.log('  Affiliation:', affiliation);

  if (!name || !affiliation) { return res.status(400).json({ error: 'Missing name or affiliation' }); }
  if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') { return res.status(500).json({ error: "Server config error: Missing Perplexity API Key" }); }

  // --- Perplexity API Call ---
  console.log('Attempting Perplexity API call...');
  try {
    // ... (Perplexity axios call logic remains the same) ...
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
      // ... (OpenAI call logic remains the same) ...
       const completion = await openai.chat.completions.create({ model: "gpt-3.5-turbo", messages: [ { role: "system", content: "Extract 5-10 relevant keywords suitable for searching grant databases... Return only a comma-separated list." }, { role: "user", content: actualProfile } ], temperature: 0.5, max_tokens: 50 });
      console.log('OpenAI API call successful.');
      const keywordString = completion.choices?.[0]?.message?.content;
      if (keywordString) { actualKeywords = keywordString.split(/,|\n/).map(kw => kw.trim().toLowerCase()).filter(kw => kw.length > 0); console.log('Extracted keywords from OpenAI:', actualKeywords); }
      else { console.warn('Could not find keywords in OpenAI response.'); actualKeywords = ['parsing_failed']; }
    } catch (error) { console.error('Error calling OpenAI API:', error.message); actualKeywords = ['openai_call_failed']; }
  } else if (!actualProfile) { console.log('Skipping OpenAI call: profile missing.'); }
  else { console.log('Skipping OpenAI call: client not initialized.'); actualKeywords = ['openai_not_initialized']; }
  // --- End OpenAI API Call ---


  // --- Grants.gov API Call (One call per keyword, run in parallel) ---
  if (actualKeywords.length > 0 && !actualKeywords[0].includes('_failed') && !actualKeywords[0].includes('_not_initialized')) {
      console.log(`Attempting Grants.gov API calls for ${actualKeywords.length} keywords...`);
      const grantsApiUrl = 'https://api.grants.gov/v1/api/search2';
      const headers = { 'Content-Type': 'application/json' };
      const searchPromises = actualKeywords.map(keyword => {
          const requestData = {
              keyword: keyword, // Use individual keyword
              rows: 5, // Limit results per keyword (adjust as needed)
              oppStatuses: "forecasted|posted"
          };
          console.log(`  -> Querying for keyword: ${keyword}`);
          // Return the promise from axios.post
          return axios.post(grantsApiUrl, requestData, { headers })
                     .catch(err => { // Add basic error handling for individual calls
                         console.error(`Error fetching grants for keyword "${keyword}":`, err.response ? err.response.data : err.message);
                         return null; // Return null or a specific error object if a call fails
                     });
      });

      // Wait for all promises to settle (either resolve or reject)
      const results = await Promise.allSettled(searchPromises);

      let combinedOppHits = [];
      results.forEach((result, index) => {
          const keyword = actualKeywords[index];
          if (result.status === 'fulfilled' && result.value && result.value.data?.data?.oppHits) {
              console.log(`  <- Received ${result.value.data.data.oppHits.length} results for keyword: ${keyword}`);
              combinedOppHits = combinedOppHits.concat(result.value.data.data.oppHits);
          } else if (result.status === 'rejected') {
              // Error already logged in the individual catch block above
              console.log(`  <- Failed to get results for keyword: ${keyword}`);
          } else {
               console.log(`  <- No results or unexpected response for keyword: ${keyword}`);
          }
      });

      grantResults = combinedOppHits; // Assign combined results
      console.log(`Aggregated ${grantResults.length} total grant results (before deduplication).`);

  } else {
      console.log('Skipping Grants.gov call because no valid keywords were obtained.');
  }
  // --- End Grants.gov API Call ---


  // --- Final Response ---
  res.json({
    message: "Successfully processed researcher: Perplexity -> OpenAI -> Grants.gov (per keyword).", // Updated message
    received: { name, affiliation },
    profile: actualProfile,
    actualKeywords: actualKeywords,
    grantResults: grantResults // Send back combined grant results
  });
});


// --- Start Server ---
app.listen(port, () => {
  // ... (startup logs remain the same) ...
  console.log(`BioBeacon backend server listening at http://localhost:${port}`);
  console.log(`Perplexity API Key Status on startup: ${perplexityApiKey ? 'Loaded' : 'Not Loaded or Placeholder'}`);
  console.log(`OpenAI API Key Status on startup: ${openaiApiKey ? 'Loaded' : 'Not Loaded or Placeholder'}`);
  console.log('Available endpoints:');
  console.log(`  GET /`);
  console.log(`  GET /api/grants?keyword=...`); // Kept this endpoint
  console.log(`  POST /api/process-researcher (expects JSON body: {"name": "...", "affiliation": "..."})`);
});
