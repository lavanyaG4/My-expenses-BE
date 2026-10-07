import { MongoClient } from 'mongodb';
import { config } from './config.js';
import dns from 'node:dns';

const client = new MongoClient(config.mongodbUri);
let database;
dns.setServers(["8.8.8.8", "8.8.4.4"]);
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
