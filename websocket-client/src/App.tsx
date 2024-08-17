
import React, { useEffect, useState } from 'react';
import './App.css';

interface EndpointData {
  [region: string]: {
    status: string;
    responseTime: number;
    // Add any other relevant fields here
  };
}

const App: React.FC = () => {
  const [data, setData] = useState<EndpointData | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
      const receivedData: EndpointData = JSON.parse(event.data);
      setData(receivedData);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>DevOps Monitoring Dashboard</h1>
        {data ? (
          <div className="status-board">
            {Object.entries(data).map(([region, details]) => (
              <div key={region} className="region-status">
                <h2>{region.toUpperCase()}</h2>
                <p>Status: {details.status}</p>
                <p>Response Time: {details.responseTime} ms</p>
              </div>
            ))}
          </div>
        ) : (
          <p>Loading data...</p>
        )}
      </header>
    </div>
  );
};

export default App;
