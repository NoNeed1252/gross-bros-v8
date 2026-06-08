module.exports = {
  apps: [
    {
      name: "gross-bros-v8",
      script: "./server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 8080,
        XAMAN_API_KEY: process.env.XAMAN_API_KEY,
        XAMAN_API_SECRET: process.env.XAMAN_API_SECRET,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
      }
    }
  ]
};
