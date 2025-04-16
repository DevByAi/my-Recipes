#!/bin/bash

# Get the local IP address
IP_ADDRESS=$(ipconfig getifaddr en0)

# Start the Python HTTP server in the background
python3 -m http.server 8000 --bind 0.0.0.0 &

# Store the server process ID
SERVER_PID=$!

# Print the URL with an emoji
echo "🔗 פתוח ב־ http://${IP_ADDRESS}:8000"

# Generate and display QR code
echo "QR Code:"
qrencode -t ANSIUTF8 "http://${IP_ADDRESS}:8000"

# Handle script termination
trap "kill $SERVER_PID" EXIT

# Keep the script running
wait $SERVER_PID 