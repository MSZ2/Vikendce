const mongoose = require('mongoose');

const CottageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  coordinates: { lat: Number, lng: Number },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  images: [String],
  services: [String],
  pricePerNight: { type: Number },
  priceSummer: { type: Number, required: true },
  priceWinter: { type: Number, required: true },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now },
  maxGuests: { type: Number },
  unavailableDates: [Date],
  blockedUntil: { type: Date }
});

module.exports = mongoose.model('Cottage', CottageSchema, "cottages");
