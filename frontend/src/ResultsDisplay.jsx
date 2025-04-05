import React from 'react';

// Receive isLoading, error, and processedData as props from App
function ResultsDisplay({ isLoading, error, processedData }) {

  // Render loading state with a spinner
  if (isLoading) {
    return (
      <section className="results-section card">
        <h2>Results</h2>
        <div className="loading-indicator">
          <div className="spinner"></div> {/* Added spinner div */}
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
        {/* Ensure error message uses the dedicated class */}
        <p className="error-message">Error: {error}</p>
      </section>
    );
  }

  // Render results if data is available
  if (processedData) {
    return (
      <section className="results-section card">
        <h2>Results</h2>
        <div className="result-content">
          <h4>{processedData.message || 'Processing Complete'}</h4>

          <div className="profile-section">
            <h3>Generated Profile:</h3>
            {processedData.profile ? (
              <pre className="profile-text">{processedData.profile}</pre>
            ) : (
              <p>No profile generated.</p>
            )}
          </div>

          <div className="keywords-section">
            <h3>Extracted Keywords:</h3>
            {processedData.actualKeywords?.length > 0 && !processedData.actualKeywords[0].includes('_') ? (
              <p className="keywords-list">{processedData.actualKeywords.join(', ')}</p>
            ) : (
              <p>No keywords extracted or keyword extraction failed.</p>
            )}
          </div>

          <div className="grants-section">
            {/* Display count clearly */}
            <h3>Potential Grant Results ({processedData.grantResults?.length || 0} found):</h3>
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
              // More specific message when keywords were found but no grants matched
              processedData.actualKeywords?.length > 0 && !processedData.actualKeywords[0].includes('_') ?
              <p>No matching grants found from Grants.gov for the extracted keywords.</p> :
              <p>No grant search performed or no results available.</p> // Fallback
            )}
          </div>
        </div>
      </section>
    );
  }

  // Initial state message
  return (
     <section className="results-section card">
        <h2>Results</h2>
        <p>Enter researcher details above and click "Process Researcher".</p>
      </section>
  );
}

export default ResultsDisplay;
