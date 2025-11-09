// Configuration
const CONFIG = {
    API_KEY: 'bca4565674a6d492711be356fad77ccd', // Replace with your actual API key
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    BACKEND_URL: 'http://localhost:5001/api',
    WEATHER_ICON_BASE: 'https://openweathermap.org/img/wn/'
};

// State management
const state = {
    weather: null,
    forecast: null,
    searchHistory: JSON.parse(localStorage.getItem('weatherSearchHistory')) || [],
    storedLocations: [],
    isBackendConnected: false
};

// DOM Elements
const elements = {
    // Forms and inputs
    searchForm: document.getElementById('searchForm'),
    searchInput: document.getElementById('searchInput'),
    exportFormat: document.getElementById('exportFormat'),
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate'),
    selectedLocation: document.getElementById('selectedLocation'),
    
    // Buttons
    infoBtn: document.getElementById('infoBtn'),
    exportToggleBtn: document.getElementById('exportToggleBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    exportBtn: document.getElementById('exportBtn'),
    testExportBtn: document.getElementById('testExportBtn'),
    closeInfoModal: document.getElementById('closeInfoModal'),
    closeExportPanel: document.getElementById('closeExportPanel'),
    modalOkBtn: document.getElementById('modalOkBtn'),
    
    // Modals and panels
    infoModal: document.getElementById('infoModal'),
    exportPanel: document.getElementById('exportPanel'),
    
    // Display areas
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    weatherDisplay: document.getElementById('weatherDisplay'),
    searchHistory: document.getElementById('searchHistory'),
    historyList: document.getElementById('historyList'),
    historyCount: document.getElementById('historyCount'),
    storedLocations: document.getElementById('storedLocations'),
    locationsGrid: document.getElementById('locationsGrid'),
    locationsCount: document.getElementById('locationsCount'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText')
};

// Utility Functions
const utils = {
    // Show/hide elements
    show(element) {
        element.style.display = 'block';
    },
    
    hide(element) {
        element.style.display = 'none';
    },
    
    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    // Get country flag emoji
    getCountryFlag(countryCode) {
        if (!countryCode) return '';
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt());
        return String.fromCodePoint(...codePoints);
    },
    
    // Detect search type
    detectSearchType(searchTerm) {
        const cleanTerm = searchTerm.trim();
        
        // Coordinates
        if (/^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(cleanTerm)) {
            const [lat, lon] = cleanTerm.split(',').map(coord => coord.trim());
            return { type: 'coordinates', lat, lon };
        }
        
        // Postal code with country
        if (/^[a-z0-9\s-]+\s*,\s*[a-z]{2}$/i.test(cleanTerm)) {
            const [postalCode, countryCode] = cleanTerm.split(',').map(part => part.trim());
            return { type: 'postalCodeWithCountry', postalCode, countryCode: countryCode.toUpperCase() };
        }
        
        // City with country code
        if (/^[a-z\s-]+\s*,\s*[a-z]{2,}$/i.test(cleanTerm)) {
            const [cityName, country] = cleanTerm.split(',').map(part => part.trim());
            if (country.length === 2) {
                return { type: 'cityWithCountryCode', cityName, countryCode: country.toUpperCase() };
            } else {
                return { type: 'cityWithCountry', cityName, countryName: country };
            }
        }
        
        // Pure numbers (postal codes)
        if (/^\d+$/.test(cleanTerm)) {
            return { type: 'postalCode', postalCode: cleanTerm };
        }
        
        // Default to city name
        return { type: 'city', cityName: cleanTerm };
    },
    
    // Build weather API URL
    buildWeatherURL(searchType) {
        switch (searchType.type) {
            case 'coordinates':
                return `${CONFIG.BASE_URL}/weather?lat=${searchType.lat}&lon=${searchType.lon}&appid=${CONFIG.API_KEY}&units=metric`;
            
            case 'postalCodeWithCountry':
                return `${CONFIG.BASE_URL}/weather?zip=${searchType.postalCode},${searchType.countryCode}&appid=${CONFIG.API_KEY}&units=metric`;
            
            case 'cityWithCountryCode':
                return `${CONFIG.BASE_URL}/weather?q=${encodeURIComponent(searchType.cityName)},${searchType.countryCode}&appid=${CONFIG.API_KEY}&units=metric`;
            
            case 'cityWithCountry':
                return `${CONFIG.BASE_URL}/weather?q=${encodeURIComponent(searchType.cityName)},${encodeURIComponent(searchType.countryName)}&appid=${CONFIG.API_KEY}&units=metric`;
            
            case 'postalCode':
                return `${CONFIG.BASE_URL}/weather?zip=${searchType.postalCode}&appid=${CONFIG.API_KEY}&units=metric`;
            
            case 'city':
            default:
                return `${CONFIG.BASE_URL}/weather?q=${encodeURIComponent(searchType.cityName)}&appid=${CONFIG.API_KEY}&units=metric`;
        }
    },
    
    // Get weather background class
    getWeatherBackground(weatherMain) {
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
    }
};

// API Functions
const api = {
    // Fetch weather data
    async fetchWeather(searchTerm) {
        const searchType = utils.detectSearchType(searchTerm);
        const url = utils.buildWeatherURL(searchType);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Weather data not found');
        }
        return await response.json();
    },
    
    // Fetch forecast
    async fetchForecast(lat, lon) {
        const url = `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Forecast data not found');
        }
        return await response.json();
    },
    
    // Store weather data in backend
    async storeWeatherData(searchTerm, weatherData) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/weather`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    searchQuery: searchTerm,
                    weatherData: weatherData
                })
            });
            
            if (response.ok) {
                console.log('✅ Weather data stored in backend');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Failed to store in backend:', error);
        }
        return false;
    },
    
    // Fetch stored locations
    async fetchStoredLocations() {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/weather/locations/all`);
            if (response.ok) {
                const data = await response.json();
                state.storedLocations = data.locations || [];
                state.isBackendConnected = true;
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Backend might be unavailable:', error);
            state.isBackendConnected = false;
        }
        return false;
    },
    
    // Test export connection
    async testExportConnection() {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/export/test`);
            if (response.ok) {
                const data = await response.json();
                return { success: true, data };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Connection failed' };
    },
    
    // Export data
    async exportData(format, startDate, endDate, location) {
        const params = new URLSearchParams({
            startDate,
            endDate,
            ...(location && { location })
        });
        
        const response = await fetch(`${CONFIG.BACKEND_URL}/export/${format}?${params}`);
        if (!response.ok) {
            throw new Error('Export failed');
        }
        return await response.blob();
    }
};

// UI Rendering Functions
const render = {
    // Show loading state
    showLoading() {
        utils.show(elements.loadingSpinner);
        utils.hide(elements.errorMessage);
        utils.hide(elements.weatherDisplay);
    },
    
    // Hide loading state
    hideLoading() {
        utils.hide(elements.loadingSpinner);
    },
    
    // Show error message
    showError(message) {
        elements.errorText.textContent = message;
        utils.show(elements.errorMessage);
        utils.hide(elements.weatherDisplay);
    },
    
    // Hide error message
    hideError() {
        utils.hide(elements.errorMessage);
    },
    
    // Render weather card
    renderWeatherCard(weatherData) {
        const backgroundClass = utils.getWeatherBackground(weatherData.weather[0].main);
        const countryFlag = utils.getCountryFlag(weatherData.sys.country);
        
        return `
            <div class="weather-card ${backgroundClass}">
                <div class="weather-header">
                    <h2 class="location">
                        ${weatherData.name}
                        <span class="country-flag">${countryFlag}</span>
                    </h2>
                    <p class="date">${utils.formatDate(new Date())}</p>
                </div>

                <div class="weather-main">
                    <div class="temperature-section">
                        <div class="temperature">
                            ${Math.round(weatherData.main.temp)}°C
                        </div>
                        <div class="weather-description">
                            ${weatherData.weather[0].description}
                        </div>
                    </div>
                    <div class="icon-section">
                        <img 
                            src="${CONFIG.WEATHER_ICON_BASE}${weatherData.weather[0].icon}@2x.png" 
                            alt="${weatherData.weather[0].description}"
                            class="weather-icon"
                        >
                    </div>
                </div>

                <div class="weather-details">
                    <div class="detail-item">
                        <span class="detail-label">Feels like</span>
                        <span class="detail-value">${Math.round(weatherData.main.feels_like)}°C</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Humidity</span>
                        <span class="detail-value">${weatherData.main.humidity}%</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Wind</span>
                        <span class="detail-value">${weatherData.wind.speed} m/s</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Pressure</span>
                        <span class="detail-value">${weatherData.main.pressure} hPa</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Render forecast
    renderForecast(forecastData) {
        const dailyForecast = forecastData.list.filter((reading, index) => index % 8 === 0).slice(0, 5);
        
        const forecastCards = dailyForecast.map(day => {
            const date = new Date(day.dt * 1000);
            const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            
            return `
                <div class="forecast-card">
                    <div class="forecast-date">${formattedDate}</div>
                    <img 
                        src="${CONFIG.WEATHER_ICON_BASE}${day.weather[0].icon}.png"
                        alt="${day.weather[0].description}"
                        class="forecast-icon"
                    >
                    <div class="forecast-temp">${Math.round(day.main.temp)}°C</div>
                    <div class="forecast-desc">${day.weather[0].description}</div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="forecast">
                <h3 class="forecast-title">5-Day Forecast</h3>
                <div class="forecast-cards">${forecastCards}</div>
            </div>
        `;
    },
    
    // Render search history
    renderSearchHistory() {
        if (state.searchHistory.length === 0) {
            utils.hide(elements.searchHistory);
            return;
        }
        
        elements.historyCount.textContent = `${state.searchHistory.length} searches`;
        elements.historyList.innerHTML = state.searchHistory.map((item, index) => `
            <div class="history-item" onclick="app.handleHistoryClick('${item.searchTerm.replace(/'/g, "\\'")}')">
                <span class="history-name">${item.name}, ${item.country}</span>
                <span class="history-term">Searched: ${item.searchTerm}</span>
                <span class="history-time">${item.timestamp}</span>
            </div>
        `).join('');
        
        utils.show(elements.searchHistory);
    },
    
    // Render stored locations
    renderStoredLocations() {
        if (state.storedLocations.length === 0) {
            utils.hide(elements.storedLocations);
            return;
        }
        
        elements.locationsCount.textContent = `${state.storedLocations.length} locations in database`;
        
        const locationsToShow = state.storedLocations.slice(0, 6);
        elements.locationsGrid.innerHTML = locationsToShow.map(location => `
            <div class="location-card">
                <div class="location-name">
                    ${location.name}, ${location.country}
                </div>
                <div class="location-stats">
                    <span class="search-count">Searched: ${location.searchCount || 0} times</span>
                    <span class="last-updated">
                        Last: ${new Date(location.lastUpdated).toLocaleDateString()}
                    </span>
                </div>
            </div>
        `).join('');
        
        if (state.storedLocations.length > 6) {
            elements.locationsGrid.innerHTML += `
                <div class="locations-more">
                    +${state.storedLocations.length - 6} more locations available for export
                </div>
            `;
        }
        
        utils.show(elements.storedLocations);
    },
    
    // Update backend status
    updateBackendStatus() {
        if (state.isBackendConnected) {
            elements.statusIndicator.className = 'status-indicator online';
            elements.statusText.textContent = 'Backend Connected';
        } else {
            elements.statusIndicator.className = 'status-indicator offline';
            elements.statusText.textContent = 'Backend Offline - Data not being stored';
        }
    },
    
    // Update location dropdown for export
    updateLocationDropdown() {
        elements.selectedLocation.innerHTML = '<option value="">All Locations</option>';
        
        state.storedLocations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.name;
            option.textContent = `${location.name}, ${location.country} (${location.searchCount || 0} searches)`;
            elements.selectedLocation.appendChild(option);
        });
    }
};

// Main Application Logic
const app = {
    // Initialize the application
    async init() {
        this.setupEventListeners();
        this.setMaxDates();
        await this.initializeApp();
    },
    
    // Set up event listeners
    setupEventListeners() {
        // Search form
        elements.searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        
        // Example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const searchTerm = e.target.getAttribute('data-search');
                elements.searchInput.value = searchTerm;
                this.handleSearch(new Event('submit'), searchTerm);
            });
        });
        
        // Info modal
        elements.infoBtn.addEventListener('click', () => this.showInfoModal());
        elements.closeInfoModal.addEventListener('click', () => this.hideInfoModal());
        elements.modalOkBtn.addEventListener('click', () => this.hideInfoModal());
        
        // Export panel
        elements.exportToggleBtn.addEventListener('click', () => this.toggleExportPanel());
        elements.closeExportPanel.addEventListener('click', () => this.hideExportPanel());
        elements.exportBtn.addEventListener('click', () => this.handleExport());
        elements.testExportBtn.addEventListener('click', () => this.testExportConnection());
        
        // Export format change
        elements.exportFormat.addEventListener('change', (e) => {
            elements.exportBtn.textContent = `Export as ${e.target.value.toUpperCase()}`;
        });
        
        // Refresh stored locations
        elements.refreshBtn.addEventListener('click', () => this.refreshStoredLocations());
        
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target === elements.infoModal) {
                this.hideInfoModal();
            }
        });
    },
    
    // Set max dates for date inputs
    setMaxDates() {
        const today = new Date().toISOString().split('T')[0];
        elements.startDate.max = today;
        elements.endDate.max = today;
    },
    
    // Initialize application
    async initializeApp() {
        // Load stored locations
        await api.fetchStoredLocations();
        render.renderStoredLocations();
        render.updateBackendStatus();
        render.updateLocationDropdown();
        
        // Render search history
        render.renderSearchHistory();
        
        // Try to get user's location
        this.getUserLocation();
    },
    
    // Get user's current location
    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    this.fetchWeather(`${latitude},${longitude}`);
                },
                () => {
                    // Default to London if location access denied
                    this.fetchWeather('London');
                },
                {
                    timeout: 10000,
                    enableHighAccuracy: false
                }
            );
        } else {
            // Fallback if geolocation is not supported
            this.fetchWeather('London');
        }
    },
    
    // Handle search
    async handleSearch(e, searchTerm = null) {
        e.preventDefault();
        
        const term = searchTerm || elements.searchInput.value.trim();
        if (!term) {
            render.showError('Please enter a location to search');
            return;
        }
        
        await this.fetchWeather(term);
        elements.searchInput.value = '';
    },
    
    // Fetch weather data
    async fetchWeather(searchTerm) {
        try {
            render.showLoading();
            render.hideError();
            
            // Fetch current weather
            const weatherData = await api.fetchWeather(searchTerm);
            state.weather = weatherData;
            
            // Fetch forecast
            const forecastData = await api.fetchForecast(
                weatherData.coord.lat,
                weatherData.coord.lon
            );
            state.forecast = forecastData;
            
            // Store in backend
            await api.storeWeatherData(searchTerm, weatherData);
            
            // Update search history
            this.updateSearchHistory(searchTerm, weatherData);
            
            // Refresh stored locations
            await this.refreshStoredLocations();
            
            // Render results
            this.renderWeatherResults();
            
        } catch (error) {
            console.error('Error fetching weather:', error);
            render.showError(`"${searchTerm}" not found. Try different formats like:
                • "Hyderabad" (city only)
                • "Hyderabad,IN" (city with country code)
                • "500001" (postal code)
                • "17.3850,78.4867" (coordinates)`);
        } finally {
            render.hideLoading();
        }
    },
    
    // Update search history
    updateSearchHistory(searchTerm, weatherData) {
        const historyItem = {
            name: weatherData.name,
            country: weatherData.sys.country,
            searchTerm: searchTerm,
            timestamp: new Date().toLocaleString()
        };
        
        state.searchHistory = [
            historyItem,
            ...state.searchHistory.filter(item => 
                item.searchTerm !== searchTerm
            ).slice(0, 4)
        ];
        
        // Save to localStorage
        localStorage.setItem('weatherSearchHistory', JSON.stringify(state.searchHistory));
        
        // Render updated history
        render.renderSearchHistory();
    },
    
    // Handle history item click
    handleHistoryClick(searchTerm) {
        this.fetchWeather(searchTerm);
    },
    
    // Render weather results
    renderWeatherResults() {
        if (!state.weather || !state.forecast) return;
        
        const weatherHTML = render.renderWeatherCard(state.weather);
        const forecastHTML = render.renderForecast(state.forecast);
        
        elements.weatherDisplay.innerHTML = weatherHTML + forecastHTML;
        utils.show(elements.weatherDisplay);
    },
    
    // Show info modal
    showInfoModal() {
        utils.show(elements.infoModal);
    },
    
    // Hide info modal
    hideInfoModal() {
        utils.hide(elements.infoModal);
    },
    
    // Toggle export panel
    toggleExportPanel() {
        if (elements.exportPanel.style.display === 'none') {
            utils.show(elements.exportPanel);
            elements.exportToggleBtn.textContent = '📊 Hide Export';
        } else {
            this.hideExportPanel();
        }
    },
    
    // Hide export panel
    hideExportPanel() {
        utils.hide(elements.exportPanel);
        elements.exportToggleBtn.textContent = '📊 Export Data';
    },
    
    // Refresh stored locations
    async refreshStoredLocations() {
        const success = await api.fetchStoredLocations();
        if (success) {
            render.renderStoredLocations();
            render.updateBackendStatus();
            render.updateLocationDropdown();
        }
    },
    
    // Test export connection
    async testExportConnection() {
        const result = await api.testExportConnection();
        if (result.success) {
            alert(`✅ Export backend is working!\n${result.data.message}\nTotal records: ${result.data.totalRecords}`);
        } else {
            alert(`❌ Export backend test failed: ${result.error}`);
        }
    },
    
    // Handle export
    async handleExport() {
        const format = elements.exportFormat.value;
        const startDate = elements.startDate.value;
        const endDate = elements.endDate.value;
        const location = elements.selectedLocation.value;
        
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            alert('Start date cannot be after end date');
            return;
        }
        
        try {
            elements.exportBtn.disabled = true;
            elements.exportBtn.textContent = 'Exporting...';
            
            const blob = await api.exportData(format, startDate, endDate, location);
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `weather-data.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            alert(`✅ Successfully exported ${format.toUpperCase()} file!`);
            
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data. Please try again.');
        } finally {
            elements.exportBtn.disabled = false;
            elements.exportBtn.textContent = `Export as ${format.toUpperCase()}`;
        }
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});