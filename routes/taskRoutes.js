const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { roleMiddleware, isMember } = require("../middleware/roleMiddleware");
const {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
  updateTaskOrder,
  getAllTasksForUser
} = require("../controllers/taskController");


router.use(auth);

// Get all tasks for user (must be before /project/:id to avoid conflict)
router.get("/all", getAllTasksForUser);

router.post("/", createTask);

router.get("/project/:id", getTasksByProject);

router.put("/update-order", updateTaskOrder);

// Update and delete individual tasks
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
