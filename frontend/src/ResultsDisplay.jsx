import React, { useState } from 'react';

// Receive isLoading, error, and processedData (which contains status, errors, data) as props from App
function ResultsDisplay({ isLoading, error, processedData }) {
  // State to track the active tab, default to 'grants'
  const [activeTab, setActiveTab] = useState('grants');

  // Render loading state
  if (isLoading) {
    // ... (loading state JSX remains the same)
    return (
        <section className="results-section card">
            <h2>Results</h2>
            <div className="loading-indicator">
                <div className="spinner"></div>
                <p className="loading-message">Processing... Please wait.</p>
            </div>
        </section>
    );
  }

  // Render error state - Use the error prop passed from App
  if (error) {
    return (
      <section className="results-section card">
        <h2>Results</h2>
        <p className="error-message">Error: {error}</p>
      </section>
    );
  }

  // Render results with tabs if data is available and status is not 'failed'
  // Check processedData itself and processedData.data before accessing nested properties
  if (processedData && processedData.data) {
    // Extract the nested data for easier access
    const { profile, actualKeywords, grantResults, message } = processedData.data;
    // Check for backend-reported errors within the 'errors' array
    const backendErrors = processedData.errors || [];

    return (
      <section className="results-section card">
        <h2>Results</h2>
        {/* Display overall status and any backend errors */}
        {processedData.status && (
            <h4 style={{ color: processedData.status === 'success' ? '#28a745' : (processedData.status === 'partial_success' ? '#ffc107' : '#dc3545') }}>
                Status: {processedData.status.replace('_', ' ')}
            </h4>
        )}
        {backendErrors.length > 0 && (
            <div className="error-message" style={{ marginBottom: '15px', textAlign: 'left' }}>
                Encountered issues:
                <ul>
                    {backendErrors.map((err, index) => (
                        <li key={index}>{err.step}: {err.message} {err.details ? `(${JSON.stringify(err.details)})` : ''}</li>
                    ))}
                </ul>
            </div>
        )}

        {/* Tab Buttons */}
        <div className="tabs">
          <button
            className={activeTab === 'grants' ? 'active' : ''}
            onClick={() => setActiveTab('grants')}
            // Disable tab if grants might be missing due to earlier failure
            disabled={!grantResults && backendErrors.some(e => ['perplexity', 'openai_keywords'].includes(e.step))}
          >
            Potential Grant Results ({grantResults?.length || 0})
          </button>
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
            // Disable tab if profile is missing due to earlier failure
            disabled={!profile && backendErrors.some(e => e.step === 'perplexity')}
          >
            Generated Profile
          </button>
          <button
            className={activeTab === 'keywords' ? 'active' : ''}
            onClick={() => setActiveTab('keywords')}
             // Disable tab if keywords are missing due to earlier failure
            disabled={!actualKeywords && backendErrors.some(e => ['perplexity', 'openai_keywords'].includes(e.step))}
          >
            Extracted Keywords
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="tab-content">
          {/* Grants Content - Access via data prop */}
          {activeTab === 'grants' && (
            <div className="grants-section">
              {grantResults?.length > 0 ? ( // Use optional chaining
                <ul className="grants-list">
                  {grantResults.map(grant => (
                    <li key={grant.id || grant.number} className="grant-item">
                       <strong>Title:</strong>
                       <a href={`https://www.grants.gov/search-results-detail/${grant.id}`} target="_blank" rel="noopener noreferrer" title={`View details for grant ${grant.number || grant.id} on Grants.gov`}>
                         {' '}{grant.title || 'N/A'}
                       </a>
                       <br />
                      <strong>Number:</strong> {grant.number || 'N/A'} <br />
                      <strong>Agency:</strong> {grant.agencyName || grant.agencyCode || 'N/A'} <br />
                      <strong>Status:</strong> {grant.oppStatus || 'N/A'} <br />
                      <strong>Open Date:</strong> {grant.openDate || 'N/A'}
                      {grant.closeDate && <> | <strong>Close Date:</strong> {grant.closeDate}</>}
                    </li>
                  ))}
                </ul>
              ) : (
                 // Check if keywords were generated successfully before saying no grants found
                 actualKeywords?.length > 0 && !actualKeywords[0].includes('_') ?
                 <p>No matching grants found from Grants.gov for the extracted keywords.</p> :
                 <p>No grant search performed or no results available (check status/errors above).</p>
              )}
            </div>
          )}

          {/* Profile Content - Access via data prop */}
          {activeTab === 'profile' && (
            <div className="profile-section">
              {profile ? ( // Use optional chaining
                <pre className="profile-text">{profile}</pre>
              ) : (
                <p>No profile generated (check status/errors above).</p>
              )}
            </div>
          )}

          {/* Keywords Content - Access via data prop */}
          {activeTab === 'keywords' && (
            <div className="keywords-section">
              {actualKeywords?.length > 0 && !actualKeywords[0].includes('_') ? ( // Use optional chaining
                <p className="keywords-list">{actualKeywords.join(', ')}</p>
              ) : (
                <p>No keywords extracted or keyword extraction failed (check status/errors above).</p>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  // Initial state message before any submission
  return (
     <section className="results-section card">
        <h2>Results</h2>
        <p>Enter researcher details above and click "Process Researcher".</p>
      </section>
  );
}

export default ResultsDisplay;
