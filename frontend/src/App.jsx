import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  // State variable to store the message fetched from the backend
  // Initialize with a loading message
  const [message, setMessage] = useState('Loading message from backend...');

  // Backend API URL (from AWS App Runner)
  const backendUrl = 'https://jmpzukpkcs.us-east-2.awsapprunner.com';

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    // Use the fetch API to make a GET request to the backend root URL
    fetch(backendUrl + '/') // Append '/' just to be explicit we're hitting the root
      .then(response => {
        // Check if the request was successful (status code 200-299)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Parse the response body as text
        return response.text();
      })
      .then(data => {
        // Update the message state with the data recclseived from the backend
        setMessage(data);
      })
      .catch(error => {
        // Handle any errors during the fetch operation
        console.error('Error fetching data:', error);
        setMessage('Failed to fetch message from backend.');
      });
  }, []); // The empty dependency array [] means this effect runs only once when the component mounts

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
      <h1>Vite + React</h1>
      <div className="card">
        {/* Display the message from the backend (or loading/error state) */}
        <p>
          Backend says: <strong>{message}</strong>
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
