const Project = require("../models/Project.model");
const User = require("../models/User.model");



const createProject = async (req, res) => {
  try {
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.role !== 'owner') {
      return res.status(403).json({ message: "Only owners can create projects" });
    }

    const { name, description, members = [] } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Project name is required" });
    }

    
    const memberEmails = Array.isArray(members) ? [...new Set(members)] : [];
    const memberUsers = await User.find({ email: { $in: memberEmails } });
    const memberIds = memberUsers.map(user => user._id);

    
    const project = new Project({
      name,
      description: description || "",
      members: [...memberIds, req.user.id], 
      createdBy: req.user.id,
    });

    const savedProject = await project.save();
    
    
    const populatedProject = await Project.findById(savedProject._id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email role');
      
    res.status(201).json({
      success: true,
      data: populatedProject
    });
  } catch (err) {
    console.error("createProject error", err);
    res.status(500).json({ 
      success: false,
      message: err.message || "Server error" 
    });
  }
};

const getProjectsForUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; 
    const skip = (page - 1) * limit;

    
    const total = await Project.countDocuments({
      $or: [
        { createdBy: userId },
        { members: userId }
      ]
    });

    const projects = await Project.find({
      $or: [
        { createdBy: userId },
        { members: userId }
      ]
    })
      .populate('members', 'name email role')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: projects,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (err) {
    console.error('getProjectsForUser error', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id)
      .populate("members", "name email")
      .lean();
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ project });
  } catch (err) {
    console.error("getProjectById error", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = (({ name, description }) => ({ name, description }))(
      req.body
    );

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (updates.name !== undefined) project.name = updates.name;
    if (updates.description !== undefined)
      project.description = updates.description;

    await project.save();
    res.json({ project });
  } catch (err) {
    console.error("updateProject error", err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting project ID:', id);
    
    
    const project = await Project.findById(id);
    if (!project) {
      console.log('Project not found:', id);
      return res.status(404).json({ 
        success: false,
        message: "Project not found" 
      });
    }

    
    const normalizeId = (id) => {
      if (!id) return null;
      return id._id ? id._id.toString() : id.toString();
    };

    const createdById = normalizeId(project.createdBy);
    const userId = req.user?.id?.toString();

    
    if (createdById !== userId) {
      console.log('User not authorized to delete project. User ID:', userId, 'Creator ID:', createdById);
      return res.status(403).json({ 
        success: false,
        message: "Only project creator can delete project" 
      });
    }

    
    await Project.findByIdAndDelete(id);
    
    console.log('Project deleted successfully:', id);
    res.json({ 
      success: true,
      message: "Project deleted successfully" 
    });
  } catch (err) {
    console.error("deleteProject error:", err);
    res.status(500).json({ 
      success: false,
      message: err.message || "Server error" 
    });
  }
};

const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberEmail } = req.body;
    
    if (!memberEmail) {
      return res.status(400).json({ 
        success: false,
        message: "memberEmail is required" 
      });
    }

    const userToAdd = await User.findOne({ email: memberEmail.toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: "Project not found" 
      });
    }

    const userId = req.user?.id?.toString();
    const userToAddId = userToAdd._id?.toString();

    
    const isAlreadyMember = project.members.some(member => {
      const memberId = member?._id?.toString() || member?.toString();
      return memberId === userToAddId;
    });

    if (isAlreadyMember) {
      return res.status(400).json({ 
        success: false,
        message: "User is already a member of this project" 
      });
    }


    project.members.push(userToAdd._id);
    await project.save();

    
    const updatedProject = await Project.findById(project._id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: "Member added successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("addMember error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error adding member",
    });
  }

};

module.exports = {
  createProject,
  getProjectsForUser,
  getProjectById,
  updateProject,
  deleteProject,
  addMember
};
