const app = require('./app');
const { testConnection } = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Verify database is reachable before accepting requests
  await testConnection();

  app.listen(PORT, () => {
    logger.info(`SpeakForge server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`Client URL: ${process.env.CLIENT_URL}`);
  });
}

startServer();
