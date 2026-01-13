import express from "express";
import auth, { UserRole } from "../../middleware/auth";
import { commentController } from "./comment.controller";

const router = express.Router();

router.get("/author/:authorId", commentController.getCommentsByAuthor);
router.get("/:commentId", commentController.getCommentById);
router.post(
  "/",
  auth(UserRole.USER, UserRole.ADMIN),
  commentController.createComment
);
router.delete(
  "/:commentId",
  auth(UserRole.USER, UserRole.ADMIN),
  commentController.deleteComment
);

router.patch(
  "/:commentId",
  auth(UserRole.USER, UserRole.ADMIN),
  commentController.updateComment
);
router.patch(
  "/:commentId/moderate",
  auth(UserRole.ADMIN),
  commentController.moderateComment
);

export const commentRoutes = router;
