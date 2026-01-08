const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "ecom"  
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host} / Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;