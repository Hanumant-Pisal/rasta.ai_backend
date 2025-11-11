const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { roleMiddleware } = require("../middleware/roleMiddleware");
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

router.get("/get-project/:id", roleMiddleware, getProjectById);

router.put("/update-project/:id", roleMiddleware, updateProject);

router.delete("/delete-project/:id", roleMiddleware, deleteProject);

router.post("/add-member/:id", roleMiddleware, addMember);

module.exports = router;
