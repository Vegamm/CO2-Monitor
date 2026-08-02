import time
import board
import adafruit_scd4x
import requests

SERVER_URL = "http://localhost:3000/api/data"

i2c = board.I2C()
scd4x = adafruit_scd4x.SCD4X(i2c)

print("Starting SCD-41 readings and sending data to {SERVER_URL}")
scd4x.start_low_periodic_measurement()

try:
    while True:
        if scd4x.data_ready:
            temp_f = (scd4x.temperature * 9 / 5) + 32

            payload = {
                "co2": scd4x.CO2,
                "temp_f": round(temp_f, 1),
                "humidity": round(scd4x.relative_humidity, 1)
            }

            try:
                response = requests.post(SERVER_URL, json=payload, timeout=3)
                print(f"Reported: {payload} -> Status: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"Failed to post data: {e}")

        time.sleep(30)
except KeyboardInterrupt:
    scd4x.stop_periodic_measurement()
    print("\nStopped.")
