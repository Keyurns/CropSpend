CROPSpend Enterprise Expense Management
CROPSpend is a full-stack, cross-platform expense management system designed for modern enterprises. It features a React Web Dashboard for managers, a React Native Mobile App for on-the-go employees, and a unified Node.js/MongoDB backend.

The system includes AI-powered receipt scanning, strict Identity and Access Management (IAM), dynamic theming, and automated email notifications.

 Key Features
 Identity & Access Management (IAM)
ID Verification: New users must upload a government/company ID proof during registration.

Admin Quarantine: New accounts are placed in a "Pending" state and cannot log in until reviewed.

Role-Based Access Control (RBAC): Three distinct tiers (Admin, Manager, Employee) with protected routes.

Admin Control Panel: Dedicated screens (Web & Mobile) to review ID proofs, assign roles, and approve/reject users.

 Smart Receipt Scanning (OCR)
Mobile Camera Integration: Snap receipts directly using the Expo Camera.

Image Optimization: Auto-resizes heavy images before uploading to save bandwidth and speed up processing.

AI Extraction: Uses OCR.space API to intelligently extract the Merchant Name, Total Amount, and automatically categorize the expense (e.g., Food, Travel, Equipment).

 Expense & Budget Tracking
Multi-Currency Support: Log expenses in INR, USD, EUR, or GBP.

Dynamic Dashboards: Employees see their personal monthly spending; Managers see company-wide totals.

AI Anomaly Detection: Flags suspicious transactions with high amounts or unusual categories for strict manager review.

Approval Workflow: Managers can Approve or Reject expenses. Rejections trigger a prompt for a "Reason."

Automated Communications
NodeMailer Integration: Sends automated emails via Gmail (using secure App Passwords).

Status Updates: Employees receive instant email notifications when their expense is approved or rejected (including the manager's reason).

Modern UI/UX
Cross-Platform Theme Engine: Global Dark/Light mode toggle that syncs instantly across Web and Mobile.

Pull-to-Refresh: Native mobile gesture to fetch live data.

Cloudinary Profiles: Users can upload profile pictures via their phone gallery or web browser.

Tech Stack
Frontend (Web):

React.js

Tailwind CSS

Context API (State & Theme Management)

Frontend (Mobile):

React Native (Expo)

React Navigation (Stack)

Expo Image Picker & Manipulator

AsyncStorage

Backend:

Node.js & Express.js

MongoDB & Mongoose

Cloudinary & Multer (Image Storage)

NodeMailer (Email Services)

JSON Web Tokens (JWT) & Bcrypt

Project Structure
Plaintext
CROPSpend/
├── server/                 # Node.js/Express Backend
│   ├── models/             # Mongoose Schemas (User, Expense)
│   ├── routes/             # API Endpoints (Auth, Users, Expenses)
│   ├── middleware/         # JWT Auth & Multer/Cloudinary upload
│   └── server.js           # Entry point
├── web/                    # React Web Application
│   ├── src/components/     # UI Components & Pages
│   └── src/context/        # ThemeContext
└── CorpSpendMobile/        # React Native Mobile App
    ├── screens/            # App Screens (Login, Dashboard, Admin)
    ├── scripts/            # Auto-IP generation scripts
    └── App.js              # Mobile Entry & Navigation
Installation & Setup
Prerequisites
Node.js installed

MongoDB connection URI (Atlas or Local)

Cloudinary Account (Cloud Name, API Key, API Secret)

Gmail Account with an "App Password" generated for NodeMailer

1. Backend Setup
Bash
cd server
npm install
Create a .env file in the server directory:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_16_digit_google_app_password
Start the backend:

Bash
npm start
2. Web Frontend Setup
Bash
cd web
npm install
npm start
3. Mobile App Setup
Bash
cd CorpSpendMobile
npm install
Important: The mobile app needs to know your laptop's local IP address to talk to the backend. We created a script for this!

Bash
# This detects your IP, creates Config.js, and starts Expo
npm start
Scan the QR code with the Expo Go app on your physical iOS or Android device. (Ensure your phone and laptop are on the same Wi-Fi network).

Default Admin Access
To access the IAM Control Panel upon first launch, register a new user. Then, access your MongoDB database and manually change that user's role to admin and status to Approved. From then on, you can approve all other users directly from the Admin Dashboard!