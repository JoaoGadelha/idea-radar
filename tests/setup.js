/**
 * Setup global de testes
 * Configuração de variáveis de ambiente e mocks globais
 */

// Mock de variáveis de ambiente necessárias para os testes
process.env.DATABASE_URL = process.env.DATABASE_URL || 'mock-database-url';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'mock-jwt-secret-for-tests';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'mock-gemini-key';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'mock-resend-key';
