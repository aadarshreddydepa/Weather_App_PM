import React from 'react';
import '../styles/WeatherStyles.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="cloud"></div>
        <div className="sun"></div>
      </div>
      <p>Fetching weather data...</p>
    </div>
  );
};

export default LoadingSpinner;