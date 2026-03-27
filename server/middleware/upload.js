const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'corpspend_id_proofs', // A dedicated folder in your Cloudinary account
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Block invalid files
    transformation: [{ width: 800, crop: 'limit' }] // Compress the image automatically
  },
});

const upload = multer({ storage: storage });

module.exports = upload;