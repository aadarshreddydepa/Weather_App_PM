import React from 'react';
import '../styles/WeatherStyles.css';

const WeatherCard = ({ weather }) => {
  const getWeatherIcon = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const getBackgroundClass = (weatherMain) => {
    const weatherTypes = {
      Clear: 'sunny',
      Clouds: 'cloudy',
      Rain: 'rainy',
      Snow: 'snowy',
      Thunderstorm: 'stormy',
      Drizzle: 'drizzly',
      Mist: 'misty',
      Fog: 'misty'
    };
    return weatherTypes[weatherMain] || 'default';
  };

  const getCountryFlag = (countryCode) => {
    // Convert country code to regional indicator symbols for flag emoji
    if (!countryCode) return '';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className={`weather-card ${getBackgroundClass(weather.weather[0].main)}`}>
      <div className="weather-header">
        <h2 className="location">
          {weather.name}
          <span className="country-flag">
            {getCountryFlag(weather.sys.country)}
          </span>
        </h2>
        <p className="date">{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
        <p className="country-info">
          {weather.sys.country_name || `Country Code: ${weather.sys.country}`}
        </p>
      </div>

      <div className="weather-main">
        <div className="temperature-section">
          <div className="temperature">
            {Math.round(weather.main.temp)}°C
          </div>
          <div className="weather-description">
            {weather.weather[0].description}
          </div>
        </div>
        <div className="icon-section">
          <img 
            src={getWeatherIcon(weather.weather[0].icon)} 
            alt={weather.weather[0].description}
            className="weather-icon"
          />
        </div>
      </div>

      <div className="weather-details">
        <div className="detail-item">
          <span className="detail-label">Feels like</span>
          <span className="detail-value">{Math.round(weather.main.feels_like)}°C</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Humidity</span>
          <span className="detail-value">{weather.main.humidity}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Wind</span>
          <span className="detail-value">{weather.wind.speed} m/s</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Pressure</span>
          <span className="detail-value">{weather.main.pressure} hPa</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;