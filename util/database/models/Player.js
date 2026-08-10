const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: String,
  createdAt: Date,
  stats: {
    type: mongoose.Schema.Types.Mixed,
  },
  clans: [
    {
      tag: String,
      name: String,
      role: String,
      joinedAt: Date,
      memberCount: Number,
    },
  ],
});

module.exports =
  mongoose.models.Player || mongoose.model("Player", playerSchema);
