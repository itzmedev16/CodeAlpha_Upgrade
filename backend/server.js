require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/minisocial';
mongoose.connect(MONGODB_URI)
.then(async () => {
  console.log('MongoDB Connected');
  const User = require('./models/User');
  const bcrypt = require('bcrypt');
  try {
    const adminExists = await User.findOne({ email: 'itzmedev.off@gmail.com' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('itzmedev$$@', salt);
      
      const admin = new User({
        username: 'admin',
        email: 'itzmedev.off@gmail.com',
        password: hashedPassword,
        name: 'Administrator',
        role: 'admin',
        bio: 'Master Admin'
      });      
      await admin.save();
      console.log('Admin account securely seeded to MongoDB');
    }
  } catch(e) {
    console.error('Error seeding admin:', e);
  }

  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
})
.catch(err => console.error('MongoDB connection error:', err));
