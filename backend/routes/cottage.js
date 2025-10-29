const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const homeController = require('../controllers/homeController');
const cottageController = require('../controllers/cottageController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

router.get('/', homeController.getCottages);
router.get('/owner/me', authenticateJWT, cottageController.getOwnerCottages);
router.get('/admin', authenticateJWT, authorizeRoles('admin'), cottageController.getAllCottagesForAdmin);
router.get('/:id', homeController.getCottageDetails);
router.post('/:id/bookings', authenticateJWT, homeController.scheduleBooking);
router.put('/:id', authenticateJWT, cottageController.updateCottage);
router.delete('/:id', authenticateJWT, cottageController.deleteCottage);
router.post('/', authenticateJWT, upload.array('images', 10), cottageController.createCottage);
router.patch('/:id/block', authenticateJWT, authorizeRoles('admin'), cottageController.blockCottage);

module.exports = router;
