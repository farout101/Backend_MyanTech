const express = require('express');
const { body } = require('express-validator');
const { login, logout } = require('../controllers/authController');

const router = express.Router();

router.post(
    '/login',
    body('email').isEmail(),
    body('password').notEmpty(),
    login
);
router.post('/logout', logout)



module.exports = router;