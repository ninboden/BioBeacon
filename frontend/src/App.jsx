import { useState } from 'react';
import InputForm from './InputForm';
import ResultsDisplay from './ResultsDisplay';
import './App.css';

function App() {
  const [processedData, setProcessedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const backendUrl = 'https://jmpzukpkcs.us-east-2.awsapprunner.com';

  const handleProcessResearcher = (name, affiliation) => {
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
      .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, data })))
      .then(({ ok, status, data }) => {
        console.log('Received response from backend:', { ok, status, data });
        if (!ok) { throw new Error(data.error || data.details || `HTTP error! status: ${status}`); }
        setProcessedData(data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error processing researcher:', error);
        setError(`Failed to process researcher: ${error.message}`);
        setIsLoading(false);
      });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>BioBeacon Grant Finder</h1>
      </header>

      {/* Added main-content wrapper for flex layout */}
      <main className="main-content">
        {/* InputForm takes up the first column */}
        <InputForm onSubmit={handleProcessResearcher} isLoading={isLoading} />

        {/* ResultsDisplay takes up the second column */}
        <ResultsDisplay
          isLoading={isLoading}
          error={error}
          processedData={processedData}
        />
      </main>

      <footer className="app-footer">
        <p>(BioBeacon v0.1 - Data provided by Perplexity, OpenAI, Grants.gov)</p>
      </footer>
    </div>
  );
}

export default App;
