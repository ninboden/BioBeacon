// frontend/src/App.jsx
// --- FULL CODE --- (Includes localStorage persistence for BOTH login and researchers)

import React, { useState, useEffect } from 'react'; // Need useEffect
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ResearcherAppPage from './pages/ResearcherAppPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import GrantAssistPage from './pages/GrantAssistPage';
import './App.css';

function App() {
  // --- Admin Login State (Loads from localStorage) ---
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    const storedValue = localStorage.getItem('isAdminLoggedIn');
    // <<< This log should appear >>>
    console.log('App.jsx: Init isAdminLoggedIn from localStorage:', storedValue);
    return storedValue === 'true';
  });
  console.log('App.jsx rendering. isAdminLoggedIn =', isAdminLoggedIn);

  // --- Researchers State (Loads from localStorage) ---
  const [researchers, setResearchers] = useState(() => {
      const storedResearchers = localStorage.getItem('managedResearchers');
      // <<< This log should appear >>>
      console.log('App.jsx: Init researchers from localStorage:', storedResearchers);
      try {
          // Parse the stored JSON string, or return default if null/invalid
          return storedResearchers ? JSON.parse(storedResearchers) : ['Dr. Ada Lovelace', 'Dr. Charles Babbage']; // Default list
      } catch (error) {
          console.error("Failed to parse researchers from localStorage:", error);
          return ['Dr. Ada Lovelace', 'Dr. Charles Babbage']; // Fallback to default on error
      }
  });
  console.log('App.jsx rendering. researchers =', researchers);

  // --- Effect to SAVE researchers list to localStorage whenever it changes ---
  useEffect(() => {
      // Don't log saving the default array on initial load if it wasn't already in storage
      // This check prevents overwriting potentially empty valid storage on first load
      // A more robust check might compare to the initial default array instance
      // For simplicity, we just save any change after initial load.
      console.log('App.jsx: useEffect saving researchers to localStorage:', researchers);
      try {
          localStorage.setItem('managedResearchers', JSON.stringify(researchers));
      } catch (error) {
          console.error("Failed to save researchers to localStorage:", error);
      }
  }, [researchers]); // Dependency array: Run when 'researchers' state changes

  // --- Handler Functions ---
  const handleAdminLogin = () => {
    console.log('App.jsx: handleAdminLogin called.');
    localStorage.setItem('isAdminLoggedIn', 'true');
    setIsAdminLoggedIn(true);
  };

  const handleAdminLogout = () => {
    console.log('App.jsx: handleAdminLogout called.');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('managedResearchers'); // Also clear list on logout
    setIsAdminLoggedIn(false);
    setResearchers(['Dr. Ada Lovelace', 'Dr. Charles Babbage']); // Reset state to default
  };

  const handleAddResearcher = (name) => {
    console.log('App.jsx: handleAddResearcher called with:', name);
    if (name.trim() !== '') {
      const trimmedName = name.trim();
       if (!researchers.some(r => r.toLowerCase() === trimmedName.toLowerCase())) {
            setResearchers(prevResearchers => [...prevResearchers, trimmedName]); // Use functional update
       } else {
            console.warn(`Researcher "${trimmedName}" already exists.`);
            alert(`Researcher "${trimmedName}" already exists.`);
       }
    }
  };
  // --- End Handler Functions ---

  return (
    <Routes>
      {/* --- Public Routes --- */}
      <Route path="/" element={<HomePage />} />
      <Route path="/researcher-app" element={<ResearcherAppPage />} />

      {/* --- Grant Assistant Route --- */}
      <Route path="/assist" element={<GrantAssistPage />} />

      {/* --- Admin Login Route --- */}
      <Route
        path="/admin/login"
        element={
          isAdminLoggedIn ? (
             <Navigate to="/admin/dashboard" replace />
          ) : (
             <AdminLoginPage onLoginSuccess={handleAdminLogin} />
          )
        }
      />

      {/* --- Protected Admin Dashboard Route --- */}
      <Route
        path="/admin/dashboard"
        element={
          isAdminLoggedIn ? (
            <AdminDashboardPage
              researchers={researchers}
              onAddResearcher={handleAddResearcher}
              onLogout={handleAdminLogout}
            />
          ) : (
            <Navigate to="/admin/login" replace />
          )
        }
      />

      {/* --- 404 Not Found --- */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}

export default App;