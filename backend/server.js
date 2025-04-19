// backend/server.js
// --- FULL CODE ---
// Includes: Perplexity Profile -> OpenAI Keywords -> Grants.gov Search/Dedupe -> OpenAI Rank -> Mock Ideation

require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai'); // Use the official OpenAI library

// --- Environment Variable Setup & Client Initialization ---
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// Perplexity Key Check
if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE' || !perplexityApiKey.startsWith('pplx-')) {
    console.warn('WARNING: PERPLEXITY_API_KEY not set correctly in backend/.env file.');
} else {
    console.log('Perplexity API Key Status: Loaded successfully.');
}

// OpenAI Client Initialization
let openai;
let isOpenAIInitialized = false;
if (!openaiApiKey || openaiApiKey === 'YOUR_OPENAI_API_KEY_GOES_HERE' || !openaiApiKey.startsWith('sk-')) {
    console.warn('WARNING: OPENAI_API_KEY not set correctly in backend/.env file. OpenAI features will be skipped.');
} else {
    try {
        openai = new OpenAI({ apiKey: openaiApiKey }); // Initialize OpenAI client
        isOpenAIInitialized = true;
        console.log('OpenAI API Key Status: Loaded successfully & client initialized.');
    } catch (error) {
        console.error("Error initializing OpenAI client:", error.message);
        console.warn('OpenAI features will be skipped due to initialization error.');
    }
}
// --- End Environment Variable Setup ---

const app = express();
app.use(cors()); // Enable Cross-Origin Resource Sharing for requests from frontend
app.use(express.json()); // Enable parsing of JSON request bodies
const port = 3001; // Port the backend server will listen on

// --- Mock Grant Data (Optional - can be removed if not needed directly) ---
const mockGrants = [
    { id: 1, title: "Grant A", agency: "NIH" },
    { id: 2, title: "Grant B", agency: "NSF" }
];

// --- API Endpoints ---

// Basic root endpoint
app.get('/', (req, res) => {
    res.send('Hello from the BioBeacon Backend!');
});

// Simple endpoint to return mock grants (if needed)
app.get('/api/grants', (req, res) => {
    console.log('GET request to /api/grants');
    res.json(mockGrants);
});

// POST endpoint - Full researcher processing workflow
app.post('/api/process-researcher', async (req, res) => {
    const { name, affiliation } = req.body; // Extract name and affiliation from request body
    let actualProfile = null;
    let actualKeywords = [];
    let grantResults = [];
    let rankedGrantResults = [];
    let overallStatus = 'success'; // Assume success initially
    const errorsEncountered = []; // Array to store any non-fatal errors

    console.log('\n--- New Request ---');
    console.log('Received POST request to /api/process-researcher');
    console.log('  Name:', name);
    console.log('  Affiliation:', affiliation);

    // --- Input Validation ---
    if (!name || !affiliation) {
        console.error('Request failed: Missing name or affiliation.');
        return res.status(400).json({ status: 'failed', errors: ['Missing name or affiliation'], data: null });
    }
    // Check if Perplexity key is usable
    if (!perplexityApiKey || perplexityApiKey === 'YOUR_PERPLEXITY_API_KEY_GOES_HERE' || !perplexityApiKey.startsWith('pplx-')) {
         console.error('Request failed: Perplexity API Key is not configured.');
         errorsEncountered.push({ step: 'config', message: 'Perplexity API Key is not configured correctly on the server.' });
         // Return 500 Internal Server Error as it's a server config issue
         return res.status(500).json({ status: 'failed', errors: errorsEncountered, data: null });
    }
    // Check if OpenAI client is ready (if key was provided)
    if (!isOpenAIInitialized && openaiApiKey && openaiApiKey !== 'YOUR_OPENAI_API_KEY_GOES_HERE' && openaiApiKey.startsWith('sk-')) {
         console.warn("OpenAI client not initialized despite key being present (check logs for initialization error). Skipping OpenAI steps.");
         errorsEncountered.push({ step: 'config', message: 'OpenAI client not initialized (check server logs). Skipping OpenAI steps.' });
         overallStatus = 'partial_success';
    } else if (!isOpenAIInitialized) {
         console.log("OpenAI API Key not provided or invalid. Skipping OpenAI steps.");
         // Don't add an error if the key simply wasn't provided - this is expected behavior.
    }
    // --- End Input Validation ---


    // --- Step 1: Perplexity API Call for Profile ---
    console.log('Attempting Perplexity API call for profile...');
    try {
        const perplexityApiUrl = 'https://api.perplexity.ai/chat/completions';
        const requestData = {
            model: "sonar", // Or try "sonar-medium-online" if needed
            messages: [
                { role: "system", content: "Generate a concise, professional researcher profile suitable for identifying relevant research areas and keywords for grant searching. Focus on key expertise, research interests, and methodologies based on publicly available information. If no specific information is found, state that." },
                { role: "user", content: `Generate profile for ${name}, affiliated with ${affiliation}.` }
            ]
        };
        const headers = {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        const response = await axios.post(perplexityApiUrl, requestData, { headers });
        console.log('Perplexity API call successful.');

        if (response.data?.choices?.[0]?.message?.content) {
            actualProfile = response.data.choices[0].message.content.trim();
            console.log('Extracted profile from Perplexity.');
        } else {
            console.warn('Could not find profile content in Perplexity response structure.');
            actualProfile = "Could not generate profile from Perplexity response."; // Provide a default message
            errorsEncountered.push({ step: 'perplexity', message: 'Could not parse profile from Perplexity response structure.' });
            overallStatus = 'partial_success';
        }
    } catch (error) {
        console.error('Error calling Perplexity API:');
        if (error.response) {
            // The request was made and the server responded with a status code that falls out of the range of 2xx
            console.error('  Status:', error.response.status);
            console.error('  Data:', error.response.data);
            errorsEncountered.push({ step: 'perplexity', message: `Perplexity API Error ${error.response.status}`, details: error.response.data });
        } else if (error.request) {
            // The request was made but no response was received
            console.error('  Error: No response received from Perplexity.');
            errorsEncountered.push({ step: 'perplexity', message: 'No response received from Perplexity API' });
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('  Error:', error.message);
            errorsEncountered.push({ step: 'perplexity', message: 'Failed to make Perplexity API request', details: error.message });
        }
         // Decide if this error is fatal. For now, let's make it non-fatal but record the error.
         actualProfile = "Failed to retrieve profile from Perplexity.";
         overallStatus = 'partial_success'; // Mark as partial success as we can't proceed fully
         // If we consider Perplexity failure fatal, uncomment the next line:
         // return res.status(500).json({ status: 'failed', errors: errorsEncountered, data: { received: { name, affiliation } } });
    }
    // --- End Perplexity API Call ---


    // --- Step 2: OpenAI API Call for Keywords (if profile exists and OpenAI is ready) ---
    if (isOpenAIInitialized && actualProfile && !actualProfile.startsWith("Failed") && !actualProfile.startsWith("Could not generate")) {
        console.log('Attempting OpenAI API call for keywords...');
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "Extract 5-10 relevant keywords suitable for searching grant databases like Grants.gov based on the provided researcher profile. Focus on specific scientific concepts, methodologies, diseases, or research areas mentioned. Return ONLY a comma-separated list of keywords (e.g., keyword1, keyword2, keyword3)." },
                    { role: "user", content: actualProfile } // Send the profile obtained from Perplexity
                ],
                temperature: 0.5, // Lower temperature for more focused output
                max_tokens: 60 // Allocate enough tokens for keywords
            });
            console.log('OpenAI API call for keywords successful.');
            const keywordString = completion.choices?.[0]?.message?.content;

            if (keywordString) {
                // Split by comma, trim whitespace, convert to lowercase, filter empty strings
                actualKeywords = keywordString.split(',')
                                           .map(kw => kw.trim().toLowerCase())
                                           .filter(kw => kw.length > 0);
                console.log('Extracted keywords from OpenAI:', actualKeywords);
                 if (actualKeywords.length === 0) {
                     console.warn('OpenAI returned a response, but no valid keywords were parsed.');
                     errorsEncountered.push({ step: 'openai_keywords', message: 'OpenAI response parsed, but resulted in zero valid keywords.'});
                     overallStatus = 'partial_success';
                 }
            } else {
                console.warn('Could not find keywords in OpenAI response content.');
                errorsEncountered.push({ step: 'openai_keywords', message: 'Could not parse keywords from OpenAI response content.' });
                overallStatus = 'partial_success';
                actualKeywords = []; // Ensure it's an empty array
            }
        } catch (error) {
            console.error('Error calling OpenAI API for keywords:', error.message);
             errorsEncountered.push({
                step: 'openai_keywords',
                message: 'Failed to call OpenAI for keywords',
                details: error instanceof OpenAI.APIError ? `OpenAI API Error: ${error.status} ${error.name} ${error.message}` : error.message
            });
            overallStatus = 'partial_success';
            actualKeywords = []; // Ensure it's an empty array on error
        }
    } else {
        if (!isOpenAIInitialized) {
             console.log('Skipping OpenAI keyword extraction (OpenAI not initialized).');
        } else {
             console.log('Skipping OpenAI keyword extraction (No valid profile obtained).');
             // Add error only if profile generation failed earlier
             if(actualProfile && (actualProfile.startsWith("Failed") || actualProfile.startsWith("Could not generate"))){
                  errorsEncountered.push({ step: 'openai_keywords', message: 'Skipped due to profile generation failure.'});
             }
        }
    }
    // --- End OpenAI API Call for Keywords ---


    // --- Step 3: Grants.gov API Call (Per Keyword) & Deduplication ---
    if (actualKeywords.length > 0) {
        console.log(`Attempting Grants.gov API calls for ${actualKeywords.length} keywords...`);
        const grantsApiUrl = 'https://api.grants.gov/v1/api/search2';
        const headers = { 'Content-Type': 'application/json' };

        // Create an array of promises for each keyword search
        const searchPromises = actualKeywords.map(keyword => {
            const requestData = {
                keyword: keyword,
                rows: 10, // Fetch more rows per keyword initially
                oppStatuses: "forecasted|posted" // Search for forecasted and posted grants
            };
            // Add a catch block to each promise to handle individual failures
            return axios.post(grantsApiUrl, requestData, { headers })
                       .catch(err => {
                            const errorDetail = err.response ? `Status ${err.response.status}: ${JSON.stringify(err.response.data)}` : err.message;
                            console.error(`Error fetching grants for keyword "${keyword}": ${errorDetail}`);
                            // Don't push to errorsEncountered here, handle in allSettled results
                            return { error: true, keyword: keyword, details: errorDetail }; // Return an error object for identification
                        });
        });

        // Use Promise.allSettled to wait for all searches, even if some fail
        const results = await Promise.allSettled(searchPromises);

        let combinedOppHits = [];
        results.forEach((result, index) => {
            const keyword = actualKeywords[index];
            if (result.status === 'fulfilled') {
                // Check if the fulfilled promise contains our custom error object or actual data
                if (result.value.error) {
                     errorsEncountered.push({ step: 'grants_gov', keyword: keyword, message: 'Failed to fetch grants for keyword', details: result.value.details });
                     overallStatus = 'partial_success';
                } else if (result.value?.data?.data?.oppHits) {
                    console.log(`  Keyword "${keyword}": Found ${result.value.data.data.oppHits.length} grants.`);
                    combinedOppHits = combinedOppHits.concat(result.value.data.data.oppHits);
                } else {
                     console.log(`  Keyword "${keyword}": Found 0 grants or unexpected response structure.`);
                     // Optional: Log if the structure was unexpected but no error occurred
                     // errorsEncountered.push({ step: 'grants_gov', keyword: keyword, message: 'Received success status but no oppHits found or unexpected structure.' });
                }
            } else { // status === 'rejected' - Should not happen due to .catch inside map, but handle defensively
                console.error(`Unexpected rejection for keyword "${keyword}": ${result.reason}`);
                 errorsEncountered.push({ step: 'grants_gov', keyword: keyword, message: 'Grant search promise unexpectedly rejected.', details: result.reason });
                 overallStatus = 'partial_success';
            }
        });

        console.log(`Aggregated ${combinedOppHits.length} total grant results (before deduplication).`);

        // Deduplicate based on grant ID
        const uniqueGrantsMap = new Map();
        combinedOppHits.forEach(grant => {
            if (grant?.id) { // Ensure grant and grant.id exist
                uniqueGrantsMap.set(grant.id, grant);
            }
        });
        grantResults = Array.from(uniqueGrantsMap.values());
        console.log(`Found ${grantResults.length} unique grant results after deduplication.`);

    } else {
        console.log('Skipping Grants.gov call because no valid keywords were obtained.');
        if (actualKeywords.length === 0 && actualProfile && !actualProfile.startsWith("Failed")) {
             // If profile was okay, but keyword extraction yielded nothing, add specific note.
             errorsEncountered.push({ step: 'grants_gov', message: 'Skipped grant search: No keywords were extracted from the profile.' });
             // Don't necessarily mark as partial_success, could be valid if profile has no keywords
        }
    }
    // --- End Grants.gov API Call & Deduplication ---


    // --- Step 4: OpenAI API Call for Ranking (if profile, grants exist, and OpenAI is ready) ---
    rankedGrantResults = [...grantResults]; // Default to deduplicated order if ranking fails/skipped
    if (isOpenAIInitialized && actualProfile && !actualProfile.startsWith("Failed") && grantResults.length > 0) {
        console.log(`Attempting OpenAI API call to rank ${grantResults.length} grants...`);
        try {
            // Limit ranking to a reasonable number to avoid large prompts/costs
            const grantsToRank = grantResults.slice(0, 20); // Rank top 20 unique grants
            const grantListString = grantsToRank.map((g, index) =>
                `${g.id}: ${g.title} (Agency: ${g.agencyName || g.agencyCode || 'N/A'}, Number: ${g.number || 'N/A'})`
            ).join('\n');

            const rankingPrompt = `Based on the following researcher profile:\n---\n${actualProfile}\n---\nRank the relevance of the following grant opportunities. Consider the researcher's expertise, interests, and the grant's focus and agency. Return ONLY a comma-separated list of the grant IDs, ordered from most relevant to least relevant. Only include IDs from the list provided.\n\nGrants:\n${grantListString}`;

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo", // Or potentially a more advanced model if needed for accuracy
                messages: [
                    { role: "system", content: "You are an expert AI assistant specializing in matching researchers with relevant grant funding based on their profile and grant descriptions. Prioritize relevance based on scientific overlap. Return ONLY the comma-separated list of grant IDs as requested." },
                    { role: "user", content: rankingPrompt }
                ],
                temperature: 0.3, // Lower temperature for more deterministic ranking
                max_tokens: 200 // Adjust based on the max number of grant IDs expected (e.g., 20 IDs * ~10 chars/ID = 200)
            });
            console.log('OpenAI Ranking call successful.');

            const rankedIdString = completion.choices?.[0]?.message?.content;
            if (rankedIdString) {
                 // Parse the comma-separated string of IDs
                 const rankedIds = rankedIdString.split(',').map(id => id.trim()).filter(id => id); // Trim and remove empty strings

                 // Create a map for quick lookup of grants by ID (convert grant ID to string for comparison)
                 const grantMap = new Map(grantResults.map(g => [g.id?.toString(), g]));

                 // Create the ranked list based on the order of IDs returned by OpenAI
                 const reorderedResults = rankedIds
                    .map(id => grantMap.get(id)) // Get the grant object for each ranked ID
                    .filter(grant => grant !== undefined); // Filter out any IDs not found in our original list

                // Get the IDs that were successfully reordered
                const rankedGrantIdsSet = new Set(reorderedResults.map(g => g.id?.toString()));

                 // Get the grants that were in the original list but *not* included in the AI's ranked list
                 const unrankedGrants = grantResults.filter(g => !rankedGrantIdsSet.has(g.id?.toString()));

                 // Combine the AI-ranked grants with the remaining unranked grants
                 rankedGrantResults = [...reorderedResults, ...unrankedGrants];
                 console.log(`Reordered ${reorderedResults.length} grants based on AI ranking. Total results: ${rankedGrantResults.length}`);

                 if (reorderedResults.length === 0 && rankedIds.length > 0) {
                     console.warn('OpenAI returned ranked IDs, but none matched the fetched grant IDs.');
                     errorsEncountered.push({ step: 'openai_ranking', message: 'AI returned ranked IDs, but none matched fetched grants.', details: `AI IDs: ${rankedIds.join(',')}` });
                     overallStatus = 'partial_success';
                 } else if (reorderedResults.length < rankedIds.length) {
                     console.warn(`OpenAI returned ${rankedIds.length} IDs, but only ${reorderedResults.length} matched fetched grants.`);
                      errorsEncountered.push({ step: 'openai_ranking', message: 'AI returned some IDs that did not match fetched grants.', details: `AI IDs: ${rankedIds.join(',')}`});
                      // Not necessarily partial success, could be acceptable
                 }

            } else {
                console.warn('Could not parse ranking order from OpenAI response content.');
                errorsEncountered.push({ step: 'openai_ranking', message: 'Could not parse ranking from OpenAI response content.' });
                overallStatus = 'partial_success';
                 // Keep the original 'grantResults' order in 'rankedGrantResults'
            }
        } catch (error) {
            console.error('Error calling OpenAI API for ranking:', error.message);
            errorsEncountered.push({
                step: 'openai_ranking',
                message: 'Failed to call OpenAI for ranking',
                details: error instanceof OpenAI.APIError ? `OpenAI API Error: ${error.status} ${error.name} ${error.message}` : error.message
            });
            overallStatus = 'partial_success';
            // Keep the original 'grantResults' order in 'rankedGrantResults'
        }
    } else {
         if (!isOpenAIInitialized) {
             console.log('Skipping ranking step (OpenAI not initialized).');
         } else if (!actualProfile || actualProfile.startsWith("Failed")) {
             console.log('Skipping ranking step (No valid profile obtained).');
         } else if (grantResults.length === 0) {
             console.log('Skipping ranking step (No grants found to rank).');
         }
    }
    // --- End OpenAI Ranking Call ---


    // --- Step 5: Generate Mock Ideation Data ---
    // Use data available at this point (keywords, top ranked grant)
    const topKeyword = actualKeywords[0] || 'your primary research area';
    const secondKeyword = actualKeywords[1] || 'a secondary focus';
    const topGrant = rankedGrantResults[0]; // Use the potentially re-ordered list

    const mockIdeation = [
        `Consider focusing a proposal on the intersection of ${topKeyword} and ${secondKeyword} based on ${name}'s profile strengths.`,
        `Highlight ${affiliation}'s unique resources or facilities relevant to grant opportunity ${topGrant?.number || 'the top ranked grant'}.`,
        `Explore collaborative potential with researchers mentioned in relation to ${name}'s work (if applicable based on profile).`,
        `Tailor the specific aims towards the stated priorities of ${topGrant?.agencyName || 'the funding agency'} for grant ${topGrant?.number || 'the most relevant opportunity'}.`,
        `Investigate recent awards by ${topGrant?.agencyName || 'the agency'} in the area of ${topKeyword} for insights.`
    ];
    console.log("Added mock ideation points.");
    // --- End Mock Ideation ---


    // --- Final Response ---
    // Ensure the structure is { status, errors, data: { received, profile, actualKeywords, grantResults, mockIdeation } }
    console.log(`Finishing request with status: ${overallStatus}`);
    res.json({ // Start of the main response object
        status: overallStatus,
        errors: errorsEncountered,
        data: { // <<< Start of the nested 'data' payload object
            received: { name, affiliation },
            profile: actualProfile,
            actualKeywords: actualKeywords,
            grantResults: rankedGrantResults, // Send the potentially ranked results
            mockIdeation: mockIdeation // <<< Ensure mockIdeation is correctly placed HERE
        } // <<< End of the nested 'data' payload object
    }); // End of the main response object
});


// --- Start Server ---
app.listen(port, () => {
    console.log(`\nBioBeacon backend server listening on http://localhost:${port}`);
    console.log('Ensure Perplexity and OpenAI API keys are set in backend/.env');
    console.log('Waiting for requests...');
});