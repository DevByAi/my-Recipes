#!/bin/bash

ip=$(ipconfig getifaddr en0)
url="http://$ip:8080"

echo "🔗 האתר נגיש בכתובת: $url"
qrencode -t ANSIUTF8 "$url"
echo ""
live-server --host=0.0.0.0 --port=8080

