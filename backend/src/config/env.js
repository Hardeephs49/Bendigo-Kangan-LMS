const path = require('path');

// Validate required environment variables
const requiredEnvVars = [
  'OPENROUTER_API_KEY',
  'JWT_SECRET',
  'MONGODB_URI',
  'PORT'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Current environment variables:', Object.keys(process.env));
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Export validated environment variables
module.exports = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  MONGODB_URI: process.env.MONGODB_URI,
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
};