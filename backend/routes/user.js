const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateJWT } = require('../middleware/auth');
const User = require('../models/User');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

// PUT /api/users/me - update profile (turista ili vlasnik)
router.put('/me', authenticateJWT, upload.single('profileImage'), async (req, res) => {
  const userId = req.user.id; // uzimamo id iz JWT-a
  const updateData = { ...req.body };

  // Ako je fajl uploadovan, dodaj putanju slike
  if(req.file) {
    updateData.profileImage = '/uploads/' + path.basename(req.file.path);
  }

  try {
    // update korisnika i vrati novi dokument
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    // vrati samo polja koja su relevantna za frontend
    const responseUser = {
      username: updatedUser.username,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      address: updatedUser.address,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      cardNumber: updatedUser.cardNumber,
      profileImage: updatedUser.profileImage
    };

    res.json(responseUser);
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Greška pri ažuriranju profila' });
  }
});

module.exports = router;
