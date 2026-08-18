import { z } from "zod";
import { ORDER_STATUSES } from "../types/index.js";

/**
 * Reduces a typed phone number to its subscriber digits, dropping separators
 * and an optional +91 country code or leading 0. Lets someone write
 * "+91 98765 43210", "098765 43210" or "9876543210" and be treated the same.
 */
/**
 * A person's name: letters from any script, plus the spaces, full stops,
 * apostrophes and hyphens that real names use ("M. K. Sharma", "D'Souza",
 * "Anne-Marie"). Digits are rejected. Must start with a letter.
 */
const NAME_PATTERN = /^\p{L}[\p{L}\s.'-]*$/u;

function phoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  return digits;
}

/**
 * Note there is no `.strict()` here. Unknown keys are stripped rather than
 * rejected, which is what makes a client-supplied `price` harmless: it never
 * reaches the service, and the total is always computed from menu data.
 */
export const createOrderSchema = z.object({
  customer: z.object({
    name: z
      .string()
      .trim()
      .min(1, "name is required")
      .max(80, "name must be 80 characters or fewer")
      .regex(NAME_PATTERN, "name may only contain letters"),
    address: z
      .string()
      .trim()
      .min(5, "address must be at least 5 characters")
      .max(200, "address must be 200 characters or fewer"),
    phone: z
      .string()
      .trim()
      .min(1, "phone is required")
      .max(20, "phone must be 20 characters or fewer")
      .regex(
        /^\+?[\d\s()-]+$/,
        "phone may only contain digits and the characters + - ( )",
      )
      .refine(
        (value) => phoneDigits(value).length === 10,
        "phone must be a 10-digit mobile number",
      ),
  }),
  items: z
    .array(
      z.object({
        menuItemId: z.string().trim().min(1, "menuItemId is required"),
        quantity: z
          .number()
          .int("quantity must be a whole number")
          .min(1, "quantity must be at least 1")
          .max(50, "quantity must be 50 or fewer"),
      }),
    )
    .min(1, "an order must contain at least one item"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Flattens Zod issues into the `details` field of the API error shape. */
export function formatIssues(error: z.ZodError): { path: string; message: string }[] {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}
