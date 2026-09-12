// pm2 process definition for SeverusByAnfal.
// Usage: pm2 start deploy/ecosystem.config.js   (see deploy/setup-server.sh)
module.exports = {
  apps: [
    {
      name: "severusbyanfal",
      script: "dist/server.js",
      cwd: __dirname + "/..",
      instances: 1,
      exec_mode: "fork",
      // SQLite (node:sqlite) is a single-file, single-writer database, so
      // this app is designed to run as exactly one process. If you outgrow
      // that, migrate src/db to PostgreSQL before scaling to multiple
      // instances/cluster mode.
      autorestart: true,
      max_restarts: 20,
      restart_delay: 2000,
      env: {
        NODE_ENV: "production",
        NODE_NO_WARNINGS: "1",
      },
    },
  ],
};
