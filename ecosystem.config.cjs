/**
 * PM2 ecosystem config for Nexora Platform
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 reload ecosystem.config.cjs --env production
 *
 * Ports:
 *   nexora-api  → 4000  (Nginx proxies /api to this)
 *   nexora-web  → 3000  (Nginx proxies / to this)
 */

module.exports = {
  apps: [
    {
      name: "nexora-api",
      cwd: "/var/www/nexora-platform/server",
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
        PORT: "4000",
      },
      // Restart policy
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 2000,
      // Logs
      out_file: "/var/log/pm2/nexora-api-out.log",
      error_file: "/var/log/pm2/nexora-api-err.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    {
      name: "nexora-web",
      cwd: "/var/www/nexora-platform/website",
      script: "node_modules/.bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 2000,
      out_file: "/var/log/pm2/nexora-web-out.log",
      error_file: "/var/log/pm2/nexora-web-err.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
