// server.js - Backend: Perplexity -> OpenAI -> Grants.gov -> Deduplicate -> Rank

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');

// --- Environment Variable Setup & Client Initialization ---
// ... (API Key checks and OpenAI client initialization remain the same) ...
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') { console.warn('WARNING: PERPLEXITY_API_KEY not set or using placeholder.'); } else { console.log('Perplexity API Key Status: Loaded successfully.'); }
let openai; let isOpenAIInitialized = false;
if (!openaiApiKey || openaiApiKey === 'YOUR_OPENAI_API_KEY_GOES_HERE') { console.warn('WARNING: OPENAI_API_KEY not set or using placeholder.'); } else { try { openai = new OpenAI({ apiKey: openaiApiKey }); isOpenAIInitialized = true; console.log('OpenAI API Key Status: Loaded successfully & client initialized.'); } catch (error) { console.error("Error initializing OpenAI client:", error.message); } }
// --- End Environment Variable Setup ---

const app = express();
app.use(cors());
app.use(express.json());
const port = 3001;

// --- Mock Grant Data (Only used by direct /api/grants endpoint now) ---
const mockGrants = [ /* ... mock data ... */ ];

// --- API Endpoints ---

app.get('/', (req, res) => { res.send('Hello from the BioBeacon Backend!'); });
app.get('/api/grants', (req, res) => { /* ... /api/grants endpoint remains the same ... */ });

// POST endpoint - Full workflow with ranking
app.post('/api/process-researcher', async (req, res) => {
  const { name, affiliation } = req.body;
  let actualProfile = null;
  let actualKeywords = [];
  let grantResults = []; // Holds unique grants before ranking

  console.log('Received POST request to /api/process-researcher');
  console.log('  Name:', name);
  console.log('  Affiliation:', affiliation);

  if (!name || !affiliation) { return res.status(400).json({ error: 'Missing name or affiliation' }); }
  if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE') { return res.status(500).json({ error: "Server config error: Missing Perplexity API Key" }); }

  // --- Perplexity API Call ---
  console.log('Attempting Perplexity API call...');
  try { /* ... Perplexity call logic ... */
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
    try { /* ... OpenAI keyword extraction logic ... */
      const completion = await openai.chat.completions.create({ model: "gpt-3.5-turbo", messages: [ { role: "system", content: "Extract 5-10 relevant keywords suitable for searching grant databases... Return only a comma-separated list." }, { role: "user", content: actualProfile } ], temperature: 0.5, max_tokens: 50 });
      console.log('OpenAI API call successful.');
      const keywordString = completion.choices?.[0]?.message?.content;
      if (keywordString) { actualKeywords = keywordString.split(/,|\n/).map(kw => kw.trim().toLowerCase()).filter(kw => kw.length > 0); console.log('Extracted keywords from OpenAI:', actualKeywords); }
      else { console.warn('Could not find keywords in OpenAI response.'); actualKeywords = ['parsing_failed']; }
    } catch (error) { console.error('Error calling OpenAI API:', error.message); actualKeywords = ['openai_call_failed']; }
  } else { /* ... Skip logging ... */ actualKeywords = actualProfile ? ['openai_not_initialized'] : ['profile_missing']; }
  // --- End OpenAI API Call ---


  // --- Grants.gov API Call (Per Keyword) & Deduplication ---
  if (actualKeywords.length > 0 && !actualKeywords[0].includes('_failed') && !actualKeywords[0].includes('_not_initialized') && !actualKeywords[0].includes('parsing_failed')) {
      console.log(`Attempting Grants.gov API calls for ${actualKeywords.length} keywords...`);
      const grantsApiUrl = 'https://api.grants.gov/v1/api/search2';
      const headers = { 'Content-Type': 'application/json' };
      const searchPromises = actualKeywords.map(keyword => {
          const requestData = { keyword: keyword, rows: 5, oppStatuses: "forecasted|posted" };
          return axios.post(grantsApiUrl, requestData, { headers }).catch(err => { console.error(`Error fetching grants for keyword "${keyword}"`); return null; });
      });
      const results = await Promise.allSettled(searchPromises);
      let combinedOppHits = [];
      results.forEach((result) => { if (result.status === 'fulfilled' && result.value?.data?.data?.oppHits) { combinedOppHits = combinedOppHits.concat(result.value.data.data.oppHits); } });
      console.log(`Aggregated ${combinedOppHits.length} total grant results (before deduplication).`);
      // Deduplicate
      const uniqueGrantsMap = new Map();
      combinedOppHits.forEach(grant => { if (grant?.id) { uniqueGrantsMap.set(grant.id, grant); } });
      grantResults = Array.from(uniqueGrantsMap.values()); // Now holds unique grants
      console.log(`Found ${grantResults.length} unique grant results after deduplication.`);
  } else { console.log('Skipping Grants.gov call because no valid keywords were obtained.'); }
  // --- End Grants.gov API Call & Deduplication ---


  // --- OpenAI API Call for Ranking ---
  let rankedGrantResults = [...grantResults]; // Default to deduplicated order if ranking fails
  if (isOpenAIInitialized && actualProfile && grantResults.length > 0) {
    console.log(`Attempting OpenAI API call to rank ${grantResults.length} grants...`);
    try {
        // Limit the number of grants sent for ranking to avoid large prompts/costs
        const grantsToRank = grantResults.slice(0, 15); // Rank top 15 unique results
        const grantListString = grantsToRank.map((g, index) =>
            `${index + 1}. ID: ${g.id}, Number: ${g.number}, Title: ${g.title}, Agency: ${g.agencyName}`
        ).join('\n');

        const rankingPrompt = `Based on the following researcher profile:\n---\n${actualProfile}\n---\nRank the relevance of the following grant opportunities (listed with index, ID, Number, Title, Agency). Return ONLY a comma-separated list of the grant IDs (e.g., "356511,348796,357137") in order from most relevant to least relevant.\n\nGrants:\n${grantListString}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Or gpt-4 if needed/available
            messages: [
                { role: "system", content: "You are an expert AI assistant specializing in matching researchers with relevant grant funding based on their profile." },
                { role: "user", content: rankingPrompt }
            ],
            temperature: 0.3, // Lower temperature for more deterministic ranking
            max_tokens: 100 // Should be enough for a list of IDs
        });

        console.log('OpenAI Ranking call successful.');
        const rankedIdString = completion.choices?.[0]?.message?.content;

        if (rankedIdString) {
            console.log('Raw ranking string from OpenAI:', rankedIdString);
            // Parse the comma-separated list of IDs
            const rankedIds = rankedIdString.split(',').map(id => id.trim()).filter(id => id);
            console.log('Parsed ranked IDs:', rankedIds);

            // Create a map for quick lookup of original grants by ID
            const grantMap = new Map(grantResults.map(g => [g.id?.toString(), g])); // Ensure ID is string for comparison

            // Reorder the grantResults based on rankedIds
            const reorderedResults = rankedIds
                .map(id => grantMap.get(id)) // Get grant object for each ID in ranked order
                .filter(grant => grant !== undefined); // Filter out any potential undefined if IDs don't match

            // Add any grants that were not ranked (e.g., if list was > 15 or AI missed some) to the end
            const rankedGrantIdsSet = new Set(rankedIds);
            const unrankedGrants = grantResults.filter(g => !rankedGrantIdsSet.has(g.id?.toString()));

            rankedGrantResults = [...reorderedResults, ...unrankedGrants];
            console.log(`Reordered ${reorderedResults.length} grants based on AI ranking. Total results: ${rankedGrantResults.length}`);

        } else {
            console.warn('Could not parse ranking order from OpenAI response.');
            // Keep original deduplicated order if ranking fails
        }

    } catch (error) {
        console.error('Error calling OpenAI API for ranking:');
         if (error instanceof OpenAI.APIError) { console.error(' Status:', error.status); console.error(' Message:', error.message); }
         else { console.error(' Error Message:', error.message); }
        // Keep original deduplicated order on error
    }
  } else {
      console.log('Skipping ranking step (OpenAI client not ready, no profile, or no grants found).');
  }
  // --- End OpenAI Ranking Call ---


  // --- Final Response ---
  res.json({
    message: "Successfully processed researcher: Perplexity -> OpenAI -> Grants.gov -> Deduplicate -> Rank.", // Updated message
    received: { name, affiliation },
    profile: actualProfile,
    actualKeywords: actualKeywords,
    grantResults: rankedGrantResults // Send back ranked grant results
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
