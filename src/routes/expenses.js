import { ObjectId } from 'mongodb';
import { Router } from 'express';
import { expensesCollection } from '../db.js';
import { validateExpense } from '../validation.js';

export function createExpensesRouter(collectionGetter = expensesCollection) {
  const expensesRouter = Router();

  function formatExpense(expense) {
    if (!expense) return null;
    const { _id, ...rest } = expense;
    return { id: _id.toString(), ...rest };
  }

  function expenseId(id, response) {
    if (!ObjectId.isValid(id)) {
      response.status(404).json({ message: 'Expense not found' });
      return null;
    }
    return new ObjectId(id);
  }

  function userScope(request) {
    return { user_id: request.user?.id };
  }

  expensesRouter.post('/', async (request, response, next) => {
    try {
      const { errors, value } = validateExpense(request.body);
      if (errors.length) return response.status(400).json({ errors });
      const now = new Date();
      const expense = {
        user_id: request.user.id,
        amount: value.amount,
        category: value.category,
        description: value.description,
        expense_date: value.expenseDate,
        created_at: now,
        updated_at: now,
      };
      const result = await collectionGetter().insertOne(expense);
      return response.status(201).json(formatExpense({ _id: result.insertedId, ...expense }));
    } catch (error) { return next(error); }
  });

  expensesRouter.get('/', async (request, response, next) => {
    try {
      const expenses = await collectionGetter().find(userScope(request)).sort({ expense_date: -1, _id: -1 }).toArray();
      return response.json(expenses.map(formatExpense));
    } catch (error) { return next(error); }
  });

  expensesRouter.get('/:id', async (request, response, next) => {
    try {
      const id = expenseId(request.params.id, response);
      if (!id) return;
      const expense = await collectionGetter().findOne({ ...userScope(request), _id: id });
      return expense ? response.json(formatExpense(expense)) : response.status(404).json({ message: 'Expense not found' });
    } catch (error) { return next(error); }
  });

  expensesRouter.put('/:id', async (request, response, next) => {
    try {
      const id = expenseId(request.params.id, response);
      if (!id) return;
      const { errors, value } = validateExpense(request.body);
      if (errors.length) return response.status(400).json({ errors });
      const result = await collectionGetter().findOneAndUpdate(
        { ...userScope(request), _id: id },
        { $set: { amount: value.amount, category: value.category, description: value.description, expense_date: value.expenseDate, updated_at: new Date() } },
        { returnDocument: 'after' }
      );
      return result ? response.json(formatExpense(result)) : response.status(404).json({ message: 'Expense not found' });
    } catch (error) { return next(error); }
  });

  expensesRouter.delete('/:id', async (request, response, next) => {
    try {
      const id = expenseId(request.params.id, response);
      if (!id) return;
      const result = await collectionGetter().deleteOne({ ...userScope(request), _id: id });
      return result.deletedCount ? response.status(204).send() : response.status(404).json({ message: 'Expense not found' });
    } catch (error) { return next(error); }
  });

  return expensesRouter;
}

export const expensesRouter = createExpensesRouter();
