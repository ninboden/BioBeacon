// frontend/src/pages/ResearcherAppPage.jsx
// --- FULL CODE --- (Corrected fetch options object)

import React, { useState } from 'react';
import InputForm from '../InputForm';
import ResultsDisplay from '../ResultsDisplay';
import '../App.css';

function ResearcherAppPage() {
  const [processedData, setProcessedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const backendUrl = 'https://jmpzukpkcs.us-east-2.awsapprunner.com'; // Use DEPLOYED backend URL

  const handleProcessResearcher = (name, affiliation) => {
    setIsLoading(true);
    setError(null);
    setProcessedData(null);

    const apiUrl = `${backendUrl}/api/process-researcher`;
    const requestBody = { name, affiliation };
    console.log('Sending data to backend:', requestBody);
    console.log('Target API URL:', apiUrl);

    // <<< FIX HERE: Added the correct options object as the second argument >>>
    fetch(apiUrl, {
        method: 'POST', // Specify POST method
        headers: {
            'Content-Type': 'application/json', // Tell backend we're sending JSON
        },
        body: JSON.stringify(requestBody), // Convert JS object to JSON string for the body
    })
      .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, data })))
      .then(({ ok, status, data }) => {
          console.log('Received response from backend:', { ok, status, data });
          setProcessedData(data);
          if (data.status !== 'success' && data.status !== 'partial_success') {
               const errorMessages = data.errors?.map(e => `${e.step}: ${e.message}`).join('; ') || 'Unknown backend processing error.';
               throw new Error(`Backend processing failed: ${errorMessages}`);
          }
          setIsLoading(false);
       })
      .catch(error => {
          console.error('Error processing researcher:', error);
          // Check if the error is the JSON parse error, otherwise use error.message
          if (error instanceof SyntaxError) {
              // This might happen if the server response wasn't JSON (e.g., HTML error page)
               setError(`Failed to process: Server sent an unexpected response. Check backend logs.`);
          } else {
               setError(`Failed to process researcher: ${error.message}`);
          }
          setIsLoading(false);
       });
  };
  console.log("ResearcherAppPage rendering. Profile prop to pass:", processedData?.data?.profile ? "Exists" : "MISSING/NULL");
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>BioBeacon Grant Finder</h1>
      </header>

      <main className="main-content">
        <InputForm onSubmit={handleProcessResearcher} isLoading={isLoading} />
        <ResultsDisplay
          isLoading={isLoading}
          error={error}
          processedData={processedData}
          researcherProfile={processedData?.data?.profile}
        />
      </main>

      <footer className="app-footer">
        <p>(BioBeacon v0.1 - Data provided by Perplexity, OpenAI, Grants.gov)</p>
      </footer>
    </div>
  );
}

export default ResearcherAppPage;