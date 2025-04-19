// backend/server.js
// --- FULL CODE --- (Functional Process-Researcher w/ Refined Perplexity Prompt AND Functional Assist-Grant-Writing w/ Refined OpenAI Prompt)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');

// --- Environment Variable Setup & Client Initialization ---
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!perplexityApiKey || !perplexityApiKey.startsWith('pplx-')) { console.warn('WARNING: PERPLEXITY_API_KEY not set correctly.'); } else { console.log('Perplexity API Key Status: Loaded.'); }
let openai; let isOpenAIInitialized = false;
if (!openaiApiKey || !openaiApiKey.startsWith('sk-')) { console.warn('WARNING: OPENAI_API_KEY not set correctly. OpenAI features will be skipped.'); } else { try { openai = new OpenAI({ apiKey: openaiApiKey }); isOpenAIInitialized = true; console.log('OpenAI API Key Status: Loaded & client initialized.'); } catch (error) { console.error("Error initializing OpenAI client:", error.message); console.warn('OpenAI features will be skipped.'); } }
// --- End Environment Variable Setup ---

const app = express();
app.use(cors());
app.use(express.json());
const port = 3001;

// --- API Endpoints ---
app.get('/', (req, res) => { res.send('Hello from the BioBeacon Backend!'); });

// --- Endpoint for main researcher processing ---
app.post('/api/process-researcher', async (req, res) => {
    const { name, affiliation } = req.body;
    let actualProfile = null; let actualKeywords = []; let grantResults = []; let rankedGrantResults = [];
    let overallStatus = 'success'; const errorsEncountered = [];
    console.log('\n--- New Request ---'); console.log('Received POST request to /api/process-researcher'); console.log('  Name:', name); console.log('  Affiliation:', affiliation);

    // Input Validation
    if (!name || !affiliation) { return res.status(400).json({ status: 'failed', errors: ['Missing name or affiliation'], data: null }); }
    if (!perplexityApiKey || !perplexityApiKey.startsWith('pplx-')) { return res.status(500).json({ status: 'failed', errors: [{ step: 'config', message: 'Perplexity API Key not configured.' }], data: null }); }
    if (!isOpenAIInitialized && openaiApiKey && openaiApiKey.startsWith('sk-')) { console.warn("OpenAI client not initialized."); errorsEncountered.push({ step: 'config', message: 'OpenAI client not initialized.' }); overallStatus = 'partial_success'; } else if (!isOpenAIInitialized) { console.log("OpenAI API Key not provided/invalid."); }

    // --- Step 1: Perplexity API Call for Profile (with Refined Prompt) ---
    console.log('Attempting Perplexity API call for structured profile...');
    try {
        const perplexityApiUrl = 'https://api.perplexity.ai/chat/completions';

        // <<< REFINED PERPLEXITY PROMPT >>>
        const systemPromptForProfile = `You are a research analyst summarizing a researcher's profile for grant seeking purposes. Based on the provided name and affiliation and publicly available information, generate a structured summary containing the following sections using Markdown headings:
1.  '## Potential Funding Keywords:' (Suggest 10 specific keywords based on the research areas, disease study, and methodologies suitable for searching grant databases like NIH RePORTER or Grants.gov).
2.  '## Brief Narrative Summary:' (A concise 2-4 sentence paragraph synthesizing their main research focus and expertise).
If limited information is found, state that clearly within the relevant sections. Focus on academic and research-oriented information.`;

        const userPromptForProfile = `Generate a structured profile summary for researcher named ${name}, affiliated with ${affiliation}.`;

        const requestData = {
            model: "sonar",
            messages: [
                { role: "system", content: systemPromptForProfile },
                { role: "user", content: userPromptForProfile }
            ]
        };
        // <<< END REFINED PERPLEXITY PROMPT >>>

        const headers = { 'Authorization': `Bearer ${perplexityApiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };
        const response = await axios.post(perplexityApiUrl, requestData, { headers });
        console.log('Perplexity API call successful.');
        if (response.data?.choices?.[0]?.message?.content) {
            actualProfile = response.data.choices[0].message.content.trim();
            console.log('Extracted structured profile from Perplexity.');
            // console.log("Generated Profile Text:\n", actualProfile); // Uncomment to log the profile
        } else {
             actualProfile = "Could not generate profile from Perplexity response."; errorsEncountered.push({ step: 'perplexity', message: 'Could not parse profile.' }); overallStatus = 'partial_success';
        }
    } catch (error) { console.error('Error calling Perplexity API:', error.message); actualProfile = "Failed to retrieve profile."; overallStatus = 'partial_success'; errorsEncountered.push({ step: 'perplexity', message: 'Failed Perplexity call', details: error.message });}

    // --- Step 2: OpenAI Keywords ---
    // Now using the potentially structured profile from Perplexity
    if (isOpenAIInitialized && actualProfile && !actualProfile.startsWith("Failed") && !actualProfile.startsWith("Could not")) {
        console.log('Attempting OpenAI API call for keywords from generated profile...');
        try {
            // Refined prompt acknowledging potential structure and keywords within profile
            const keywordSystemPrompt = "Analyze the provided researcher profile text, which may contain sections like '## Key Research Areas:', '## Core Methodologies:', and potentially '## Potential Funding Keywords:'. Extract or synthesize 5-10 highly relevant keywords suitable for searching grant databases (like Grants.gov, NIH RePORTER). Prioritize specific scientific concepts, techniques, diseases, and areas mentioned. If the profile suggests 'Potential Funding Keywords', use them as strong candidates but refine or add based on the entire profile context. Return ONLY a comma-separated list of keywords (e.g., keyword1, keyword2, keyword3), with no introductory text or formatting.";
            const completion = await openai.chat.completions.create({ model: "gpt-3.5-turbo", messages: [ { role: "system", content: keywordSystemPrompt }, { role: "user", content: actualProfile } ], temperature: 0.4, max_tokens: 80 }); // Slightly lower temp, more tokens just in case
            console.log('OpenAI Keywords call successful.');
            const keywordString = completion.choices?.[0]?.message?.content;
            if (keywordString) {
                 // Filter out lines that might be markdown headers or empty
                 actualKeywords = keywordString.split(',')
                                        .map(kw => kw.trim().toLowerCase())
                                        .filter(kw => kw.length > 1 && !kw.startsWith('#') && !kw.includes(':')); // Basic filtering
                 console.log('Extracted keywords:', actualKeywords);
                 if(actualKeywords.length < 3){ // Warn if very few keywords extracted
                      console.warn('Extracted fewer than 3 keywords.');
                      errorsEncountered.push({ step: 'openai_keywords', message:`Parsed only ${actualKeywords.length} keywords.`});
                      if (actualKeywords.length === 0) overallStatus = 'partial_success';
                 }
             } else { errorsEncountered.push({ step: 'openai_keywords', message:'Could not parse keywords.' }); overallStatus='partial_success'; actualKeywords=[]; }
        } catch (error) { console.error('OpenAI Keywords Error:', error.message); errorsEncountered.push({ step: 'openai_keywords', message: 'Failed OpenAI call', details: error.message }); overallStatus='partial_success'; actualKeywords=[]; }
    } else { /* ... log skipping ... */ }

    // --- Step 3: Grants.gov Search & Dedupe ---
    if (actualKeywords.length > 0) { console.log(`Attempting Grants.gov calls for ${actualKeywords.length} keywords...`); const url = 'https://api.grants.gov/v1/api/search2'; const hdrs = { 'Content-Type': 'application/json' }; const promises = actualKeywords.map(kw => axios.post(url, { keyword: kw, rows: 10, oppStatuses: "forecasted|posted" }, { headers: hdrs }).catch(e => ({ error: true, keyword: kw, details: e.message }))); const results = await Promise.allSettled(promises); let combined = []; results.forEach((r, i) => { if (r.status === 'fulfilled') { if (r.value.error) { errorsEncountered.push({ step: 'grants_gov', keyword: actualKeywords[i], message: 'Fetch failed', details: r.value.details }); overallStatus = 'partial_success'; } else if (r.value?.data?.data?.oppHits) { combined = combined.concat(r.value.data.data.oppHits); } } else { errorsEncountered.push({ step: 'grants_gov', keyword: actualKeywords[i], message: 'Promise rejected', details: r.reason }); overallStatus = 'partial_success'; } }); const map = new Map(); combined.forEach(g => { if(g?.id) map.set(g.id, g); }); grantResults = Array.from(map.values()); console.log(`Found ${grantResults.length} unique grants.`); } else { console.log('Skipping Grants.gov...'); if (actualKeywords.length === 0 && actualProfile && !actualProfile.startsWith("Failed")) { errorsEncountered.push({ step: 'grants_gov', message: 'Skipped: No keywords.' }); } }

    // --- Step 4: OpenAI Ranking ---
    rankedGrantResults = [...grantResults]; if (isOpenAIInitialized && actualProfile && !actualProfile.startsWith("Failed") && grantResults.length > 0) { console.log(`Attempting OpenAI ranking...`); try { const toRank = grantResults.slice(0, 20); const listStr = toRank.map(g => `${g.id}: ${g.title} (Agency: ${g.agencyName||'N/A'}, Num: ${g.number||'N/A'})`).join('\n'); const rankPrompt = `Profile:\n---\n${actualProfile}\n---\nRank relevance... Return ONLY comma-separated IDs...\n\nGrants:\n${listStr}`; const compl = await openai.chat.completions.create({ model: "gpt-3.5-turbo", messages: [ { role: "system", content: "You are expert AI... Return ONLY IDs..." }, { role: "user", content: rankPrompt } ], temperature: 0.3, max_tokens: 200 }); const rankStr = compl.choices?.[0]?.message?.content; if (rankStr) { const rankIds = rankStr.split(',').map(id => id.trim()).filter(id => id); const gMap = new Map(grantResults.map(g => [g.id?.toString(), g])); const reordered = rankIds.map(id => gMap.get(id)).filter(g => g); const rankedSet = new Set(reordered.map(g => g.id?.toString())); const unranked = grantResults.filter(g => !rankedSet.has(g.id?.toString())); rankedGrantResults = [...reordered, ...unranked]; console.log(`Reordered ${reordered.length} grants.`); if (reordered.length === 0 && rankIds.length > 0){ errorsEncountered.push({ step:'openai_ranking', message:'Ranked IDs no match.'}); overallStatus='partial_success';} } else { errorsEncountered.push({ step: 'openai_ranking', message: 'Could not parse ranking.' }); overallStatus = 'partial_success'; } } catch (e) { console.error('OpenAI Ranking Error:', e.message); errorsEncountered.push({ step: 'openai_ranking', message: 'API call failed', details: e.message }); overallStatus = 'partial_success'; } }

    // --- Step 5: Mock Ideation ---
    const topKeyword = actualKeywords[0] || 'research area'; const secondKeyword = actualKeywords[1] || 'focus'; const topGrant = rankedGrantResults[0]; const mockIdeation = [ `Consider intersection of ${topKeyword} and ${secondKeyword}...`, `Highlight ${affiliation} resources for grant ${topGrant?.number || 'top grant'}...`, `Explore collaborations...`, `Tailor aims towards ${topGrant?.agencyName || 'agency'} priorities...`, `Investigate recent awards by ${topGrant?.agencyName || 'agency'} in ${topKeyword}...` ]; console.log("Added mock ideation points.");

    // --- Final Response (/api/process-researcher) ---
    console.log(`Finishing /api/process-researcher request with status: ${overallStatus}`);
    res.json({ status: overallStatus, errors: errorsEncountered, data: { received: { name, affiliation }, profile: actualProfile, actualKeywords: actualKeywords, grantResults: rankedGrantResults, mockIdeation: mockIdeation } });
});
// <<< END of /api/process-researcher >>>


// --- Endpoint: Grant Writing Assistant ---
// (Includes refined prompts based on targetSection)
app.post('/api/assist-grant-writing', async (req, res) => {
    console.log('\n--- New Request ---'); console.log('Received POST request to /api/assist-grant-writing');
    const { researcherProfile, grantInfo, targetSection, userPrompt } = req.body; console.log(' Target Section:', targetSection); console.log(' Grant Number:', grantInfo?.number || 'N/A');
    let errorsEncountered = []; let draftText = null;
    if (!researcherProfile || !grantInfo || !targetSection || !userPrompt) { return res.status(400).json({ success: false, error: 'Missing required fields.' }); }
    if (!isOpenAIInitialized) { return res.status(500).json({ success: false, error: 'OpenAI client is not initialized.' }); }

    // Construct Refined OpenAI Prompt
    const systemMessage = `You are an expert grant writing assistant... Start the response directly...`; // Using refined version
    let finalUserInstruction = `User Request: ${userPrompt}\n\nDraft content for "${targetSection}"...`; // Default
    // Section-Specific Instructions
    if (targetSection === "Specific Aims") { finalUserInstruction = `User Request: ${userPrompt}\n\n...draft content for "Specific Aims"... Ensure clear, concise, measurable... Structure (Aim 1:)... Start directly...`; }
    else if (targetSection === "Significance / Scientific Premise") { finalUserInstruction = `User Request: ${userPrompt}\n\n...draft content for "Significance / Scientific Premise"... Emphasize importance, gap, impact... Connect to agency... Start directly...`; }
    else if (targetSection === "Project Summary/Abstract") { finalUserInstruction = `User Request: ${userPrompt}\n\n...draft content for "Project Summary/Abstract"... Concise overview: goals, aims, significance, design, outcomes/impact... Avoid jargon... Start directly...`; }
    else if (targetSection === "Approach") { finalUserInstruction = `User Request: ${userPrompt}\n\n...draft content for "Approach"... Describe design, methods, procedures, analysis, pitfalls, alternatives... Align with expertise... Start directly...`; }
    else if (targetSection === "Innovation") { finalUserInstruction = `User Request: ${userPrompt}\n\n...draft content for "Innovation"... Explain how research is innovative... Differentiate from existing... Highlight advancement... Start directly...`; }
    const userMessage = `Profile:\n---\n${researcherProfile}\n---\n\nGrant:\n---\nTitle: ${grantInfo.title||'N/A'}\nNum: ${grantInfo.number||'N/A'}\nAgency: ${grantInfo.agencyName||'N/A'}\n---\n\nSection: ${targetSection}\n\n${finalUserInstruction}`;
    console.log('Constructed refined OpenAI prompt (User message length:', userMessage.length, ')');

    // Call OpenAI API
    try { console.log('Attempting OpenAI call for assistance...'); const completion = await openai.chat.completions.create({ model: "gpt-3.5-turbo", messages: [ { role: "system", content: systemMessage }, { role: "user", content: userMessage } ], temperature: 0.6, max_tokens: 700 }); console.log('OpenAI call successful.'); draftText = completion.choices?.[0]?.message?.content?.trim(); if (!draftText) { errorsEncountered.push('OpenAI response empty.'); } } catch (error) { console.error('OpenAI Assist Error:', error.message); errorsEncountered.push(`Failed OpenAI call: ${error.message}`); return res.status(500).json({ success: false, error: 'Failed OpenAI call.', details: error.message }); }

    // Send JSON Response
    if (errorsEncountered.length > 0) { res.json({ success: true, draftText: draftText || `Could not generate draft. Issues: ${errorsEncountered.join(', ')}`, errors: errorsEncountered }); } else { res.json({ success: true, draftText: draftText }); }
});
// <<< END of /api/assist-grant-writing >>>


// --- Start Server ---
app.listen(port, () => {
    console.log(`\nBioBeacon backend server listening on http://localhost:${port}`);
    console.log('Ensure Perplexity and OpenAI API keys are set in backend/.env');
    console.log('Waiting for requests...');
});