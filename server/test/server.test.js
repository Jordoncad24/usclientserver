const WebSocket = require('ws');
const axios = require('axios');
const { Server } = require('ws');

const PORT = 8080;
const INTERVAL = 10000;
const TIMEOUT = 30000;

const endpoints = [
  'https://data--us-east.upscope.io/status?stats=1',
  'https://data--eu-west.upscope.io/status?stats=1',
  'https://data--eu-central.upscope.io/status?stats=1',
  'https://data--us-west.upscope.io/status?stats=1',
  'https://data--sa-east.upscope.io/status?stats=1',
  'https://data--ap-southeast.upscope.io/status?stats=1',
];

// Mock the server implementation for testing
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

const server = new Server({ port: PORT });

server.on('connection', (ws) => {
  console.log('Client connected');

  const connectionTimeout = setTimeout(() => {
    ws.terminate();
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

  ws.on('close', () => {
    clearInterval(interval);
    clearTimeout(connectionTimeout);
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });
});

let wsClient;

beforeAll((done) => {
  wsClient = new WebSocket(`ws://localhost:${PORT}`);
  wsClient.on('open', done);
});

afterAll(() => {
  wsClient.close();
  server.close();
});

describe('WebSocket Server', () => {
  it('should send data to the client', (done) => {
    wsClient.on('message', (message) => {
      const data = JSON.parse(message);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(endpoints.length);
      data.forEach((item) => {
        expect(item).toHaveProperty('region');
        expect(item).toHaveProperty('lastChecked');
      });
      done();
    });
    // Set a timeout for the test to handle cases where the server is slow to respond
    setTimeout(() => {
      done.fail('Test timed out');
    }, TIMEOUT);
  });

  it('should handle connection and disconnection', (done) => {
    let messageReceived = false;
    const handleMessage = () => {
      messageReceived = true;
      wsClient.removeListener('message', handleMessage);
    };
    wsClient.on('message', handleMessage);
    wsClient.close();
    setTimeout(() => {
      expect(messageReceived).toBe(true);
      done();
    }, 1000); // Wait for a short period to ensure close event
  });

  it('should handle server errors gracefully', (done) => {
    // Simulate an error by modifying the server or endpoints if necessary
    server.close(); // Close the server to simulate a failure

    const errorClient = new WebSocket(`ws://localhost:${PORT}`);
    errorClient.on('error', (error) => {
      expect(error).toBeDefined();
      done();
    });
    setTimeout(() => {
      done.fail('Test timed out');
    }, TIMEOUT);
  });
});
