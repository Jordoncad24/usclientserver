import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import RegionPage from './RegionPage';

interface RegionData {
  status: string;
  region: string;
  results: {
    services: {
      redis: boolean;
      database: boolean;
    };
    stats: {
      servers_count: number;
      online: number;
      session: number;
      server: {
        active_connections: number;
        wait_time: number;
        workers: [string, {
          wait_time: number;
          workers: number;
          waiting: number;
          idle: number;
          time_to_return: number;
          recently_blocked_keys: [string, number, string][];
          top_keys: [string, number][];
        }][];
        cpu_load: number;
        timers: number;
      };
    };
  };
  lastChecked: string;
}

const App: React.FC = () => {
  const [data, setData] = useState<RegionData[]>([]);

  useEffect(() => {
    const ws = new WebSocket('https://usclientserver-9.onrender.com');

    ws.onmessage = (event) => {
      const receivedData: RegionData[] = JSON.parse(event.data);
      setData(receivedData);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    ws.onerror = () => {
      console.log('WebSocket error');
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>DevOps Monitoring Dashboard</h1>
          {data.length > 0 ? (
            <div className="region-links">
              {data.map((regionData) => (
                <Link key={regionData.region} to={`/region/${regionData.region}`} className="region-button">
                  {regionData.region.toUpperCase()}
                </Link>
              ))}
            </div>
          ) : (
            <p>Loading data...</p>
          )}
        </header>
        <Routes>
          <Route
            path="/region/:regionId"
            element={<RegionPage data={data} />}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
