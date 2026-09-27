'use strict';

const app = require('./app');
const { connectDB } = require('./config/db');
const env = require('./config/env');
const logger = require('./config/logger');

const PORT = env.PORT;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`StockSense API running on port ${PORT} (${env.NODE_ENV})`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

start();
