# MyCash AI API

A beginner-friendly Node.js API for tracking personal expenses. It uses Express for API routes and MongoDB Atlas to save data.

## 1. Install Node.js

Install the current **LTS** version from [nodejs.org](https://nodejs.org/). Close and reopen PowerShell, then check:

```powershell
node --version
npm --version
```

## 2. Configure environment

1. Copy `.env.example` to a new `.env` file.
2. Replace `MONGODB_URI` in `.env` with your MongoDB Atlas connection string.
3. Set a strong `JWT_SECRET` value for token signing.
4. Set `GOOGLE_AI_API_KEY` to enable the Gemini-powered AI chat. Optionally set `GOOGLE_AI_MODEL` (defaults to `gemini-3.8-flash`).
5. Set `CORS_ORIGINS` to a comma-separated list of allowed frontend origins (including scheme and port). It defaults to `http://localhost:3000,https://my-expenses-fe.vercel.app`.

## 3. Install and run

```powershell
npm install
npm run dev
```

The server starts at `http://localhost:5000`. MongoDB creates the `expenses` collection automatically when you add the first expense.

## Try it

### Register a user

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/auth/register -ContentType 'application/json' -Body '{"name":"Jane Doe","email":"jane@example.com","password":"StrongPass123"}'
```

### Login

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/auth/login -ContentType 'application/json' -Body '{"email":"jane@example.com","password":"StrongPass123"}'
```

### Create an expense with the token

```powershell
$token = "<your-jwt-token>"
Invoke-RestMethod -Method Post -Uri http://localhost:5000/expenses -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body '{"amount":250,"category":"Food","description":"Lunch","expense_date":"2026-07-17"}'
```

| Method | URL | Purpose |
| --- | --- | --- |
| GET | `/` | Check that the server is running |
| POST | `/auth/register` | Register a user |
| POST | `/auth/login` | Login a user |
| POST | `/expenses` | Add an expense |
| GET | `/expenses` | List expenses |
| GET | `/expenses/:id` | Get one expense |
| PUT | `/expenses/:id` | Update an expense |
| DELETE | `/expenses/:id` | Delete an expense |
| GET | `/dashboard/summary` | View totals |
| POST | `/chat` | Ask Gemini about the authenticated user's expenses |

### Ask about expenses with Gemini

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/chat -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body '{"message":"Which category did I spend the most on this month?"}'
```

The server sends Gemini only the current authenticated user's expense records and returns its answer as `{ "answer": "..." }`. Keep the API key in `.env`; never send it from a browser or commit it.
