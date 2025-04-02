// server.js - Basic Express server for BioBeacon Backend with CORS enabled

// Import the Express library
const express = require('express');
// Import the CORS middleware package
const cors = require('cors'); // Added this line

// Create an instance of the Express application
const app = express();

// --- Enable CORS for all origins ---
// This MUST come before your route definitions!
// It adds the necessary 'Access-Control-Allow-Origin' headers to responses.
app.use(cors()); // Added this line

// Define the port number the server will listen on
const port = 3001;

// Define a simple route for the root URL ('/')
app.get('/', (req, res) => {
  // Send a simple text response back to the client (browser)
  res.send('Hello from the BioBeacon Backend!');
});

// Start the server and make it listen on the defined port
app.listen(port, () => {
  // Log a message to the console (visible in App Runner logs)
  console.log(`BioBeacon backend server listening at http://localhost:${port}`);
});
