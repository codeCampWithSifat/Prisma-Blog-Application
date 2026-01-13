import { get } from "node:http";
import {
  CommentStatus,
  Post,
  PostStatus,
} from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { PostWhereInput } from "../../../generated/prisma/models";

const createPost = async (
  data: Omit<Post, "id" | "createdAt" | "updatedAt">,
  userId: string
) => {
  const result = await prisma.post.create({
    data: {
      ...data,
      authorId: userId,
    },
  });

  return result;
};

// const getAllPosts = async ({
//   search,
//   tags,
//   isFeatured,
//   status,
//   authorId,
//   page,
//   limit,
//   skip,
//   sortBy,
//   sortOrder,
// }: {
//   search: string | undefined;
//   tags: string[] | [];
//   isFeatured: boolean | undefined;
//   status: PostStatus | undefined;
//   authorId: string | undefined;
//   page: number;
//   limit: number;
//   skip: number;
//   sortBy: string | undefined;
//   sortOrder: string | undefined;
// }) => {
//   const andConditions: PostWhereInput[] = [];

//   if (search) {
//     andConditions.push({
//       OR: [
//         {
//           title: {
//             contains: search,
//             mode: "insensitive",
//           },
//         },
//         {
//           content: {
//             contains: search,
//             mode: "insensitive",
//           },
//         },
//         {
//           tags: {
//             has: search,
//           },
//         },
//       ],
//     });
//   }

//   if (tags.length > 0) {
//     andConditions.push({
//       tags: {
//         hasEvery: tags,
//       },
//     });
//   }

//   if (typeof isFeatured === "boolean") {
//     andConditions.push({
//       isFeatured,
//     });
//   }

//   if (status) {
//     andConditions.push({
//       status,
//     });
//   }

//   if (authorId) {
//     andConditions.push({
//       authorId,
//     });
//   }

//   const result = await prisma.post.findMany({
//     take: limit,
//     skip,
//     where: {
//       AND: andConditions,
//     },
//     orderBy:
//       sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" },
//   });
//   return result;
// };

const getAllPosts = async ({
  search,
  tags,
  isFeatured,
  status,
  authorId,
  page,
  limit,
  skip,
  sortBy,
  sortOrder,
}: {
  search: string | undefined;
  tags: string[] | [];
  isFeatured: boolean | undefined;
  status: PostStatus | undefined;
  authorId: string | undefined;
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
}) => {
  const andConditions: PostWhereInput[] = [];

  if (search) {
    andConditions.push({
      OR: [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          tags: {
            has: search,
          },
        },
      ],
    });
  }

  if (tags.length > 0) {
    andConditions.push({
      tags: {
        hasEvery: tags as string[],
      },
    });
  }

  if (typeof isFeatured === "boolean") {
    andConditions.push({
      isFeatured,
    });
  }

  if (status) {
    andConditions.push({
      status,
    });
  }

  if (authorId) {
    andConditions.push({
      authorId,
    });
  }

  const allPost = await prisma.post.findMany({
    take: limit,
    skip,
    where: {
      AND: andConditions,
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      _count: {
        select: { comments: true },
      },
    },
  });

  const total = await prisma.post.count({
    where: {
      AND: andConditions,
    },
  });
  return {
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    data: allPost,
  };
};

const getPostById = async (postId: string) => {
  return await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: {
        id: postId,
      },
      data: {
        views: {
          increment: 1,
        },
      },
    });
    const postData = await tx.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        comments: {
          where: {
            parentId: null,
            status: CommentStatus.APPROVED,
          },
          orderBy: { createdAt: "desc" },
          include: {
            replies: {
              where: {
                status: CommentStatus.APPROVED,
              },
              orderBy: { createdAt: "asc" },
              include: {
                replies: {
                  where: {
                    status: CommentStatus.APPROVED,
                  },
                  orderBy: { createdAt: "asc" },
                },
              },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
    return postData;
  });
};

const getMyPosts = async (authorId: string) => {
  await prisma.user.findUniqueOrThrow({
    where: {
      id: authorId,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  const result = await prisma.post.findMany({
    where: {
      authorId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  return result;
};

//**
// user - sudhu nijar post update korta parbe, isFeatured update korta parbe na
// admin - sobar post update korta parbe.
// */

const updatePost = async (
  postId: string,
  data: Partial<Post>,
  authorId: string,
  isAdmin: boolean
) => {
  const postData = await prisma.post.findUniqueOrThrow({
    where: {
      id: postId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!isAdmin && postData.authorId !== authorId) {
    throw new Error("You are not the owner/creator of the post!");
  }

  if (!isAdmin) {
    delete data.isFeatured;
  }

  const result = await prisma.post.update({
    where: {
      id: postData.id,
    },
    data,
  });

  return result;
};

//**
// 1. user - nijar created post delete korta parbe
// 2. admin - sobar post delete korta parbe
// */

const deletePost = async (
  postId: string,
  authorId: string,
  isAdmin: boolean
) => {
  const postData = await prisma.post.findUniqueOrThrow({
    where: {
      id: postId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!isAdmin && postData.authorId !== authorId) {
    throw new Error("You are not the owner/creator of the post!");
  }

  return await prisma.post.delete({
    where: {
      id: postId,
    },
  });
};

// const getStates = async () => {
//   console.log("getStates");
//   // postCount, publishedPosts, draftPosts, totalComments
//   return await prisma.$transaction(async (tx) => {
//     const totalPosts = await tx.post.count();
//     const publishedPosts = await tx.post.count({
//       where: {
//         status: PostStatus.PUBLISHED,
//       },
//     });

//     const draftPosts = await tx.post.count({
//       where: {
//         status: PostStatus.DRAFT,
//       },
//     });

//     const archivedPost = await tx.post.count({
//       where: {
//         status: PostStatus.ARCHIVED,
//       },
//     });

//     return {
//       totalPosts,
//       publishedPosts,
//       draftPosts,
//       archivedPost,
//     };
//   });
// };

const getStates = async () => {
  return await prisma.$transaction(async (tx) => {
    const [
      totalPosts,
      publlishedPosts,
      draftPosts,
      archivedPosts,
      totalComments,
      approvedComment,
      totalUsers,
      adminCount,
      userCount,
      totalViews,
    ] = await Promise.all([
      await tx.post.count(),
      await tx.post.count({ where: { status: PostStatus.PUBLISHED } }),
      await tx.post.count({ where: { status: PostStatus.DRAFT } }),
      await tx.post.count({ where: { status: PostStatus.ARCHIVED } }),
      await tx.comment.count(),
      await tx.comment.count({ where: { status: CommentStatus.APPROVED } }),
      await tx.user.count(),
      await tx.user.count({ where: { role: "ADMIN" } }),
      await tx.user.count({ where: { role: "USER" } }),
      await tx.post.aggregate({
        _sum: { views: true },
      }),
    ]);

    return {
      totalPosts,
      publlishedPosts,
      draftPosts,
      archivedPosts,
      totalComments,
      approvedComment,
      totalUsers,
      adminCount,
      userCount,
      totalViews: totalViews._sum.views,
    };
  });
};
export const postService = {
  createPost,
  getAllPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
  getStates,
};
