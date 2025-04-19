// frontend/src/pages/ResultsDisplay.jsx
// --- FULL CODE --- (Added console.log for Sample Grant Data inspection)

import React, { useState, useEffect } from 'react';

// Receive researcherProfile prop
function ResultsDisplay({
    isLoading,
    error,
    processedData,
    researcherProfile
 }) {
  console.log("ResultsDisplay rendering. Received researcherProfile prop:", researcherProfile ? `Type: ${typeof researcherProfile}, Length: ${researcherProfile?.length}` : String(researcherProfile));

  const [activeTab, setActiveTab] = useState('grants'); // Default to grants

  // State for Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'relevance', direction: 'asc' });
  const [displayGrants, setDisplayGrants] = useState([]);

  // Handle Assist button click (Uses localStorage)
  const handleAssistClick = (grant) => {
    // ... (handleAssistClick logic using localStorage remains the same) ...
      console.log("ResultsDisplay: handleAssistClick triggered for grant:", grant?.id);
      console.log("ResultsDisplay: Checking researcherProfile inside handleAssistClick:", researcherProfile ? `Type: ${typeof researcherProfile}, Length: ${researcherProfile?.length}` : String(researcherProfile));
      if (!researcherProfile) { alert("Cannot open assistant: Profile missing."); console.error("..."); return; } else { console.log("ResultsDisplay: researcherProfile check passed."); }
      if (!grant) { alert("Cannot open assistant: Grant missing."); console.error("..."); return; } else { console.log("ResultsDisplay: Grant data check passed."); }
      try { const grantInfoString = JSON.stringify(grant); localStorage.setItem('assistGrantInfo', grantInfoString); localStorage.setItem('assistResearcherProfile', researcherProfile); const checkGrant = localStorage.getItem('assistGrantInfo'); const checkProfile = localStorage.getItem('assistResearcherProfile'); console.log(`ResultsDisplay: Verification - saved: ${!!checkGrant}, ${!!checkProfile}`); if (!checkGrant || !checkProfile) { throw new Error("Data failed to save correctly..."); } const assistUrl = '/assist'; console.log("ResultsDisplay: Opening new tab:", assistUrl); window.open(assistUrl, '_blank', 'noopener,noreferrer'); } catch (storageError) { console.error("ResultsDisplay: Error saving/opening:", storageError); alert("Could not open assistant: " + storageError.message); }
  };

  // useEffect Hook for Sorting Logic AND Inspecting Data
  useEffect(() => {
    console.log("Sorting/Data Log effect running. Sort config:", sortConfig);
    const originalGrants = processedData?.data?.grantResults;

    // <<< Log the raw value >>>
    console.log("Inside useEffect, value of originalGrants:", originalGrants);

    if (!originalGrants) {
      setDisplayGrants([]);
      return;
    }

    // <<< ADDED LOG TO INSPECT GRANT DATA STRUCTURE >>>
    // Log the first grant object to inspect its fields if the array is not empty
    if (originalGrants.length > 0) {
        console.log('Sample Grant Data (first result):', originalGrants[0]);
    }
    // <<< END ADDED LOG >>>

    let sortedGrants = [...originalGrants];
    const { key, direction } = sortConfig;

    if (key !== 'relevance') {
        // ... (Sorting logic remains the same) ...
        sortedGrants.sort((a, b) => {
            let valA = a[key]; let valB = b[key];
            const nullValAsc = Infinity; const nullValDesc = -Infinity;
            if (valA == null) valA = direction === 'asc' ? nullValAsc : nullValDesc;
            if (valB == null) valB = direction === 'asc' ? nullValAsc : nullValDesc;
            if (key.includes('Date')) { const dateA = new Date(valA).getTime(); const dateB = new Date(valB).getTime(); valA = isNaN(dateA) ? (direction === 'asc' ? nullValAsc : nullValDesc) : dateA; valB = isNaN(dateB) ? (direction === 'asc' ? nullValAsc : nullValDesc) : dateB; }
            else if (typeof valA === 'string' && typeof valB === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
            let comparison = 0; if (valA > valB) { comparison = 1; } else if (valA < valB) { comparison = -1; }
            return direction === 'desc' ? (comparison * -1) : comparison;
        });
    }

    setDisplayGrants(sortedGrants);
    console.log("Grants sorted/processed. Display count:", sortedGrants.length);

  }, [processedData, sortConfig]);


  const handleSortChange = (event) => {
    const value = event.target.value;
    let newKey = 'relevance'; let newDirection = 'asc';
    if (value.includes('_')) { const parts = value.split('_'); newKey = parts[0]; newDirection = parts[1]; } else { newKey = value; }
    console.log(`Setting sort to: key=${newKey}, direction=${newDirection}`);
    setSortConfig({ key: newKey, direction: newDirection });
  };

  // --- Rendering logic ---
  if (isLoading && !processedData) { /* ... loading ... */ }
  if (error) { /* ... error ... */ }
  if (processedData) {
    const { profile, actualKeywords, grantResults, mockIdeation } = processedData.data || {};
    const backendErrors = processedData.errors || [];
    const currentProfile = researcherProfile;
    return (
      <section className="results-section card">
         <h2>Results</h2>
         {processedData.status && ( <h4 style={{ color: processedData.status === 'success' ? '#28a745' : (processedData.status === 'partial_success' ? '#ffc107' : '#dc3545') }}> Status: {processedData.status.replace('_', ' ')} </h4> )}
         {backendErrors.length > 0 && ( <div className="error-message" style={{ marginBottom: '15px', textAlign: 'left', backgroundColor: '#fff3cd', borderColor: '#ffeeba', color: '#856404' }}> Encountered issues: <ul> {backendErrors.map((err, index) => ( <li key={index}>{err?.step}: {err?.message} {err?.details ? `(${JSON.stringify(err.details)})` : ''}</li> ))} </ul> </div> )}
         <div className="main-results-content">
            <div className="tabs">
               <button className={activeTab === 'grants' ? 'active' : ''} onClick={() => setActiveTab('grants')} disabled={!grantResults && backendErrors.some(e => ['perplexity', 'openai_keywords', 'grants_gov'].includes(e.step))} > Potential Grants ({displayGrants?.length || 0}) </button>
               <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')} disabled={!currentProfile && backendErrors.some(e => e.step === 'perplexity')} > Generated Profile </button>
               <button className={activeTab === 'keywords' ? 'active' : ''} onClick={() => setActiveTab('keywords')} disabled={!actualKeywords && backendErrors.some(e => ['perplexity', 'openai_keywords'].includes(e.step))} > Extracted Keywords ({actualKeywords?.length || 0}) </button>
            </div>
            <div className="tab-content">
              {/* Removed Ideation Content */}
              {/* Grants Content */}
              {activeTab === 'grants' && (
                <div className="grants-section">
                  {/* Sorting UI */}
                  <div className="sorting-controls" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <label htmlFor="sort-select" style={{ fontWeight: 'bold' }}>Sort by:</label>
                     <select id="sort-select" value={sortConfig.key === 'relevance' ? 'relevance' : `${sortConfig.key}_${sortConfig.direction}`} onChange={handleSortChange} style={{ padding: '5px' }} >
                          <option value="relevance">Relevance (Default)</option>
                          <option value="closeDate_asc">Close Date (Soonest First)</option>
                          <option value="closeDate_desc">Close Date (Latest First)</option>
                          <option value="openDate_desc">Open Date (Newest First)</option>
                          <option value="openDate_asc">Open Date (Oldest First)</option>
                          <option value="agencyName_asc">Agency (A-Z)</option>
                          <option value="agencyName_desc">Agency (Z-A)</option>
                          <option value="title_asc">Title (A-Z)</option>
                          <option value="title_desc">Title (Z-A)</option>
                     </select>
                  </div>
                  {/* Grants List */}
                  {displayGrants?.length > 0 ? ( <ul className="grants-list">{displayGrants.map(grant => ( <li key={grant.id || grant.number} className="grant-item"> <strong>Title:</strong> <a href={`https://www.grants.gov/search-results-detail/${grant.id}`} target="_blank" rel="noopener noreferrer">{ grant.title || 'N/A'}</a><br/> <strong>Number:</strong>{grant.number||'N/A'}<br/> <strong>Agency:</strong>{grant.agencyName||'N/A'}<br/> <strong>Status:</strong>{grant.oppStatus||'N/A'}<br/> <strong>Open Date:</strong>{grant.openDate||'N/A'} {grant.closeDate && <>| <strong>Close Date:</strong> {grant.closeDate}</>} <div style={{marginTop:'10px',textAlign:'right'}}> <button onClick={() => handleAssistClick(grant)} className="submit-button" style={{padding:'5px 10px', fontSize:'0.9em'}}> Assist </button></div> </li> ))}</ul> ) : ( grantResults?.length === 0 && actualKeywords?.length > 0 ? <p>No matching grants found...</p> : <p>No grant search performed...</p> )}
                </div>
              )}
              {/* Profile Content */}
              {activeTab === 'profile' && ( <div className="profile-section">{currentProfile ? ( <pre className="profile-text">{currentProfile}</pre> ) : ( <p>No profile generated...</p> )}</div> )}
              {/* Keywords Content */}
              {activeTab === 'keywords' && ( <div className="keywords-section">{actualKeywords?.length > 0 ? ( <p className="keywords-list">{actualKeywords.join(', ')}</p> ) : ( <p>No keywords extracted...</p> )}</div> )}
            </div>
         </div>
      </section>
    );
  }
  return ( <section className="results-section card"><h2>Results</h2><p>Enter researcher details...</p></section> );
}

export default ResultsDisplay;