import React from 'react';
import '../styles/WeatherStyles.css';

const Forecast = ({ forecast }) => {
  // Group forecast by day and take one reading per day
  const dailyForecast = forecast.list.filter((reading, index) => index % 8 === 0);

  const formatDay = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="forecast">
      <h3 className="forecast-title">5-Day Forecast</h3>
      <div className="forecast-cards">
        {dailyForecast.slice(0, 5).map((day, index) => (
          <div key={index} className="forecast-card">
            <div className="forecast-date">
              {formatDay(day.dt)}
            </div>
            <img 
              src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
              alt={day.weather[0].description}
              className="forecast-icon"
            />
            <div className="forecast-temp">
              {Math.round(day.main.temp)}°C
            </div>
            <div className="forecast-desc">
              {day.weather[0].description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Forecast;