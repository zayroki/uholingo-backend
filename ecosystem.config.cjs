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
      }
    }
  ]
};
