require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const homeRoutes = require('./routes/home');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const cottageRoutes = require('./routes/cottage');
const path = require('path');
const usersRouter = require('./routes/user');
const bookingsRouter = require('./routes/booking');
Admin = require('./models/Admin');
const bcrypt = require('bcrypt');


//DODAVANJE ADMINA
async function createInitialAdmins() {
  try {
    const admins = [
      { username: 'superadmin', password: 'Abc123!@' },
      { username: 'admin2', password: 'Xyz789$%' }
    ];

    for (let a of admins) {
      const exists = await Admin.findOne({ username: a.username });
      if (exists) continue;

      const admin = new Admin({ username: a.username });
      const salt = await bcrypt.genSalt(10);
      admin.passwordHash = await bcrypt.hash(a.password, salt);
      await admin.save();

      console.log(`Admin ${a.username} kreiran`);
    }
  } catch (err) {
    console.error('Greška pri kreiranju admina:', err);
  }
}





//

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors()); // configure origin in production
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/home', homeRoutes);
app.use('/api/cottage', cottageRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // statičke slike
app.use('/api/users', usersRouter);
app.use('/api/bookings', bookingsRouter);

connectDB(process.env.MONGO_URI).then(() => {
    createInitialAdmins();
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
});
