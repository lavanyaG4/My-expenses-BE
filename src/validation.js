import { expenseSchema, userLoginSchema, userRegistrationSchema } from './schemas.js';

function createValidationError(message, details = []) {
  const error = new Error(message);
  error.statusCode = 400;
  error.details = details;
  return error;
}

function validateSchema(schema, body) {
  const errors = [];
  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const value = body?.[fieldName];
    const isRequired = fieldSchema.required ?? false;

    if (value === undefined || value === null || value === '') {
      if (isRequired) errors.push(`${fieldName} is required`);
      continue;
    }

    if (fieldSchema.type === 'number') {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue <= 0 || !/^\d+(\.\d{1,2})?$/.test(String(value))) {
        errors.push(`${fieldName} must be a positive number with up to two decimal places`);
      }
    }

    if (fieldSchema.type === 'string') {
      const stringValue = String(value).trim();
      if (stringValue.length < (fieldSchema.minLength ?? 0)) {
        errors.push(`${fieldName} must be at least ${fieldSchema.minLength} characters long`);
      }
      if (fieldSchema.maxLength && stringValue.length > fieldSchema.maxLength) {
        errors.push(`${fieldName} must be at most ${fieldSchema.maxLength} characters long`);
      }
    }

    if (fieldSchema.type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) {
        errors.push('email must be a valid email address');
      }
    }

    if (fieldSchema.type === 'dateString') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) || Number.isNaN(Date.parse(String(value)))) {
        errors.push('expense_date must use YYYY-MM-DD format');
      }
    }
  }

  return errors;
}

// Validate request data before it reaches the database.
export function validateExpense(body) {
  const errors = validateSchema(expenseSchema, body);
  const amount = Number(body.amount);
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const description = body.description == null ? null : String(body.description).trim();
  const expenseDate = body.expense_date ?? new Date().toISOString().slice(0, 10);

  if (errors.length) {
    throw createValidationError('Validation failed', errors);
  }

  return { errors: [], value: { amount, category, description, expenseDate } };
}

export function validateUserRegistration(body) {
  const errors = validateSchema(userRegistrationSchema, body);
  if (errors.length) {
    throw createValidationError('Validation failed', errors);
  }

  return {
    errors: [],
    value: {
      name: String(body.name).trim(),
      email: String(body.email).trim(),
      password: String(body.password),
    },
  };
}

export function validateUserLogin(body) {
  const errors = validateSchema(userLoginSchema, body);
  if (errors.length) {
    throw createValidationError('Validation failed', errors);
  }

  return {
    errors: [],
    value: {
      email: String(body.email).trim(),
      password: String(body.password),
    },
  };
}
