const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { roleMiddleware, isOwner } = require("../middleware/roleMiddleware");
const {
  createProject,
  getProjectsForUser,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
} = require("../controllers/projectController");


router.use(auth);


router.post("/create-project", createProject);


router.get("/get-projects", getProjectsForUser);


router.get("/get-project/:id", roleMiddleware, getProjectById);
router.put("/update-project/:id", roleMiddleware, isOwner, updateProject);
router.delete("/delete-project/:id", roleMiddleware, isOwner, deleteProject);
router.post("/add-member/:id", roleMiddleware, isOwner, addMember);

module.exports = router;
