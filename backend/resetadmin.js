const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User'); 

mongoose.connect('mongodb://localhost:27017/minisocial')
  .then(() => console.log('DB connected'))
  .catch(err => console.log(err));

async function resetAdminPassword() {
  const newPassword = 'admin123'; 
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const result = await User.updateOne(
    { email: 'itzmedev.off@gmail.com' },
    { $set: { password: hashedPassword } }
  );
  console.log('Password updated:', result);
  mongoose.disconnect();
}

resetAdminPassword();