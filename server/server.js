const WebSocket = require('ws');
const axios = require('axios');

const PORT = 8080;
const INTERVAL = 10000; // 10 seconds

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
  const results = {};
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint);
      const region = endpoint.match(/--(.*)\.upscope/)[1];
      results[region] = response.data;
    } catch (error) {
      console.error(`Failed to fetch data from ${endpoint}:`, error.message);
    }
  }
  return results;
};

server.on('connection', (ws) => {
  console.log('Client connected');

  const sendUpdates = async () => {
    const data = await fetchEndpointData();
    ws.send(JSON.stringify(data));
  };

  sendUpdates();
  const interval = setInterval(sendUpdates, INTERVAL);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
