import express from 'express';
import { pathToFileURL } from 'node:url';
import { config } from './config.js';
import { connectDatabase, expensesCollection, usersCollection } from './db.js';
import { createExpensesRouter } from './routes/expenses.js';
import { authenticateRequest, createToken, hashPassword, verifyPassword } from './auth.js';
import { validateUserLogin, validateUserRegistration } from './validation.js';
import { generateExpenseAnswer } from './gemini.js';

export function createApp(options = {}) {
  const collectionGetter = options.collectionGetter ?? expensesCollection;
  const usersGetter = options.usersCollectionGetter ?? usersCollection;
  const chatService = options.chatService ?? generateExpenseAnswer;
  const app = express();

  app.use(express.json());
  app.get('/', (_request, response) => response.json({ message: 'MyCash API Running' }));

  app.post('/auth/register', async (request, response, next) => {
    try {
      const { errors, value } = validateUserRegistration(request.body);
      if (errors.length) return response.status(400).json({ errors });

      const existingUser = await usersGetter().findOne({ email: value.email });
      if (existingUser) {
        return response.status(409).json({ message: 'User already exists' });
      }

      const newUser = {
        name: value.name,
        email: value.email,
        password: hashPassword(value.password),
        created_at: new Date(),
      };

      const result = await usersGetter().insertOne(newUser);
      const token = createToken({ id: result.insertedId.toString(), email: value.email });
      return response.status(201).json({ token, user: { id: result.insertedId.toString(), name: value.name, email: value.email } });
    } catch (error) {
      return next(error);
    }
  });

  app.post('/auth/login', async (request, response, next) => {
    try {
      const { errors, value } = validateUserLogin(request.body);
      if (errors.length) return response.status(400).json({ errors });

      const user = await usersGetter().findOne({ email: value.email });
      if (!user || !verifyPassword(value.password, user.password)) {
        return response.status(401).json({ message: 'Invalid credentials' });
      }

      const token = createToken({ id: user._id.toString(), email: user.email });
      return response.json({ token, user: { id: user._id.toString(), name: user.name, email: user.email } });
    } catch (error) {
      return next(error);
    }
  });

  app.use('/expenses', authenticateRequest, createExpensesRouter(collectionGetter));

  app.get('/dashboard/summary', authenticateRequest, async (request, response, next) => {
    try {
      const [summary] = await collectionGetter().aggregate([
        { $match: { user_id: request.user.id } },
        { $group: { _id: null, total_expenses: { $sum: '$amount' }, categories: { $addToSet: '$category' }, total_transactions: { $sum: 1 } } },
        { $project: { _id: 0, total_expenses: 1, total_categories: { $size: '$categories' }, total_transactions: 1 } }
      ]).toArray();
      response.json(summary ?? { total_expenses: 0, total_categories: 0, total_transactions: 0 });
    } catch (error) { next(error); }
  });

  app.post('/chat', authenticateRequest, async (request, response, next) => {
    try {
      const message = String(request.body?.message ?? '').trim();
      if (!message) {
        return response.status(400).json({ message: 'message is required' });
      }

      const expenses = await collectionGetter().find({ user_id: request.user.id }).sort({ expense_date: -1, _id: -1 }).toArray();
      try {
        const answer = await chatService({ message, expenses });

        return response.json({ answer });
      } catch (error) {
        console.error('AI service failed:', error);

        // Fallback response when Gemini is unavailable
        const totalExpenses = expenses.reduce(
          (total, expense) => total + Number(expense.amount || 0),
          0
        );

        const categories = new Set(
          expenses.map(expense => expense.category).filter(Boolean)
        );

        const summary = {
          total_expenses: totalExpenses,
          total_categories: categories.size,
          total_transactions: expenses.length
        };

        return response.json({
          answer: `AI is temporarily unavailable. Your current expense summary is: ₹${totalExpenses.toFixed(2)} spent across ${expenses.length} transactions and ${categories.size} categories.`,
          fallback: true,
          summary
        });
      }
    } catch (error) {
      return next(error);
    }
  });

  app.use((error, _request, response, _next) => {
    console.error(error);

    if (error?.statusCode === 400) {
      return response.status(400).json({ message: error.message, errors: error.details ?? [] });
    }

    if (error?.statusCode === 401) {
      return response.status(401).json({ message: error.message ?? 'Authentication required' });
    }

    if (error?.statusCode === 404) {
      return response.status(404).json({ message: error.message ?? 'Resource not found' });
    }

    if (error?.statusCode === 503) {
      return response.status(503).json({ message: error.message });
    }

    response.status(500).json({ message: 'An unexpected server error occurred' });
  });

  return app;
}

export async function startServer(options = {}) {
  await connectDatabase();
  const app = createApp(options);
  return app.listen(config.port, () => console.log(`MyCash API is running at http://localhost:${config.port}`));
}

const isDirectlyInvoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectlyInvoked) {
  startServer().catch((error) => {
    console.error('The server could not start:', error.message);
    process.exit(1);
  });
}
