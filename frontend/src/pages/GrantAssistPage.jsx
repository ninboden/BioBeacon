// frontend/src/pages/GrantAssistPage.jsx
// --- FULL CODE --- (Initialize state directly from localStorage, simplified useEffect)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const grantSections = [
    "Project Summary/Abstract", "Project Narrative", "Specific Aims",
    "Research Strategy", "Significance / Scientific Premise", "Innovation",
    "Approach", "Preliminary Data", "Other (Specify in prompt)",
];

// Helper function to safely get and parse item from localStorage
const getInitialStateFromLocalStorage = (key, defaultValue) => {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            console.log(`GrantAssistPage: Found ${key} in localStorage.`);
            return JSON.parse(storedValue);
        }
        console.log(`GrantAssistPage: Did not find ${key} in localStorage, using default.`);
    } catch (error) {
        console.error(`GrantAssistPage: Error parsing ${key} from localStorage:`, error);
    }
    // Remove invalid item if parsing failed or not found initially
    // Note: This might clear storage if the page loads before item is set,
    // but useEffect cleanup should handle the normal case. Consider if needed.
    // localStorage.removeItem(key);
    return defaultValue;
};


function GrantAssistPage() {
    const [error, setError] = useState('');

    // === CHANGED: Initialize state using function that reads localStorage ===
    const [grantInfo, setGrantInfo] = useState(() => getInitialStateFromLocalStorage('assistGrantInfo', null));
    const [researcherProfile, setResearcherProfile] = useState(() => {
        // Profile isn't JSON, just get the string
        const storedProfile = localStorage.getItem('assistResearcherProfile');
        console.log(`GrantAssistPage: Init researcherProfile from localStorage: ${storedProfile ? 'Found' : 'Missing'}`);
        // No need to remove here, useEffect will handle it if found
        return storedProfile || ''; // Default to empty string if not found
    });
    // === End Initial State Change ===

    const [targetSection, setTargetSection] = useState(grantSections[2]);
    const [userPrompt, setUserPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [assistantResponse, setAssistantResponse] = useState('');


    // === CHANGED: useEffect now primarily handles cleanup and initial error check ===
    useEffect(() => {
        console.log("GrantAssistPage: useEffect running.");
        // Check if data failed to load during initialization
        if (!grantInfo || !researcherProfile) {
             console.error("GrantAssistPage: useEffect detected state is missing after init. Setting error.");
             setError("Could not load assistant context. Please go back and try clicking 'Assist' again.");
             // Clear any potentially remaining items
             localStorage.removeItem('assistGrantInfo');
             localStorage.removeItem('assistResearcherProfile');
        } else {
            console.log("GrantAssistPage: useEffect confirmed state seems loaded. Cleaning up localStorage.");
             // Cleanup storage now that state is presumably set
             localStorage.removeItem('assistGrantInfo');
             localStorage.removeItem('assistResearcherProfile');
        }
         // We only want this effect to run once after the initial render.
    }, []); // Still run only once on mount

    // handleSubmitRequest remains the same (using simulation for now)
    const handleSubmitRequest = () => {
         if (!userPrompt.trim()) { alert("Please enter a specific request or question."); return; }
         if (!grantInfo || !researcherProfile) { alert("Assistant context (grant or profile) is missing."); return; }
         console.log("GrantAssistPage: Submitting assistant request.");
         setIsLoading(true);
         setAssistantResponse('');
         setError('');
         setTimeout(() => {
             console.log("Simulating AI response received.");
             const mockResponse = `Simulated response using LOCAL STORAGE for: ${targetSection}\nGrant: ${grantInfo.number}\nRequest: "${userPrompt}"\n\nBased on the provided context... [Simulated text]`;
             setAssistantResponse(mockResponse);
             setIsLoading(false);
         }, 2000);
    };

    // --- Rendering Logic ---
    // Show error first if it was set during useEffect
    if (error) {
        return ( <div className="app-container" style={{ justifyContent: 'center' }}> <p className="error-message">{error}</p> <Link to="/researcher-app">Go Back</Link> </div> );
    }
    // Show loading if state hasn't initialized yet (should be brief)
    // This check should now pass if initialization worked
    if (!grantInfo) {
        return ( <div className="app-container" style={{ justifyContent: 'center' }}> <div className="loading-indicator"> <div className="spinner"></div> Loading Assistant... </div> </div> );
    }
    // Main Assistant UI JSX...
    return (
        <div className="app-container">
             <header className="app-header"><h1>Grant Writing Assistant</h1></header>
             <main className="main-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
                 <section className="card">
                    {/* Grant Info Display */}
                    <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                        <h3 style={{marginTop: 0}}>Assisting with Grant:</h3>
                        <p><strong>Title:</strong> {grantInfo.title || 'N/A'}<br />
                           <strong>Number:</strong> {grantInfo.number || 'N/A'}<br />
                           <strong>Agency:</strong> {grantInfo.agencyName || 'N/A'}
                        </p>
                    </div>
                    {/* Controls */}
                    <div className="form-group" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '15px' }}>
                        <label htmlFor="targetSectionSelect" style={{ fontWeight: 'bold' }}>Target Section:</label>
                        <select id="targetSectionSelect" value={targetSection} onChange={(e) => setTargetSection(e.target.value)} style={{ padding: '10px', marginTop: '5px' }}>
                            {grantSections.map(section => (<option key={section} value={section}>{section}</option>))}
                        </select>
                    </div>
                    <div className="form-group" style={{ flexDirection: 'column', alignItems: 'stretch', marginBottom: '15px' }}>
                        <label htmlFor="userPromptTextarea" style={{ fontWeight: 'bold' }}>Your Request / Prompt:</label>
                        <textarea id="userPromptTextarea" rows="5" value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder={`e.g., "Draft an opening paragraph for ${targetSection}..."`} style={{ marginTop: '5px', width: 'calc(100% - 22px)', padding: '10px', resize: 'vertical' }} />
                    </div>
                    <button onClick={handleSubmitRequest} className="submit-button" style={{ width: '100%', marginBottom: '20px' }} disabled={isLoading} >
                        {isLoading ? 'Generating...' : 'Generate Draft'}
                    </button>
                    {/* Response Area */}
                    <div className="assistant-response-area" style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <h4 style={{ marginTop: 0 }}>Assistant Response:</h4>
                        {isLoading ? ( <div className="loading-indicator" style={{ justifyContent: 'flex-start' }}> <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '10px' }}></div> <span>Processing...</span> </div> ) : (
                            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', backgroundColor: '#f9f9f9', border: '1px solid #eee', padding: '15px', borderRadius: '4px', maxHeight: '400px', overflowY: 'auto' }}>
                                 {assistantResponse || <span style={{color: '#777'}}>Response will appear here.</span>}
                            </pre>
                        )}
                    </div>
                 </section>
             </main>
             <footer className="app-footer"><p>(BioBeacon Assistant)</p></footer>
        </div>
    );
}

export default GrantAssistPage;