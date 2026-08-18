/**
 * Barrel for every shared server type. Modules import from "./types/index.js" and
 * never need to know which file a type lives in.
 */
export type { MenuItem } from "./menu.js";
export { ORDER_STATUSES } from "./order.js";
export type { Customer, Order, OrderItem, OrderStatus } from "./order.js";
export type { ApiError } from "./api.js";
