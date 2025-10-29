const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const { authenticateJWT } = require('../middleware/auth');

router.get('/', homeController.getCottages);
router.get('/:id', homeController.getCottageDetails);
router.post('/:id/bookings', authenticateJWT, homeController.scheduleBooking);

module.exports = router;
