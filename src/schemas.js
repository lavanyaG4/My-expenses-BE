// Shared request/response shape documentation for this API.
// These objects are intentionally small and explicit so the auth + expense contract is easy to reason about.

export const expenseSchema = Object.freeze({
  amount: { type: 'number', required: true, min: 0.01, maxDecimals: 2 },
  category: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  description: { type: 'string', required: false, maxLength: 500 },
  expense_date: { type: 'dateString', required: true, format: 'YYYY-MM-DD' },
});

export const userRegistrationSchema = Object.freeze({
  name: { type: 'string', required: true, minLength: 1 },
  email: { type: 'email', required: true },
  password: { type: 'string', required: true, minLength: 8 },
});

export const userLoginSchema = Object.freeze({
  email: { type: 'email', required: true },
  password: { type: 'string', required: true },
});
