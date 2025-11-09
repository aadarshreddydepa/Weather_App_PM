const express = require('express');
const router = express.Router();
const WeatherData = require('../models/WeatherData');
const axios = require('axios');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// ✅ CREATE - Store new weather data
router.post('/', async (req, res) => {
  try {
    const { searchQuery, weatherData } = req.body;

    if (!searchQuery || !weatherData) {
      return res.status(400).json({ error: 'Search query and weather data are required' });
    }

    const weatherRecord = new WeatherData({
      location: {
        name: weatherData.name,
        country: weatherData.sys.country,
        coordinates: {
          lat: weatherData.coord.lat,
          lon: weatherData.coord.lon
        }
      },
      weather: {
        main: weatherData.weather[0].main,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        temperature: weatherData.main.temp,
        feels_like: weatherData.main.feels_like,
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        wind_speed: weatherData.wind.speed,
        visibility: weatherData.visibility
      },
      searchQuery: searchQuery
    });

    const savedData = await weatherRecord.save();
    res.status(201).json({
      message: 'Weather data stored successfully',
      data: savedData
    });
  } catch (error) {
    console.error('Error storing weather data:', error);
    res.status(500).json({ error: 'Failed to store weather data' });
  }
});

// ✅ READ - Get weather data by location
router.get('/location/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const weatherData = await WeatherData.find({
      'location.name': new RegExp(location, 'i')
    })
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await WeatherData.countDocuments({
      'location.name': new RegExp(location, 'i')
    });

    res.json({
      data: weatherData,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// ✅ READ - Get weather data by date range
router.get('/date-range', async (req, res) => {
  try {
    const { startDate, endDate, location } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (location) {
      query['location.name'] = new RegExp(location, 'i');
    }

    const weatherData = await WeatherData.find(query).sort({ timestamp: -1 });
    
    res.json({
      data: weatherData,
      count: weatherData.length
    });
  } catch (error) {
    console.error('Error fetching weather data by date range:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// ✅ UPDATE - Update weather data by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedData = await WeatherData.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedData) {
      return res.status(404).json({ error: 'Weather data not found' });
    }

    res.json({
      message: 'Weather data updated successfully',
      data: updatedData
    });
  } catch (error) {
    console.error('Error updating weather data:', error);
    res.status(500).json({ error: 'Failed to update weather data' });
  }
});

// ✅ DELETE - Delete weather data by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedData = await WeatherData.findByIdAndDelete(id);

    if (!deletedData) {
      return res.status(404).json({ error: 'Weather data not found' });
    }

    res.json({
      message: 'Weather data deleted successfully',
      data: deletedData
    });
  } catch (error) {
    console.error('Error deleting weather data:', error);
    res.status(500).json({ error: 'Failed to delete weather data' });
  }
});

// ✅ GET - Get all locations in database
router.get('/locations/all', async (req, res) => {
  try {
    const locations = await WeatherData.aggregate([
      {
        $group: {
          _id: {
            name: '$location.name',
            country: '$location.country'
          },
          count: { $sum: 1 },
          lastUpdated: { $max: '$timestamp' }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id.name',
          country: '$_id.country',
          searchCount: '$count',
          lastUpdated: 1
        }
      },
      { $sort: { searchCount: -1 } }
    ]);

    res.json({ locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});
// ✅ DELETE - Delete all weather data (for testing/reset)
router.delete('/cleanup/all', async (req, res) => {
  try {
    const result = await WeatherData.deleteMany({});
    res.json({
      message: 'All weather data deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting all data:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

// ✅ DELETE - Delete by location
router.delete('/location/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const result = await WeatherData.deleteMany({
      'location.name': new RegExp(location, 'i')
    });
    
    res.json({
      message: `Weather data for ${location} deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting location data:', error);
    res.status(500).json({ error: 'Failed to delete location data' });
  }
});

module.exports = router;