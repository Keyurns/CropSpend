const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { register, login, getUsers } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/users', auth, getUsers);

module.exports = router;