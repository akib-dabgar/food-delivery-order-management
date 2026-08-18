import type { Customer } from "../types";

/**
 * The shape of the checkout form as data.
 *
 * Keeping the fields as a list rather than three hand-written blocks of JSX
 * means adding or relabelling a field is a one-line edit here, and the form
 * component is left holding only its behaviour.
 */
export interface CheckoutField {
  id: keyof Customer;
  label: string;
  placeholder: string;
  autoComplete: string;
  inputMode?: "tel";
}

export const EMPTY_CUSTOMER: Customer = { name: "", address: "", phone: "" };

/** Order matters: focus jumps to the first invalid field in this sequence. */
export const CUSTOMER_FIELD_ORDER: (keyof Customer)[] = [
  "name",
  "address",
  "phone",
];

export const CHECKOUT_FIELDS: CheckoutField[] = [
  {
    id: "name",
    label: "Name",
    placeholder: "Akib Dabgar",
    autoComplete: "name",
  },
  {
    id: "address",
    label: "Delivery address",
    placeholder: "A-204, Sola Road, Ahmedabad 380060",
    autoComplete: "street-address",
  },
  {
    id: "phone",
    label: "Phone number",
    placeholder: "9876543210",
    autoComplete: "tel",
    inputMode: "tel",
  },
];
