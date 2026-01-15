import express, { Application } from "express";
import cors from "cors";
import { postRoutes } from "./modules/post/post.router";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { commentRoutes } from "./modules/comment/comment.router";
import errorHandler from "./middleware/globalErrorHandler";
import notFound from "./middleware/notFound";

const app: Application = express();

app.use(express.json());

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:4000",
    credentials: true,
  })
);

// API
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/comments", commentRoutes);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use(notFound);
app.use(errorHandler);
export default app;
