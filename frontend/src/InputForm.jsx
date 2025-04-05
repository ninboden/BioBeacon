import React, { useState } from 'react'; // Need to import useState here

// Receive onSubmit function and isLoading state as props from App
function InputForm({ onSubmit, isLoading }) {
  // State for input fields is managed within this component
  const [name, setName] = useState('');
  const [affiliation, setAffiliation] = useState('');

  // Handle button click
  const handleSubmit = (event) => {
    event.preventDefault(); // Good practice in case it's ever inside a <form>
    // Call the onSubmit function passed down from App, providing the current input values
    onSubmit(name, affiliation);
  };

  return (
    <section className="input-section card">
      <h2>Enter Researcher Details</h2>
      {/* Use onSubmit for the div/button click */}
      {/* Could wrap in <form> and use onSubmit={handleSubmit} on the form tag */}
      <div>
        <div className="form-group">
          <label htmlFor="nameInput">Name:</label>
          <input
            id="nameInput"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)} // Update local state
            placeholder="Enter researcher name"
            disabled={isLoading} // Disable input while loading
          />
        </div>
        <div className="form-group">
          <label htmlFor="affiliationInput">Affiliation:</label>
          <input
            id="affiliationInput"
            type="text"
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)} // Update local state
            placeholder="Enter institutional affiliation"
            disabled={isLoading} // Disable input while loading
          />
        </div>
        <button className="submit-button" onClick={handleSubmit} disabled={isLoading || !name || !affiliation}>
          {/* Disable button if loading or if inputs are empty */}
          {isLoading ? 'Processing...' : 'Process Researcher'}
        </button>
      </div>
    </section>
  );
}

export default InputForm;
