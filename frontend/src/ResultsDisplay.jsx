// frontend/src/ResultsDisplay.jsx
// --- FULL CODE --- (Removed debugger; statement)

import React, { useState } from 'react';

// Receive researcherProfile prop
function ResultsDisplay({
    isLoading,
    error,
    processedData,
    researcherProfile // Prop received here
 }) {
  // Log prop on render
  console.log("ResultsDisplay rendering. Received researcherProfile prop:", researcherProfile ? `Type: ${typeof researcherProfile}, Length: ${researcherProfile?.length}` : String(researcherProfile));

  const [activeTab, setActiveTab] = useState('ideation');

  // Handle Assist button click for new tab
  const handleAssistClick = (grant) => {
      console.log("ResultsDisplay: handleAssistClick triggered for grant:", grant?.id);
      // Log profile inside handler
      console.log("ResultsDisplay: Checking researcherProfile inside handleAssistClick:", researcherProfile ? `Type: ${typeof researcherProfile}, Length: ${researcherProfile?.length}` : String(researcherProfile));

      // Check #1
      if (!researcherProfile) {
          alert("Cannot open assistant: Researcher profile is not available.");
          console.error("ResultsDisplay: Assist Click Failed - researcherProfile is missing or empty.");
          return; // Exit if no profile
      } else {
          console.log("ResultsDisplay: researcherProfile check passed.");
      }
      // Check #2
      if (!grant) {
           alert("Cannot open assistant: Grant data is missing.");
           console.error("ResultsDisplay: Assist Click Failed - grant data is missing.");
           return;
      } else {
           console.log("ResultsDisplay: Grant data check passed.");
      }

      // --- Save to localStorage and open tab ---
      try {
          const grantInfoString = JSON.stringify(grant);
          console.log("ResultsDisplay: Attempting to save to localStorage:");
          console.log("  Key: assistGrantInfo, Value snippet:", grantInfoString.substring(0, 100) + "...");
          console.log("  Key: assistResearcherProfile, Value snippet:", String(researcherProfile).substring(0, 100) + "...");

          localStorage.setItem('assistGrantInfo', grantInfoString);
          localStorage.setItem('assistResearcherProfile', researcherProfile);

          const checkGrant = localStorage.getItem('assistGrantInfo');
          const checkProfile = localStorage.getItem('assistResearcherProfile');
          console.log(`ResultsDisplay: Verification - grant saved: ${!!checkGrant}, profile saved: ${!!checkProfile}`);

          if (!checkGrant || !checkProfile) {
               throw new Error("Data failed to save correctly to localStorage immediately after setting.");
          }

          // <<< DEBUGGER REMOVED >>>

          const assistUrl = '/assist';
          console.log("ResultsDisplay: Opening new tab:", assistUrl);
          window.open(assistUrl, '_blank', 'noopener,noreferrer');


      } catch (storageError) {
          console.error("ResultsDisplay: Error saving data to localStorage or opening tab:", storageError);
          alert("Could not open assistant due to storage error: " + storageError.message);
      }
      // --- End Save ---
  }; // End of handleAssistClick

  // --- Rendering logic (Ensure all tabs have correct content) ---
  if (isLoading && !processedData) { return ( <section className="results-section card"><h2>Results</h2><div className="loading-indicator"><div className="spinner"></div><p>Processing...</p></div></section> ); }
  if (error) { return ( <section className="results-section card"><h2>Results</h2><p className="error-message">Error: {error}</p></section> ); }
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
               <button className={activeTab === 'ideation' ? 'active' : ''} onClick={() => setActiveTab('ideation')} > Ideation </button>
               <button className={activeTab === 'grants' ? 'active' : ''} onClick={() => setActiveTab('grants')} disabled={!grantResults && backendErrors.some(e => ['perplexity', 'openai_keywords', 'grants_gov'].includes(e.step))} > Potential Grants ({grantResults?.length || 0}) </button>
               <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')} disabled={!currentProfile && backendErrors.some(e => e.step === 'perplexity')} > Generated Profile </button>
               <button className={activeTab === 'keywords' ? 'active' : ''} onClick={() => setActiveTab('keywords')} disabled={!actualKeywords && backendErrors.some(e => ['perplexity', 'openai_keywords'].includes(e.step))} > Extracted Keywords ({actualKeywords?.length || 0}) </button>
            </div>
            <div className="tab-content">
               {activeTab === 'ideation' && ( <div className="ideation-section">{ mockIdeation?.length > 0 ? ( <ul>{mockIdeation.map((i,idx)=><li key={idx} className="ideation-item">{i}</li>)}</ul> ) : <p>No ideation suggestions available.</p> }</div> )}
               {activeTab === 'grants' && ( <div className="grants-section">{ grantResults?.length > 0 ? ( <ul className="grants-list">{grantResults.map(grant => ( <li key={grant.id || grant.number} className="grant-item"><strong>Title:</strong> <a href={`https://www.grants.gov/search-results-detail/${grant.id}`} target="_blank" rel="noopener noreferrer">{ grant.title || 'N/A'}</a><br/><strong>Number:</strong>{grant.number||'N/A'}<br/><strong>Agency:</strong>{grant.agencyName||'N/A'}<br/><strong>Status:</strong>{grant.oppStatus||'N/A'}<br/><strong>Open Date:</strong>{grant.openDate||'N/A'} {grant.closeDate && <>| <strong>Close Date:</strong> {grant.closeDate}</>} <div style={{marginTop:'10px',textAlign:'right'}}><button onClick={() => handleAssistClick(grant)} className="submit-button" style={{padding:'5px 10px', fontSize:'0.9em'}}> Assist </button></div> </li> ))}</ul> ) : ( actualKeywords?.length > 0 ? <p>No matching grants found from Grants.gov for the extracted keywords.</p> : <p>No grant search performed or no results available (check status/errors above).</p> )}</div> )}
               {activeTab === 'profile' && ( <div className="profile-section">{currentProfile ? ( <pre className="profile-text">{currentProfile}</pre> ) : ( <p>No profile generated (check status/errors above).</p> )}</div> )}
               {activeTab === 'keywords' && ( <div className="keywords-section">{actualKeywords?.length > 0 ? ( <p className="keywords-list">{actualKeywords.join(', ')}</p> ) : ( <p>No keywords extracted or keyword extraction failed (check status/errors above).</p> )}</div> )}
             </div>
         </div>
      </section>
    );
  }
  return ( <section className="results-section card"><h2>Results</h2><p>Enter researcher details above and click "Process Researcher".</p></section> );
}

export default ResultsDisplay;