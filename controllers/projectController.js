const Project = require("../models/Project.model");
const User = require("../models/User.model");

const createProject = async (req, res) => {
  try {
    const { name, description, members = [] } = req.body;
    if (!name)
      return res.status(400).json({ message: "Project name is required" });

    const uniqueMemberIds = Array.from(new Set(members || []));

    const project = new Project({
      name,
      description: description || "",
      members: uniqueMemberIds,
      createdBy: req.user.id,
    });

    if (!project.members.find((m) => m.toString() === req.user.id)) {
      project.members.push(req.user.id);
    }

    await project.save();
    res.status(201).json({ project });
  } catch (err) {
    console.error("createProject error", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getProjectsForUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await Project.find({
      members: userId,
    })
      .populate("createdBy", "name email")
      .lean();

    res.json({ projects });
  } catch (err) {
    console.error("getProjectsForUser error", err);
    res.status(500).json({ message: "Server error" });
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
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only project creator can delete project" });
    }

    await project.remove();
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("deleteProject error", err);
    res.status(500).json({ message: "Server error" });
  }
};

const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberEmail } = req.body;
    if (!memberEmail)
      return res.status(400).json({ message: "memberEmail is required" });

    const userToAdd = await User.findOne({ email: memberEmail.toLowerCase() });
    if (!userToAdd) return res.status(404).json({ message: "User not found" });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only project owner can add members" });
    }

    const isAlreadyMember = project.members.find(
      (m) => m.toString() === userToAdd._id.toString()
    );
    if (isAlreadyMember)
      return res.status(400).json({ message: "User already a member" });

    project.members.push(userToAdd._id);
    await project.save();

    res.json({ message: "Member added", project });
  } catch (err) {
    console.error("addMember error", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createProject,
  getProjectsForUser,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
};
