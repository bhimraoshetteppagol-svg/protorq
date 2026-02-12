# MERN Application

A full-stack MERN (MongoDB, Express, React, Node.js) application with role-based authentication.

## Features

- Login page with overlay design
- Admin Dashboard
- Employee Dashboard
- User Dashboard
- Role-based routing and access control

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```
MONGODB_URI=mongodb://localhost:27017/mernapp
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
```

4. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```

The frontend will run on `http://localhost:7000`

## Default Users

You can create users via the registration endpoint or directly in MongoDB. For testing, you can use these demo credentials (create them first):

- **Admin**: admin@example.com / password123
- **Employee**: employee@example.com / password123
- **User**: user@example.com / password123

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

## Project Structure

```
.
├── backend/
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── auth.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Admin.js
│   │   │   ├── Employee.js
│   │   │   └── User.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

