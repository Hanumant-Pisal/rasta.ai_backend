const Task = require("../models/Task.model");
const Project = require("../models/Project.model");

const createTask = async (req, res) => {
  try {
    const { projectId, title, description, assignee, dueDate, status } =
      req.body;
    if (!projectId || !title)
      return res.status(400).json({ message: "projectId and title required" });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const task = new Task({
      projectId,
      title,
      description: description ,
      assignee: assignee ,
      dueDate: dueDate ,
      status: status ,
      createdBy: req.user.id,
    });

    await task.save();
    res.status(201).json({ task });
  } catch (err) {
    console.error("createTask error", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId)
      return res.status(400).json({ message: "projectId required" });

    const tasks = await Task.find({ projectId })
      .populate("assignee", "name email")
      .sort({ createdAt: 1 });
    res.json({ tasks });
  } catch (err) {
    console.error("getTasksByProject error", err);
    res.status(500).json({ message: "Server error" });
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
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isMember =
      project.createdBy.toString() === req.user.id 
      (Array.isArray(project.members) &&
        project.members.find((m) => m.toString() === req.user.id));
    if (!isMember)
      return res.status(403).json({ message: "Unauthorized to edit task" });

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) task[key] = updates[key];
    });

    await task.save();
    res.json({ task });
  } catch (err) {
    console.error("updateTask error", err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isMember =
      project.createdBy.toString() === req.user.id 
      (Array.isArray(project.members) &&
        project.members.find((m) => m.toString() === req.user.id));
    if (!isMember)
      return res.status(403).json({ message: "Unauthorized to delete task" });

    await task.remove();
    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("deleteTask error", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
};
