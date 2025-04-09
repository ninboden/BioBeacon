import React, { useState } from 'react';

// Receive isLoading, error, and processedData as props from App
function ResultsDisplay({ isLoading, error, processedData }) {
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

  // Render error state
  if (error) {
    // ... (error state JSX remains the same)
     return (
      <section className="results-section card">
        <h2>Results</h2>
        <p className="error-message">Error: {error}</p>
      </section>
    );
  }

  // Render results with tabs if data is available
  if (processedData) {
    // Base URL for Grants.gov details (assuming structure based on grant ID)
    const grantsGovBaseUrl = 'https://www.grants.gov/search-results-detail/';

    return (
      <section className="results-section card">
        <h2>Results</h2>
        {/* Tab Buttons */}
        <div className="tabs">
          <button
            className={activeTab === 'grants' ? 'active' : ''}
            onClick={() => setActiveTab('grants')}
          >
            Potential Grant Results ({processedData.grantResults?.length || 0})
          </button>
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            Generated Profile
          </button>
          <button
            className={activeTab === 'keywords' ? 'active' : ''}
            onClick={() => setActiveTab('keywords')}
          >
            Extracted Keywords
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="tab-content">
          {/* Grants Content */}
          {activeTab === 'grants' && (
            <div className="grants-section">
              {processedData.grantResults?.length > 0 ? (
                <ul className="grants-list">
                  {processedData.grantResults.map(grant => (
                    <li key={grant.id || grant.number} className="grant-item">
                      {/* Make Title a Link */}
                      <strong>Title:</strong>
                      <a
                        href={`${grantsGovBaseUrl}${grant.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`View details for grant ${grant.number || grant.id} on Grants.gov`}
                      >
                        {' '}{grant.title || 'N/A'}
                      </a>
                      <br />
                      {/* End Link */}
                      <strong>Number:</strong> {grant.number || 'N/A'} <br />
                      <strong>Agency:</strong> {grant.agencyName || grant.agencyCode || 'N/A'} <br />
                      <strong>Status:</strong> {grant.oppStatus || 'N/A'} <br />
                      <strong>Open Date:</strong> {grant.openDate || 'N/A'}
                      {grant.closeDate && <> | <strong>Close Date:</strong> {grant.closeDate}</>}
                    </li>
                  ))}
                </ul>
              ) : (
                 processedData.actualKeywords?.length > 0 && !processedData.actualKeywords[0].includes('_') ?
                 <p>No matching grants found from Grants.gov for the extracted keywords.</p> :
                 <p>No grant search performed or no results available.</p>
              )}
            </div>
          )}

          {/* Profile Content */}
          {activeTab === 'profile' && (
             // ... (profile JSX remains the same) ...
            <div className="profile-section">
              {processedData.profile ? ( <pre className="profile-text">{processedData.profile}</pre> ) : ( <p>No profile generated.</p> )}
            </div>
          )}

          {/* Keywords Content */}
          {activeTab === 'keywords' && (
            // ... (keywords JSX remains the same) ...
            <div className="keywords-section">
              {processedData.actualKeywords?.length > 0 && !processedData.actualKeywords[0].includes('_') ? ( <p className="keywords-list">{processedData.actualKeywords.join(', ')}</p> ) : ( <p>No keywords extracted or keyword extraction failed.</p> )}
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
