const Project = require("../models/Project.model");

const roleMiddleware = async (req, res, next) => {
  try {
    const projectId =
      req.params.id || req.body.projectId || req.query.projectId;
    if (!projectId) {
      return res.status(400).json({ message: "projectId is required" });
    }

    const project = await Project.findById(projectId).lean();
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user.id;
    const isMember =
      project.createdBy?.toString() === userId ||
      (Array.isArray(project.members) &&
        project.members.find((m) => m.toString() === userId));

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this project" });
    }

    req.project = project;
    next();
  } catch (err) {
    console.error("ensureProjectMember error", err);
    res.status(500).json({ message: "Permission check failed" });
  }
};

module.exports = { roleMiddleware };
