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
        log("MongoDB est correctement connecté", "READY", "green");
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        log(`Erreur lors de la connexion MongoDB : ${err}`, "ERROR", "red");
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = {
  connectMongo,
};
