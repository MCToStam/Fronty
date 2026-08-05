const mongoose = require("mongoose");
const log = require("../module/log");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectMongo() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI)
      .then((mongooseInstance) => {
        log("MongoDB is successfully connected", "READY", "green");
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        log(`Error connecting to MongoDB : ${err}`, "error", "red");
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = {
  connectMongo,
};
