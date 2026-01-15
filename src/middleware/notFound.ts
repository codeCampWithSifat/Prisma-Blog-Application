import { Request, Response } from "express";

function notFound(req: Request, res: Response) {
  res.status(404).json({
    message: "Route Not Found",
    path: req.originalUrl,
    date: Date(),
  });
}

export default notFound;
