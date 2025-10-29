const bcrypt = require('bcryptjs');
const User = require('../models/User');
const RejectedCredential = require('../models/RejectedCredential');

const passwordRegex = /^[A-Za-z](?=(?:.*[a-z]){3,})(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z]\S{5,9}$/;

exports.getAllUsers = async (req, res) => {
  const [owners, tourists, pending] = await Promise.all([
    User.find({ role: 'owner' }).lean(),
    User.find({ role: 'tourist' }).lean(),
    User.find({ status: 'pending' }).lean()
  ]);

  res.json({ owners, tourists, pending });
};

exports.createUser = async (req, res) => {
  const {
    username,
    password,
    firstName,
    lastName,
    gender,
    address,
    phone,
    email,
    role,
    cardNumber,
    status = 'approved'
  } = req.body;

  if(!username || !password || !firstName || !lastName || !gender || !email || !role) {
    return res.status(400).json({ message: 'Недостају обавезна поља.' });
  }

  if(!['owner', 'tourist'].includes(role)) {
    return res.status(400).json({ message: 'Неважећа улога.' });
  }

  if(!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Лозинка није у исправном формату.' });
  }

  const blacklistHit = await RejectedCredential.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
  });
  if(blacklistHit) {
    return res.status(409).json({ message: 'Ово корисничко име или имејл су одбијени и не могу се поново користити.' });
  }

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if(existingUser) {
    return res.status(409).json({ message: 'Корисничко име или имејл већ постоји.' });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    password: hashed,
    firstName,
    lastName,
    gender,
    address,
    phone,
    email,
    role,
    cardNumber,
    status
  });

  res.status(201).json(user);
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const allowedFields = ['firstName', 'lastName', 'gender', 'address', 'phone', 'email', 'cardNumber', 'role'];
  const updates = {};

  allowedFields.forEach(field => {
    if(req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(id, updates, { new: true });
  if(!user) {
    return res.status(404).json({ message: 'Корисник није пронађен.' });
  }

  res.json(user);
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const deleted = await User.findByIdAndDelete(id);
  if(!deleted) {
    return res.status(404).json({ message: 'Корисник није пронађен.' });
  }
  res.json({ message: 'Корисник је обрисан.' });
};

exports.updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if(!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Неисправан статус.' });
  }

  const user = await User.findById(id);
  if(!user) {
    return res.status(404).json({ message: 'Корисник није пронађен.' });
  }

  user.status = status;
  if(status === 'rejected') {
    try {
      await RejectedCredential.updateOne(
        { $or: [{ username: user.username.toLowerCase() }, { email: user.email.toLowerCase() }] },
        { username: user.username.toLowerCase(), email: user.email.toLowerCase(), reason: reason || 'Одбијена регистрација' },
        { upsert: true }
      );
    } catch (err) {
      console.error('RejectedCredential upsert failed', err);
    }
  }

  await user.save();
  res.json(user);
};
