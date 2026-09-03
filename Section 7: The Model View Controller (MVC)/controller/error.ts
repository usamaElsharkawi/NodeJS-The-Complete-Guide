import { type Request, type Response, type NextFunction } from "express";

export const pageNotFound = (req: Request, res: Response) => {
  res.status(404).render("404", { pageTitle: "Page Not Found" });
};
