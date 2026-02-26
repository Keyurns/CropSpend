# Expense Tracker Application

A full-stack expense tracking application built with React, Node.js, Express, and MongoDB. Features include user authentication, expense management, and data visualization.

## Features

- User Authentication (Login/Register)
- Expense Management (Add, View, Delete)
- Data Visualization with Charts
- Dark/Light Mode Toggle
- Responsive Design

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd expense-tracker
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

## Configuration

1. MongoDB Setup:
   - Install MongoDB from [MongoDB Official Website](https://www.mongodb.com/try/download/community)
   - Make sure MongoDB service is running
   - The application will automatically create the database named 'expense-tracker'

2. Environment Variables:
   - Create a `.env` file in the server directory
   - Add the following variables:
   ```
   PORT=5000
   JWT_SECRET=your-secret-key
   ```

## Running the Application

### 1. Start MongoDB

1. Make sure MongoDB is running (local service or Atlas cluster):
   - On Windows: MongoDB usually runs as a service after installation
   - On Linux/Mac: `sudo service mongod start`
   - Or use a cloud MongoDB instance like Atlas and point `MONGO_URI` to it

### 2. Start the Backend API (server)

```bash
cd server
npm install          # first time only
npm run dev          # development with nodemon
# or: npm start      # plain node server.js
```

The backend will be available at:

- `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

### 3. Start the Web Client (client)

```bash
cd client
npm install              # first time only
npm run start:legacy     # recommended on Windows
# or: npm start          # if this works without OpenSSL errors
```

The React app will open at:

- `http://localhost:3000`

The client is already configured to proxy API requests to `http://localhost:5000`.

### 4. Run the Mobile App (CorpSpendMobile)

1. Update the API base URL in `CorpSpendMobile/screens/LoginScreen.js` and `CorpSpendMobile/screens/AddExpenseScreen.js`:
   - Replace `192.168.1.XXX` with **your computer's local Wi‑Fi IP** (reachable from your phone), e.g.
     - `http://192.168.1.20:5000/api`
   - Make sure your phone and computer are on the **same Wi‑Fi network**.

2. Install and run the Expo app:

```bash
cd CorpSpendMobile
npm install        # first time only
npm run start      # or: npx expo start
```

3. Open the app:
   - Use the **Expo Go** app on your phone (scan the QR code), or
   - Use an Android emulator / iOS simulator.

After logging in on mobile, expenses will be sent to the same backend (`/api/expenses`) using the JWT token saved in `AsyncStorage`.

### 5. Docker (optional)

To build and run using Docker Compose:

```bash
docker-compose up --build
```

## Project Structure

```
expense-tracker/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # React components
│       ├── App.js         # Main application component
│       └── styles.css     # Global styles
├── server/                 # Node.js backend
│   ├── config/            # Configuration files
│   ├── models/            # MongoDB models
│   └── server.js          # Main server file
└── README.md
```

## API Endpoints

### Authentication
- POST `/api/register` - Register a new user
- POST `/api/login` - Login user

### Expenses (Protected Routes)
- GET `/api/expenses` - Get all expenses for the logged-in user
- POST `/api/expenses` - Add a new expense
- DELETE `/api/expenses/:id` - Delete an expense

## Technologies Used

- Frontend:
  - React
  - React Router
  - Axios
  - Chart.js
  - CSS3

- Backend:
  - Node.js
  - Express
  - MongoDB
  - Mongoose
  - JWT Authentication

- DevOps:
  - Docker
  - Docker Compose

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email [your-email] or open an issue in the repository.
