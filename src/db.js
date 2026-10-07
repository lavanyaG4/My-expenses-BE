import { MongoClient } from 'mongodb';
import { config } from './config.js';

const client = new MongoClient(config.mongodbUri);
let database;

// Connect once when the application starts, then reuse the connection.
export async function connectDatabase() {
  await client.connect();
  database = client.db(config.mongodbDatabase);
  await database.collection('expenses').createIndex({ expense_date: -1, _id: -1 });
  await database.collection('users').createIndex({ email: 1 }, { unique: true });
  console.log(`Connected to MongoDB database: ${config.mongodbDatabase}`);
}

export function expensesCollection() {
  if (!database) throw new Error('MongoDB is not connected');
  return database.collection('expenses');
}

export function usersCollection() {
  if (!database) throw new Error('MongoDB is not connected');
  return database.collection('users');
}
