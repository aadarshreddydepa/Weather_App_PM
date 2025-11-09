# 🌤️ Global Weather+

A beautiful, feature-rich weather application that provides real-time weather data for any location worldwide. Built with modern web technologies and designed with an exceptional user experience.

![Weather App](https://img.shields.io/badge/React-18.2.0-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-success) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🌍 **Smart Search**
- Search by **city name** (e.g., "London", "New York")
- Search by **postal code** (e.g., "110001", "90210")
- Search by **coordinates** (e.g., "40.7128,-74.0060")
- Search by **city with country code** (e.g., "Hyderabad,IN", "London,UK")
- Auto-detects search type intelligently

### 📊 **Weather Information**
- **Current weather** with detailed metrics
- **5-day forecast** with daily predictions
- **Weather icons** and descriptions
- **Multiple metrics**: Temperature, humidity, pressure, wind speed, feels-like temperature

### 💾 **Data Management**
- **Automatic data storage** in MongoDB Atlas
- **CRUD operations** (Create, Read, Update, Delete)
- **Search history** with quick re-search capability
- **Location statistics** and search counts

### 📤 **Export Capabilities**
- **Multiple formats**: JSON, CSV, XML, PDF, Markdown
- **Date range filtering**
- **Location-based exports**
- **Batch operations** for data sharing

### 🎨 **User Experience**
- **Beautiful, responsive design**
- **Cute animations** and transitions
- **Mobile-friendly** interface
- **Real-time feedback** and loading states
- **Error handling** with helpful suggestions

## 🛠️ Technical Stack

### **Frontend**
- **React 18** - Modern UI framework
- **Axios** - HTTP client for API calls
- **CSS3** - Custom animations and responsive design
- **HTML5** - Semantic markup

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB object modeling

### **APIs & Services**
- **OpenWeatherMap API** - Weather data provider
- **RESTful APIs** - Custom backend endpoints
- **CORS** - Cross-origin resource sharing

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- OpenWeatherMap API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/global-weather-plus.git
   cd global-weather-plus
   ```

2. **Frontend Setup**
   ```bash
   # Install dependencies
   npm install

   # Start development server
   npm start
   ```
   Frontend runs on `http://localhost:3000`

3. **Backend Setup**
   ```bash
   cd backend
   
   # Install dependencies
   npm install
   
   # Create environment file
   echo "PORT=5001" >> .env
   echo "MONGODB_URI=your_mongodb_atlas_connection_string" >> .env
   echo "OPENWEATHER_API_KEY=your_openweather_api_key" >> .env
   
   # Start backend server
   npm run dev
   ```
   Backend runs on `http://localhost:5001`

### Environment Variables

Create `.env` file in backend directory:

```env
PORT=5001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/weather-app
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

## 📡 API Endpoints

### Weather Routes
- `POST /api/weather` - Store weather data
- `GET /api/weather/location/:location` - Get weather by location
- `GET /api/weather/date-range` - Get weather by date range
- `GET /api/weather/locations/all` - Get all unique locations
- `PUT /api/weather/:id` - Update weather record
- `DELETE /api/weather/:id` - Delete weather record
- `DELETE /api/weather/cleanup/all` - Delete all data

### Export Routes
- `GET /api/export/json` - Export as JSON
- `GET /api/export/csv` - Export as CSV
- `GET /api/export/xml` - Export as XML
- `GET /api/export/pdf` - Export as PDF
- `GET /api/export/markdown` - Export as Markdown
- `GET /api/export/all/json` - Export all data as JSON

## 🗃️ Database Schema

```javascript
{
  location: {
    name: String,
    country: String,
    coordinates: {
      lat: Number,
      lon: Number
    }
  },
  weather: {
    main: String,
    description: String,
    icon: String,
    temperature: Number,
    feels_like: Number,
    humidity: Number,
    pressure: Number,
    wind_speed: Number,
    visibility: Number
  },
  timestamp: Date,
  searchQuery: String
}
```

## 🎯 Usage Examples

### Search Formats
```javascript
"London"           // City name
"London,UK"        // City with country code
"110001"           // Indian postal code
"110001,IN"        // Postal code with country
"40.7128,-74.0060" // Coordinates
"90210,US"         // US zip code with country
```

### Export Examples
```bash
# Export all data as JSON
curl "http://localhost:5001/api/export/all/json"

# Export specific date range as CSV
curl "http://localhost:5001/api/export/csv?startDate=2024-01-01&endDate=2024-01-31"

# Export location-specific data as PDF
curl "http://localhost:5001/api/export/pdf?location=London"
```

## 🔧 Development

### Project Structure
```
global-weather-plus/
├── public/
├── src/
│   ├── components/
│   │   ├── WeatherCard.js
│   │   ├── SearchBar.js
│   │   ├── Forecast.js
│   │   ├── LoadingSpinner.js
│   │   ├── ExportPanel.js
│   │   └── InfoModal.js
│   ├── styles/
│   │   ├── App.css
│   │   └── WeatherStyles.css
│   └── App.js
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── server.js
└── README.md
```

### Available Scripts

**Frontend:**
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

**Backend:**
```bash
npm run dev        # Start with nodemon
npm start          # Start production server
npm run test:db    # Test database connection
```

## 🌟 Key Features in Detail

### Smart Search Detection
The app intelligently detects search type:
- **Coordinates**: Matches lat,lon patterns
- **Postal codes**: Numeric or alphanumeric patterns
- **City names**: Everything else falls back to city search
- **Country codes**: Supports both 2-letter and full country names

### Data Export System
- **JSON**: Perfect for APIs and developers
- **CSV**: Ideal for spreadsheets and data analysis
- **XML**: Enterprise system compatibility
- **PDF**: Professional reports and printing
- **Markdown**: Documentation and notes

### Responsive Design
- **Mobile-first** approach
- **Flexible grids** and layouts
- **Touch-friendly** interfaces
- **Optimized images** and icons

## 🐛 Troubleshooting

### Common Issues

1. **Weather data not loading**
   - Check OpenWeatherMap API key
   - Verify internet connection
   - Check browser console for errors

2. **Backend connection failed**
   - Ensure backend server is running on port 5001
   - Check MongoDB Atlas connection string
   - Verify IP is whitelisted in MongoDB Atlas

3. **Export not working**
   - Check if dates are properly selected
   - Verify backend is running
   - Check browser download settings

### Debug Endpoints
```bash
# Check backend health
curl http://localhost:5001/api/weather/health

# Debug date issues
curl "http://localhost:5001/api/export/debug/dates"

# Test database connection
node backend/test-connection.js
```

## 📈 Performance

- **Lazy loading** for better initial load times
- **Efficient API calls** with proper error handling
- **Optimized database queries** with indexes
- **Compressed assets** and minimal bundle size

## 🔒 Security

- **CORS configuration** for controlled access
- **Input validation** on both frontend and backend
- **Environment variables** for sensitive data
- **MongoDB Atlas** with IP whitelisting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Aadarsh Reddy Depa**  
*Full Stack Developer*

## 🚀 Product Manager Accelerator

This project was developed in association with **Product Manager Accelerator**, dedicated to empowering the next generation of product leaders through comprehensive training, mentorship, and real-world experience.

### PM Accelerator Highlights
- 🎯 **Product Management Training**
- 💡 **Career Acceleration Programs**
- 🤝 **Industry Mentorship**
- 🌐 **Global Community**

[Visit our LinkedIn Page](https://www.linkedin.com/school/pmaccelerator/)

## 🙏 Acknowledgments

- **OpenWeatherMap** for providing reliable weather data
- **MongoDB Atlas** for cloud database services
- **React community** for excellent documentation and support
- **Product Manager Accelerator** for the opportunity and guidance

## 📞 Support

For support, email aadarshreddydepa@gmail.com or create an issue in the repository.

---

**⭐ Star this repo if you found it helpful!**

**🌤️ Happy Weather Tracking!**