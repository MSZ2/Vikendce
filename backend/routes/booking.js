const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

router.get('/me', authenticateJWT, bookingController.getTouristBookings);
router.get('/owner', authenticateJWT, bookingController.getOwnerReservations);
router.patch('/:id/cancel', authenticateJWT, bookingController.cancelBooking);
router.post('/:id/review', authenticateJWT, bookingController.submitReview);
router.patch('/:id/status', authenticateJWT, bookingController.updateBookingStatus);

module.exports = router;
