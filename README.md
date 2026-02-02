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

1. Start the MongoDB service:
   - On Windows: MongoDB should run as a service automatically after installation
   - On Linux/Mac: `sudo service mongod start`
   -Make sure to cloud MongoDB Like Atlas

2. Start the server:
```bash
cd server
node server.js
```

3. Start the client:
```bash
cd client
npm start
```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

5.Docker Build
-   docker-compose up --build

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
