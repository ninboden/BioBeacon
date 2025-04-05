import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  // State for input fields
  const [name, setName] = useState('');
  const [affiliation, setAffiliation] = useState('');

  // State for the result from the backend POST request
  const [processedData, setProcessedData] = useState(null);
  // State for loading status during POST request
  const [isLoading, setIsLoading] = useState(false);
  // State for any potential error messages during POST request
  const [error, setError] = useState(null);

  // Backend API URL (from AWS App Runner)
  const backendUrl = 'https://jmpzukpkcs.us-east-2.awsapprunner.com'; // Replace if yours is different

  // Function to handle form submission
  const handleProcessResearcher = (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setProcessedData(null);

    const apiUrl = `${backendUrl}/api/process-researcher`;
    const requestBody = { name, affiliation };

    console.log('Sending data to backend:', requestBody);

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })
      .then(response => {
        return response.json().then(data => ({ ok: response.ok, status: response.status, data }));
      })
      .then(({ ok, status, data }) => {
        console.log('Received response from backend:', { ok, status, data });
        if (!ok) {
          throw new Error(data.error || data.details || `HTTP error! status: ${status}`);
        }
        setProcessedData(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error processing researcher:', error);
        setError(`Failed to process researcher: ${error.message}`);
        setIsLoading(false);
      });
  };

  // Helper function to render the results area
  const renderResults = () => {
    if (isLoading) {
      return <p>Processing... Please wait.</p>;
    }
    if (error) {
      return <p style={{ color: 'red' }}>Error: {error}</p>;
    }
    if (processedData) {
      return (
        <div>
          <h4>{processedData.message || 'Processing Complete'}</h4>
          <hr />

          <h3>Generated Profile:</h3>
          {processedData.profile ? (
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', background: '#f4f4f4', padding: '10px', borderRadius: '5px' }}>
              {processedData.profile}
            </pre>
          ) : (
            <p>No profile generated.</p>
          )}
          <hr />

          <h3>Extracted Keywords:</h3>
          {/* Using optional chaining (?.) for safety */}
          {processedData.actualKeywords?.length > 0 && !processedData.actualKeywords[0].includes('_') ? (
            <p>{processedData.actualKeywords.join(', ')}</p>
          ) : (
            <p>No keywords extracted or keyword extraction failed.</p>
          )}
          <hr />

          {/* Display Grant Results - Using actual field names from Grants.gov */}
          <h3>Potential Grant Results (from Grants.gov):</h3>
          {/* Using optional chaining (?.) for safety */}
          {processedData.grantResults?.length > 0 ? (
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              {processedData.grantResults.map(grant => (
                // Use grant.id as key if available and unique, otherwise grant.number might work
                <li key={grant.id || grant.number} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                  <strong>Title:</strong> {grant.title || 'N/A'} <br />
                  <strong>Number:</strong> {grant.number || 'N/A'} <br />
                  <strong>Agency:</strong> {grant.agencyName || grant.agencyCode || 'N/A'} <br />
                  <strong>Status:</strong> {grant.oppStatus || 'N/A'} <br />
                  <strong>Open Date:</strong> {grant.openDate || 'N/A'} <br />
                  {/* Close date might be empty for forecasted/posted */}
                  {grant.closeDate && <><strong>Close Date:</strong> {grant.closeDate} <br /></>}
                </li>
              ))}
            </ul>
          ) : (
            <p>No matching grants found from Grants.gov based on extracted keywords.</p>
          )}
        </div>
      );
    }
    return <p>Enter researcher details above and click "Process Researcher".</p>; // Initial state
  };

  // Render the component
  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>BioBeacon Researcher Input</h1>
      <div className="card">
        {/* Input fields and button */}
        <div>
          <div>
            <label htmlFor="nameInput" style={{ marginRight: '5px' }}>Name: </label>
            <input
              id="nameInput"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter researcher name"
              style={{ padding: '5px' }}
            />
          </div>
          <div style={{ marginTop: '10px', marginBottom: '10px' }}>
            <label htmlFor="affiliationInput" style={{ marginRight: '5px' }}>Affiliation: </label>
            <input
              id="affiliationInput"
              type="text"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder="Enter institutional affiliation"
              style={{ padding: '5px' }}
            />
          </div>
          <button onClick={handleProcessResearcher} disabled={isLoading} style={{ padding: '8px 15px', cursor: 'pointer' }}>
            {isLoading ? 'Processing...' : 'Process Researcher'}
          </button>
        </div>
      </div>

      {/* Area to display results from the backend */}
      <div className="card">
        <h2>Backend Response</h2>
        {renderResults()}
      </div>
    </>
  );
}

export default App;
