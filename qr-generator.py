#!/usr/bin/env python3
"""
Simple QR Code Generator for PWA Access
"""

import sys
import subprocess
import os

def get_local_ip():
    """Get local IP address"""
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

def generate_simple_qr_code(url):
    """Generate a simple ASCII QR code representation"""
    qr = f"""
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  📱 FollowUp PWA - iPhone Access                       │
│                                                         │
│  🔗 URL to scan:                                       │
│     {url:<45} │
│                                                         │
│  📋 Instructions:                                      │
│     1. Open Safari on iPhone                          │
│     2. Type the URL above                             │
│     3. Accept security warning                        │
│     4. Tap share button 📤                            │
│     5. Select "Add to Home Screen"                    │
│                                                         │
│  🌐 Alternative:                                       │
│     • Local:  https://localhost:8000                  │
│     • Network: {url:<35} │
│                                                         │
└─────────────────────────────────────────────────────────┘
"""
    return qr

def check_venv_exists():
    """Check if virtual environment exists and has qrcode installed"""
    venv_python = "venv/bin/python"
    venv_pip = "venv/bin/pip"
    
    if not os.path.exists(venv_python):
        return False, "venv does not exist"
    
    # Check if qrcode is installed in venv
    try:
        result = subprocess.run([venv_python, "-c", "import qrcode"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            return True, "venv exists with qrcode"
        else:
            return True, "venv exists but no qrcode"
    except Exception:
        return True, "venv exists but can't check qrcode"

def setup_venv():
    """Setup virtual environment and install qrcode"""
    venv_exists, status = check_venv_exists()
    
    if venv_exists and "with qrcode" in status:
        print("✅ Using existing virtual environment with qrcode installed")
        return True
    
    if venv_exists and "no qrcode" in status:
        print("📦 Virtual environment exists, installing qrcode...")
        try:
            result = subprocess.run(["venv/bin/pip", "install", "qrcode[pil]"], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print("✅ Successfully installed qrcode in existing venv")
                return True
            else:
                print("❌ Failed to install qrcode in existing venv:")
                print(result.stderr)
                return False
        except Exception as e:
            print(f"❌ Error installing qrcode: {e}")
            return False
    
    # Create new venv
    print("🔧 Creating new virtual environment...")
    try:
        subprocess.check_call(["python3", "-m", "venv", "venv"])
        print("📦 Installing qrcode in new venv...")
        result = subprocess.run(["venv/bin/pip", "install", "qrcode[pil]"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Successfully created venv and installed qrcode")
            return True
        else:
            print("❌ Failed to install qrcode in new venv:")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"❌ Failed to create virtual environment: {e}")
        return False

def generate_qr_code(url):
    """Generate QR code using qrcode library or fallback to ASCII"""
    try:
        # Try to use venv's qrcode if available
        venv_exists, status = check_venv_exists()
        if venv_exists and "with qrcode" in status:
            # Use venv's Python to generate QR code
            qr_code_script = f"""
import qrcode
qr = qrcode.QRCode(version=1, box_size=1, border=2)
qr.add_data('{url}')
qr.make(fit=True)
matrix = qr.get_matrix()
result = ''
for row in matrix:
    for cell in row:
        result += '██' if cell else '  '
    result += '\\n'
print(result, end='')
"""
            result = subprocess.run(["venv/bin/python", "-c", qr_code_script],
                                  capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout
            else:
                print("⚠️  Failed to generate QR code with venv, using fallback")
                return generate_simple_qr_code(url)
        
        # Try to import qrcode directly (if installed globally)
        import qrcode
        qr = qrcode.QRCode(version=1, box_size=1, border=2)
        qr.add_data(url)
        qr.make(fit=True)
        qr_matrix = qr.get_matrix()
        ascii_qr = ""
        for row in qr_matrix:
            for cell in row:
                ascii_qr += "██" if cell else "  "
            ascii_qr += "\n"
        return ascii_qr
    except ImportError:
        # Try to setup venv automatically
        print("📦 qrcode package not found. Setting up virtual environment...")
        if setup_venv():
            # Re-run the function to use the venv
            return generate_qr_code(url)
        else:
            print("⚠️  Could not setup virtual environment. Using fallback QR code.")
            return generate_simple_qr_code(url)

def main():
    port = 8000
    local_ip = get_local_ip()
    url = f"https://{local_ip}:{port}"
    
    print("🔗 PWA Access URL:")
    print(f"   {url}")
    print()
    print("📱 QR Code for iPhone:")
    print(generate_qr_code(url))
    print()
    print("💡 Instructions:")
    print("   1. Make sure your iPhone is on the same WiFi network")
    print("   2. Scan the QR code or manually enter the URL")
    print("   3. Accept the security warning (self-signed certificate)")
    print("   4. Tap the share button 📤 and select 'Add to Home Screen'")

if __name__ == "__main__":
    main() 