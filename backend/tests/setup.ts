// Runs before any test file is loaded. Provides minimum env so config/env.ts
// can validate without a real .env file.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-1234';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-1234';
process.env.JWT_ACCESS_TTL = '15m';
process.env.JWT_REFRESH_TTL = '30d';
process.env.CORS_ORIGIN = 'http://localhost:5173';
