import 'dotenv/config';

const isTestEnvironment = process.env.NODE_ENV === 'test';

const {
  MONGODB_URI,
  MONGODB_DATABASE = 'MyCash',
  PORT = 5000,
  CORS_ORIGINS = 'http://localhost:3000,https://my-expenses-fe.vercel.app',
  GOOGLE_AI_API_KEY,
  GOOGLE_AI_MODEL = 'gemini-3.8-flash',
} = process.env;
const mongodbUri = MONGODB_URI ?? (isTestEnvironment ? 'mongodb://127.0.0.1:27017/MyCash-test' : undefined);

if (!mongodbUri) {
  throw new Error('MONGODB_URI is missing. Copy .env.example to .env and add your MongoDB Atlas URL.');
}

export const config = {
  mongodbUri,
  mongodbDatabase: MONGODB_DATABASE,
  port: Number(PORT),
  corsOrigins: CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
  googleAiApiKey: GOOGLE_AI_API_KEY,
  googleAiModel: GOOGLE_AI_MODEL,
};
