import { useState } from 'react';
import InputForm from './InputForm'; // Import new component
import ResultsDisplay from './ResultsDisplay'; // Import new component
import './App.css'; // Keep main CSS import here

function App() {
  // State related to API call and results remains in App
  const [processedData, setProcessedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const backendUrl = 'https://jmpzukpkcs.us-east-2.awsapprunner.com'; // Keep backend URL here

  // Function to handle the API call, triggered by InputForm
  const handleProcessResearcher = (name, affiliation) => {
    // Start loading, clear errors/previous data
    setIsLoading(true);
    setError(null);
    setProcessedData(null);

    const apiUrl = `${backendUrl}/api/process-researcher`;
    const requestBody = { name, affiliation };

    console.log('Sending data to backend:', requestBody);

    // Perform the fetch call
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })
      .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, data })))
      .then(({ ok, status, data }) => {
        console.log('Received response from backend:', { ok, status, data });
        if (!ok) { throw new Error(data.error || data.details || `HTTP error! status: ${status}`); }
        // Update state with the results
        setProcessedData(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error processing researcher:', error);
        setError(`Failed to process researcher: ${error.message}`);
        setIsLoading(false);
      });
  };

  // Render the main structure, delegating input and results display
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>BioBeacon Grant Finder</h1>
      </header>

      {/* Render InputForm, passing the handler function and loading state */}
      <InputForm onSubmit={handleProcessResearcher} isLoading={isLoading} />

      {/* Render ResultsDisplay, passing the data and loading/error states */}
      <ResultsDisplay
        isLoading={isLoading}
        error={error}
        processedData={processedData}
      />

      <footer className="app-footer">
        <p>(BioBeacon v0.1 - Data provided by Perplexity, OpenAI, Grants.gov)</p>
      </footer>
    </div>
  );
}

export default App;
