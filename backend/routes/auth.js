const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require('../middleware/upload');

// Public login for tourist / owner
router.post('/login', (req, res, next) => {
  req.isAdminLogin = false;
  next();
}, authController.login);

// Admin login — different route, not linked publicly
router.post('/admin/login', (req, res, next) => {
  req.isAdminLogin = true;
  next();
}, authController.login);

// Optional: register route (remove or protect in production)
router.post('/register', upload.single('profileImage'), authController.register);

module.exports = router;
