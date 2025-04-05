import React, { useState } from 'react';

// Receive isLoading, error, and processedData as props from App
function ResultsDisplay({ isLoading, error, processedData }) {
  // State to track the active tab, default to 'grants' now
  const [activeTab, setActiveTab] = useState('grants'); // Changed default

  // Render loading state
  if (isLoading) {
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
    return (
      <section className="results-section card">
        <h2>Results</h2>
        <p className="error-message">Error: {error}</p>
      </section>
    );
  }

  // Render results with tabs if data is available
  if (processedData) {
    return (
      <section className="results-section card">
        <h2>Results</h2>
        {/* Tab Buttons - Reordered */}
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

        {/* Tab Content Area - Content blocks reordered for readability */}
        <div className="tab-content">
          {/* Grants Content */}
          {activeTab === 'grants' && (
            <div className="grants-section">
              {processedData.grantResults?.length > 0 ? (
                <ul className="grants-list">
                  {processedData.grantResults.map(grant => (
                    <li key={grant.id || grant.number} className="grant-item">
                      <strong>Title:</strong> {grant.title || 'N/A'} <br />
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
            <div className="profile-section">
              {processedData.profile ? (
                <pre className="profile-text">{processedData.profile}</pre>
              ) : (
                <p>No profile generated.</p>
              )}
            </div>
          )}

          {/* Keywords Content */}
          {activeTab === 'keywords' && (
            <div className="keywords-section">
              {processedData.actualKeywords?.length > 0 && !processedData.actualKeywords[0].includes('_') ? (
                <p className="keywords-list">{processedData.actualKeywords.join(', ')}</p>
              ) : (
                <p>No keywords extracted or keyword extraction failed.</p>
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
        <p>Enter researcher details to the right and click "Process Researcher".</p>
      </section>
  );
}

export default ResultsDisplay;
