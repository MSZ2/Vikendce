const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Admin = require('../models/Admin');
const RejectedCredential = require('../models/RejectedCredential');
const path = require('path');

// ---------- POMOĆNE FUNKCIJE ----------
//const passwordRegex = /^[A-Za-z](?=(?:.*[a-z]){3,})(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{5,9}$/;
//const passwordRegex = /^(?=[a-zA-Z])(?=.[0-9])(?=.[!@#$%^&])(?=.[A-Z])(?=.[a-z].[a-z].*[a-z]).{6,10}$/
//const passwordRegex = /^[A-Za-z](?=.*\d)(?=(?:.*[a-z]){3,})(?=.*[A-Z])(?=.*[!@#$%^&*]).{5,9}$/
//REGEX TO DO
const passwordRegex = /^[A-Za-z](?=(?:.*[a-z]){3,})(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z]\S{5,9}$/;
const validateCard = (number) => {
  if (/^(300|301|302|303|36|38)\d{12}$/.test(number)) return 'diners';
  if (/^(51|52|53|54|55)\d{14}$/.test(number)) return 'mastercard';
  if (/^(4539|4556|4916|4532|4929|4485|4716)\d{12}$/.test(number)) return 'visa';
  return null;
};

// ---------- TOKEN FUNKCIJA ----------
const signToken = (user, JWT_SECRET, expiresIn) => {
  return jwt.sign({
    id: user._id,
    username: user.username,
    role: user.role
  }, JWT_SECRET, { expiresIn });
};

// ---------- LOGIN ----------
exports.login = async (req, res) => {
    if (!req.isAdminLogin) {
      const { username, password } = req.body;
      if(!username || !password)
          return res.status(400).json({ message: 'Username and password required' });

      const user = await User.findOne({ username });
          if(!user) return res.status(401).json({ message: 'Неправилно корисничко име или лозинка' });

      const ok = await user.verifyPassword(password);
          if(!ok) return res.status(401).json({ message: 'Неправилно корисничко име или лозинка' });

      if(user.status !== 'approved')
          return res.status(403).json({ message: 'Налог још није одобрен од администратора' });

      const token = signToken(user, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '7d');
      res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
    } else {
        const { username, password } = req.body;
        if(!username || !password)
            return res.status(400).json({ message: 'Username and password required' });

        const admin = await Admin.findOne({ username });
            if(!admin) return res.status(401).json({ message: 'Неправилно корисничко име' });

        const ok = await admin.verifyPassword(password);
            if(!ok) return res.status(401).json({ message: 'Неправилна лозинка' });
        const token = signToken({username: admin.username, password:admin.passwordHash, role: "admin"}, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '7d');
      res.json({ token, user: { id: admin._id, username: admin.username, role: "admin"} });


  };
} 
// ---------- REGISTRACIJA ВЛАСНИКА/ТУРИСТЕ ----------
exports.register = async (req, res) => {
  try {
    const { username, password, firstName, lastName, gender, address, phone, email, role, cardNumber } = req.body;
    const file = req.file;

    // osnovne provere
    if (!username || !password || !firstName || !lastName || !gender || !email || !role)
      return res.status(400).json({ message: 'Недостају обавезна поља' });

    if (!['owner', 'tourist'].includes(role))
      return res.status(400).json({ message: 'Неважећа улога' });

    console.log(passwordRegex.test(password))
    if (!passwordRegex.test(password))
      return res.status(400).json({ message: 'Лозинка није у исправном формату' });

    if (cardNumber && !validateCard(cardNumber))
      return res.status(400).json({ message: 'Неисправан број картице' });

    const rejected = await RejectedCredential.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    });
    if(rejected) {
      return res.status(409).json({ message: 'Ово корисничко име или имејл су одбијени и не могу се користити.' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser)
      return res.status(409).json({ message: 'Корисничко име или имејл већ постоји' });

    const hashed = await bcrypt.hash(password, 10);

    let imagePath = 'uploads/default.png';
    if (file) {
      imagePath = 'uploads/' + path.basename(file.path);
    }

    const user = new User({
      username,
      password: hashed,
      firstName,
      lastName,
      gender,
      address,
      phone,
      email,
      profileImage: imagePath,
      cardNumber,
      role,
      status: 'pending'
    });

    await user.save();
    res.status(201).json({ message: 'Захтев за регистрацију послат, чека одобрење администратора.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Грешка на серверу' });
  }
};
