import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import WeatherCard from "./components/WeatherCard";
import SearchBar from "./components/SearchBar";
import Forecast from "./components/Forecast";
import LoadingSpinner from "./components/LoadingSpinner";
import ExportPanel from "./components/ExportPanel";
import InfoModal from "./components/InfoModal";
import "./styles/App.css";

// Constants - these don't change and don't need to be dependencies
const API_KEY = "bca4565674a6d492711be356fad77ccd";
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const BACKEND_URL = "http://localhost:5001/api";

function App() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [storedLocations, setStoredLocations] = useState([]);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Enhanced search type detection that handles city,country format properly
  const detectSearchType = useCallback((searchTerm) => {
    // Trim and clean the input
    const cleanTerm = searchTerm.trim();

    console.log("🔍 Analyzing search term:", cleanTerm);

    // First, check for coordinates (lat,lon) - most specific
    if (/^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(cleanTerm)) {
      const [lat, lon] = cleanTerm.split(",").map((coord) => coord.trim());
      return { type: "coordinates", lat, lon };
    }

    // Then check for postal code with country (e.g., "110001,IN")
    if (/^[a-z0-9\s-]+\s*,\s*[a-z]{2}$/i.test(cleanTerm)) {
      const [postalCode, countryCode] = cleanTerm
        .split(",")
        .map((part) => part.trim());
      return {
        type: "postalCodeWithCountry",
        postalCode,
        countryCode: countryCode.toUpperCase(),
      };
    }

    // Check for city,country format (e.g., "Hyderabad,IN" or "London,UK")
    if (/^[a-z\s-]+\s*,\s*[a-z]{2,}$/i.test(cleanTerm)) {
      const [cityName, country] = cleanTerm
        .split(",")
        .map((part) => part.trim());
      // If country is 2 letters, treat as country code, otherwise as country name
      if (country.length === 2) {
        return {
          type: "cityWithCountryCode",
          cityName,
          countryCode: country.toUpperCase(),
        };
      } else {
        return { type: "cityWithCountry", cityName, countryName: country };
      }
    }

    // Check for pure numbers (postal codes)
    if (/^\d+$/.test(cleanTerm)) {
      return { type: "postalCode", postalCode: cleanTerm };
    }

    // Check for alphanumeric postal codes (Canada, UK, etc.)
    if (
      /^[a-z0-9\s-]+$/i.test(cleanTerm) &&
      cleanTerm.length <= 10 &&
      !/\s{2,}/.test(cleanTerm)
    ) {
      const mightBePostalCode =
        /^[a-z][0-9][a-z]\s*[0-9][a-z][0-9]$/i.test(cleanTerm) || // Canadian format
        /^[a-z]{1,2}\d{1,2}\s*\d{1,2}[a-z]{2}$/i.test(cleanTerm); // UK format

      if (mightBePostalCode) {
        return { type: "postalCode", postalCode: cleanTerm };
      }
    }

    // DEFAULT: Everything else is treated as city name
    return { type: "city", cityName: cleanTerm };
  }, []);

  // NEW: Fetch stored locations from backend - defined BEFORE fetchWeather
  const fetchStoredLocations = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/weather/locations/all`);
      setStoredLocations(response.data.locations);
      console.log(
        "✅ Stored locations loaded:",
        response.data.locations.length
      );
    } catch (error) {
      console.warn(
        "⚠️ Failed to fetch stored locations. Backend might be unavailable:",
        error
      );
      // Don't show error to user - backend might be intentionally offline
    }
  }, []);

  // Fixed fetchWeather function - now it comes AFTER fetchStoredLocations
  const fetchWeather = useCallback(
    async (searchTerm) => {
      if (!searchTerm.trim()) {
        setError("Please enter a location to search");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const searchType = detectSearchType(searchTerm);
        let url;

        console.log("Search type detected:", searchType);

        switch (searchType.type) {
          case "coordinates":
            url = `${BASE_URL}/weather?lat=${searchType.lat}&lon=${searchType.lon}&appid=${API_KEY}&units=metric`;
            break;

          case "postalCodeWithCountry":
            url = `${BASE_URL}/weather?zip=${searchType.postalCode},${searchType.countryCode}&appid=${API_KEY}&units=metric`;
            break;

          case "cityWithCountryCode":
            // Format: "q=Hyderabad,IN"
            url = `${BASE_URL}/weather?q=${encodeURIComponent(
              searchType.cityName
            )},${searchType.countryCode}&appid=${API_KEY}&units=metric`;
            break;

          case "cityWithCountry":
            // Format: "q=Hyderabad,India"
            url = `${BASE_URL}/weather?q=${encodeURIComponent(
              searchType.cityName
            )},${encodeURIComponent(
              searchType.countryName
            )}&appid=${API_KEY}&units=metric`;
            break;

          case "postalCode":
            url = `${BASE_URL}/weather?zip=${searchType.postalCode}&appid=${API_KEY}&units=metric`;
            break;

          case "city":
          default:
            url = `${BASE_URL}/weather?q=${encodeURIComponent(
              searchType.cityName
            )}&appid=${API_KEY}&units=metric`;
            break;
        }

        console.log("🌤️ Fetching from:", url);
        const weatherResponse = await axios.get(url);

        // Store weather data in backend
        try {
          await axios.post(`${BACKEND_URL}/weather`, {
            searchQuery: searchTerm,
            weatherData: weatherResponse.data,
          });
          console.log("✅ Weather data stored in backend");

          // Refresh stored locations after new search
          fetchStoredLocations();
        } catch (storageError) {
          console.warn(
            "⚠️ Failed to store in backend, but continuing...",
            storageError
          );
        }

        // Add to search history
        setSearchHistory((prev) => [
          {
            name: weatherResponse.data.name,
            country: weatherResponse.data.sys.country,
            searchTerm: searchTerm,
            timestamp: new Date().toLocaleString(),
          },
          ...prev.slice(0, 4),
        ]);

        setWeather(weatherResponse.data);

        // Fetch forecast
        const forecastUrl = `${BASE_URL}/forecast?lat=${weatherResponse.data.coord.lat}&lon=${weatherResponse.data.coord.lon}&appid=${API_KEY}&units=metric`;
        const forecastResponse = await axios.get(forecastUrl);
        setForecast(forecastResponse.data);
      } catch (err) {
        console.error(
          "Error fetching weather:",
          err.response?.data || err.message
        );

        if (err.response?.data?.cod === "404") {
          setError(`"${searchTerm}" not found. Try different formats like:
          • "Hyderabad" (city only)
          • "Hyderabad,IN" (city with country code)
          • "500001" (postal code)
          • "17.3850,78.4867" (coordinates)`);
        } else if (err.response?.data?.message) {
          setError(`Error: ${err.response.data.message}`);
        } else if (err.code === "NETWORK_ERROR") {
          setError("Network error. Please check your internet connection.");
        } else {
          setError("Failed to fetch weather data. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [detectSearchType, fetchStoredLocations]
  ); // Removed API_KEY and BASE_URL from dependencies

  // Get user's location on app start
  useEffect(() => {
    const initializeApp = async () => {
      // First, try to load stored locations
      await fetchStoredLocations();

      // Then get current location weather
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeather(`${latitude},${longitude}`);
          },
          (error) => {
            console.log("Geolocation error:", error);
            // Default to a major city if location access denied
            fetchWeather("London");
          },
          {
            timeout: 10000,
            enableHighAccuracy: false,
          }
        );
      } else {
        // Fallback if geolocation is not supported
        fetchWeather("London");
      }
    };

    initializeApp();
  }, [fetchWeather, fetchStoredLocations]);

  // Function to handle history item click
  const handleHistoryClick = useCallback(
    (searchTerm) => {
      fetchWeather(searchTerm);
    },
    [fetchWeather]
  );

  // Function to refresh stored locations
  const handleRefreshStoredData = useCallback(() => {
    fetchStoredLocations();
  }, [fetchStoredLocations]);

  return (
    <div className="app">
      <div className="container">
        <header className="app-header">
          <h1 className="app-title">🌤️ Global Weather+</h1>
          <p className="app-subtitle">
            Your worldwide weather companion with data export
          </p>
          <button
            className="info-btn"
            onClick={() => setShowInfoModal(true)}
            title="About this app"
          >
            ℹ️
          </button>
          <div className="developer-credit">
            Developed by{" "}
            <span className="developer-name">Aadarsh Reddy Depa</span>
          </div>
          <div className="header-actions">
            <button
              className="export-toggle-btn"
              onClick={() => setShowExportPanel(!showExportPanel)}
            >
              {showExportPanel ? "📊 Hide Export" : "📊 Export Data"}
            </button>
            {storedLocations.length > 0 && (
              <button
                className="refresh-btn"
                onClick={handleRefreshStoredData}
                title="Refresh stored locations"
              >
                🔄
              </button>
            )}
          </div>
          <button
            className="cleanup-btn"
            onClick={async () => {
              if (window.confirm("Delete ALL weather data?")) {
                try {
                  await axios.delete(`${BACKEND_URL}/weather/cleanup/all`);
                  alert("All data deleted!");
                  fetchStoredLocations();
                } catch (error) {
                  alert("Failed to delete data");
                }
              }
            }}
          >
            🗑️ Cleanup DB
          </button>
        </header>

        {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
        {showExportPanel && (
          <ExportPanel
            storedLocations={storedLocations}
            onClose={() => setShowExportPanel(false)}
          />
        )}

        <SearchBar onSearch={fetchWeather} />

        {loading && <LoadingSpinner />}

        {error && (
          <div className="error-message">
            ❌ {error}
            <div className="error-suggestion">
              💡 Try: "London, UK", "110001,IN", or "48.8566,2.3522"
            </div>
          </div>
        )}

        {weather && !loading && (
          <>
            <WeatherCard weather={weather} />
            <Forecast forecast={forecast} />
          </>
        )}

        {searchHistory.length > 0 && (
          <div className="search-history">
            <div className="history-header">
              <h3>Recent Searches</h3>
              <span className="history-count">
                {searchHistory.length} searches
              </span>
            </div>
            <div className="history-list">
              {searchHistory.map((item, index) => (
                <div
                  key={index}
                  className="history-item"
                  onClick={() => handleHistoryClick(item.searchTerm)}
                >
                  <span className="history-name">
                    {item.name}, {item.country}
                  </span>
                  <span className="history-term">
                    Searched: {item.searchTerm}
                  </span>
                  <span className="history-time">{item.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {storedLocations.length > 0 && (
          <div className="stored-locations">
            <div className="locations-header">
              <h3>📁 Stored Locations</h3>
              <span className="locations-count">
                {storedLocations.length} locations in database
              </span>
            </div>
            <div className="locations-grid">
              {storedLocations.slice(0, 6).map((location, index) => (
                <div key={index} className="location-card">
                  <div className="location-name">
                    {location.name}, {location.country}
                  </div>
                  <div className="location-stats">
                    <span className="search-count">
                      Searched: {location.searchCount} times
                    </span>
                    <span className="last-updated">
                      Last:{" "}
                      {new Date(location.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {storedLocations.length > 6 && (
              <div className="locations-more">
                +{storedLocations.length - 6} more locations available for
                export
              </div>
            )}
          </div>
        )}

        {/* Backend status indicator */}
        <div className="backend-status">
          <div
            className={`status-indicator ${
              storedLocations.length > 0 ? "online" : "offline"
            }`}
          >
            ●
          </div>
          <span className="status-text">
            {storedLocations.length > 0
              ? "Backend Connected"
              : "Backend Offline - Data not being stored"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
