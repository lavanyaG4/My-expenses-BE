# MyCash AI — Product Requirements Document

**Product:** MyCash AI  
**Version:** 1.0 — MVP  
**Status:** Draft for approval  
**Product type:** REST API backend

## 1. Product summary

MyCash AI is a personal expense-tracking backend. In the MVP, a user can create, view, update, and delete expense records and retrieve dashboard totals. The API is designed so an AI assistant and richer reporting can be added in a later phase without a disruptive database redesign.

## 2. Goals

The MVP will:

- Record a daily expense with an amount and category.
- Retrieve all expenses or one expense by ID.
- Edit and delete an expense.
- Provide aggregate dashboard metrics.
- Expose documented REST APIs for a future frontend.
- Preserve enough date and description data to support later reporting and AI queries.

## 3. Scope

### In scope — MVP

- Health-check endpoint.
- Expense CRUD APIs.
- Dashboard summary API.
- MongoDB persistence.
- Request validation and consistent error responses.
- Basic user registration and login.
- Bearer-token authentication for protected routes.
- Interactive API documentation via OpenAPI/Swagger.

### Out of scope — MVP

- AI chat and AI-generated insights.
- Budgets, recurring expenses, notifications, receipt OCR, CSV import/export, and charts.
- A web or mobile frontend.

## 4. Users and primary use cases

The initial API supports registered users who can sign up, sign in, and access their own authenticated expense data through bearer-token protection.

| Use case | User outcome |
| --- | --- |
| Record an expense | An expense amount, category, optional description, and date are saved. |
| Review expenses | A user can retrieve their expenses and inspect an individual record. |
| Correct an entry | A user can update an expense. |
| Remove an entry | A user can delete an expense. |
| View a summary | A user sees total spending, category count, and transaction count. |

## 5. Functional requirements

### 5.1 Expense management

| ID | Requirement |
| --- | --- |
| FR-01 | The system shall create an expense. |
| FR-02 | The system shall return all expenses. |
| FR-03 | The system shall return an expense by ID. |
| FR-04 | The system shall update an existing expense. |
| FR-05 | The system shall delete an existing expense. |
| FR-06 | The system shall reject invalid expense data with a client-error response. |

### 5.2 Dashboard

| ID | Requirement |
| --- | --- |
| FR-07 | The system shall return the total amount spent across recorded expenses. |
| FR-08 | The system shall return the number of distinct expense categories. |
| FR-09 | The system shall return the total number of expense transactions. |

### 5.3 Authentication and user access

The system shall support user registration and login, and shall require a valid bearer token for protected expense and dashboard routes.

### 5.4 Future AI capability

AI chat is not part of the MVP. A future `/chat` endpoint may answer date-, category-, amount-, and trend-based spending questions using expense data.

Examples: “How much did I spend today?”, “What did I spend on food this month?”, and “Which category has the highest spending?”

## 6. Data model

### Expense

| Field | Type | Required | Rules / description |
| --- | --- | --- | --- |
| `id` | integer | System-generated | Primary key. |
| `amount` | decimal(10,2) | Yes | Must be greater than 0. Stored as an exact decimal, never a floating-point value. |
| `category` | string (max. 100) | Yes | Expense category, such as `Food` or `Fuel`. |
| `description` | string (max. 500) | No | Optional note, such as `Lunch with client`. |
| `expense_date` | date | Yes | The date the money was spent; defaults to the current date if omitted. |
| `created_at` | timestamp with time zone | System-generated | Timestamp when the record was created. |
| `updated_at` | timestamp with time zone | System-generated | Timestamp of the latest update. |

`expense_date` represents when the expense occurred; `created_at` represents when it was entered. Keeping both makes future reports and AI queries reliable.

## 7. API requirements

**Base URL (local):** `http://localhost:5000`  
**Content type:** `application/json`

### 7.1 Health check

`GET /`

**Success — 200**

```json
{ "message": "MyCash API Running" }
```

### 7.2 Register user

`POST /auth/register`

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongPass123"
}
```

**Success — 201:** Returns a JWT token and the created user profile.

### 7.3 Login user

`POST /auth/login`

```json
{
  "email": "jane@example.com",
  "password": "StrongPass123"
}
```

**Success — 200:** Returns a JWT token and the authenticated user profile.

### 7.4 Create expense

`POST /expenses`

```json
{
  "amount": 250.00,
  "category": "Food",
  "description": "Lunch",
  "expense_date": "2026-07-10"
}
```

**Success — 201:** Returns the created expense, including generated fields.

### 7.5 List expenses

`GET /expenses`

**Success — 200:** Returns an array of expenses, ordered by `expense_date` descending and then `id` descending.

### 7.6 Get one expense

`GET /expenses/{id}`

**Success — 200:** Returns the expense.  
**Not found — 404:** Returned when no expense has the requested ID.

### 7.7 Update expense

`PUT /expenses/{id}`

The request contains the complete editable expense representation (`amount`, `category`, optional `description`, and `expense_date`).

**Success — 200:** Returns the updated expense.  
**Not found — 404:** Returned when no expense has the requested ID.

### 7.8 Delete expense

`DELETE /expenses/{id}`

**Success — 204:** No response body.  
**Not found — 404:** Returned when no expense has the requested ID.

### 7.9 Dashboard summary

`GET /dashboard/summary`

**Success — 200**

```json
{
  "total_expenses": 1050.00,
  "total_categories": 2,
  "total_transactions": 3
}
```

## 8. Validation and error handling

| Situation | Status | Expected behavior |
| --- | --- | --- |
| Valid register request | 201 | Create the user and return a token. |
| Valid login request | 200 | Return a token for the authenticated user. |
| Missing or invalid bearer token | 401 | Reject protected requests with an authentication error. |
| Valid create request | 201 | Create and return the expense. |
| Valid read or update request | 200 | Return the requested resource. |
| Valid delete request | 204 | Delete with no response body. |
| Invalid JSON or field value | 400 | Return validation error details. |
| Missing expense | 404 | Return a consistent not-found message. |
| Unexpected server failure | 500 | Do not expose internal error details. |

## 9. Non-functional requirements

- Use Node.js, Express, the MongoDB Node.js driver, and MongoDB Atlas.
- Store database configuration and secrets in environment variables; never commit `.env` files.
- Provide Swagger UI at `/docs` and ReDoc at `/redoc`.
- Use UTC-aware timestamps in the database.
- Add automated tests for expense CRUD, validation, and dashboard totals.
- Version and document database migrations.

## 10. Proposed technical structure

```text
app/
├── api/
│   └── expenses.py
├── core/
│   └── config.py
├── db/
│   ├── database.py
│   └── models.py
├── schemas/
│   └── expense.py
├── services/
│   └── expense_service.py
└── main.py
tests/
```

## 11. Future roadmap

- Per-user expense isolation and `user_id` ownership on expenses.
- Filtering, pagination, and date/category summary reports.
- Monthly budgets and spending alerts.
- Recurring expenses.
- CSV import/export and receipt OCR.
- AI chat, insights, trends, and comparisons.
- Multi-currency support, charts, email reports, and voice entry.

## 12. Assumptions requiring confirmation

- The MVP now supports basic user registration and login with bearer-token authentication.
- Categories are free-text values in the MVP; there is no separate category-management API.
- Amounts are recorded in one currency. The API does not yet store a currency code.
- List and dashboard endpoints initially return all data, without date filters or pagination.
- Deletion is permanent rather than recoverable (soft deletion).

## 13. Acceptance criteria

The MVP is ready when:

1. A user can register and receive a valid token.
2. A registered user can log in and receive a valid token.
3. Protected expense and dashboard routes reject requests without a valid bearer token.
4. A valid expense can be created and persisted in MongoDB.
5. All expenses and a single expense can be retrieved correctly.
6. An expense can be updated and permanently deleted.
7. Invalid amounts, malformed dates, and missing required fields are rejected.
8. Missing expense IDs return `404`.
9. Dashboard totals correctly reflect create, update, and delete operations.
10. API documentation is available at `/docs`.
