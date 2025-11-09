import React from 'react';
import '../styles/WeatherStyles.css';

const InfoModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>About Weather App</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="modal-body">
          <div className="app-info">
            <h3>🌤️ Global Weather+</h3>
            <p>
              A beautiful, feature-rich weather application that provides real-time 
              weather data for any location worldwide. Built with modern web technologies 
              and designed with user experience in mind.
            </p>
          </div>

          <div className="features-list">
            <h4>✨ Features:</h4>
            <ul>
              <li>🌍 Search by city name, postal code, or coordinates</li>
              <li>📊 5-day weather forecast</li>
              <li>💾 Automatic data storage with MongoDB</li>
              <li>📤 Export data in JSON, CSV, XML, PDF, and Markdown</li>
              <li>📱 Fully responsive design</li>
              <li>🎨 Beautiful, intuitive interface</li>
            </ul>
          </div>

          <div className="pm-accelerator-info">
            <h4>🚀 About Product Manager Accelerator</h4>
            <p>
              <strong>Product Manager Accelerator</strong> is dedicated to empowering 
              the next generation of product leaders through comprehensive training, 
              mentorship, and real-world experience.
            </p>
            
            <div className="pm-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">🎯</span>
                <span>Product Management Training</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">💡</span>
                <span>Career Acceleration</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🤝</span>
                <span>Industry Mentorship</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🌐</span>
                <span>Global Community</span>
              </div>
            </div>

            <div className="social-links">
              <a 
                href="https://www.linkedin.com/school/pmaccelerator/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="linkedin-link"
              >
                🔗 Visit our LinkedIn Page
              </a>
            </div>
          </div>

          <div className="technical-info">
            <h4>🛠️ Technical Stack:</h4>
            <div className="tech-stack">
              <span className="tech-item">React</span>
              <span className="tech-item">Node.js</span>
              <span className="tech-item">Express</span>
              <span className="tech-item">MongoDB Atlas</span>
              <span className="tech-item">OpenWeather API</span>
            </div>
          </div>

          <div className="developer-info">
            <p>
              <strong>Developed by:</strong> Aadarsh Reddy Depa
            </p>
            <p className="app-version">Version 2.0</p>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-ok-btn" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;