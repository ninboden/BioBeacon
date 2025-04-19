// frontend/src/pages/AdminLoginPage.jsx
// --- FULL CODE --- (Changed simulated password)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Hook for navigation
import '../App.css'; // Use shared styles

// Accept the onLoginSuccess prop from App.jsx
function AdminLoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Initialize the navigate function

  const handleLogin = (event) => {
    event.preventDefault(); // Prevent default form submission which reloads the page
    setError(''); // Clear previous errors

    // --- Simulated Authentication ---
    // <<< PASSWORD CHANGED HERE >>>
    if (email === 'admin@test.com' && password === 'chicken') { // Changed from 'password' to 'chicken'
      console.log('Simulated login successful');
      onLoginSuccess(); // Call the function passed from App.jsx to update login state
      navigate('/admin/dashboard', { replace: true }); // Navigate to dashboard after successful login
    } else {
      console.log('Simulated login failed');
      // Update error message to reflect the new password hint if desired, or make it generic
      setError('Invalid credentials. Please try again.');
      // Or provide hint: setError('Invalid credentials. Use admin@test.com / chicken');
    }
    // --- End Simulated Authentication ---
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center' }}>
      <main className="main-content" style={{ justifyContent: 'center', alignItems: 'center', flexGrow: 0 }}>
        <section className="card" style={{ maxWidth: '400px', width: '100%' }}>
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <label htmlFor="emailInput" style={{ textAlign: 'left', width: '100%' }}>Email:</label>
              <input
                id="emailInput"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                required // Basic HTML5 validation
                style={{ width: 'calc(100% - 22px)' }} // Adjust width if needed
              />
            </div>
            <div className="form-group" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <label htmlFor="passwordInput" style={{ textAlign: 'left', width: '100%' }}>Password:</label>
              <input
                id="passwordInput"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{ width: 'calc(100% - 22px)' }} // Adjust width if needed
              />
            </div>
            {error && <p className="error-message" style={{ textAlign: 'center', marginTop: '10px' }}>{error}</p>}
            <button type="submit" className="submit-button" style={{ width: '100%', marginTop: '20px' }}>
              Login
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default AdminLoginPage;