const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');


router.get('/users', authenticateJWT, adminController.getAllUsers);
router.put('/users/:id/status', authenticateJWT, adminController.updateUserStatus);

//router.get('/users', authenticateJWT, adminController.getAllUsers);
//router.put('/users/:id/status', authenticateJWT, adminController.updateUserStatus);

module.exports = router;