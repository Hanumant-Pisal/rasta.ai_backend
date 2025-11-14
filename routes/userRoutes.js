const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllMembers,
  deleteMember
} = require('../controllers/userController');


const isOwner = (req, res, next) => {
  if (req.user && req.user.role === 'owner') {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Not authorized to access this route. Owner role required.' 
  });
};


router.use(authMiddleware);


router.get('/members', isOwner, getAllMembers);
router.delete('/members/:id', isOwner, deleteMember);

module.exports = router;
