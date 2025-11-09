const express = require('express');
const router = express.Router();
const WeatherData = require('../models/WeatherData');
const { Parser } = require('json2csv');
const xml2js = require('xml2js');
const PDFDocument = require('pdfkit');

// Helper function to get weather data
// Fixed getWeatherData function with proper date handling
const getWeatherData = async (startDate, endDate, location) => {
  let query = {};
  
  console.log('📊 Export request details:', { startDate, endDate, location });

  // Handle date range - include full day for start and end dates
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set start to beginning of the day (00:00:00)
    start.setHours(0, 0, 0, 0);
    
    // Set end to end of the day (23:59:59.999)
    end.setHours(23, 59, 59, 999);
    
    query.timestamp = {
      $gte: start,
      $lte: end
    };

    console.log('📅 Date range search:', {
      start: start.toISOString(),
      end: end.toISOString()
    });
  } else if (startDate && !endDate) {
    // If only start date provided, search from that date to now
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    query.timestamp = { $gte: start };
  } else if (!startDate && endDate) {
    // If only end date provided, search from beginning to that date
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query.timestamp = { $lte: end };
  }
  
  // If no dates provided, get all data
  if (!startDate && !endDate) {
    console.log('📅 No date range - fetching all records');
  }

  if (location && location !== '') {
    query['location.name'] = new RegExp(location, 'i');
    console.log('📍 Location filter:', location);
  }

  console.log('🔍 Final query:', JSON.stringify(query, null, 2));
  
  try {
    const weatherData = await WeatherData.find(query)
      .sort({ timestamp: -1 })
      .maxTimeMS(30000);

    console.log(`✅ Found ${weatherData.length} records for export`);
    
    // Log sample of what we found
    if (weatherData.length > 0) {
      console.log('📝 Sample records:');
      weatherData.slice(0, 2).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.location.name} - ${record.timestamp}`);
      });
    }
    
    return weatherData;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

// ✅ Export ALL data without date filtering
router.get('/all/json', async (req, res) => {
  try {
    const { location } = req.query;
    
    let query = {};
    if (location && location !== '') {
      query['location.name'] = new RegExp(location, 'i');
    }

    console.log('📨 Export ALL data request:', { location });
    
    const weatherData = await WeatherData.find(query)
      .sort({ timestamp: -1 })
      .maxTimeMS(30000);

    console.log(`📤 Sending ALL ${weatherData.length} records as JSON`);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=weather-data-ALL-${Date.now()}.json`);
    
    res.json({
      metadata: {
        exportedAt: new Date().toISOString(),
        totalRecords: weatherData.length,
        locationFilter: location || 'all',
        note: 'All records exported without date filtering'
      },
      data: weatherData
    });
    
  } catch (error) {
    console.error('❌ Error exporting all data:', error);
    res.status(500).json({ error: 'Failed to export all data: ' + error.message });
  }
});

// Similarly for other formats
router.get('/all/csv', async (req, res) => {
  try {
    const { location } = req.query;
    
    let query = {};
    if (location && location !== '') {
      query['location.name'] = new RegExp(location, 'i');
    }

    const weatherData = await WeatherData.find(query).sort({ timestamp: -1 });
    
    const flattenedData = weatherData.map(record => ({
      city: record.location.name,
      country: record.location.country,
      coordinates: `${record.location.coordinates.lat}, ${record.location.coordinates.lon}`,
      temperature: record.weather.temperature,
      feels_like: record.weather.feels_like,
      humidity: record.weather.humidity,
      pressure: record.weather.pressure,
      wind_speed: record.weather.wind_speed,
      weather_main: record.weather.main,
      weather_description: record.weather.description,
      visibility: record.weather.visibility || 'N/A',
      search_query: record.searchQuery,
      timestamp: record.timestamp.toLocaleString(),
      record_id: record._id
    }));
    
    const fields = [
      'city', 'country', 'coordinates', 'temperature', 'feels_like', 
      'humidity', 'pressure', 'wind_speed', 'weather_main', 
      'weather_description', 'visibility', 'search_query', 'timestamp', 'record_id'
    ];
    
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(flattenedData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=weather-data-ALL-${Date.now()}.csv`);
    res.send(csv);
    
  } catch (error) {
    console.error('❌ Error exporting all CSV:', error);
    res.status(500).json({ error: 'Failed to export all CSV: ' + error.message });
  }
});
// ✅ Export as JSON - Enhanced version
router.get('/json', async (req, res) => {
  try {
    const { startDate, endDate, location } = req.query;
    console.log('📨 JSON Export request received:', { startDate, endDate, location });

    const weatherData = await getWeatherData(startDate, endDate, location);
    
    console.log(`📤 Sending ${weatherData.length} records as JSON`);
    
    res.setHeader('Content-Type', 'application/json');
    
    // Create a descriptive filename
    let filename = 'weather-data';
    if (startDate && endDate) {
      filename += `-${startDate}-to-${endDate}`;
    }
    if (location) {
      filename += `-${location}`;
    }
    filename += '.json';
    
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.json({
      metadata: {
        exportedAt: new Date().toISOString(),
        totalRecords: weatherData.length,
        dateRange: { startDate, endDate },
        locationFilter: location || 'all'
      },
      data: weatherData
    });
    
  } catch (error) {
    console.error('❌ Error exporting JSON:', error);
    res.status(500).json({ 
      error: 'Failed to export data as JSON',
      details: error.message 
    });
  }
});
// ✅ Debug endpoint to check date formats and data
router.get('/debug/dates', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('🔍 Debug date request:', { startDate, endDate });
    
    // Get all records to see what dates we have
    const allRecords = await WeatherData.find().sort({ timestamp: -1 }).limit(10);
    
    const recordDates = allRecords.map(record => ({
      location: record.location.name,
      timestamp: record.timestamp,
      iso: record.timestamp.toISOString(),
      local: record.timestamp.toLocaleString(),
      searchQuery: record.searchQuery
    }));
    
    // Test the date query
    let testQuery = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      testQuery.timestamp = { $gte: start, $lte: end };
      
      const matchingRecords = await WeatherData.find(testQuery);
      
      res.json({
        debugInfo: {
          inputDates: { startDate, endDate },
          parsedDates: {
            start: start.toISOString(),
            end: end.toISOString()
          },
          testQuery
        },
        recentRecords: recordDates,
        matchingRecordsCount: matchingRecords.length,
        matchingRecords: matchingRecords.map(r => ({
          location: r.location.name,
          timestamp: r.timestamp
        }))
      });
    } else {
      res.json({
        recentRecords: recordDates,
        message: 'Provide startDate and endDate to test query'
      });
    }
    
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});
// ✅ Export as JSON
router.get('/json', async (req, res) => {
  try {
    const { startDate, endDate, location } = req.query;
    console.log('📨 JSON Export request:', { startDate, endDate, location });

    const weatherData = await getWeatherData(startDate, endDate, location);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=weather-data.json');
    res.json(weatherData);
    
  } catch (error) {
    console.error('❌ Error exporting JSON:', error);
    res.status(500).json({ error: 'Failed to export data as JSON: ' + error.message });
  }
});

// ✅ Export as CSV
router.get('/csv', async (req, res) => {
  try {
    const { startDate, endDate, location } = req.query;
    console.log('📨 CSV Export request:', { startDate, endDate, location });

    const weatherData = await getWeatherData(startDate, endDate, location);
    
    // Flatten the data for CSV
    const flattenedData = weatherData.map(record => ({
      city: record.location.name,
      country: record.location.country,
      temperature: record.weather.temperature,
      feels_like: record.weather.feels_like,
      humidity: record.weather.humidity,
      pressure: record.weather.pressure,
      wind_speed: record.weather.wind_speed,
      weather: record.weather.main,
      description: record.weather.description,
      timestamp: record.timestamp
    }));
    
    const fields = [
      'city',
      'country', 
      'temperature',
      'feels_like',
      'humidity',
      'pressure',
      'wind_speed',
      'weather',
      'description',
      'timestamp'
    ];
    
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(flattenedData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=weather-data.csv');
    res.send(csv);
    
  } catch (error) {
    console.error('❌ Error exporting CSV:', error);
    res.status(500).json({ error: 'Failed to export data as CSV: ' + error.message });
  }
});

// ✅ Export as XML
router.get('/xml', async (req, res) => {
  try {
    const { startDate, endDate, location } = req.query;
    console.log('📨 XML Export request:', { startDate, endDate, location });

    const weatherData = await getWeatherData(startDate, endDate, location);
    
    const builder = new xml2js.Builder();
    const xml = builder.buildObject({ weatherData: weatherData });
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename=weather-data.xml');
    res.send(xml);
    
  } catch (error) {
    console.error('❌ Error exporting XML:', error);
    res.status(500).json({ error: 'Failed to export data as XML: ' + error.message });
  }
});

// ✅ Export as PDF
router.get('/pdf', async (req, res) => {
  try {
    const { startDate, endDate, location } = req.query;
    console.log('📨 PDF Export request:', { startDate, endDate, location });

    const weatherData = await getWeatherData(startDate, endDate, location);
    
    const doc = new PDFDocument();
    
    // Set response headers BEFORE piping
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=weather-report.pdf');
    
    doc.pipe(res);
    
    // PDF Content
    doc.fontSize(20).text('Weather Data Report', { align: 'center' });
    doc.moveDown();
    
    if (weatherData.length === 0) {
      doc.fontSize(12).text('No weather data found for the selected criteria.', { align: 'center' });
    } else {
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`);
      doc.text(`Total Records: ${weatherData.length}`);
      if (startDate && endDate) {
        doc.text(`Date Range: ${startDate} to ${endDate}`);
      }
      if (location) {
        doc.text(`Location: ${location}`);
      }
      doc.moveDown();
      
      weatherData.forEach((record, index) => {
        doc.fontSize(12)
           .text(`${index + 1}. ${record.location.name}, ${record.location.country}`, { underline: true })
           .fontSize(10)
           .text(`   Temperature: ${record.weather.temperature}°C`)
           .text(`   Feels like: ${record.weather.feels_like}°C`)
           .text(`   Humidity: ${record.weather.humidity}%`)
           .text(`   Weather: ${record.weather.description}`)
           .text(`   Date: ${new Date(record.timestamp).toLocaleString()}`)
           .moveDown(0.5);
      });
    }
    
    doc.end();
    
  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    res.status(500).json({ error: 'Failed to export data as PDF: ' + error.message });
  }
});

// ✅ Export as Markdown
router.get('/markdown', async (req, res) => {
  try {
    const { startDate, endDate, location } = req.query;
    console.log('📨 Markdown Export request:', { startDate, endDate, location });

    const weatherData = await getWeatherData(startDate, endDate, location);
    
    let markdown = '# Weather Data Report\n\n';
    markdown += `**Generated on:** ${new Date().toLocaleString()}\n`;
    markdown += `**Total Records:** ${weatherData.length}\n`;
    
    if (startDate && endDate) {
      markdown += `**Date Range:** ${startDate} to ${endDate}\n`;
    }
    if (location) {
      markdown += `**Location Filter:** ${location}\n`;
    }
    markdown += '\n';
    
    if (weatherData.length === 0) {
      markdown += 'No weather data found for the selected criteria.\n';
    } else {
      weatherData.forEach((record, index) => {
        markdown += `## ${index + 1}. ${record.location.name}, ${record.location.country}\n`;
        markdown += `- **Temperature**: ${record.weather.temperature}°C\n`;
        markdown += `- **Feels like**: ${record.weather.feels_like}°C\n`;
        markdown += `- **Humidity**: ${record.weather.humidity}%\n`;
        markdown += `- **Pressure**: ${record.weather.pressure} hPa\n`;
        markdown += `- **Wind Speed**: ${record.weather.wind_speed} m/s\n`;
        markdown += `- **Weather**: ${record.weather.description}\n`;
        markdown += `- **Date**: ${new Date(record.timestamp).toLocaleString()}\n\n`;
      });
    }
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename=weather-data.md');
    res.send(markdown);
    
  } catch (error) {
    console.error('❌ Error exporting Markdown:', error);
    res.status(500).json({ error: 'Failed to export data as Markdown: ' + error.message });
  }
});

// ✅ Test endpoint to verify export functionality
router.get('/test', async (req, res) => {
  try {
    const count = await WeatherData.countDocuments();
    res.json({ 
      status: 'Export routes working',
      totalRecords: count,
      message: 'Export functionality is ready'
    });
  } catch (error) {
    res.status(500).json({ error: 'Export test failed: ' + error.message });
  }
});

module.exports = router;