const jwt = require('jsonwebtoken');

exports.authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if(!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Authenticated user:", payload); 
    req.user = payload; // { id, username, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    console.log("Authorizing roles:", allowedRoles, "for user:", req.user);
    if(!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if(!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
};
