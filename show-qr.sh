#!/bin/bash

# Show QR Code for iPhone Access
echo "📱 FollowUp PWA - iPhone Access"

# Function to get local IP address
get_local_ip() {
    if command -v ifconfig &> /dev/null; then
        ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
    elif command -v ip &> /dev/null; then
        ip route get 1.1.1.1 | awk '{print $7}' | head -1
    else
        echo "localhost"
    fi
}

LOCAL_IP=$(get_local_ip)
PORT=8000

echo ""
echo "🔗 PWA Access URL:"
echo "   https://$LOCAL_IP:$PORT"
echo ""
echo "📱 QR Code for iPhone:"
echo "┌─────────────────────────────────────────────────────────┐"
echo "│                                                         │"
echo "│  📱 FollowUp PWA - iPhone Access                       │"
echo "│                                                         │"
echo "│  🔗 URL to scan:                                       │"
printf "│     %-45s │\n" "https://$LOCAL_IP:$PORT"
echo "│                                                         │"
echo "│  📋 Instructions:                                      │"
echo "│     1. Open Safari on iPhone                          │"
echo "│     2. Type the URL above                             │"
echo "│     3. Accept security warning                        │"
echo "│     4. Tap share button 📤                            │"
echo "│     5. Select \"Add to Home Screen\"                    │"
echo "│                                                         │"
echo "│  🌐 Alternative:                                       │"
echo "│     • Local:  https://localhost:$PORT                  │"
printf "│     • Network: %-35s │\n" "https://$LOCAL_IP:$PORT"
echo "│                                                         │"
echo "└─────────────────────────────────────────────────────────┘"
echo ""
echo "💡 Instructions:"
echo "   1. Make sure your iPhone is on the same WiFi network"
echo "   2. Start the server with: ./start.sh"
echo "   3. Scan the QR code or manually enter the URL"
echo "   4. Accept the security warning (self-signed certificate)"
echo "   5. Tap the share button 📤 and select 'Add to Home Screen'"
echo ""
echo "🌐 Alternative URLs:"
echo "   Local: https://localhost:$PORT"
echo "   Network: https://$LOCAL_IP:$PORT" 