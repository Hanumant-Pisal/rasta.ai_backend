const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { ensureProjectMember } = require("../middleware/roleMiddleware");
// const projectController = require("../controllers/projectController");
const {createProject,
  getProjectsForUser,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,} = require("../controllers/projectController");

router.use(auth);

router.post("/create-project", createProject);

router.get("/get-projects", getProjectsForUser);

router.get("/get-project/:id", ensureProjectMember, getProjectById);

router.put("/update-project/:id", ensureProjectMember, updateProject);

router.delete("/delete-project/:id", ensureProjectMember, deleteProject);

router.post("/add-member/:id", ensureProjectMember, addMember);

module.exports = router;
