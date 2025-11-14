const mongoose = require('mongoose');
const Task = require("../models/Task.model");
const Project = require("../models/Project.model");
const User = require("../models/User.model");

const createTask = async (req, res) => {
  try {
    
    const { projectId, title, description = '', assignee = null, dueDate = null, status = 'pending' } = req.body;

    
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
        field: 'projectId'
      });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required and must be a non-empty string',
        field: 'title'
      });
    }

    if (assignee && !mongoose.Types.ObjectId.isValid(assignee)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignee ID format',
        field: 'assignee'
      });
    }
    
    
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: req.user.id },
        { members: { $in: [req.user.id] } }
      ]
    }).lean();

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found or you don't have permission to access it" 
      });
    }


    if (assignee) {
      const isMember = project.members.some(member => 
        member._id.toString() === assignee.toString() || 
        (typeof member === 'string' && member === assignee)
      );
      
      if (!isMember) {
        return res.status(400).json({ 
          success: false, 
          message: "Selected assignee is not a member of this project" 
        });
      }
    }

    
    const taskData = {
      projectId: new mongoose.Types.ObjectId(projectId),
      title: title.trim(),
      description: (description || '').trim(),
      
      status: ['To Do', 'In Progress', 'Done'].includes(status) ? status : 'To Do',
      createdBy: new mongoose.Types.ObjectId(req.user.id)
    };

    
    if (assignee && mongoose.Types.ObjectId.isValid(assignee)) {
      taskData.assignee = new mongoose.Types.ObjectId(assignee);
    } else {
      taskData.assignee = null; 
    }

    
    if (dueDate) {
      const parsedDate = new Date(dueDate);
      if (!isNaN(parsedDate.getTime())) {
        taskData.dueDate = parsedDate;
      }
    }

    const task = new Task(taskData);
    const validationError = task.validateSync();
    
    if (validationError) {
      console.error('Validation error:', validationError);
      const errors = {};
      Object.keys(validationError.errors).forEach(key => {
        errors[key] = validationError.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    await task.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .lean();
    
    res.status(201).json({ 
      success: true, 
      message: 'Task created successfully',
      task: {
        ...populatedTask,
        _id: populatedTask._id.toString(),
        projectId: populatedTask.projectId.toString(),
        createdBy: {
          ...populatedTask.createdBy,
          _id: populatedTask.createdBy._id.toString()
        },
        assignee: populatedTask.assignee ? {
          ...populatedTask.assignee,
          _id: populatedTask.assignee._id.toString()
        } : null
      }
    });
  } catch (err) {
    console.error("createTask error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
      keyValue: err.keyValue,
      errors: err.errors
    });
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        errors: messages 
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        error: err.message
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create task. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const getTasksByProject = async (req, res) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    const userId = req.user?.id;
    
    if (!projectId) {
      return res.status(400).json({ 
        success: false,
        message: "Project ID is required",
        data: []
      });
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required",
        data: []
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: userId },
        { members: { $in: [userId] } }
      ]
    });

    if (!project) {
      return res.status(403).json({ 
        success: false,
        message: "You don't have permission to access this project",
        data: []
      });
    }

    
    let tasks = [];
    try {
      const result = await Task.find({ projectId })
        .populate("assignee", "name email")
        .populate("createdBy", "name email")
        .sort({ createdAt: 1 })
        .lean();
      
      tasks = Array.isArray(result) ? result : [];
      
    } catch (dbError) {
      console.error('Database error in getTasksByProject:', dbError);
      tasks = [];
    }

    return res.json({ 
      success: true,
      data: tasks 
    });

  } catch (error) {
    console.error("Unexpected error in getTasksByProject:", {
      message: error.message,
      stack: error.stack,
      params: req.params,
      user: req.user?.id
    });
    
    
    return res.json({ 
      success: false,
      data: [], 
      message: "Failed to fetch tasks",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = (({ title, description, assignee, dueDate, status }) => ({
      title,
      description,
      assignee,
      dueDate,
      status,
    }))(req.body);

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: "Task not found" 
      });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: "Project not found" 
      });
    }

    // Check if user is project owner or member
    const userId = req.user.id.toString();
    const isOwner = project.createdBy.toString() === userId;
    const isMember = Array.isArray(project.members) && 
      project.members.some((m) => m.toString() === userId);
    
    if (!isOwner && !isMember) {
      console.log('Authorization failed:', {
        userId,
        projectCreatedBy: project.createdBy.toString(),
        projectMembers: project.members.map(m => m.toString()),
        isOwner,
        isMember
      });
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized to edit task" 
      });
    }

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) task[key] = updates[key];
    });

    const updatedTask = await task.save();
    
    // Populate assignee and createdBy for consistent response
    await updatedTask.populate('assignee', 'name email');
    await updatedTask.populate('createdBy', 'name email');
    
    res.json({ 
      success: true,
      task: updatedTask,
      message: "Task updated successfully"
    });
  } catch (err) {
    console.error("updateTask error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: "Task not found" 
      });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: "Project not found" 
      });
    }

    // Check if user is project owner or member
    const userId = req.user.id.toString();
    const isOwner = project.createdBy.toString() === userId;
    const isMember = Array.isArray(project.members) && 
      project.members.some((m) => m.toString() === userId);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized to delete task" 
      });
    }

    await Task.deleteOne({ _id: task._id });
    
    res.json({ 
      success: true,
      message: "Task deleted successfully" 
    });
  } catch (err) {
    console.error("deleteTask error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};



const updateTaskOrder = async (req, res) => {
  try {
    const { tasks } = req.body;
    
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ 
        success: false,
        message: "Tasks array is required" 
      });
    }

    
    const taskIds = tasks.map(t => t._id);
    const existingTasks = await Task.find({ _id: { $in: taskIds } });
    
    if (existingTasks.length !== tasks.length) {
      return res.status(400).json({
        success: false,
        message: "One or more tasks not found"
      });
    }

    
    const projectIds = [...new Set(existingTasks.map(t => t.projectId.toString()))];
    if (projectIds.length > 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot update tasks from different projects in one request"
      });
    }

    
    const project = await Project.findOne({
      _id: projectIds[0],
      $or: [
        { createdBy: req.user.id },
        { members: { $in: [req.user.id] } }
      ]
    });

    if (!project) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update these tasks"
      });
    }

    
    const bulkOps = tasks.map(task => ({
      updateOne: {
        filter: { _id: task._id },
        update: { 
          $set: { 
            order: task.order, 
            status: task.status || "pending" 
          } 
        }
      }
    }));

   
    await Task.bulkWrite(bulkOps);
    
    
    const updatedTasks = await Task.find({ _id: { $in: taskIds } });
    
    res.json({ 
      success: true,
      message: "Tasks order updated successfully",
      tasks: updatedTasks
    });
  } catch (err) {
    console.error("Error updating task order:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const getAllTasksForUser = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required",
        data: []
      });
    }

    // Find all projects the user is part of
    const userProjects = await Project.find({
      $or: [
        { createdBy: userId },
        { members: { $in: [userId] } }
      ]
    }).select('_id');

    const projectIds = userProjects.map(p => p._id);

    // Get all tasks from those projects
    const tasks = await Task.find({
      projectId: { $in: projectIds }
    })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ 
      success: true,
      data: tasks 
    });

  } catch (error) {
    console.error("Error in getAllTasksForUser:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server error",
      data: []
    });
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
  updateTaskOrder,
  getAllTasksForUser
};
