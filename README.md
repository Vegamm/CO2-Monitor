# SCD-41 Raspberry Pi CO2, temperature, and humidity Dashboard

A real-time tracking system built with a **Raspberry Pi**, an **Adafruit SCD-41** sensor, a **Python** data ingestion service, and a **Node.js / Express** web dashboard.

The system continuously samples $CO_2$, temperature, and relative humidity every 30 seconds and visualizes the history using interactive line charts powered by Chart.js.

---

1. **Python Service (`co2monitor.py`)**: Interfaces with the SCD-41 via $I^2C$, reads $CO_2$, temperature, and humidity every 30 seconds, and posts readings to the Express backend.
2. **Express Server (`index.js`)**: Receives data payloads, maintains a rolling 2880-point (1 day) historical log, and serves the static frontend.
3. **Web Dashboard (`public/index.html`)**: Fetches data history from the API and dynamically updates interactive line graphs every 30 seconds.

### Prerequisites

* Node.js (v22+)
* Python 3.x

### How to get started
* To start the python service: ```python3 co2Monitor.py```
* To start the express server: ```node index.js```

The web dashboard is listening on localhost:3000 by default. 
