const WebSocket = require('ws');
const axios = require('axios');

const PORT = 8080;
const INTERVAL = 10000; // 10 seconds
const TIMEOUT = 30000; // 30 seconds

const endpoints = [
  'https://data--us-east.upscope.io/status?stats=1',
  'https://data--eu-west.upscope.io/status?stats=1',
  'https://data--eu-central.upscope.io/status?stats=1',
  'https://data--us-west.upscope.io/status?stats=1',
  'https://data--sa-east.upscope.io/status?stats=1',
  'https://data--ap-southeast.upscope.io/status?stats=1',
];

const server = new WebSocket.Server({ port: PORT });

const fetchEndpointData = async () => {
  const results = [];
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint);
      const region = endpoint.match(/--(.*)\.upscope/)[1];
      const data = response.data;
      data.region = region;
      data.lastChecked = new Date().toISOString();
      results.push(data);
    } catch (error) {
      console.error(`Failed to fetch data from ${endpoint}:`, error.message);
    }
  }
  return results;
};

server.on('connection', (ws) => {
  console.log('Client connected');

  // Set a timeout for the WebSocket connection
  const connectionTimeout = setTimeout(() => {
    ws.terminate(); // Terminate the connection if no activity within TIMEOUT
    console.log('Client connection timed out');
  }, TIMEOUT);

  const sendUpdates = async () => {
    try {
      const data = await fetchEndpointData();
      ws.send(JSON.stringify(data));
    } catch (error) {
      console.error('Error sending updates:', error.message);
    }
  };

  sendUpdates();
  const interval = setInterval(sendUpdates, INTERVAL);

  ws.on('message', (message) => {
    // Handle incoming messages if needed
  });

  ws.on('close', () => {
    clearInterval(interval);
    clearTimeout(connectionTimeout);
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });
});

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
