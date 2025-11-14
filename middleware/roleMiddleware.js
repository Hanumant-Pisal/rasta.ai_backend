const Project = require("../models/Project.model");
const User = require("../models/User.model");

const roleMiddleware = async (req, res, next) => {
  try {
    
    const projectId = req.params.id || req.params.projectId || 
                     (req.body && req.body.projectId) || 
                     (req.query && req.query.projectId);
    
    console.log('Role Middleware - Project ID:', projectId);
    console.log('User ID:', req.user?.id);

    if (!projectId) {
      return res.status(400).json({ 
        success: false,
        message: "Project ID is required" 
      });
    }

   
    const project = await Project.findById(projectId)
      .populate('members', '_id')
      .populate('createdBy', '_id')
      .lean();

    if (!project) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ 
        success: false,
        message: "Project not found" 
      });
    }

    const userId = req.user?.id?.toString();
    if (!userId) {
      console.log('No user ID in request');
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    
    const normalizeId = (id) => {
      if (!id) return null;
      return id._id ? id._id.toString() : id.toString();
    };

    
    const createdById = normalizeId(project.createdBy);
    if (createdById === userId) {
      console.log('User is project owner');
      req.userRole = 'owner';
      req.project = project;
      return next();
    }

    
    const isMember = project.members && project.members.some(member => {
      const memberId = normalizeId(member);
      return memberId === userId;
    });
    
    if (isMember) {
      console.log('User is project member');
      req.userRole = 'member';
      req.project = project;
      return next();
    }

    console.log('Access denied - User is not a member');
    return res.status(403).json({ 
      success: false,
      message: "You don't have permission to access this project" 
    });

  } catch (error) {
    console.error("roleMiddleware error:", {
      message: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body,
      query: req.query,
      user: req.user
    });
    return res.status(500).json({ 
      success: false,
      message: "Permission check failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const isOwner = (req, res, next) => {
  if (req.userRole === 'owner') {
    return next();
  }
  return res.status(403).json({ 
    success: false,
    message: "Only project owners can perform this action" 
  });
};


const isMember = (req, res, next) => {
  if (req.userRole === 'member' || req.userRole === 'owner') {
    return next();
  }
  return res.status(403).json({ 
    success: false,
    message: "You need to be a member to perform this action" 
  });
};

module.exports = { 
  roleMiddleware, 
  isOwner, 
  isMember 
};
