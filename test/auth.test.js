import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { createApp } from '../src/server.js';

function createCollections() {
  const users = [];
  const expenses = [];

  const userCollection = {
    async insertOne(user) {
      const insertedId = new ObjectId();
      users.push({ _id: insertedId, ...user });
      return { insertedId };
    },
    async findOne(query) {
      if (query.email) {
        return users.find((user) => user.email === query.email) ?? null;
      }
      return null;
    },
  };

  const expenseCollection = {
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
    async findOneAndUpdate(query, update) {
      const match = expenses.find((expense) => expense._id.toString() === query._id.toString());
      if (!match) return null;
      const updatedExpense = { ...match, ...update.$set, _id: match._id };
      const index = expenses.findIndex((expense) => expense._id.toString() === query._id.toString());
      expenses[index] = updatedExpense;
      return { value: updatedExpense };
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

  return { userCollection, expenseCollection };
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

test('POST /auth/register creates a user and returns a token', async () => {
  const { userCollection, expenseCollection } = createCollections();
  const app = createApp({
    collectionGetter: () => expenseCollection,
    usersCollectionGetter: () => userCollection,
  });

  const { response, body } = await request(app, '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Jane Doe', email: 'jane@example.com', password: 'StrongPass123' }),
  });

  assert.equal(response.status, 201);
  const payload = JSON.parse(body);
  assert.equal(payload.user.email, 'jane@example.com');
  assert.ok(payload.token);
});

test('GET /expenses requires a bearer token', async () => {
  const { userCollection, expenseCollection } = createCollections();
  const app = createApp({
    collectionGetter: () => expenseCollection,
    usersCollectionGetter: () => userCollection,
  });

  const { response } = await request(app, '/expenses');
  assert.equal(response.status, 401);
});
