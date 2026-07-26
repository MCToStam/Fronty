const mongoose = require("mongoose");

const { getConnection } = require("../index");

const connection = getConnection();

const configSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  language: {
    type: String,
    default: null,
  },
});

module.exports = connection.model("Config", configSchema);
