// frontend/src/pages/GrantAssistPage.jsx
// --- FULL CODE --- (Side-by-side layout for Controls/Response)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const grantSections = [
    "Project Summary/Abstract", "Project Narrative", "Specific Aims",
    "Research Strategy", "Significance / Scientific Premise", "Innovation",
    "Approach", "Preliminary Data", "Other (Specify in prompt)",
];

const getInitialStateFromLocalStorage = (key, defaultValue) => {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            console.log(`GrantAssistPage: Found ${key} in localStorage.`);
            return JSON.parse(storedValue);
        }
        console.log(`GrantAssistPage: Did not find ${key} in localStorage.`);
    } catch (error) {
        console.error(`GrantAssistPage: Error parsing ${key} from localStorage:`, error);
    }
    return defaultValue;
};

const backendUrl = 'http://localhost:3001';

function GrantAssistPage() {
    const [error, setError] = useState('');
    const [grantInfo, setGrantInfo] = useState(() => getInitialStateFromLocalStorage('assistGrantInfo', null));
    const [researcherProfile, setResearcherProfile] = useState(() => {
        const storedProfile = localStorage.getItem('assistResearcherProfile');
        console.log(`GrantAssistPage: Init researcherProfile from localStorage: ${storedProfile ? 'Found' : 'Missing'}`);
        return storedProfile || '';
    });

    const [targetSection, setTargetSection] = useState(grantSections[2]);
    const [userPrompt, setUserPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [assistantResponse, setAssistantResponse] = useState('');

    useEffect(() => {
        // ... (useEffect logic remains the same as previous working version) ...
        let didLoad = false;
        setError('');
        console.log("GrantAssistPage: useEffect START - Reading localStorage.");
        try {
            let currentGrantInfo = grantInfo; // Check current state first
            let currentProfile = researcherProfile;
            if (!currentGrantInfo) {
                const storedGrant = localStorage.getItem('assistGrantInfo');
                if (storedGrant) {
                     console.log("GrantAssistPage: useEffect found storedGrant.");
                     currentGrantInfo = JSON.parse(storedGrant);
                     setGrantInfo(currentGrantInfo);
                }
            }
             if (!currentProfile) {
                const storedProfile = localStorage.getItem('assistResearcherProfile');
                 if (storedProfile) {
                     console.log("GrantAssistPage: useEffect found storedProfile.");
                     currentProfile = storedProfile;
                     setResearcherProfile(currentProfile);
                 }
            }

            if (currentGrantInfo && currentProfile) {
                didLoad = true;
                console.log("GrantAssistPage: Context data loaded. Cleaning up localStorage.");
                localStorage.removeItem('assistGrantInfo');
                localStorage.removeItem('assistResearcherProfile');
            } else {
                console.error("GrantAssistPage: Context data still missing after useEffect check.");
                setError("Could not load assistant context. Please ensure you clicked 'Assist' recently.");
                localStorage.removeItem('assistGrantInfo');
                localStorage.removeItem('assistResearcherProfile');
            }
        } catch (err) {
             console.error("GrantAssistPage: Error during useEffect (reading/parsing localStorage):", err);
             setError("Error loading assistant context. Check console.");
             localStorage.removeItem('assistGrantInfo');
             localStorage.removeItem('assistResearcherProfile');
        } finally {
             console.log("GrantAssistPage: useEffect FINISHED. Data loaded:", didLoad);
        }
    }, []); // Run once

    // handleSubmitRequest remains the same
    const handleSubmitRequest = () => {
         if (!userPrompt.trim()) { alert("Please enter a specific request."); return; }
         if (!grantInfo || !researcherProfile) { alert("Context is missing."); return; }
         console.log("GrantAssistPage: Submitting request...");
         setIsLoading(true); setAssistantResponse(''); setError('');
         const apiUrl = `${backendUrl}/api/assist-grant-writing`;
         const requestBody = { researcherProfile, grantInfo, targetSection, userPrompt };
         fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) })
         .then(response => { if (!response.ok) { return response.json().then(err => Promise.reject(err)).catch(()=>Promise.reject({error:`HTTP ${response.status}`})) } return response.json(); })
         .then(data => { console.log("GrantAssistPage: Received response:", data); if (data.success && data.draftText) { setAssistantResponse(data.draftText); setError(''); } else { throw new Error(data.error || 'Invalid response from backend.'); } })
         .catch(error => { console.error("GrantAssistPage: Error calling API:", error); setError(`Failed: ${error.message}`); setAssistantResponse(''); })
         .finally(() => { setIsLoading(false); });
    };

    // --- Rendering Logic ---
    if (error) { return ( <div className="app-container" style={{ justifyContent: 'center' }}> <p className="error-message">{error}</p> <Link to="/researcher-app">Go Back</Link> </div> ); }
    if (!grantInfo) { return ( <div className="app-container" style={{ justifyContent: 'center' }}> <div className="loading-indicator"> <div className="spinner"></div> Loading Assistant... </div> </div> ); }

    // Main Assistant UI
    return (
        <div className="app-container">
             <header className="app-header"><h1>Grant Writing Assistant</h1></header>
             <main className="main-content" style={{ maxWidth: '900px', margin: '0 auto' }}> {/* Wider max-width */}
                 <section className="card">
                    {/* Grant Info Display */}
                    <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                        <h3 style={{marginTop: 0}}>Assisting with Grant:</h3>
                        <p><strong>Title:</strong> {grantInfo.title || 'N/A'}<br />
                           <strong>Number:</strong> {grantInfo.number || 'N/A'}<br />
                           <strong>Agency:</strong> {grantInfo.agencyName || 'N/A'}
                        </p>
                    </div>

                    {/* <<< NEW: Wrapper for side-by-side layout >>> */}
                    <div className="assistant-layout-container">

                        {/* <<< Column 1: Controls >>> */}
                        <div className="assistant-controls">
                            <div className="form-group" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '15px' }}>
                                <label htmlFor="targetSectionSelect" style={{ fontWeight: 'bold' }}>Target Section:</label>
                                <select id="targetSectionSelect" value={targetSection} onChange={(e) => setTargetSection(e.target.value)} style={{ padding: '10px', marginTop: '5px' }}>
                                    {grantSections.map(section => (<option key={section} value={section}>{section}</option>))}
                                </select>
                            </div>

                            <div className="form-group" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '15px' }}>
                                <label htmlFor="userPromptTextarea" style={{ fontWeight: 'bold' }}>Your Request / Prompt:</label>
                                <textarea id="userPromptTextarea" rows="8" value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder={`e.g., "Draft an opening paragraph for ${targetSection}..."`} style={{ marginTop: '5px', width: 'calc(100% - 22px)', padding: '10px', resize: 'vertical' }} />
                            </div>
                            {/* Show fetch error related to this section if it occurs */}
                            {error && <p className="error-message" style={{textAlign: 'left', marginBottom: '10px'}}>{error}</p>}

                            <button onClick={handleSubmitRequest} className="submit-button" style={{ width: '100%' }} disabled={isLoading} >
                                {isLoading ? 'Generating...' : 'Generate Draft'}
                            </button>
                        </div>

                        {/* <<< Column 2: Response Area >>> */}
                        <div className="assistant-response-display">
                            <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Assistant Response:</h4>
                            {isLoading ? (
                                <div className="loading-indicator" style={{ justifyContent: 'flex-start', alignItems:'center', minHeight: '100px' }}>
                                    <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '10px' }}></div>
                                    <span>Processing...</span>
                                </div>
                             ) : (
                                <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', backgroundColor: '#f9f9f9', border: '1px solid #eee', padding: '15px', borderRadius: '4px', minHeight: '200px', maxHeight: '500px', overflowY: 'auto' }}>
                                     {assistantResponse || <span style={{color: '#777'}}>Response will appear here.</span>}
                                </pre>
                            )}
                        </div>

                    </div> {/* <<< End assistant-layout-container >>> */}
                 </section>
             </main>
             <footer className="app-footer"><p>(BioBeacon Assistant)</p></footer>
        </div>
    );
}

export default GrantAssistPage;