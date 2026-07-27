const mongoose = require("mongoose");

const membersSchema = new mongoose.Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  role: {
    type: String,
  },
  joinedAt: {
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
  memberCount: { type: Number },
  createdAt: {
    type: Date,
  },
});

module.exports = mongoose.models.Clan || mongoose.model("Clan", clanSchema);
