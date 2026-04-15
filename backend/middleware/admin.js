const User = require('../models/User');
module.exports = async function (req, res, next) {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: You must be an administrator' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error in admin verification' });
  }
};