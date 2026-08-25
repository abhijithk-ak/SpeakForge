// Simple logger — never log passwords, tokens, or API keys

const logger = {
  info: (msg, meta = {}) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[INFO] ${new Date().toISOString()} ${msg}`, meta);
    }
  },
  error: (msg, err = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, err.message || err);
  },
  warn: (msg) => {
    console.warn(`[WARN] ${new Date().toISOString()} ${msg}`);
  }
};

module.exports = logger;
