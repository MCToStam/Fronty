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
  },
  wins: {
    type: Number,
  },
  losses: {
    type: Number,
  },
  playerSessions: {
    type: Number,
  },
  weightedWins: {
    type: Number,
  },
  weightedLosses: {
    type: Number,
  },
  weightedWLRatio: {
    type: Number,
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
  memberCount: { type: Number },
  createdAt: {
    type: Date,
  },
  stats: {
    type: statsSchema,
  },
});

module.exports = mongoose.models.Clan || mongoose.model("Clan", clanSchema);
