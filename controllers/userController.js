const User = require('../models/User.model');



exports.getAllMembers = async (req, res, next) => {
  console.log('Fetching all members...');
  try {
  
    if (!User || typeof User.find !== 'function') {
      console.error('User model is not properly initialized');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    
    const members = await User.find({
      $or: [
        { role: 'member' },
        { role: { $exists: false } } 
      ]
    })
    .select('-password -__v -createdAt -updatedAt')
    .sort({ name: 1 })
    .lean(); 

    console.log(`Found ${members.length} members`);
    
    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    console.error('Error in getAllMembers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching members',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


exports.deleteMember = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

   
    await User.deleteOne({ _id: user._id });

    res.status(200).json({
      success: true,
      data: {},
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
