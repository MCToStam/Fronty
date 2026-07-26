const mongoose = require("mongoose");
const log = require("../../util/module/log");

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
      .createConnection(process.env.MONGO_URI)
      .asPromise()
      .then((connection) => {
        log("MongoDB est correctement connecté", "READY", "green");
        return connection;
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

function getConnection() {
  return cached.conn;
}

module.exports = {
  connectMongo,
  getConnection,
};
