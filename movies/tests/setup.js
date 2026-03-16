// Jest setup file
// This file runs before all tests

// Load environment variables from .env file
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
