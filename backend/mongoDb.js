const mongoose = require("mongoose");

async function connectMongoDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is missing from .env file"
      );
    }

    const connection = await mongoose.connect(
      process.env.MONGODB_URI,
      {
        dbName: "disha_academy",
        serverSelectionTimeoutMS: 10000,
      }
    );

    console.log("");
    console.log("=================================");
    console.log("MONGODB CONNECTED SUCCESSFULLY");
    console.log("=================================");
    console.log(
      `Database: ${connection.connection.name}`
    );
    console.log(
      `Host: ${connection.connection.host}`
    );
    console.log("=================================");
    console.log("");

    return connection;
  } catch (error) {
    console.error("");
    console.error("=================================");
    console.error("MONGODB CONNECTION FAILED");
    console.error("=================================");
    console.error(error.message);
    console.error("=================================");
    console.error("");

    throw error;
  }
}

module.exports = {
  connectMongoDB,
};