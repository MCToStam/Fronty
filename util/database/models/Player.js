const mongoose = require("mongoose");

const boatsTotalSchema = new mongoose.Schema(
  {
    trade: {
      sent: {
        type: Number,
        default: 0,
      },
      arrived: {
        type: Number,
        default: 0,
      },
      captured: {
        type: Number,
        default: 0,
      },
      destroyed: {
        type: Number,
        default: 0,
      },
    },
    trans: {
      sent: {
        type: Number,
        default: 0,
      },
      arrived: {
        type: Number,
        default: 0,
      },
      captured: {
        type: Number,
        default: 0,
      },
      destroyed: {
        type: Number,
        default: 0,
      },
    },
  },
  { _id: false },
);

const bombsTotalSchema = new mongoose.Schema(
  {
    abomb: {
      launched: {
        type: Number,
        default: 0,
      },
      landed: {
        type: Number,
        default: 0,
      },
      intercepted: {
        type: Number,
        default: 0,
      },
    },
    hbomb: {
      launched: {
        type: Number,
        default: 0,
      },
      landed: {
        type: Number,
        default: 0,
      },
      intercepted: {
        type: Number,
        default: 0,
      },
    },
    mirv: {
      launched: {
        type: Number,
        default: 0,
      },
      landed: {
        type: Number,
        default: 0,
      },
      intercepted: {
        type: Number,
        default: 0,
      },
    },
    mirvw: {
      launched: {
        type: Number,
        default: 0,
      },
      landed: {
        type: Number,
        default: 0,
      },
      intercepted: {
        type: Number,
        default: 0,
      },
    },
  },
  { _id: false },
);

const unitsTotalSchema = new mongoose.Schema(
  {
    city: {
      built: {
        type: Number,
        default: 0,
      },
      destroyed: {
        type: Number,
        default: 0,
      },
      captured: {
        type: Number,
        default: 0,
      },
      lost: {
        type: Number,
        default: 0,
      },
    },
    defp: {
      built: {
        type: Number,
        default: 0,
      },
      destroyed: {
        type: Number,
        default: 0,
      },
      captured: {
        type: Number,
        default: 0,
      },
      lost: {
        type: Number,
        default: 0,
      },
    },
    port: {
      built: {
        type: Number,
        default: 0,
      },
      destroyed: {
        type: Number,
        default: 0,
      },
      captured: {
        type: Number,
        default: 0,
      },
      lost: {
        type: Number,
        default: 0,
      },
    },
    saml: {
      built: {
        type: Number,
        default: 0,
      },
      destroyed: {
        type: Number,
        default: 0,
      },
      captured: {
        type: Number,
        default: 0,
      },
      lost: {
        type: Number,
        default: 0,
      },
    },
    silo: {
      built: {
        type: Number,
        default: 0,
      },
      destroyed: {
        type: Number,
        default: 0,
      },
      captured: {
        type: Number,
        default: 0,
      },
      lost: {
        type: Number,
        default: 0,
      },
    },
    fact: {
      built: {
        type: Number,
        default: 0,
      },
      destroyed: {
        type: Number,
        default: 0,
      },
      captured: {
        type: Number,
        default: 0,
      },
      lost: {
        type: Number,
        default: 0,
      },
    },
    wshp: {
      built: {
        type: Number,
        default: 0,
      },
      destroyed: {
        type: Number,
        default: 0,
      },
      captured: {
        type: Number,
        default: 0,
      },
      lost: {
        type: Number,
        default: 0,
      },
    },
  },
  { _id: false },
);

const goldTotalSchema = new mongoose.Schema(
  {
    workers: {
      type: Number,
      default: 0,
    },
    war: {
      type: Number,
      default: 0,
    },
    trade: {
      type: Number,
      default: 0,
    },
    piracy: {
      type: Number,
      default: 0,
    },
    trains: {
      type: Number,
      default: 0,
    },
    othersTrains: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const attacksTotalSchema = new mongoose.Schema(
  {
    sent: {
      type: Number,
      default: 0,
    },
    incoming: {
      type: Number,
      default: 0,
    },
    cancelled: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const totalStatsSchema = new mongoose.Schema(
  {
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    betrayals: {
      type: Number,
      default: 0,
    },
    winRate: {
      type: Number,
      default: 0,
    },
    winLossRatio: {
      type: Number,
      default: 0,
    },
    attacks: {
      type: attacksTotalSchema,
      default: () => ({}),
    },
    bombs: {
      type: bombsTotalSchema,
      default: () => ({}),
    },
    boats: {
      type: boatsTotalSchema,
      default: () => ({}),
    },
    units: {
      type: unitsTotalSchema,
      default: () => ({}),
    },
    gold: {
      type: goldTotalSchema,
      default: () => ({}),
    },
  },
  { _id: false },
);

const boatsSchema = new mongoose.Schema(
  {
    trade: [Number],
    trans: [Number],
  },
  { _id: false },
);

const bombsSchema = new mongoose.Schema(
  {
    abomb: [Number],
    hbomb: [Number],
    mirv: [Number],
    mirvw: [Number],
  },
  { _id: false },
);

const unitsSchema = new mongoose.Schema(
  {
    city: [Number],
    defp: [Number],
    port: [Number],
    saml: [Number],
    silo: [Number],
    fact: [Number],
    wshp: [Number],
  },
  { _id: false },
);

const gameStatsDetailSchema = new mongoose.Schema(
  {
    attacks: [Number],
    betrayals: {
      type: Number,
      default: 0,
    },
    boats: {
      type: boatsSchema,
      default: () => ({}),
    },
    bombs: {
      type: bombsSchema,
      default: () => ({}),
    },
    gold: [Number],
    units: {
      type: unitsSchema,
      default: () => ({}),
    },
  },
  { _id: false },
);

const gameModeEntrySchema = new mongoose.Schema(
  {
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    stats: {
      type: gameStatsDetailSchema,
      default: () => ({}),
    },
  },
  { _id: false },
);

const playerSchema = new mongoose.Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: String,
  createdAt: {
    type: Date,
    index: true,
  },
  stats: {
    Private: {
      type: Map,
      of: {
        type: Map,
        of: gameModeEntrySchema,
      },
    },
    Public: {
      type: Map,
      of: {
        type: Map,
        of: gameModeEntrySchema,
      },
    },
    Ranked: {
      type: Map,
      of: gameModeEntrySchema,
    },
    total: {
      type: totalStatsSchema,
      default: () => ({}),
      index: false,
    },
    recent: {
      type: mongoose.Schema.Types.Mixed,
    },
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
