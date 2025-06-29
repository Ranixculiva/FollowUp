#!/bin/bash

# FollowUp PWA Startup Script
# This script starts a local HTTPS server for PWA installation

set -e

# Usage: ./start.sh [PORT] [--kill-port]

# Default port
PORT=8000
KILL_PORT=0

# Parse arguments
for arg in "$@"; do
    if [[ "$arg" =~ ^[0-9]+$ ]]; then
        PORT=$arg
    elif [[ "$arg" == "--kill-port" ]]; then
        KILL_PORT=1
    fi
    # ignore unknown args
done

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Error: Python is not installed. Please install Python 3.x"
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "index.html" ] || [ ! -f "manifest.json" ]; then
    echo "❌ Error: Please run this script from the FollowUp project directory"
    exit 1
fi

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

# Function to generate QR code
generate_qr_display() {
    local url=$1
    echo ""
    echo "📱 QR Code for iPhone Access:"
    echo "┌─────────────────────────────────────────────────────────┐"
    echo "│                                                         │"
    echo "│  📱 FollowUp PWA - iPhone Access                       │"
    echo "│                                                         │"
    echo "│  🔗 URL to scan:                                       │"
    printf "│     %-45s │\n" "$url"
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
    printf "│     • Network: %-35s │\n" "$url"
    echo "│                                                         │"
    echo "└─────────────────────────────────────────────────────────┘"
    echo ""
}

# Check if port is in use
if lsof -i :$PORT | grep LISTEN &> /dev/null; then
    PID=$(lsof -t -i :$PORT)
    echo "⚠️  Port $PORT is already in use by process PID $PID."
    lsof -i :$PORT
    if [ "$KILL_PORT" = "1" ]; then
        echo "🔪 Killing process $PID..."
        kill $PID
        sleep 1
    else
        read -p "Do you want to kill this process? [y/N]: " yn
        case $yn in
            [Yy]*)
                echo "🔪 Killing process $PID..."
                kill $PID
                sleep 1
                ;;
            *)
                echo "❌ Aborting. Please free the port or use a different one."
                exit 1
                ;;
        esac
    fi
fi

LOCAL_IP=$(get_local_ip)

# Create a simple SSL certificate for HTTPS (required for PWA installation)
if [ ! -f "localhost.pem" ] || [ ! -f "localhost-key.pem" ]; then
    echo "🔐 Generating SSL certificate for HTTPS..."
    
    # Check if openssl is available
    if ! command -v openssl &> /dev/null; then
        echo "⚠️  Warning: OpenSSL not found. Using HTTP server instead."
        echo "   Note: PWA installation may not work properly without HTTPS"
        echo ""
        echo "🌐 Starting HTTP server on http://0.0.0.0:$PORT"
        echo "📱 Access from iPhone:"
        echo "   Local: http://localhost:$PORT"
        echo "   Network: http://$LOCAL_IP:$PORT"
        generate_qr_display "http://$LOCAL_IP:$PORT"
        echo "📱 To install as PWA:"
        echo "   1. Open http://$LOCAL_IP:$PORT in Safari on iPhone"
        echo "   2. Tap the share button 📤"
        echo "   3. Select 'Add to Home Screen'"
        echo ""
        $PYTHON_CMD -m http.server $PORT --bind 0.0.0.0
    else
        # Generate self-signed certificate
        openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        echo "🔐 SSL certificate generated successfully!"
        echo ""
        echo "🌐 Starting HTTPS server on https://0.0.0.0:$PORT"
        echo "📱 Access from iPhone:"
        echo "   Local: https://localhost:$PORT"
        echo "   Network: https://$LOCAL_IP:$PORT"
        generate_qr_display "https://$LOCAL_IP:$PORT"
        echo "📱 To install as PWA:"
        echo "   1. Open https://$LOCAL_IP:$PORT in Safari on iPhone"
        echo "   2. Accept the security warning (self-signed certificate)"
        echo "   3. Tap the share button 📤"
        echo "   4. Select 'Add to Home Screen'"
        echo ""
        echo "Press Ctrl+C to stop the server"
        echo ""
        
        # Start HTTPS server using Python with SSL (modern API) - bind to all interfaces
        $PYTHON_CMD -c "
import http.server
import ssl
import socketserver

class HTTPServer(socketserver.TCPServer):
    def __init__(self, server_address, RequestHandlerClass):
        super().__init__(server_address, RequestHandlerClass)
        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        context.load_cert_chain(certfile='localhost.pem', keyfile='localhost-key.pem')
        self.socket = context.wrap_socket(self.socket, server_side=True)

if __name__ == '__main__':
    PORT = $PORT
    Handler = http.server.SimpleHTTPRequestHandler
    with HTTPServer(('0.0.0.0', PORT), Handler) as httpd:
        print(f'Server running on https://0.0.0.0:{PORT}')
        print(f'Access from iPhone: https://$LOCAL_IP:{PORT}')
        httpd.serve_forever()
"
    fi
else
    echo "🔐 Using existing SSL certificate"
    echo ""
    echo "🌐 Starting HTTPS server on https://0.0.0.0:$PORT"
    echo "📱 Access from iPhone:"
    echo "   Local: https://localhost:$PORT"
    echo "   Network: https://$LOCAL_IP:$PORT"
    generate_qr_display "https://$LOCAL_IP:$PORT"
    echo "📱 To install as PWA:"
    echo "   1. Open https://$LOCAL_IP:$PORT in Safari on iPhone"
    echo "   2. Accept the security warning (self-signed certificate)"
    echo "   3. Tap the share button 📤"
    echo "   4. Select 'Add to Home Screen'"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Start HTTPS server using Python with SSL (modern API) - bind to all interfaces
    $PYTHON_CMD -c "
import http.server
import ssl
import socketserver

class HTTPServer(socketserver.TCPServer):
    def __init__(self, server_address, RequestHandlerClass):
        super().__init__(server_address, RequestHandlerClass)
        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        context.load_cert_chain(certfile='localhost.pem', keyfile='localhost-key.pem')
        self.socket = context.wrap_socket(self.socket, server_side=True)

if __name__ == '__main__':
    PORT = $PORT
    Handler = http.server.SimpleHTTPRequestHandler
    with HTTPServer(('0.0.0.0', PORT), Handler) as httpd:
        print(f'Server running on https://0.0.0.0:{PORT}')
        print(f'Access from iPhone: https://$LOCAL_IP:{PORT}')
        httpd.serve_forever()
"
fi 