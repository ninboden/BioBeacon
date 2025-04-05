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
        // Try to parse JSON regardless of status code for potential error messages
        return response.json().then(data => ({ ok: response.ok, status: response.status, data }));
      })
      .then(({ ok, status, data }) => {
        console.log('Received response from backend:', { ok, status, data });
        if (!ok) {
          // Throw an error with message from backend if available, else default HTTP error
          throw new Error(data.error || data.details || `HTTP error! status: ${status}`);
        }
        // Success: Update state with the data received
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
      // Display backend error details if available
      return <p style={{ color: 'red' }}>Error: {error}</p>;
    }
    if (processedData) {
      return (
        <div>
          {/* Display Confirmation Message */}
          <h4>{processedData.message || 'Processing Complete'}</h4>
          <hr />

          {/* Display Profile */}
          <h3>Generated Profile:</h3>
          {processedData.profile ? (
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', background: '#f4f4f4', padding: '10px', borderRadius: '5px' }}>
              {processedData.profile}
            </pre>
          ) : (
            <p>No profile generated.</p>
          )}
          <hr />

          {/* Display Keywords */}
          <h3>Extracted Keywords:</h3>
          {processedData.actualKeywords && processedData.actualKeywords.length > 0 && !processedData.actualKeywords[0].includes('_') ? ( // Check for keywords and avoid error indicators
            <p>{processedData.actualKeywords.join(', ')}</p>
          ) : (
            <p>No keywords extracted or keyword extraction failed.</p>
          )}
          <hr />

          {/* Display Grant Results */}
          <h3>Potential Grant Results (Simulated):</h3>
          {processedData.grantResults && processedData.grantResults.length > 0 ? (
            <ul>
              {processedData.grantResults.map(grant => (
                <li key={grant.id}>
                  <strong>{grant.title}</strong> ({grant.agency}) - ${grant.amount.toLocaleString()}
                  <br />
                  <small>Matched Keywords: {grant.keyword}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p>No matching grants found in the mock database based on extracted keywords.</p>
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
