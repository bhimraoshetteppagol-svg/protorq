# MongoDB Configuration

## Connection String Setup

The MongoDB connection string has been configured to use:
- **Database**: Protorq
- **Collection**: users (will be created automatically)

## Important: Update Your Password

The connection string currently has `<user1>` as a placeholder for the password. You need to replace it with your actual MongoDB password.

### Option 1: Update in server.js directly

Edit `backend/server.js` and replace `<user1>` with your actual password:

```javascript
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://user1:YOUR_ACTUAL_PASSWORD@evolutionapi.ipbubyl.mongodb.net/Protorq?appName=EvolutionAPI';
```

### Option 2: Use .env file (Recommended)

Create a `.env` file in the `backend` directory:

```
MONGODB_URI=mongodb+srv://user1:YOUR_ACTUAL_PASSWORD@evolutionapi.ipbubyl.mongodb.net/Protorq?appName=EvolutionAPI
JWT_SECRET=your-secret-key
PORT=5000
```

**Note**: If your password contains special characters, you may need to URL encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- etc.

## After Updating the Password

Run the seed script to create the users:

```bash
cd backend
npm run seed
```

This will create:
1. admin@example.com / password: 123 / role: admin
2. employee@example.com / password: 123 / role: employee
3. user@example.com / password: 123 / role: user

## Database Structure

- **Database Name**: Protorq
- **Collection Name**: users
- **Schema**:
  - email (String, required, unique)
  - password (String, required, hashed)
  - role (String, enum: ['admin', 'employee', 'user'])

