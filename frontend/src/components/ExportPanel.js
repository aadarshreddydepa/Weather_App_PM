import React, { useState } from "react";
import axios from "axios";
import "../styles/WeatherStyles.css";

const BACKEND_URL = "http://localhost:5001/api";

const ExportPanel = ({ storedLocations, onClose }) => {
  const [exportFormat, setExportFormat] = useState("json");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const handleExport = async () => {
    let effectiveStartDate = startDate;
    let effectiveEndDate = endDate;

    if (!startDate && !endDate) {
      // If user wants all data, use a very wide date range
      effectiveStartDate = "2020-01-01";
      effectiveEndDate = "2030-12-31";
      console.log("📅 No dates selected - exporting all data");
    } else if (!startDate || !endDate) {
      alert(
        "Please select both start and end dates, or leave both empty for all data"
      );
      return;
    }

    if (new Date(effectiveStartDate) > new Date(effectiveEndDate)) {
      alert("Start date cannot be after end date");
      return;
    }

    setExportLoading(true);
    setExportMessage("");

    try {
      const params = new URLSearchParams({
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
        ...(selectedLocation && { location: selectedLocation }),
      });

      console.log("📤 Export request:", {
        exportFormat,
        effectiveStartDate,
        effectiveEndDate,
        selectedLocation,
      });

      const response = await axios.get(
        `${BACKEND_URL}/export/${exportFormat}?${params}`,
        {
          responseType: "blob",
          timeout: 60000, // 60 second timeout
        }
      );

      // Check if we got a blob response
      if (response.data instanceof Blob) {
        // Create download link
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `weather-data.${getFileExtension(exportFormat)}`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setExportMessage(
          `✅ Successfully exported ${exportFormat.toUpperCase()} file!`
        );

        // Clear message after 3 seconds
        setTimeout(() => setExportMessage(""), 3000);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Export error:", error);

      let errorMessage = "Failed to export data. ";

      if (error.response?.data) {
        // Try to parse error message from backend
        try {
          const errorText = await new Response(error.response.data).text();
          const errorData = JSON.parse(errorText);
          errorMessage += errorData.error || "Unknown error from server.";
        } catch {
          errorMessage += "Server error occurred.";
        }
      } else if (error.code === "ECONNREFUSED") {
        errorMessage += "Backend server is not running.";
      } else if (error.code === "NETWORK_ERROR") {
        errorMessage += "Network error. Check your connection.";
      } else if (error.message.includes("timeout")) {
        errorMessage += "Request timed out. Try again.";
      } else {
        errorMessage += error.message || "Please try again.";
      }

      alert(errorMessage);
    } finally {
      setExportLoading(false);
    }
  };

  const getFileExtension = (format) => {
    const extensions = {
      json: "json",
      csv: "csv",
      xml: "xml",
      pdf: "pdf",
      markdown: "md",
    };
    return extensions[format] || "txt";
  };

  // Test backend connection
  const testExportConnection = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/export/test`);
      alert(
        `✅ Export backend is working!\n${response.data.message}\nTotal records: ${response.data.totalRecords}`
      );
    } catch (error) {
      alert(`❌ Export backend test failed: ${error.message}`);
    }
  };

  return (
    <div className="export-panel">
      <div className="export-header">
        <h3>📊 Export Weather Data</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="export-controls">
        <div className="form-group">
          <label>Format:</label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="xml">XML</option>
            <option value="pdf">PDF</option>
            <option value="markdown">Markdown</option>
          </select>
        </div>

        <div className="form-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate || new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className="form-group">
          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className="form-group">
          <label>Location (Optional):</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {storedLocations.map((loc, index) => (
              <option key={index} value={loc.name}>
                {loc.name}, {loc.country} ({loc.searchCount || 0} searches)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="export-actions">
        <button
          className="export-btn"
          onClick={handleExport}
          disabled={exportLoading || !startDate || !endDate}
        >
          {exportLoading
            ? "Exporting..."
            : `Export as ${exportFormat.toUpperCase()}`}
        </button>

        <button
          className="test-btn"
          onClick={testExportConnection}
          type="button"
        >
          Test Connection
        </button>
      </div>

      {exportMessage && (
        <div className="export-message success">{exportMessage}</div>
      )}

      <div className="export-tips">
        <p>
          💡 <strong>Tips:</strong>
        </p>
        <ul>
          <li>Select both start and end dates for export</li>
          <li>JSON/CSV are best for data analysis</li>
          <li>PDF is great for reports</li>
          <li>Use location filter for specific cities</li>
        </ul>
      </div>
    </div>
  );
};

export default ExportPanel;
