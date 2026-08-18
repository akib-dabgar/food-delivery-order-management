import type { Customer } from "../types";

export type CustomerErrors = Partial<Record<keyof Customer, string>>;

/**
 * Mirrors the server rules in server/src/schemas/order.schema.ts so the user
 * gets immediate feedback. The server still validates every request; this is
 * convenience, not a security boundary.
 */
export function validateCustomer(customer: Customer): CustomerErrors {
  const errors: CustomerErrors = {};

  const name = customer.name.trim();
  const address = customer.address.trim();
  const phone = customer.phone.trim();

  if (!name) {
    errors.name = "Name is required";
  } else if (name.length > 80) {
    errors.name = "Name must be 80 characters or fewer";
  }

  if (!address) {
    errors.address = "Address is required";
  } else if (address.length < 5) {
    errors.address = "Address must be at least 5 characters";
  } else if (address.length > 200) {
    errors.address = "Address must be 200 characters or fewer";
  }

  const digitCount = (phone.match(/\d/g) ?? []).length;

  if (!phone) {
    errors.phone = "Phone number is required";
  } else if (!/^\+?[\d\s()-]+$/.test(phone)) {
    errors.phone = "Phone may only contain digits and + - ( )";
  } else if (digitCount < 7) {
    errors.phone = "Phone must contain at least 7 digits";
  } else if (phone.length > 20) {
    errors.phone = "Phone must be 20 characters or fewer";
  }

  return errors;
}
