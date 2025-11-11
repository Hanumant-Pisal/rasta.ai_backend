
const express = require('express');
const router = express.Router();
const { signup, login, getuser } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/signup', signup);
router.post('/login', login);


router.get('/user-info', authMiddleware, getuser);

module.exports = router;
