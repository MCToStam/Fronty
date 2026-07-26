const mongoose = require("mongoose");

const { getConnection } = require("../index");

const connection = getConnection();

const nationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    flag: {
      type: String,
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  {
    _id: false,
  },
);

const mapSizeSchema = new mongoose.Schema(
  {
    width: Number,
    height: Number,
    num_land_tiles: Number,
  },
  {
    _id: false,
  },
);

const mapSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  translations: {
    type: Map,
    of: String,
    default: {},
  },

  thumbnail: {
    type: String,
    required: true,
  },

  categories: {
    type: [String],
    default: [],
  },

  featured_rank: {
    type: Number,
    default: null,
  },

  multiplayer_frequency: {
    type: Number,
    default: null,
  },

  map: mapSizeSchema,

  map4x: mapSizeSchema,

  map16x: mapSizeSchema,

  nations: {
    type: [nationSchema],
    default: [],
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = connection.model("Map", mapSchema);
