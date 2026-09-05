const mongoose = require("mongoose");

const membersSchema = new mongoose.Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: { type: String },
  role: {
    type: String,
  },
  joinedAt: {
    type: Date,
  },
});

const statsSchema = new mongoose.Schema({
  available: {
    type: Boolean,
    default: false,
  },
  games: {
    type: Number,
    index: true,
  },
  wins: {
    type: Number,
    index: true,
  },
  losses: {
    type: Number,
    index: true,
  },
  playerSessions: {
    type: Number,
    index: true,
  },
  weightedWins: {
    type: Number,
    index: true,
  },
  weightedLosses: {
    type: Number,
    index: true,
  },
  weightedWLRatio: {
    type: Number,
    index: true,
  },
  start: {
    type: Date,
  },
  end: {
    type: Date,
  },
});

const clanSchema = new mongoose.Schema({
  tag: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  isOpen: {
    type: Boolean,
  },
  members: {
    type: [membersSchema],
  },
  discordUrl: { type: String },
  memberCount: { type: Number, index: true },
  createdAt: {
    type: Date,
    index: true,
  },
  stats: {
    type: statsSchema,
  },
});

module.exports = mongoose.models.Clan || mongoose.model("Clan", clanSchema);
