const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require("../../config/db");

const authenticateUser = async (email, password, res) => {
    try {
        const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = users[0];

        const timer = 60 * 60 * 1000 * 8; // 8 hours

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ _id: user.id, dept_name: user.dept_name }, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.cookie('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: timer, sameSite: 'Strict'  });
        return res.json({ message: 'Login successful' });
    } catch (error) {
        console.error("Error during authentication:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Database query failed" });
        };
    }
};

const login = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    authenticateUser(email, password, res);
};

// New logout function
const logout = (req, res) => {
    res.clearCookie('jwt', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    return res.json({ message: 'Logout successful' });
};

module.exports = {
    login,
    logout
};