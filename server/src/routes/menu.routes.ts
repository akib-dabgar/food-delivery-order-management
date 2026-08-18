import { Router } from "express";
import { menuItems } from "../data/menu.js";

export const menuRouter = Router();

menuRouter.get("/", (_req, res) => {
  res.json(menuItems);
});
