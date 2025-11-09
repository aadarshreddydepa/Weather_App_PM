const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  location: {
    name: { type: String, required: true },
    country: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true }
    }
  },
  weather: {
    main: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    temperature: { type: Number, required: true },
    feels_like: { type: Number, required: true },
    humidity: { type: Number, required: true },
    pressure: { type: Number, required: true },
    wind_speed: { type: Number, required: true },
    visibility: { type: Number }
  },
  timestamp: { type: Date, default: Date.now },
  searchQuery: { type: String, required: true }
}, {
  timestamps: true
});

// Compound index for efficient queries by location and date
weatherSchema.index({ 'location.name': 1, timestamp: -1 });
weatherSchema.index({ timestamp: -1 });

module.exports = mongoose.model('WeatherData', weatherSchema);