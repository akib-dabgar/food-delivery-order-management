import { useState, type FormEvent } from "react";
import {
  CHECKOUT_FIELDS,
  CUSTOMER_FIELD_ORDER,
  EMPTY_CUSTOMER,
} from "../lib/checkoutFields";
import { buttonPrimary, errorBox } from "../lib/ui";
import { validateCustomer, type CustomerErrors } from "../lib/validation";
import type { CheckoutFormProps, Customer } from "../types";
import { SpinnerIcon } from "./icons";

const inputBase =
  "rounded-xl border bg-surface px-3.5 py-2.5 text-sm transition placeholder:text-muted/60";
const inputInvalid = "border-red-500 ring-2 ring-red-500/15";
const inputValid = "border-line hover:border-muted/50";

export default function CheckoutForm({
  onSubmit,
  submitting,
  serverError,
}: CheckoutFormProps) {
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER);
  const [errors, setErrors] = useState<CustomerErrors>({});

  function update(field: keyof Customer, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
    // Clear the message for a field as soon as the user edits it.
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validateCustomer(customer);
    setErrors(found);

    const firstInvalid = CUSTOMER_FIELD_ORDER.find((name) => found[name]);

    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    onSubmit({
      name: customer.name.trim(),
      address: customer.address.trim(),
      phone: customer.phone.trim(),
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {CHECKOUT_FIELDS.map(
        ({ id, label, placeholder, autoComplete, inputMode }) => {
          const error = errors[id];

          return (
            <div key={id} className="flex flex-col gap-1.5">
              <label htmlFor={id} className="text-sm font-semibold">
                {label}
              </label>

              <input
                id={id}
                name={id}
                value={customer[id]}
                placeholder={placeholder}
                autoComplete={autoComplete}
                inputMode={inputMode}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                onChange={(event) => update(id, event.target.value)}
                className={`${inputBase} ${error ? inputInvalid : inputValid}`}
              />

              {error && (
                <p
                  id={`${id}-error`}
                  className="text-xs font-medium text-red-600"
                >
                  {error}
                </p>
              )}
            </div>
          );
        },
      )}

      {serverError && (
        <p role="alert" className={errorBox}>
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={`${buttonPrimary} mt-1 flex items-center justify-center gap-2 px-4 py-3 text-sm`}
      >
        {submitting && <SpinnerIcon />}
        {submitting ? "Placing order…" : "Place order"}
      </button>
    </form>
  );
}
