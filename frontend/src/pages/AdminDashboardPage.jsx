// frontend/src/pages/AdminDashboardPage.jsx
// --- FULL CODE --- (Receives state/handlers via props)

import React, { useState, useEffect } from 'react';
// No longer need Navigate here for protection, App.jsx handles it
// Removed direct localStorage check - relying on route protection in App.jsx

import '../App.css';

// Receive props from App.jsx
function AdminDashboardPage({ researchers, onAddResearcher, onLogout }) {
  // Local state ONLY for the input field value
  const [newResearcherName, setNewResearcherName] = useState('');

  // Handle submitting the form to add a researcher
  const handleAddSubmit = (event) => {
    event.preventDefault();
    onAddResearcher(newResearcherName); // Call the function passed down from App.jsx
    setNewResearcherName(''); // Clear the input field
  };

  // Handle clicking the logout button
  const handleLogoutClick = () => {
    onLogout(); // Call the function passed down from App.jsx
  };

  // Render the dashboard UI using props
  return (
    <div className="app-container">
      <header className="app-header">
         <h1>Admin Dashboard</h1>
         <button
            onClick={handleLogoutClick} // Use the handler that calls the prop
            style={{ position: 'absolute', right: '20px', top: '15px', padding: '8px 12px', cursor: 'pointer' }}
         >
           Logout
         </button>
      </header>

      <main className="main-content" style={{ flexDirection: 'column', alignItems: 'center' }}>

        {/* Section to Display Researchers (uses prop) */}
        <section className="card" style={{ width: '100%', maxWidth: '600px', marginBottom: '20px' }}>
          <h2>Managed Researchers</h2>
          {/* Use the 'researchers' prop passed from App.jsx */}
          {researchers && researchers.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {researchers.map((name, index) => (
                <li key={index} style={{ borderBottom: '1px solid #eee', padding: '10px 0', textAlign: 'left' }}>
                  {name}
                </li>
              ))}
            </ul>
          ) : (
            <p>No researchers added yet.</p>
          )}
        </section>

        {/* Section to Add Researcher (uses prop function) */}
        <section className="card" style={{ width: '100%', maxWidth: '600px' }}>
          <h2>Add New Researcher</h2>
          {/* Use handleAddSubmit for the form */}
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={newResearcherName} // Controlled input
              onChange={(e) => setNewResearcherName(e.target.value)} // Update local input state
              placeholder="Enter researcher's name"
              required
              style={{ flexGrow: 1, padding: '10px' }}
            />
            <button type="submit" className="submit-button">
              Add Researcher
            </button>
          </form>
        </section>

      </main>

       <footer className="app-footer">
         <p>(BioBeacon Admin Portal)</p>
       </footer>
    </div>
  );
}

export default AdminDashboardPage;