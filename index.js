const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const PORT = 3000;

app.set('trust proxy', 1);

app.use(express.json());
app.use(express.static('public'));

// Store up to 2,880 historical data points (~24 hours at 30s intervals)
const MAX_HISTORY = 2880;

// Initialize SQLite database file on disk
const db = new Database('database.db');

// Enable WAL mode for better concurrency and write performance on SD cards
db.pragma('journal_mode = WAL');

// Create table if it doesn't already exist
db.prepare(`
    CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        co2 INTEGER,
        temp_f REAL,
        humidity REAL,
        timestamp TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// Prepared statements for fast execution
const insertStmt = db.prepare(`
    INSERT INTO readings (co2, temp_f, humidity, timestamp)
    VALUES (?, ?, ?, ?)
`);

const cleanupStmt = db.prepare(`
    DELETE FROM readings
    WHERE id NOT IN (
        SELECT id FROM readings ORDER BY id DESC LIMIT ?
    )
`);

const selectStmt = db.prepare(`
    SELECT co2, temp_f, humidity, timestamp
    FROM (
        SELECT co2, temp_f, humidity, timestamp, id
        FROM readings
        ORDER BY id DESC
        LIMIT ?
    )
    ORDER BY id ASC
`);

// Endpoint for Python script to send sensor data
app.post('/api/data', (req, res) => {
    const { co2, temp_f, humidity } = req.body;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
        // Insert new reading into SQLite database file
        insertStmt.run(co2, temp_f, humidity, timestamp);

        // Retain only the most recent 2,880 readings on disk
        cleanupStmt.run(MAX_HISTORY);

        console.log(`[${timestamp}] Saved to DB -> CO2: ${co2} ppm | Temp: ${temp_f}°F | Humidity: ${humidity}%`);
        res.json({ status: 'success' });
    } catch (err) {
        console.error("Database write error:", err);
        res.status(500).json({ status: 'error', message: 'Failed to save reading to disk' });
    }
});

// Endpoint for browser to fetch full history
app.get('/api/history', (req, res) => {
    try {
        // Query the latest 2,880 points in chronological order
        const dataHistory = selectStmt.all(MAX_HISTORY);
        res.json(dataHistory);
    } catch (err) {
        console.error("Database read error:", err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch history' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
