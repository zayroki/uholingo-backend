const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Гарантированно находим .env файл относительно ecosystem.config.cjs
const envPath = path.resolve(__dirname, '.env');
const envConfig = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};

module.exports = {
  apps: [
    {
      name: "uholingo",
      script: "./dist/server.js",
      instances: 1,
      exec_mode: "fork",
      wait_ready: false,
      kill_timeout: 3000,
      env: {
        NODE_ENV: "production",
        ...envConfig
      }
    }
  ]
};
