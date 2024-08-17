const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const app = express();

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

// Broadcast function to send data to all clients
wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

// WebSocket connection event
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Send a welcome message
    ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server!' }));

    // Handle incoming messages from clients
    ws.on('message', (message) => {
        console.log(`Received message => ${message}`);
    });

    // Handle the connection close
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Fetching data from a given region
async function fetchData(region) {
    const url = `https://data--${region}.upscope.io/status?stats=1`;
    try {
        const response = await axios.get(url);
        return { region, data: response.data };
    } catch (error) {
        console.error(`Error fetching data from ${region}:`, error.message);
        return { region, error: error.message };
    }
}

// Defining the endpoints for different regions
const regions = ['us-east', 'eu-west', 'eu-central', 'us-west', 'sa-east', 'ap-southeast'];

regions.forEach(region => {
    app.get(`/${region}`, async (req, res) => {
        const result = await fetchData(region);
        wss.broadcast(result);
        res.json(result);
    });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});