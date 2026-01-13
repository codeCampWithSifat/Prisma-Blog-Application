import { get } from "node:http";
import { Request, Response } from "express";
import { postService } from "./post.service";
import { PostStatus } from "../../../generated/prisma/enums";
import paginationSortingHelper from "../../helpers/paginationSortingHelper";
import { UserRole } from "../../middleware/auth";

const createPost = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const result = await postService.createPost(req.body, user?.id as string);
    return res.status(201).json({
      message: "Post Created Sucessfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({ message: "Bad Request" });
  }
};

// const getAllPosts = async (req: Request, res: Response) => {
//   try {
//     const { search } = req.query;
//     const tags = req.query.tags ? (req.query.tags as string).split(",") : [];
//     const seachString = typeof search === "string" ? search : undefined;

//     const isFeatured = req.query.isFeatured
//       ? req.query.isFeatured === "true"
//         ? true
//         : req.query.isFeatured === "false"
//         ? false
//         : undefined
//       : undefined;

//     const status = req.query.status as PostStatus | undefined;
//     const authorId = req.query.authorId as string | undefined;

//     const page = Number(req.query.page ?? 1);
//     const limit = Number(req.query.limit ?? 5);

//     const skip = (page - 1) * limit;

//     const sortBy = req.query.sortBy as string | undefined;
//     const sortOrder = req.query.sortOrder as string | undefined;

//     const result = await postService.getAllPosts({
//       search: seachString,
//       tags,
//       isFeatured,
//       status,
//       authorId,
//       page,
//       limit,
//       skip,
//       sortBy,
//       sortOrder,
//     });
//     return res.status(200).json({
//       message: "Posts Fetched Succesfully",
//       data: result,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Internal Server Error",
//       error: error,
//     });
//   }
// };

const getAllPosts = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const searchString = typeof search === "string" ? search : undefined;

    const tags = req.query.tags ? (req.query.tags as string).split(",") : [];

    // true or false
    const isFeatured = req.query.isFeatured
      ? req.query.isFeatured === "true"
        ? true
        : req.query.isFeatured === "false"
        ? false
        : undefined
      : undefined;

    const status = req.query.status as PostStatus | undefined;

    const authorId = req.query.authorId as string | undefined;

    const { page, limit, skip, sortBy, sortOrder } = paginationSortingHelper(
      req.query
    );

    const result = await postService.getAllPosts({
      search: searchString,
      tags,
      isFeatured,
      status,
      authorId,
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
    });
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: "Post creation failed",
      details: e,
    });
  }
};

const getPostById = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    if (!postId) {
      throw new Error("Post Id is required!");
    }
    const result = await postService.getPostById(postId);
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: "Post creation failed",
      details: e,
    });
  }
};

const getMyPosts = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error("You are unauthorized!");
    }
    console.log("User data: ", user);
    const result = await postService.getMyPosts(user.id);
    res.status(200).json(result);
  } catch (e) {
    console.log(e);
    res.status(400).json({
      error: "Post fetched failed",
      details: e,
    });
  }
};

const updatePost = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error("You are unauthorized!");
    }

    const { postId } = req.params;
    const isAdmin = user.role === UserRole.ADMIN;
    const result = await postService.updatePost(
      postId as string,
      req.body,
      user.id,
      isAdmin
    );
    res.status(200).json(result);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Post update failed!";
    res.status(400).json({
      error: errorMessage,
      details: e,
    });
  }
};

const deletePost = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error("You are unauthorized!");
    }

    const { postId } = req.params;
    const isAdmin = user.role === UserRole.ADMIN;
    const result = await postService.deletePost(
      postId as string,
      user.id,
      isAdmin
    );
    res.status(200).json(result);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Post delete failed!";
    res.status(400).json({
      error: errorMessage,
      details: e,
    });
  }
};

const getStates = async (req: Request, res: Response) => {
  try {
    const result = await postService.getStates();
    res.status(200).json(result);
  } catch (e) {
    const errorMessage =
      e instanceof Error ? e.message : "Stats fetched failed!";
    res.status(400).json({
      error: errorMessage,
      details: e,
    });
  }
};

export const postController = {
  createPost,
  getAllPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
  getStates,
};
