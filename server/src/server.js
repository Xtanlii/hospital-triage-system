const env = require('./config/env');
const app = require('./app');
const logger = require('./utils/logger');
const prisma = require('./config/db');
const { testConnection } = require('./config/db');

const PORT = env.PORT || 5000;

async function startServer() {
  // Test PostgreSQL database connection
  await testConnection();

  const server = app.listen(PORT, () => {
    logger.info(`Intelligent Triage & Queue Management Server running on port ${PORT} (${env.NODE_ENV})`);
    logger.info(`Health check available at http://localhost:${PORT}/health`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down server gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await prisma.$disconnect();
        logger.info('Database connection closed.');
      } catch (err) {
        logger.error('Error closing database connection', { meta: { error: err.message } });
      }
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  logger.error('Fatal error starting server', { meta: { error: err.message, stack: err.stack } });
  process.exit(1);
});
