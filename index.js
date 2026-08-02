const express = require('express');
const app = express();
const PORT = 3000;

//app.set('trust proxy', 1);

app.use(express.json());
app.use(express.static('public'));

// Store up to 30 historical data points
const MAX_HISTORY = 2880;
let dataHistory = [];

// Endpoint for Python script to send sensor data
app.post('/api/data', (req, res) => {
    const { co2, temp_f, humidity } = req.body;

    const newReading = {
        co2,
        temp_f,
        humidity,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    // Add new reading to history array
    dataHistory.push(newReading);

    // Keep only the most recent 30 readings
    if (dataHistory.length > MAX_HISTORY) {
        dataHistory.shift();
    }

    console.log(`[${newReading.timestamp}] Received -> CO2: ${co2} ppm | Temp: ${temp_f}°F | Humidity: ${humidity}%`);
    res.json({ status: 'success' });
});

// Endpoint for browser to fetch full history
app.get('/api/history', (req, res) => {
    res.json(dataHistory);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
