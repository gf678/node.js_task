import { Request, Response, NextFunction } from "express";

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const user = (req as any).user;


  if (!user) {
    return res.status(401).json({
      message: "UNAUTHORIZED",
    });
  }


  if (user.role !== "ADMIN") {
    return res.status(403).json({
      message: "FORBIDDEN",
    });
  }


  next();
};