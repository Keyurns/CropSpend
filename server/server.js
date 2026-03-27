const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// --- NEW IMPORTS FOR SEEDING ---
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const app = express();

dotenv.config();

app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/auditlogs', require('./routes/auditLogs'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

const PORT = process.env.PORT || 5000;

// --- THE ONLY HARDCODED ACCOUNT (ROOT ADMIN) ---
const createInitialAdmin = async () => {
  try {
      // Check if your specific admin account already exists
      const adminExists = await User.findOne({ email: 'your.real.email@gmail.com' }); // PUT YOUR GMAIL HERE
      
      if (!adminExists) {
          console.log("Generating the permanent Root Admin...");
          const salt = await bcrypt.genSalt(10);
          
          // PUT YOUR PERMANENT PASSWORD HERE
          const hashedPassword = await bcrypt.hash('CropSpend123', salt); 

          const superAdmin = new User({
              username: 'System Administrator',
              email: 'cropspend@gmail.com', // PUT YOUR GMAIL HERE
              password: hashedPassword,
              department: 'Administration',
              role: 'admin',
              status: 'Active' // Instantly active so you can log in
          });

          await superAdmin.save();
          console.log("✅ Root Admin created successfully.");
      }
  } catch (err) {
      console.error("Failed to seed Root Admin:", err);
  }
};

// --- CONNECT TO DB AND START SERVER ---
connectDB(async () => {
// Run this once to ensure you have the keys to the castle
await createInitialAdmin(); 

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
});