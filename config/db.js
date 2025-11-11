const mongoose = require("mongoose");

require("dotenv").config();
const connection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("database connected successfully");
  } catch (error) {
    console.log("database connection failed", error);
  }
};

connection();
