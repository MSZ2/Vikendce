const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({  
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }, // bcrypt hash
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, enum: ['M', 'F'], required: true },
    address: String,
    phone: String,
    email: { type: String, unique: true, required: true },
    profileImage: String, // path to uploaded file
    cardNumber: String,
    role: { type: String, enum: ['owner', 'tourist'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

// virtual for password set (helper)
UserSchema.methods.setPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(password, salt);
};

UserSchema.methods.verifyPassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports =mongoose.model('User', UserSchema, "users");
