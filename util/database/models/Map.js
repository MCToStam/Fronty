const mongoose = require("mongoose");

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
    url: { type: String },
    width: { type: Number },
    height: { type: Number },
    num_land_tiles: { type: Number },
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
    type: Map,
    of: [String],
    default: {},
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
});

module.exports = mongoose.models.Map || mongoose.model("Map", mapSchema);
