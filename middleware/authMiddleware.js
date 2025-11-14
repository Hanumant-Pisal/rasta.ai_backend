const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false,
      message: "Authorization token missing" 
    });
  }

  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    

    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

   
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role || 'member' 
    };

    next();
  } catch (err) {
    console.error("authMiddleware error", err);
    return res.status(401).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
};

module.exports = authMiddleware;
