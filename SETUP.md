# Quick Setup Guide

## Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

## Step 2: Setup Backend Environment

Create a `.env` file in the `backend` directory:

```
MONGODB_URI=mongodb://localhost:27017/mernapp
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
```

## Step 3: Start MongoDB

Make sure MongoDB is running on your system. If using MongoDB Atlas, update the `MONGODB_URI` in the `.env` file.

## Step 4: Seed Demo Users (Optional)

```bash
cd backend
npm run seed
```

This will create three demo users:
- admin@example.com / password123 (Admin)
- employee@example.com / password123 (Employee)
- user@example.com / password123 (User)

## Step 5: Start Backend Server

```bash
cd backend
npm start
# or for development:
npm run dev
```

Backend will run on `http://localhost:5000`

## Step 6: Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

## Step 7: Start Frontend Server

```bash
cd frontend
npm start
```

Frontend will automatically open on `http://localhost:7000`

## That's it!

You can now:
1. Navigate to `http://localhost:7000`
2. Login with any of the demo credentials
3. You'll be redirected to the appropriate dashboard based on your role

