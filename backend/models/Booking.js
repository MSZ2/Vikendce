const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  cottage: { type: mongoose.Schema.Types.ObjectId, ref: 'Cottage', required: true },
  tourist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending','approved','cancelled'], default: 'pending' },
  rating: Number,
  comment: String
});

module.exports = mongoose.model('Booking', BookingSchema, "bookings");
