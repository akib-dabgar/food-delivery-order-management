import { Router } from "express";
import { HttpError } from "../errors.js";
import {
  createOrderSchema,
  formatIssues,
  updateOrderStatusSchema,
} from "../schemas/order.schema.js";
import {
  createOrder,
  getOrder,
  updateOrderStatus,
} from "../services/orderService.js";

export const orderRouter = Router();

orderRouter.post("/", (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new HttpError(400, "Invalid order payload", formatIssues(parsed.error));
  }

  res.status(201).json(createOrder(parsed.data));
});

orderRouter.get("/:id", (req, res) => {
  res.json(getOrder(req.params.id));
});

orderRouter.patch("/:id/status", (req, res) => {
  const parsed = updateOrderStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new HttpError(
      400,
      "Invalid status payload",
      formatIssues(parsed.error),
    );
  }

  res.json(updateOrderStatus(req.params.id, parsed.data.status));
});
