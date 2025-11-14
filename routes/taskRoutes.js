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
} = require("../controllers/taskController");


router.use(auth);


router.post("/", createTask);


router.get("/project/:id", getTasksByProject);

router.put("/update-order", updateTaskOrder);

// router.post("/create-task", roleMiddleware, createTask);

// router.get("/get-tasks/:projectId", roleMiddleware, getTasksByProject);

// router.put("/update-task/:id", roleMiddleware, updateTask);

// router.delete("/delete-task/:id", roleMiddleware, deleteTask);

module.exports = router;
