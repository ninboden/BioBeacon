import { useState } from 'react'; // Removed useEffect for now
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
  const backendUrl = 'https://jmpzukpkcs.us-east-2.awsapprunner.com';

  // Function to handle form submission
  const handleProcessResearcher = (event) => {
    event.preventDefault(); // Prevent default form submission if it were inside a <form>
    setIsLoading(true);
    setError(null);
    setProcessedData(null); // Clear previous results

    const apiUrl = `${backendUrl}/api/process-researcher`;
    const requestBody = { name, affiliation };

    console.log('Sending data to backend:', requestBody);

    // Use fetch to make a POST request
    fetch(apiUrl, {
      method: 'POST', // Specify POST method
      headers: {
        'Content-Type': 'application/json', // Tell the server we're sending JSON
      },
      body: JSON.stringify(requestBody), // Convert the JS object to a JSON string
    })
      .then(response => {
        if (!response.ok) {
          // If response is not ok, try to parse error message from backend
          return response.json().then(errData => {
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
          }).catch(() => {
            // Fallback if error response is not JSON or has no message
            throw new Error(`HTTP error! status: ${response.status}`);
          });
        }
        // Parse the successful JSON response body
        return response.json();
      })
      .then(data => {
        console.log('Received data from backend:', data);
        // Update state with the data received (contains message, received data, mockKeywords)
        setProcessedData(data);
        setIsLoading(false); // Stop loading
      })
      .catch(error => {
        // Handle any errors during the fetch operation
        console.error('Error processing researcher:', error);
        setError(`Failed to process researcher: ${error.message}`);
        setIsLoading(false); // Stop loading
      });
  };

  // Helper function to render the results area
  const renderResults = () => {
    if (isLoading) {
      return <p>Processing...</p>;
    }
    if (error) {
      return <p style={{ color: 'red' }}>Error: {error}</p>;
    }
    if (processedData) {
      return (
        <div>
          <h4>{processedData.message}</h4>
          <p>Received Name: {processedData.received?.name}</p>
          <p>Received Affiliation: {processedData.received?.affiliation}</p>
          <p>Mock Keywords: {processedData.mockKeywords?.join(', ')}</p>
        </div>
      );
    }
    return null; // Render nothing if no action taken yet
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
        {/* We use a div instead of form to avoid default form submission for simplicity here */}
        <div>
          <div>
            <label htmlFor="nameInput">Name: </label>
            <input
              id="nameInput"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter researcher name"
            />
          </div>
          <div style={{ marginTop: '10px', marginBottom: '10px' }}>
            <label htmlFor="affiliationInput">Affiliation: </label>
            <input
              id="affiliationInput"
              type="text"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder="Enter institutional affiliation"
            />
          </div>
          <button onClick={handleProcessResearcher} disabled={isLoading}>
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

