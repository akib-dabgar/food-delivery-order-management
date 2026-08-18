import type { Customer } from "../types";

export type CustomerErrors = Partial<Record<keyof Customer, string>>;

/**
 * Reduces a typed phone number to its subscriber digits, dropping separators
 * and an optional +91 country code or leading 0. Mirrors the server rule.
 */
/** Letters from any script plus space, full stop, apostrophe and hyphen. */
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
  } else if (!NAME_PATTERN.test(name)) {
    errors.name = "Name may only contain letters";
  }

  if (!address) {
    errors.address = "Address is required";
  } else if (address.length < 5) {
    errors.address = "Address must be at least 5 characters";
  } else if (address.length > 200) {
    errors.address = "Address must be 200 characters or fewer";
  }

  const digits = phoneDigits(phone);

  if (!phone) {
    errors.phone = "Phone number is required";
  } else if (!/^\+?[\d\s()-]+$/.test(phone)) {
    errors.phone = "Phone may only contain digits and + - ( )";
  } else if (digits.length !== 10) {
    errors.phone = "Phone must be a 10-digit mobile number";
  } else if (phone.length > 20) {
    errors.phone = "Phone must be 20 characters or fewer";
  }

  return errors;
}
