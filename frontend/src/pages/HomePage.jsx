// frontend/src/pages/HomePage.jsx
// --- FULL CODE ---

import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import '../App.css'; // Assuming some shared styles might be in App.css

function HomePage() {
  return (
    <div className="app-container"> {/* You might want a different container style later */}
      <header className="app-header">
        <h1>Welcome to BioBeacon</h1>
        <p>Your AI Assistant for Grant Discovery</p>
      </header>

      <main className="main-content" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <section className="card" style={{ maxWidth: '500px' }}>
          <h2>Choose Your Role:</h2>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
            <Link to="/researcher-app" className="submit-button" style={{ textDecoration: 'none' }}>
              PIs / Researchers
            </Link>
            <Link to="/admin/login" className="submit-button" style={{ textDecoration: 'none', backgroundColor: '#6c757d' }}>
              Research Admins
            </Link>
          </div>
          <p style={{ marginTop: '30px', fontSize: '0.9em', color: '#6c757d' }}>
            Select "PIs / Researchers" to find grants for yourself. Select "Research Admins" to manage multiple researchers (Login Required).
          </p>
        </section>
      </main>

      <footer className="app-footer">
        <p>(BioBeacon - Helping Accelerate Research)</p>
      </footer>
    </div>
  );
}

export default HomePage;