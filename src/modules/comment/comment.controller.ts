import { Request, Response } from "express";
import { commentService } from "./comment.service";

const createComment = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    req.body.authorId = user?.id;
    const result = await commentService.createComment(req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({
      error: "Comment creation failed",
      details: e,
    });
  }
};

const getCommentById = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const result = await commentService.getCommentById(commentId as string);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: "Comment fetched failed",
      details: e,
    });
  }
};

const getCommentsByAuthor = async (req: Request, res: Response) => {
  try {
    const { authorId } = req.params;
    const result = await commentService.getCommentsByAuthor(authorId as string);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: "Comment fetched failed",
      details: e,
    });
  }
};
const deleteComment = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { commentId } = req.params;
    const result = await commentService.deleteComment(
      commentId as string,
      user?.id as string
    );
    res.status(200).json(result);
  } catch (e) {
    console.log(e);
    res.status(400).json({
      error: "Comment delete failed!",
      details: e,
    });
  }
};

export const commentController = {
  createComment,
  getCommentById,
  getCommentsByAuthor,
  deleteComment,
};
