const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const splitToken = token.split(' ')[1];
    if (!splitToken) {
      return res.status(401).json({ message: 'Token format invalid' });
    }
    
    const decoded = jwt.verify(splitToken, process.env.JWT_SECRET || 'secret123');
    req.user = { id: decoded.user.id };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
