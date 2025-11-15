const Comment = require("../models/Comment.model");
const Task = require("../models/Task.model");


const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const comments = await Comment.find({ taskId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 }) 
      .lean();

    res.json({ comments });
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

  
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
    }

    const comment = new Comment({
      taskId,
      userId,
      content: content.trim(),
      parentCommentId: parentCommentId || null,
    });

    await comment.save();

    
    await comment.populate("userId", "name email");

    res.status(201).json({ comment });
  } catch (err) {
    console.error("Create comment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    
    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this comment" });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    await comment.populate("userId", "name email");

    res.json({ comment });
  } catch (err) {
    console.error("Update comment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    
    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await Comment.deleteOne({ _id: commentId });

    
    await Comment.deleteMany({ parentCommentId: commentId });

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment,
};
