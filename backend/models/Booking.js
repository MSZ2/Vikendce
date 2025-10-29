const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  cottage: { type: mongoose.Schema.Types.ObjectId, ref: 'Cottage', required: true },
  tourist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending','approved','cancelled','rejected'], default: 'pending' },
  rating: Number,
  comment: String,
  adults: { type: Number, default: 1 },
  children: { type: Number, default: 0 },
  note: { type: String, maxlength: 500 },
  ownerComment: { type: String, maxlength: 500 },
  cardLast4: String,
  totalPrice: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Booking', BookingSchema, "bookings");
