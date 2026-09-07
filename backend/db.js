  const sql = require("mssql");
  require("dotenv").config();
const dbConfig = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

    options: {
      encrypt: process.env.DB_ENCRYPT === "true",
      trustServerCertificate:
        process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    },

    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  let pool;

  async function connectDB() {
    try {
      if (pool) {
        return pool;
      }

      pool = await sql.connect(dbConfig);

      console.log("");
      console.log("=================================");
      console.log("SQL SERVER CONNECTED");
      console.log("Database:", process.env.DB_NAME);
      console.log("=================================");
      console.log("");

      return pool;
    } catch (error) {
      console.error("");
      console.error("=================================");
      console.error("SQL SERVER CONNECTION FAILED");
      console.error("=================================");
      console.error(error.message);
      console.error("");

      throw error;
    }
  }

  module.exports = {
    sql,
    connectDB,
  };