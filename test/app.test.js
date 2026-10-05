import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { createApp } from '../src/server.js';
import { createToken } from '../src/auth.js';

function createMockCollection() {
  const expenses = [];

  return {
    async insertOne(expense) {
      const insertedId = new ObjectId();
      expenses.push({ _id: insertedId, ...expense });
      return { insertedId };
    },
    find() {
      return {
        sort() {
          return {
            async toArray() {
              return expenses.map((expense) => ({ ...expense, _id: expense._id }));
            },
          };
        },
      };
    },
    async findOne({ _id }) {
      return expenses.find((expense) => expense._id.toString() === _id.toString()) ?? null;
    },
    async findOneAndUpdate(query, update, options) {
      const match = expenses.find((expense) => expense._id.toString() === query._id.toString());
      if (!match) return null;
      const updatedExpense = { ...match, ...update.$set, _id: match._id };
      const index = expenses.findIndex((expense) => expense._id.toString() === query._id.toString());
      expenses[index] = updatedExpense;
      return updatedExpense;
    },
    async deleteOne({ _id }) {
      const index = expenses.findIndex((expense) => expense._id.toString() === _id.toString());
      if (index === -1) return { deletedCount: 0 };
      expenses.splice(index, 1);
      return { deletedCount: 1 };
    },
    aggregate() {
      return {
        async toArray() {
          return [{ total_expenses: 0, total_categories: 0, total_transactions: 0 }];
        },
      };
    },
  };
}

async function request(app, path, options = {}) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
  const body = await response.text();

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  return { response, body };
}

test('GET / returns the API health message', async () => {
  const app = createApp({ collectionGetter: createMockCollection });
  const { response, body } = await request(app, '/');

  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(body), { message: 'MyCash API Running' });
});

test('POST /expenses persists a new expense', async () => {
  const collection = createMockCollection();
  const app = createApp({ collectionGetter: () => collection });
  const token = createToken({ id: 'test-user', email: 'test@example.com' });

  const { response, body } = await request(app, '/expenses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount: 250, category: 'Food', description: 'Lunch', expense_date: '2026-07-17' }),
  });

  assert.equal(response.status, 201);
  const payload = JSON.parse(body);
  assert.equal(payload.amount, 250);
  assert.equal(payload.category, 'Food');
  assert.equal(payload.description, 'Lunch');
  assert.equal(payload.expense_date, '2026-07-17');
});

test('POST /chat sends the authenticated user expenses to the AI service', async () => {
  const collection = createMockCollection();
  await collection.insertOne({ user_id: 'user-1', amount: 250, category: 'Food', description: 'Lunch', expense_date: '2026-07-17', created_at: new Date(), updated_at: new Date() });

  let chatInput;
  const app = createApp({
    collectionGetter: () => collection,
    chatService: async (input) => {
      chatInput = input;
      return 'You spent 250 on Food.';
    },
  });
  const token = createToken({ id: 'user-1', email: 'test@example.com' });
  const { response, body } = await request(app, '/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message: 'How much did I spend on Food?' }),
  });

  assert.equal(response.status, 200);
  const payload = JSON.parse(body);
  assert.equal(payload.answer, 'You spent 250 on Food.');
  assert.equal(chatInput.message, 'How much did I spend on Food?');
  assert.equal(chatInput.expenses.length, 1);
  assert.equal(chatInput.expenses[0].user_id, 'user-1');
});
