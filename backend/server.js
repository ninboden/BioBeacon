// server.js - Backend with improved error handling response structure

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

// --- Mock Grant Data ---
const mockGrants = [ /* ... mock data ... */ ];

// --- API Endpoints ---

app.get('/', (req, res) => { res.send('Hello from the BioBeacon Backend!'); });
app.get('/api/grants', (req, res) => { /* ... /api/grants endpoint remains the same ... */ });

// POST endpoint - Full workflow with enhanced error handling
app.post('/api/process-researcher', async (req, res) => {
  const { name, affiliation } = req.body;
  let actualProfile = null;
  let actualKeywords = [];
  let grantResults = [];
  let rankedGrantResults = [];
  let overallStatus = 'success'; // Assume success initially
  const errorsEncountered = []; // Array to hold error details

  console.log('Received POST request to /api/process-researcher');
  console.log('  Name:', name);
  console.log('  Affiliation:', affiliation);

  if (!name || !affiliation) { return res.status(400).json({ status: 'failed', errors: ['Missing name or affiliation'], data: null }); } // Return structured error

  // Check for essential API keys early
  if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') {
      errorsEncountered.push({ step: 'config', message: 'Perplexity API Key is not configured correctly.' });
      return res.status(500).json({ status: 'failed', errors: errorsEncountered, data: null });
  }
   if (!isOpenAIInitialized) {
       // Log warning but maybe allow proceeding without OpenAI steps? Or fail? Let's allow partial for now.
       console.warn("OpenAI client not initialized, steps requiring OpenAI will be skipped.");
       errorsEncountered.push({ step: 'config', message: 'OpenAI client not initialized (check API Key). Skipping OpenAI steps.' });
       overallStatus = 'partial_success'; // Mark as partial if OpenAI is needed but missing
   }


  // --- Perplexity API Call ---
  console.log('Attempting Perplexity API call...');
  try {
    const perplexityApiUrl = 'https://api.perplexity.ai/chat/completions';
    const requestData = { model: "sonar", messages: [ { role: "system", content: "Generate a concise, professional researcher profile..." }, { role: "user", content: `Generate profile for ${name}, affiliated with ${affiliation}.` } ] };
    const headers = { 'Authorization': `Bearer ${perplexityApiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };
    const response = await axios.post(perplexityApiUrl, requestData, { headers });
    console.log('Perplexity API call successful.');
    if (response.data?.choices?.[0]?.message?.content) {
       actualProfile = response.data.choices[0].message.content;
       console.log('Extracted profile from Perplexity.');
    } else {
       console.warn('Could not find profile in Perplexity response.');
       actualProfile = null; // Set profile to null if not found
       errorsEncountered.push({ step: 'perplexity', message: 'Could not parse profile from Perplexity response.' });
       overallStatus = 'partial_success';
    }
  } catch (error) {
    console.error('Error calling Perplexity API:', error.message);
    errorsEncountered.push({ step: 'perplexity', message: 'Failed to call Perplexity API', details: error.response ? error.response.data : error.message });
    // Perplexity profile is critical, fail the whole request if it errors
    return res.status(500).json({ status: 'failed', errors: errorsEncountered, data: { received: { name, affiliation } } });
  }
  // --- End Perplexity API Call ---


  // --- OpenAI API Call for Keywords ---
  if (isOpenAIInitialized && actualProfile) { // Only proceed if OpenAI is ready and profile exists
    console.log('Attempting OpenAI API call for keywords...');
    try {
      const completion = await openai.chat.completions.create({ model: "gpt-3.5-turbo", messages: [ { role: "system", content: "Extract 5-10 relevant keywords suitable for searching grant databases... Return only a comma-separated list." }, { role: "user", content: actualProfile } ], temperature: 0.5, max_tokens: 50 });
      console.log('OpenAI API call for keywords successful.');
      const keywordString = completion.choices?.[0]?.message?.content;
      if (keywordString) { actualKeywords = keywordString.split(/,|\n/).map(kw => kw.trim().toLowerCase()).filter(kw => kw.length > 0); console.log('Extracted keywords from OpenAI:', actualKeywords); }
      else { console.warn('Could not find keywords in OpenAI response.'); errorsEncountered.push({ step: 'openai_keywords', message: 'Could not parse keywords from OpenAI response.' }); overallStatus = 'partial_success'; }
    } catch (error) {
      console.error('Error calling OpenAI API for keywords:', error.message);
      errorsEncountered.push({ step: 'openai_keywords', message: 'Failed to call OpenAI for keywords', details: error instanceof OpenAI.APIError ? error.message : error.message });
      overallStatus = 'partial_success';
      // Continue without keywords if this step fails
    }
  } else { console.log('Skipping OpenAI keyword extraction (client not ready or no profile).'); }
  // --- End OpenAI API Call ---


  // --- Grants.gov API Call (Per Keyword) & Deduplication ---
  let combinedOppHits = [];
  if (actualKeywords.length > 0) { // Only search if we have keywords
      console.log(`Attempting Grants.gov API calls for ${actualKeywords.length} keywords...`);
      const grantsApiUrl = 'https://api.grants.gov/v1/api/search2';
      const headers = { 'Content-Type': 'application/json' };
      const searchPromises = actualKeywords.map(keyword => {
          const requestData = { keyword: keyword, rows: 5, oppStatuses: "forecasted|posted" };
          return axios.post(grantsApiUrl, requestData, { headers }).catch(err => {
              const errorDetail = err.response ? err.response.data : err.message;
              console.error(`Error fetching grants for keyword "${keyword}":`, errorDetail);
              errorsEncountered.push({ step: 'grants_gov', keyword: keyword, message: 'Failed to fetch grants for keyword', details: errorDetail });
              overallStatus = 'partial_success';
              return null; // Allow Promise.allSettled to continue
          });
      });
      const results = await Promise.allSettled(searchPromises);
      results.forEach((result) => { if (result.status === 'fulfilled' && result.value?.data?.data?.oppHits) { combinedOppHits = combinedOppHits.concat(result.value.data.data.oppHits); } });
      console.log(`Aggregated ${combinedOppHits.length} total grant results (before deduplication).`);
      // Deduplicate
      const uniqueGrantsMap = new Map();
      combinedOppHits.forEach(grant => { if (grant?.id) { uniqueGrantsMap.set(grant.id, grant); } });
      grantResults = Array.from(uniqueGrantsMap.values()); // Holds unique grants
      console.log(`Found ${grantResults.length} unique grant results after deduplication.`);
  } else { console.log('Skipping Grants.gov call because no valid keywords were obtained.'); }
  // --- End Grants.gov API Call & Deduplication ---


  // --- OpenAI API Call for Ranking ---
  rankedGrantResults = [...grantResults]; // Default to deduplicated order
  if (isOpenAIInitialized && actualProfile && grantResults.length > 0) {
    console.log(`Attempting OpenAI API call to rank ${grantResults.length} grants...`);
    try {
        const grantsToRank = grantResults.slice(0, 15);
        const grantListString = grantsToRank.map((g, index) => `${index + 1}. ID: ${g.id}, Number: ${g.number}, Title: ${g.title}, Agency: ${g.agencyName}`).join('\n');
        const rankingPrompt = `Based on the following researcher profile:\n---\n${actualProfile}\n---\nRank the relevance of the following grant opportunities... Return ONLY a comma-separated list of the grant IDs... \n\nGrants:\n${grantListString}`;
        const completion = await openai.chat.completions.create({ model: "gpt-3.5-turbo", messages: [ { role: "system", content: "You are an expert AI assistant specializing in matching researchers with relevant grant funding..." }, { role: "user", content: rankingPrompt } ], temperature: 0.3, max_tokens: 100 });
        console.log('OpenAI Ranking call successful.');
        const rankedIdString = completion.choices?.[0]?.message?.content;
        if (rankedIdString) {
            const rankedIds = rankedIdString.split(',').map(id => id.trim()).filter(id => id);
            const grantMap = new Map(grantResults.map(g => [g.id?.toString(), g]));
            const reorderedResults = rankedIds.map(id => grantMap.get(id)).filter(grant => grant !== undefined);
            const rankedGrantIdsSet = new Set(rankedIds);
            const unrankedGrants = grantResults.filter(g => !rankedGrantIdsSet.has(g.id?.toString()));
            rankedGrantResults = [...reorderedResults, ...unrankedGrants];
            console.log(`Reordered ${reorderedResults.length} grants based on AI ranking. Total results: ${rankedGrantResults.length}`);
        } else { console.warn('Could not parse ranking order from OpenAI response.'); errorsEncountered.push({ step: 'openai_ranking', message: 'Could not parse ranking from OpenAI response.' }); overallStatus = 'partial_success'; }
    } catch (error) {
        console.error('Error calling OpenAI API for ranking:', error.message);
        errorsEncountered.push({ step: 'openai_ranking', message: 'Failed to call OpenAI for ranking', details: error instanceof OpenAI.APIError ? error.message : error.message });
        overallStatus = 'partial_success';
        // Keep original deduplicated order if ranking fails
    }
  } else { console.log('Skipping ranking step (Prerequisites not met).'); }
  // --- End OpenAI Ranking Call ---


  // --- Final Response ---
  console.log(`Finishing request with status: ${overallStatus}`);
  res.json({
    status: overallStatus, // 'success', 'partial_success', 'failed'
    errors: errorsEncountered, // Array of specific errors
    data: { // Wrap actual data in a 'data' object
        received: { name, affiliation },
        profile: actualProfile,
        actualKeywords: actualKeywords,
        grantResults: rankedGrantResults // Send back final (ranked or unranked) grant results
    }
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
  console.log(`  GET /api/grants?keyword=...`);
  console.log(`  POST /api/process-researcher (expects JSON body: {"name": "...", "affiliation": "..."})`);
});
