import React, { useState } from 'react';
import '../styles/WeatherStyles.css';

const SearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
      setSearchTerm('');
    }
  };

  const handleQuickSearch = (example) => {
    onSearch(example);
  };

  return (
    <div className="search-section">
      <form className="search-bar" onSubmit={handleSubmit}>
        <div className="search-container">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by city, postal code, or coordinates..."
            className="search-input"
          />
          <button type="submit" className="search-button">
            🔍
          </button>
        </div>
      </form>

      <div className="search-examples">
        <p className="examples-title">Try these examples:</p>
        <div className="example-buttons">
          <button 
            className="example-btn" 
            onClick={() => handleQuickSearch('London')}
          >
            🌆 London
          </button>
          <button 
            className="example-btn" 
            onClick={() => handleQuickSearch('New York')}
          >
            🗽 New York
          </button>
          <button 
            className="example-btn" 
            onClick={() => handleQuickSearch('Tokyo')}
          >
            🗼 Tokyo
          </button>
          <button 
            className="example-btn" 
            onClick={() => handleQuickSearch('Paris')}
          >
            🗼 Paris
          </button>
          <button 
            className="example-btn" 
            onClick={() => handleQuickSearch('Sydney')}
          >
            🦘 Sydney
          </button>
        </div>
        
        <div className="example-buttons">
          <button 
            className="example-btn" 
            onClick={() => handleQuickSearch('110001,IN')}
          >
            🇮🇳 Delhi Pincode
          </button>
          <button 
            className="example-btn" 
            onClick={() => handleQuickSearch('90210,US')}
          >
            🇺🇸 US Zip Code
          </button>
          <button 
            className="example-btn" 
            onClick={() => handleQuickSearch('48.8566,2.3522')}
          >
            📍 Coordinates
          </button>
        </div>

        <div className="search-tips">
          <small>
            💡 <strong>Tips:</strong> For better accuracy, use "City, Country" format like "London, UK" or "Paris, FR"
          </small>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;