const mongoose = require('mongoose');

const RejectedCredentialSchema = new mongoose.Schema({
  username: { type: String, lowercase: true, unique: true },
  email: { type: String, lowercase: true, unique: true },
  reason: String,
  rejectedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('RejectedCredential', RejectedCredentialSchema, 'rejected_credentials');
