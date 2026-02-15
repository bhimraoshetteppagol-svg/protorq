# ngrok Setup Guide for Internet Access

This guide will help you set up ngrok to make your application accessible from anywhere on the internet.

## Prerequisites

1. **Install ngrok**
   - Download from: https://ngrok.com/download
   - Or install via Chocolatey: `choco install ngrok`
   - Or install via npm: `npm install -g ngrok`

2. **Sign up for ngrok** (Free account)
   - Visit: https://dashboard.ngrok.com/signup
   - Create a free account

3. **Get your authtoken**
   - Visit: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy your authtoken

4. **Authenticate ngrok**
   ```powershell
   ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
   ```

## Quick Start

1. **Run the startup script:**
   ```powershell
   .\start-ngrok-simple.ps1
   ```

2. **The script will:**
   - Start your backend server (port 5000)
   - Start backend ngrok tunnel
   - Automatically detect backend ngrok URL
   - Start frontend with the backend URL configured
   - Start frontend ngrok tunnel
   - Display both URLs

3. **Access your app:**
   - Use the frontend ngrok URL shown in the script output
   - Share this URL with anyone to access from anywhere!

## Manual Setup (If Auto-Detection Fails)

If the script cannot auto-detect the ngrok URLs:

1. **Check ngrok windows:**
   - Backend ngrok window will show: `Forwarding https://xxxx.ngrok-free.app -> http://localhost:5000`
   - Frontend ngrok window will show: `Forwarding https://yyyy.ngrok-free.app -> http://localhost:7000`

2. **Set backend URL in frontend:**
   - In the frontend terminal window, run:
   ```powershell
   $env:REACT_APP_API_URL='https://xxxx.ngrok-free.app'
   ```
   - Then restart frontend (Ctrl+C, then `npm start`)

3. **Access your app:**
   - Use the frontend ngrok URL: `https://yyyy.ngrok-free.app`

## Important Notes

- **Free ngrok URLs change** every time you restart ngrok
- **Free tier has session limits** (8 hours, then resets)
- **For permanent URLs**, consider ngrok paid plans
- **HTTPS is included** - ngrok provides SSL certificates automatically

## Troubleshooting

### ngrok not found
- Make sure ngrok is installed and in your PATH
- Or place `ngrok.exe` in the project root directory

### Backend URL not detected
- Wait a few seconds for ngrok to start
- Check the ngrok window manually
- Visit http://127.0.0.1:4040 to see the backend URL

### Frontend can't connect to backend
- Make sure `REACT_APP_API_URL` is set to the backend ngrok URL
- Check browser console for CORS errors
- Verify backend ngrok tunnel is running

### CORS errors
- The backend CORS is configured to allow ngrok domains
- If you see CORS errors, check that the backend is running and ngrok tunnel is active

## Alternative: Using ngrok Config File

You can also use the `ngrok.yml` config file:

1. Update `ngrok.yml` with your authtoken
2. Start both tunnels:
   ```powershell
   ngrok start --all --config=ngrok.yml
   ```
3. Then start backend and frontend manually with the URLs

## Files Updated for ngrok Support

- `frontend/src/config/api.js` - Now handles ngrok URLs
- `backend/server.js` - CORS updated to allow ngrok domains
- `start-ngrok-simple.ps1` - Simple automated setup script

