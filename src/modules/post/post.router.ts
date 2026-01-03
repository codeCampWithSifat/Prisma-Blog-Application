import express from "express";
import { postController } from "./post.controller";
import auth, { UserRole } from "../../middleware/auth";

const router = express.Router();

router.get("/", postController.getAllPosts);
router.post("/", auth(UserRole.USER), postController.createPost);

export const postRoutes = router;
