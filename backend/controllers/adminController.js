const User = require('../models/User');

// get all users (for admin panel)
exports.getAllUsers = async (req, res) => {
    console.log("Getting all users");
  const users = await User.find({});
  res.json(users);
};

// change user status
exports.updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status))
    return res.status(400).json({ message: 'Invalid status' });

  const user = await User.findByIdAndUpdate(id, { status }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json(user);
};

