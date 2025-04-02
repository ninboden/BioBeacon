// server.js - Basic Express server for BioBeacon Backend

// Import the Express library
// 'require' is the Node.js way to load modules/packages
const express = require('express');

// Create an instance of the Express application
// This 'app' object will be used to configure the server
const app = express();

// Define the port number the server will listen on
// We use 3001 to avoid potential conflicts with the frontend development server
const port = 3001;

// Define a simple route for the root URL ('/')
// This handles GET requests made to http://localhost:3001/
// 'req' represents the incoming request object
// 'res' represents the outgoing response object
app.get('/', (req, res) => {
  // Send a simple text response back to the client (browser)
  res.send('Hello from the BioBeacon Backend!');
});

// Start the server and make it listen on the defined port
// The callback function () => { ... } runs once the server starts successfully
app.listen(port, () => {
  // Log a message to the console (visible in your terminal)
  // This confirms the server is running and indicates the port
  console.log(`BioBeacon backend server listening at http://localhost:${port}`);
});
