// server.js - Basic Express server for BioBeacon Backend with CORS and mock API

// Import the Express library
const express = require('express');
// Import the CORS middleware package
const cors = require('cors');

// Create an instance of the Express application
const app = express();

// --- Enable CORS for all origins ---
app.use(cors());

// Define the port number the server will listen on
const port = 3001;

// --- Mock Data ---
// In a real app, this would come from a database
const mockGrants = [
  { id: 1, title: 'Cancer Research Initiative', agency: 'NIH', amount: 500000, keyword: 'cancer' },
  { id: 2, title: 'Neuroscience Fellowship', agency: 'NSF', amount: 150000, keyword: 'neuroscience' },
  { id: 3, title: 'Public Health Study Grant', agency: 'CDC', amount: 300000, keyword: 'health' },
  { id: 4, title: 'Plant Biology Research Grant', agency: 'NSF', amount: 250000, keyword: 'biology' },
];

// --- API Endpoints ---

// Root endpoint (for basic testing)
app.get('/', (req, res) => {
  res.send('Hello from the BioBeacon Backend!');
});

// New endpoint to get mock grant data
// Accepts a 'keyword' query parameter: /api/grants?keyword=some_term
app.get('/api/grants', (req, res) => {
  // Get the keyword from the query parameters
  const keyword = req.query.keyword;

  console.log(`Received request for grants with keyword: ${keyword}`); // Log keyword for debugging

  let results = [];

  if (keyword) {
    // If a keyword is provided, filter the mock data (case-insensitive)
    const searchTerm = keyword.toLowerCase();
    results = mockGrants.filter(grant =>
      grant.keyword.toLowerCase().includes(searchTerm) ||
      grant.title.toLowerCase().includes(searchTerm)
    );

    // If no results found for the specific keyword, maybe return a message
    if (results.length === 0) {
        // Option 1: Return empty list (standard REST practice)
        // results = [];
        // Option 2: Return a message (can be helpful for debugging)
         return res.json({ message: `No grants found matching keyword: ${keyword}` });
    }

  } else {
    // If no keyword is provided, return an empty list (or all grants, depending on desired behavior)
    results = []; // Returning empty list if no keyword
    // Alternatively, to return all grants if no keyword: results = mockGrants;
  }

  // Send the results back as JSON
  res.json(results);
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`BioBeacon backend server listening at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log(`  GET /`);
  console.log(`  GET /api/grants?keyword=...`);
});
