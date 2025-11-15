const express = require("express");
const router = express.Router();
const {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");
const authMiddleware = require("../middleware/authMiddleware");


router.use(authMiddleware);


router.get("/task/:taskId", getTaskComments);


router.post("/task/:taskId", createComment);


router.put("/:commentId", updateComment);


router.delete("/:commentId", deleteComment);

module.exports = router;
