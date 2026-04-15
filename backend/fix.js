const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/minisocial')
.then(async () => {
    console.log('Fixing DB...');
    await mongoose.connection.db.collection('users').deleteOne({ username: 'admin' });
    console.log('Deleted old admin');
    process.exit(0);
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
