const mongoose = require("mongoose");

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

module.exports =
  mongoose.models.Config || mongoose.model("Config", configSchema);
