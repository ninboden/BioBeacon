import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  // State for loading status
  const [isLoading, setIsLoading] = useState(true);
  // State to store the array of grants fetched from the backend
  const [grants, setGrants] = useState([]);
  // State for any potential error messages
  const [error, setError] = useState(null);

  // Backend API URL (from AWS App Runner)
  const backendUrl = 'https://jmpzukpkcs.us-east-2.awsapprunner.com';
  // Define a sample keyword for testing
  const searchKeyword = 'biology'; // Try changing this later (e.g., 'health', 'cancer')

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    setIsLoading(true); // Start loading
    setError(null); // Clear previous errors

    // Construct the URL with the query parameter
    const apiUrl = `${backendUrl}/api/grants?keyword=${searchKeyword}`;

    // Use the fetch API to make a GET request to the backend grants endpoint
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          // If response is not ok, try to parse error message from backend if available
          return response.json().then(errData => {
            throw new Error(errData.message || `HTTP error! status: ${response.status}`);
          }).catch(() => {
             // Fallback if error response is not JSON or has no message
             throw new Error(`HTTP error! status: ${response.status}`);
          });
        }
        // Parse the response body as JSON (since the API now returns JSON)
        return response.json();
      })
      .then(data => {
        // Check if the backend sent a message (e.g., "No grants found...")
        if (data.message) {
           setError(data.message); // Set error state to display the message
           setGrants([]); // Ensure grants list is empty
        } else {
          // Update the grants state with the array received from the backend
          setGrants(data);
        }
        setIsLoading(false); // Stop loading
      })
      .catch(error => {
        // Handle any errors during the fetch operation
        console.error('Error fetching data:', error);
        setError(`Failed to fetch grants: ${error.message}`);
        setGrants([]); // Ensure grants list is empty on error
        setIsLoading(false); // Stop loading
      });
  }, []); // The empty dependency array [] means this effect runs only once when the component mounts

  // Helper function to render the list of grants
  const renderGrants = () => {
    if (isLoading) {
      return <p>Loading grants...</p>;
    }
    if (error) {
      return <p style={{ color: 'orange' }}>{error}</p>; // Display error message
    }
    if (grants.length === 0) {
      return <p>No grants found for keyword "{searchKeyword}".</p>;
    }

    return (
      <ul>
        {grants.map(grant => (
          <li key={grant.id}>
            <strong>{grant.title}</strong> ({grant.agency}) - ${grant.amount.toLocaleString()}
          </li>
        ))}
      </ul>
    );
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
      <h1>BioBeacon Grant Finder</h1>
      <div className="card">
        <h2>Grant Results for "{searchKeyword}"</h2>
        {renderGrants()} {/* Call helper function to display results */}
      </div>
      <p className="read-the-docs">
        (Mock data shown - API integration in progress)
      </p>
    </>
  );
}

export default App;
