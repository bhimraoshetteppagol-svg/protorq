# Using ngrok to Access Application from Internet

This guide explains how to use ngrok to make your application accessible from anywhere on the internet.

## Prerequisites

1. **Install ngrok:**
   - Download from: https://ngrok.com/download
   - Extract `ngrok.exe` to a folder
   - Add to PATH or use full path

2. **Sign up for ngrok (free):**
   - Visit: https://dashboard.ngrok.com/signup
   - Create a free account
   - Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

3. **Authenticate ngrok:**
   ```powershell
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

## Setup

1. **Update `ngrok.yml`:**
   - Open `ngrok.yml` in the project root
   - Replace `YOUR_AUTH_TOKEN_HERE` with your actual ngrok authtoken

2. **Start the application:**
   ```powershell
   .\start-with-ngrok.ps1
   ```

## How It Works

1. The script starts your backend server on port 5000
2. The script starts your frontend server on port 7000
3. ngrok creates secure tunnels for both:
   - Backend tunnel: `https://xxxx-xxxx.ngrok-free.app` → `localhost:5000`
   - Frontend tunnel: `https://xxxx-xxxx.ngrok-free.app` → `localhost:7000`

4. The frontend automatically detects the backend ngrok URL and uses it

## Accessing the Application

- **Local access:** `http://localhost:7000` (works as before)
- **Internet access:** Use the frontend ngrok URL shown in the script output
- **ngrok web interface:** `http://localhost:4040` (shows all tunnel URLs)

## Important Notes

1. **Free ngrok limitations:**
   - URLs change each time you restart ngrok (unless you use a static domain)
   - Limited connections per minute
   - For production, consider ngrok paid plans or static domains

2. **Environment Variable:**
   - The script automatically sets `REACT_APP_API_URL` with the backend ngrok URL
   - If you restart manually, you may need to set it:
     ```powershell
     $env:REACT_APP_API_URL = "https://your-backend-url.ngrok-free.app"
     ```

3. **Security:**
   - ngrok provides HTTPS automatically
   - Your application is accessible to anyone with the URL
   - Make sure authentication is working properly

## Troubleshooting

1. **ngrok not found:**
   - Make sure ngrok is in your PATH
   - Or update the script with the full path to ngrok.exe

2. **CORS errors:**
   - Backend CORS is configured to allow ngrok URLs
   - If you see CORS errors, check the backend console

3. **API not connecting:**
   - Verify `REACT_APP_API_URL` is set correctly
   - Check ngrok web interface at `http://localhost:4040`
   - Ensure backend ngrok tunnel is running

## Alternative: Using ngrok Static Domain (Recommended)

For a permanent URL that doesn't change:

1. Sign up for ngrok account
2. Get a free static domain from ngrok dashboard
3. Update `ngrok.yml`:
   ```yaml
   tunnels:
     backend:
       addr: 5000
       proto: http
       bind_tls: true
       hostname: your-backend-domain.ngrok-free.app
     frontend:
       addr: 7000
       proto: http
       bind_tls: true
       hostname: your-frontend-domain.ngrok-free.app
   ```

This way, your URLs stay the same every time!

